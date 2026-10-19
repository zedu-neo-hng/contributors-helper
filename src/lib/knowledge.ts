import { readdir, readFile } from "fs/promises";
import path from "path";

import { prisma } from "@/lib/prisma";

/**
 * Knowledge base loader for Zoe (issue #36).
 *
 * Reads the compacted call knowledge base produced by #8 in `clean-transcripts/`:
 *
 *   summaries/*.summary.md    -> always injected into the system prompt
 *   transcripts/*.cleaned.md  -> attached only when a question clearly matches one session
 *
 * There is deliberately no embedding or vector store: the whole corpus fits in the model's context
 * window, so a small inverse-document-frequency keyword match is enough to decide which (if any)
 * transcript to attach.
 */

export class KnowledgeBaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeBaseError";
  }
}

/**
 * Checks for a `KnowledgeBaseError` without relying on `instanceof` alone: a downlevelled
 * `class X extends Error` loses the prototype chain, and a bundler can duplicate the class, either
 * of which would silently turn the intended "knowledge base is unavailable" response into a generic
 * failure.
 */
export function isKnowledgeBaseError(error: unknown): error is KnowledgeBaseError {
  return (
    error instanceof KnowledgeBaseError ||
    (error instanceof Error && error.name === "KnowledgeBaseError")
  );
}

export const KNOWLEDGE_DIR =
  process.env.KNOWLEDGE_DIR || path.join(process.cwd(), "clean-transcripts");
export const SUMMARIES_DIR = path.join(KNOWLEDGE_DIR, "summaries");
export const TRANSCRIPTS_DIR = path.join(KNOWLEDGE_DIR, "transcripts");

/**
 * A transcript is attached only when one call is clearly the right one. Ambiguous questions get
 * nothing: the summaries are always in context, so attaching nothing is safer than attaching the
 * wrong call.
 */
export const MIN_SCORE = 0.75;
export const DOMINANCE = 1.5;
export const TITLE_WEIGHT = 3;

/** Function words that carry no session identity. Everything else is weighted by rarity instead. */
const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "your", "with", "that", "this", "these", "those",
  "what", "when", "where", "which", "who", "whom", "why", "how", "was", "were", "has", "have", "had",
  "does", "did", "can", "could", "should", "would", "will", "shall", "from", "into", "about", "they",
  "them", "their", "there", "then", "than", "been", "being", "his", "her", "its", "our", "ours", "out",
  "get", "got", "all", "any", "some", "one", "two", "also", "just", "like", "tell", "give", "need",
  "needs", "make", "made", "know", "want", "ask", "asked", "said", "says", "let", "lets", "didnt",
  "doesnt", "isnt", "dont", "must", "may", "might", "very", "only", "over", "under", "again", "still",
  "even", "much", "many", "more", "most", "anyone", "someone", "please", "thanks", "yes", "yeah",
]);

export type SessionIndex = {
  /** File base name, e.g. `2026-10-07_lesson_5_week_2_reorg_redesign_contributions`. */
  base: string;
  /** Tokens from the file name, which carry the date and lesson number. */
  titleTokens: Set<string>;
  /** Tokens from the summary body plus the title. */
  tokens: Set<string>;
  /**
   * Cleaned text held in memory for database-ingested documents; file pairs read their transcript
   * from disk on demand instead and leave this undefined.
   */
  cleaned?: string;
};

export type KnowledgeBase = {
  /** Every summary, concatenated, ready to inject into a prompt. */
  summaries: string;
  /** One entry per session, used to pick a transcript on demand. */
  index: SessionIndex[];
};

/** Lowercase word/number tokens. Single digits are kept so "lesson 5" stays meaningful. */
export function tokenize(text: string): string[] {
  const raw = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return raw.filter(
    (token) => (token.length >= 3 || /^\d+$/.test(token)) && !STOPWORDS.has(token),
  );
}

/**
 * Pick the session(s) the question most likely refers to, weighted by how rare each matched token
 * is across sessions, so a generic word like "team" cannot outvote a distinctive one.
 */
