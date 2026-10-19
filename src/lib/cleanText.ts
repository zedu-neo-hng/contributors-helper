/**
 * Deterministic mechanical cleaner for operator-uploaded transcripts, following the noise rules
 * established by the transcript compaction ticket (#8, see clean-transcripts/README.md). Like the
 * original, it only deletes and reflows - it never rewrites or invents content - so it is safe to
 * run before the extract-only summarisation pass.
 *
 * Noise removed: caption timestamps, the ~40-column ASR hard-wrap (line breaks inside sentences are
 * unwrapped), `>>` speaker markers, HTML entities from caption exports, adjacent duplicated words,
 * and spoken filler ("um", "uh", "erm", "you know", "I mean").
 */

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
};

/** Filler only ever deleted as a whole word, with an optional trailing comma or period. */
const FILLER = /\b(?:um|uh|erm)\b[,.]?|,\s*\b(?:you know|i mean)\b[,.]?|\b(?:you know|i mean)\b[,.]?/gi;

const TIMESTAMP = /\b\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\b/g;

const DUPLICATED_WORD = /\b(\w+)\s+\1\b(?:\s+\1\b)*/gi;

export function cleanTranscriptText(raw: string): string {
  let text = raw;

  for (const [entity, char] of Object.entries(ENTITIES)) {
    text = text.split(entity).join(char);
  }

  // Captions put the marker after a timestamp (`00:00:04.480 >> text`), so timestamps must go
  // first to expose markers at line start.
  text = text.replace(TIMESTAMP, "");
  text = text.replace(/^[ \t]*(?:>>|›>|»)[ \t]*/gm, "");
  text = text.replace(FILLER, "");
  text = text.replace(DUPLICATED_WORD, "$1");

  // Unwrap the ASR hard-wrap: a line break joins the next line unless a blank line follows, which
  // is treated as the paragraph boundary the wrap approximated.
  const lines = text.split(/\r?\n/);
  const paragraphs: string[] = [];
  let current = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      if (current) paragraphs.push(current);
      current = "";
      continue;
    }

    current = current ? `${current} ${trimmed}` : trimmed;
  }
  if (current) paragraphs.push(current);

  return paragraphs.join("\n\n").replace(/[ \t]{2,}/g, " ").trim();
}
