// neo-008 — deterministic cleaner for /transcripts -> /clean-transcripts/transcripts
// Mechanical only: strips timestamps, ASR line-wrapping, entity noise and filler words.
// It never rewrites, reorders, paraphrases or drops substantive sentences, so it cannot invent content.
//
// Usage: node scripts/clean-transcripts.mjs [--in <dir>] [--out <dir>]
// Defaults clean the repo's own transcripts/ into clean-transcripts/transcripts/, reproducing the
// committed *.cleaned.md files byte-for-byte (module line endings). --in accepts any folder of
// tactiq-style .md or .txt captures; every other file type in the folder is ignored.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const SRC = flag("--in") ?? path.join(ROOT, "transcripts");
const OUT = flag("--out") ?? path.join(ROOT, "clean-transcripts", "transcripts");

// 2026-10-14_lesson_6_week_3_standup.md is the same capture as
// 2026-10-14_lesson_2_week_3_individual_checks_8_team_projects.md (916/919 identical lines)
const SKIP = new Set(["README.md", "2026-10-14_lesson_6_week_3_standup.md"]);

const FILLER = [
  /\b(?:um+|uh+|uhm+|erm+|hmm+|mmm+)\b(?!-)\s*/gi,
  /\byou know\b\s*/gi,
  /\bi mean\b\s*/gi,
  /\bso,?\s+so\b/gi,
];

const TS = /^\s*\d{1,2}:\d{2}:\d{2}(?:\.\d+)?\s*/;
const SPEAKER = /^\s*\[([^\]]{1,60})\]:\s*(.*)$/;
const WORD = "[\\w'-]";

const decodeEntities = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

// collapse stutters and repeated phrases until the text stops changing
function dedupe(s) {
  let prev;
  let guard = 0;
  do {
    prev = s;
    s = s.replace(new RegExp(`\\b(\\w+)(?:\\s+\\1\\b)+`, "gi"), "$1");
    s = s.replace(
      new RegExp(`\\b(${WORD}+(?:\\s+${WORD}+){1,5})\\s+\\1\\b`, "gi"),
      "$1",
    );
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

fs.mkdirSync(OUT, { recursive: true });
const report = [];

for (const name of fs.readdirSync(SRC).sort()) {
  if (SKIP.has(name)) continue;
  if (!/\.(md|txt)$/i.test(name)) continue; // ignore anything that is not a transcript capture
  const src = path.join(SRC, name);
  const raw = fs.readFileSync(src, "utf8").replace(/^\uFEFF/, "");
  const rawLines = raw.split(/\r?\n/);

  const title = (rawLines.find((l) => /^#\s/.test(l)) || `# ${name}`).replace(/^#\s*/, "").trim();
  const metaDate = (raw.match(/\*\*Date:\*\*\s*(.+)/) || [])[1]?.trim() ?? "";
  const srcUrl = (raw.match(/https?:\/\/www\.youtube\.com\/watch\/[A-Za-z0-9_-]+/) || [])[0] ?? "";

  const bodyStart = rawLines.findIndex((l) => /^##\s/.test(l));
  const rawBody = (bodyStart >= 0 ? rawLines.slice(bodyStart + 1) : rawLines).join("\n");
  const sections = buildBody(rawBody);

  const base = name.replace(/\.(md|txt)$/i, "");
  const out = [
    `# ${title}`,
    "",
    "> Cleaned transcript for the Contributor Assistant knowledge base. Only mechanical cleaning was",
    "> applied — timestamps, ASR line-wrapping, entity noise, duplicated words and filler removed.",
    "> Wording, names and substance are preserved; nothing was summarised or inferred.",
    "",
    `- **Source transcript:** \`transcripts/${name}\``,
    metaDate ? `- **Date:** ${metaDate}` : null,
    srcUrl ? `- **Source URL:** <${srcUrl}>` : null,
    "- **Ticket:** #8 (neo-008)",
    "",
    "---",
    "",
    ...sections.flatMap((s) => [`## ${s.title}`, "", s.body, ""]),
  ]
    .filter((l) => l !== null)
    .join("\n");

  const dest = path.join(OUT, `${base}.cleaned.md`);
  fs.writeFileSync(dest, out.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n", "utf8");
  report.push({
    file: name,
    inBytes: Buffer.byteLength(raw, "utf8"),
    outBytes: Buffer.byteLength(out, "utf8"),
  });
}

console.log("file".padEnd(66) + "raw".padStart(10) + "cleaned".padStart(10) + "kept".padStart(8));
for (const r of report) {
  console.log(
    r.file.padEnd(66) +
      String(r.inBytes).padStart(10) +
      String(r.outBytes).padStart(10) +
      (Math.round((r.outBytes / r.inBytes) * 100) + "%").padStart(8),
  );
}
const ti = report.reduce((a, r) => a + r.inBytes, 0);
const to = report.reduce((a, r) => a + r.outBytes, 0);
console.log(`\nTOTAL  raw=${ti}  cleaned=${to}  kept=${Math.round((to / ti) * 100)}%`);