export function selectSessions(
  question: string,
  index: SessionIndex[],
  limit = 1,
): string[] {
  const questionTokens = Array.from(new Set(tokenize(question)));
  if (questionTokens.length === 0 || index.length === 0) return [];

  const documentFrequency = new Map<string, number>();
  for (const session of index) {
    for (const token of session.tokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const scored = index
    .map((session) => {
      let score = 0;
      for (const token of questionTokens) {
        if (!session.tokens.has(token)) continue;
        const weight = session.titleTokens.has(token) ? TITLE_WEIGHT : 1;
        score += weight / (documentFrequency.get(token) ?? 1);
      }
      return { base: session.base, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const runnerUp = scored[1];

  if (!top || top.score < MIN_SCORE) return [];
  if (runnerUp && runnerUp.score > 0 && top.score < runnerUp.score * DOMINANCE) return [];

  return scored
    .slice(0, limit)
    .filter((session) => session.score > 0)
    .map((session) => session.base);
}

let cached: KnowledgeBase | null = null;

/** Clears the in-process cache. Only used by tests. */
export function resetKnowledgeCache(): void {
  cached = null;
}

/**
 * Loads every summary into memory once per process. Throws `KnowledgeBaseError` when the knowledge
 * base is missing or unreadable, so a broken deployment fails loudly instead of answering blind.
 */
export async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  if (cached) return cached;

  let names: string[];
  try {
    names = (await readdir(SUMMARIES_DIR))
      .filter((name) => name.endsWith(".summary.md"))
      .sort();
  } catch (error) {
    throw new KnowledgeBaseError(
      `Knowledge base summaries are not readable at ${SUMMARIES_DIR}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (names.length === 0) {
    throw new KnowledgeBaseError(
      `Knowledge base has no *.summary.md files in ${SUMMARIES_DIR}. Expected the output of the transcript compaction ticket.`,
    );
  }

  const summaries: string[] = [];
  const index: SessionIndex[] = [];

  for (const name of names) {
    const base = name.replace(/\.summary\.md$/, "");
    let text: string;
    try {
      text = await readFile(path.join(SUMMARIES_DIR, name), "utf8");
    } catch (error) {
      throw new KnowledgeBaseError(
        `Knowledge base summary ${name} could not be read: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    const body = text.trim();
    const titleTokens = new Set(tokenize(base));
    summaries.push(body);
    index.push({
      base,
      titleTokens,
      tokens: new Set([...titleTokens, ...tokenize(body)]),
    });
  }

  // Ingested documents (operator uploads) join the committed corpus: their summary is always on
  // and their cleaned text attaches like a transcript. A database outage must not take the chat
  // down, since the committed corpus alone still answers cohort questions.
  try {
    const ingested = await prisma.ingestedDocument.findMany({ orderBy: { createdAt: "asc" } });
    for (const row of ingested) {
      const titleTokens = new Set(tokenize(row.title));
      summaries.push(row.summary);
      index.push({
        base: row.title,
        titleTokens,
        tokens: new Set([...titleTokens, ...tokenize(row.summary)]),
        cleaned: row.cleaned,
      });
    }
  } catch (error) {
    console.error(
      `Ingested knowledge is unavailable; serving the committed corpus only: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  cached = { summaries: summaries.join("\n\n---\n\n"), index };
  return cached;
}

/** Reads one cleaned transcript. Throws when it is missing rather than silently attaching nothing. */
export async function readTranscript(base: string): Promise<string> {
  const file = path.join(TRANSCRIPTS_DIR, `${base}.cleaned.md`);
  try {
    return (await readFile(file, "utf8")).trim();
  } catch (error) {
    throw new KnowledgeBaseError(
      `Knowledge base transcript ${file} could not be read: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Builds the knowledge block for one question: all summaries, plus a full cleaned transcript when
 * the question clearly points at a single call.
 */
export async function buildKnowledgeContext(question: string): Promise<string> {
  const knowledgeBase = await loadKnowledgeBase();
  const selected = selectSessions(question, knowledgeBase.index);
  const sessions = new Map(knowledgeBase.index.map((session) => [session.base, session]));

  const parts = [
    "=== COHORT CALL KNOWLEDGE (compacted summaries of the Zedu/HNG cohort calls) ===",
    knowledgeBase.summaries,
  ];

  for (const base of selected) {
    const session = sessions.get(base);
    const text = session?.cleaned ?? (await readTranscript(base));
    parts.push(`=== CALL TRANSCRIPT — EXACT WORDING (${base}) ===`, text);
  }

  return parts.join("\n\n");
}
