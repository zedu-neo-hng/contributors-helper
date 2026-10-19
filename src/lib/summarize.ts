/**
 * Chunked, extract-only summarisation for ingested documents.
 *
 * The summariser prompt mirrors the section format of the committed cohort-call summaries
 * (clean-transcripts/summaries, ticket #8) so the chat knowledge loader can treat ingested rows
 * exactly like the committed file pairs. Documents are processed in full: text is chunked on
 * paragraph boundaries instead of truncated, so nothing past the first pages is silently dropped.
 */

export const SUMMARIZE_MODEL = "deepseek/deepseek-v4-flash-0731";

export const SUMMARY_SECTIONS = [
  "Meeting Summary",
  "People & Roles",
  "Key Decisions",
  "Guidelines & Process",
  "Deadlines & Dates",
  "Action Items",
  "Q&A",
  "Unresolved / Needs Verification",
] as const;

const NONE_FOUND = "none found.";

/**
 * Splits text into chunks of at most `size` characters, breaking on paragraph boundaries where
 * possible. Any single paragraph longer than `size` is hard-split.
 */
export function chunkForSummarize(text: string, size = 9000): string[] {
  const chunks: string[] = [];

  const push = (chunk: string) => {
    const trimmed = chunk.trim();
    if (trimmed) chunks.push(trimmed);
  };

  let current = "";

  for (const paragraph of text.split(/\n{2,}/)) {
    if (paragraph.length > size) {
      push(current);
      current = "";
      for (let i = 0; i < paragraph.length; i += size) {
        push(paragraph.slice(i, i + size));
      }
      continue;
    }

    if (current && current.length + paragraph.length + 2 > size) {
      push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  push(current);
  return chunks;
}

export function buildSummarizePrompt(
  documentDate: string,
  part: number,
  totalParts: number,
): string {
  const partNote =
    totalParts > 1
      ? `\n\nThis is part ${part} of ${totalParts} of one document. Sections may be incomplete on their own; extract what this part contains and nothing more.`
      : "";

  return `You are producing an always-on knowledge summary of one Zedu/HNG cohort document, in the same style as the cohort's call knowledge base.

Strict rules:
- Extract only. Never state anything that is not traceable to the provided text.
- If the text has no speaker labels, do not invent attribution.
- Mark uncertain names or terms with [?] instead of guessing.
- Keep relative deadlines as spoken ("Sunday"), and where the document date makes the absolute date unambiguous, append it in italics labelled (computed), e.g. *Sunday, 2026-10-25 (computed)*.

Document date: ${documentDate}${partNote}

Output Markdown with exactly these sections, in this order (write "None found." under a section when it has nothing to report):
${SUMMARY_SECTIONS.map((section) => `## ${section}`).join("\n")}`;
}

const normalize = (heading: string) => heading.trim().toLowerCase();

/**
 * Merges per-chunk summaries into one document summary. Only the canonical sections survive;
 * anything a chunk wrote outside them is treated as preamble and dropped, and sections that every
 * chunk reported as "None found." collapse to a single line.
 */
export function mergeChunkSummaries(parts: string[]): string {
  const bySection = new Map<string, string[]>();

  for (const part of parts) {
    let section: string | null = null;
    let buffer: string[] = [];

    const flush = () => {
      const body = buffer.join("\n").trim();
      if (section && body) {
        const key = normalize(section);
        bySection.set(key, [...(bySection.get(key) ?? []), body]);
      }
      buffer = [];
    };

    for (const line of part.split(/\r?\n/)) {
      const match = /^##\s+(.+)$/.exec(line);
      if (match) {
        flush();
        const heading = normalize(match[1]);
        section = SUMMARY_SECTIONS.find((s) => normalize(s) === heading) ?? null;
        continue;
      }
      buffer.push(line);
    }
    flush();
  }

  const blocks = SUMMARY_SECTIONS.map((section) => {
    const bodies = (bySection.get(normalize(section)) ?? []).filter(
      (body) => body.replace(/\s+/g, " ").toLowerCase() !== NONE_FOUND,
    );
    return `## ${section}\n${bodies.length > 0 ? bodies.join("\n\n") : "None found."}`;
  });

  return blocks.join("\n\n");
}
