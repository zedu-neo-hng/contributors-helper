/**
 * Deterministic mechanical cleaning for ingested documents, following the noise rules established
 * by the transcript compaction ticket (#8, see clean-transcripts/README.md).
 *
 * One rulebook, two shapes:
 *  - `captionSections` / `cleanCaptionText` reproduce the shaping the committed corpus was produced
 *    with: caption timestamps and `>>` markers go, stutters collapse, and the speech is reflowed
 *    into readable paragraphs. `scripts/clean-transcripts.mjs` imports this, so the corpus and an
 *    uploaded capture are cleaned by the same code rather than by two copies that drift.
 *  - `cleanDocumentText` keeps the document's own layout, for uploads that are not caption captures
 *    (PDFs, prose, notes). It strips the same class of noise but never reflows, re-paragraphs or
 *    re-cases, because for those files the layout is the author's, not a caption artefact.
 *  - `cleanTranscriptText` picks between the two; `looksLikeCaptionCapture` is the predicate.
 *
 * Everything here only deletes and reflows: nothing is rewritten, reordered, paraphrased or
 * invented, so it is safe to run before the extract-only summarisation pass.
 *
 * This is plain ESM rather than TypeScript so that scripts/clean-transcripts.mjs can import it with
 * plain `node` — the production image is node:20-alpine and cannot import .ts. `cleanText.ts` is the
 * typed facade the application imports.
 */

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
  "&apos;": "'",
  "&#x27;": "'",
};

const decodeEntities = (s) => {
  for (const [entity, char] of Object.entries(ENTITIES)) s = s.split(entity).join(char);
  return s;
};

/* ------------------------------------------------------------------ caption captures */

const FILLER = [
  /\b(?:um+|uh+|uhm+|erm+|hmm+|mmm+)\b(?!-)\s*/gi,
  /\byou know\b\s*/gi,
  /\bi mean\b\s*/gi,
  /\bso,?\s+so\b/gi,
];

const TS = /^\s*\d{1,2}:\d{2}:\d{2}(?:\.\d+)?\s*/;
const SPEAKER = /^\s*\[([^\]]{1,60})\]:\s*(.*)$/;
const WORD = "[\\w'-]";

// collapse stutters and repeated phrases until the text stops changing
function dedupe(s) {
  let prev;
  let guard = 0;
  do {
    prev = s;
    s = s.replace(new RegExp(`\\b(\\w+)(?:\\s+\\1\\b)+`, "gi"), "$1");
    s = s.replace(new RegExp(`\\b(${WORD}+(?:\\s+${WORD}+){1,5})\\s+\\1\\b`, "gi"), "$1");
  } while (s !== prev && ++guard < 6);
  return s;
}

