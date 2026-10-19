// neo-008 — renders /transcripts into /clean-transcripts/transcripts
// Mechanical only: strips timestamps, ASR line-wrapping, entity noise and filler words.
// It never rewrites, reorders, paraphrases or drops substantive sentences, so it cannot invent content.
//
// Usage: node scripts/clean-transcripts.mjs [--in <dir>] [--out <dir>]
// Defaults clean the repo's own transcripts/ into clean-transcripts/transcripts/, reproducing the
// committed *.cleaned.md files byte-for-byte (module line endings). --in accepts any folder of
// tactiq-style .md or .txt captures; every other file type in the folder is ignored.
//
// This script owns the file layout only. The cleaning rules live in src/lib/cleanText.mjs, which the
// ingest pipeline imports as well, so the corpus and an uploaded capture cannot drift apart.
import fs from "node:fs";
import path from "node:path";
import { captionSections } from "../src/lib/cleanText.mjs";

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

  const sections = captionSections(raw);

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