function cleanInline(s) {
  s = decodeEntities(s)
    .replace(/[\uFEFF\u200B\u200E\u200F]/g, "") // stray BOM / zero-width chars
    .replace(/>>/g, " ");
  for (const re of FILLER) s = s.replace(re, " ");
  s = dedupe(s);
  s = s.replace(/\s+([,.;:!?])/g, "$1");
  s = s.replace(/,\s*,/g, ",");
  s = s.replace(/(^|[\s(])[,;:]\s+/g, "$1"); // comma orphaned by filler removal
  s = s.replace(/^=+\s*/, "").replace(/\s*=+$/, ""); // "==== TITLE ====" rules
  s = s.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  s = s.replace(/\bi\b/g, "I"); // ASR lowercases the pronoun
  return s.replace(/[ \t]{2,}/g, " ").trim();
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// same as cleanInline but keeps the original leading indentation (for embedded lists)
function cleanKeepIndent(line) {
  const indent = (line.match(/^\s*/) || [""])[0];
  return indent + cleanInline(line);
}

// group a continuous stream of speech into readable paragraphs
function reflow(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const paras = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 90) {
      // prefer to break on a sentence end in the last third of the block
      const tail = cur.slice(-35);
      let cut = -1;
      for (let i = tail.length - 1; i >= 0; i--) {
        if (/[.!?]["')\]]?$/.test(tail[i])) {
          cut = i;
          break;
        }
      }
      if (cut >= 0) {
        const end = cur.length - tail.length + cut + 1;
        paras.push(cur.slice(0, end).join(" "));
        cur = cur.slice(end);
      } else if (cur.length >= 120) {
        paras.push(cur.join(" "));
        cur = [];
      }
    }
  }
  if (cur.length) paras.push(cur.join(" "));
  return paras
    .map((p) => cap(cleanInline(p)))
    .filter(Boolean)
    .join("\n\n");
}

function buildBody(rawBody) {
  const lines = rawBody.split(/\r?\n/);
  const keep = [];
  for (const line of lines) {
    if (/^#\s/.test(line)) continue; // tactiq header lines / repeated titles
    if (/^tactiq\.io/i.test(line)) continue;
    if (/^Date\s*:/i.test(line)) continue;
    if (/^-{3,}$/.test(line.trim())) continue;
    keep.push(line.replace(TS, ""));
  }

  const firstSpeak = keep.findIndex((l) => SPEAKER.test(l));
  const hasSpeakers = firstSpeak >= 0;

  // call-9 style files embed their own summary before the FULL TRANSCRIPT marker
  const markerIdx = keep.findIndex((l) => /FULL TRANSCRIPT/i.test(l));
  const summaryPart = markerIdx >= 0 ? keep.slice(0, markerIdx) : [];
  const transcriptPart = markerIdx >= 0 ? keep.slice(markerIdx + 1) : keep;

  const sections = [];

  if (summaryPart.length) {
    const s = summaryPart
      .map((l) => cleanKeepIndent(l).trimEnd())
      .filter((l) => l && !/^=+$/.test(l))
      .join("\n");
    if (s.trim()) sections.push({ title: "Original In-Call Summary", body: s.trim() });
  }

  let transcript;
  if (hasSpeakers) {
    // speaker-labelled: preserve turns
    const turns = [];
    let curName = null;
    let curText = [];
    const flush = () => {
      if (curText.length) {
        const t = cap(cleanInline(curText.join(" ")));
        if (t) turns.push(curName ? `**${curName}:** ${t}` : t);
      }
      curText = [];
    };
    for (const line of transcriptPart) {
      const m = line.match(SPEAKER);
      if (m) {
        flush();
        curName = m[1].trim();
        curText.push(m[2]);
      } else {
        curText.push(line);
      }
    }
    flush();
    transcript = turns.join("\n\n");
  } else {
    transcript = reflow(transcriptPart.join(" "));
  }

  if (transcript.trim()) sections.push({ title: "Cleaned Transcript", body: transcript.trim() });
  return sections;
}

/**
 * Sections for a caption capture, i.e. what the corpus files are built from. The caller owns the
 * front matter (title, date, source URL) because that is a file-layout decision, not a cleaning one.
 */
export function captionSections(raw) {
  const lines = raw.split(/\r?\n/);
  const bodyStart = lines.findIndex((l) => /^##\s/.test(l));
  const rawBody = (bodyStart >= 0 ? lines.slice(bodyStart + 1) : lines).join("\n");
  return buildBody(rawBody);
}

/** The cleaned body of a caption capture, as a single string, for storing against an upload. */
export function cleanCaptionText(raw) {
  return captionSections(raw)
    .map((section) => `## ${section.title}\n\n${section.body}`)
    .join("\n\n")
    .trim();
}

/* ------------------------------------------------------------------ everything else */

// Only unambiguous disfluencies: "you know" and "I mean" are real English in prose, and deleting
// them changes meaning ("I mean the second one" must not become "the second one").
const DOC_FILLER = /\b(?:um|uh|uhm|erm|hmm|mmm)\b[,.]?/gi;

// Caption furniture is only ever removed at the start of a line, so anything inside a sentence is
// treated as content: a document saying "the deadline is 10:45" keeps its time.
const LEADING_STAMP = /^[ \t]*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?[ \t]*/;
const LEADING_MARKER = /^[ \t]*(?:>>|›>|»)[ \t]*/;
// Lines that carry their own structure even when no blank line precedes them, so a list, a heading,
// a quote or a speaker turn is not swallowed into the surrounding paragraph. Indentation is
// normalised, which is the one thing this path does not preserve.
const BLOCK_START = /^(?:[-*+]\s|\d+[.)]\s|#{1,6}\s|>|\[[^\]]{1,60}\]:)/;
const DUPLICATED_WORD = /\b(\w+)\s+\1\b(?:\s+\1\b)*/gi;

/**
 * Cleans a document that is not a caption capture. The document's own line and paragraph structure
 * is preserved: hard-wrapped lines inside a paragraph are rejoined, blank lines stay paragraph
 * breaks, and headings, lists and capitalisation are left alone.
 */
export function cleanDocumentText(raw) {
  const lines = decodeEntities(raw)
    .replace(/^\uFEFF/, "")
    .replace(/[\uFEFF\u200B\u200E\u200F]/g, "")
    .replace(/\f/g, "\n\n") // form feed is how PDF extraction marks a page break
    .split(/\r?\n/);

  const paragraphs = [];
  let current = "";

  for (const line of lines) {
    const trimmed = line.replace(LEADING_STAMP, "").replace(LEADING_MARKER, "").trim();

    if (!trimmed) {
      if (current) paragraphs.push(current);
      current = "";
      continue;
    }

    if (BLOCK_START.test(trimmed)) {
      if (current) paragraphs.push(current);
      current = "";
      paragraphs.push(trimmed);
      continue;
    }

    // A hyphen at a hard wrap is a split word ("deve-\nlopment"), not a hyphenated word.
    if (current && /[A-Za-z]-$/.test(current) && /^[a-z]/.test(trimmed)) {
      current = `${current.slice(0, -1)}${trimmed}`;
      continue;
    }

    current = current ? `${current} ${trimmed}` : trimmed;
  }
  if (current) paragraphs.push(current);

  return paragraphs
    .map((paragraph) =>
      paragraph
        .replace(DOC_FILLER, "")
        .replace(DUPLICATED_WORD, "$1")
        .replace(/[ \t]{2,}/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n\n");
}

/* ------------------------------------------------------------------ dispatch */

const TACTIQ_MARKERS = /tactiq\.io|\*\*Date:\*\*|FULL TRANSCRIPT/i;
// The canonical caption line is `00:00:04.480 >> text`, so the stamp in front of a marker is part of
// the furniture rather than a reason not to recognise it.
const CAPTION_MARKER = /^[ \t]*(?:\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?[ \t]*)?(?:>>|›>|»)/m;
const CAPTION_STAMP = /^[ \t]*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?[ \t]*/gm;

/**
 * Is this a caption capture rather than a document? Captures are recognised by their export
 * furniture (a tactiq header, `>>` speaker markers) or by being a stream of timestamped lines.
 * The distinction is safe either way: a capture cleaned as a document is still clean, it just keeps
 * its own line breaks; a document cleaned as a capture loses layout it may have cared about, so
 * this deliberately requires evidence rather than guessing from the file extension.
 */
export function looksLikeCaptionCapture(raw) {
  if (TACTIQ_MARKERS.test(raw)) return true;
  if (CAPTION_MARKER.test(raw)) return true;
  return (raw.match(CAPTION_STAMP) || []).length >= 3;
}

/** Cleans an uploaded document with whichever shape fits it. */
export function cleanTranscriptText(raw) {
  return looksLikeCaptionCapture(raw) ? cleanCaptionText(raw) : cleanDocumentText(raw);
}
