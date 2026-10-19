import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractText, getDocumentProxy } from "unpdf";
import { cleanTranscriptText } from "@/lib/cleanText";
import { resetKnowledgeCache } from "@/lib/knowledge";
import { prisma } from "@/lib/prisma";
import { hasIngestAccess } from "@/lib/ingestAccess";
import {
  SUMMARIZE_MODEL,
  buildSummarizePrompt,
  chunkForSummarize,
  mergeChunkSummaries,
} from "@/lib/summarize";

export const dynamic = "force-dynamic";

// Exactly one document is ingested per request. A chunked summarise run can take minutes,
// and a request that handles a single document cannot be cut off part-way by a proxy or
// client timeout. The caller loops until `remaining` reaches zero, passing back the ids
// that failed so one unreadable file cannot block the rest of the queue.
const MAX_ID_LENGTH = 200;
const MAX_SKIPPED = 200;

type Target = { id?: string; exclude: string[] };

const SYSTEM_PROMPT = (documentDate: string, part: number, totalParts: number) =>
  buildSummarizePrompt(documentDate, part, totalParts);

function stageError(stage: string, e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "empty-text") return "No extractable text.";
  if (msg === "empty-ai") return "Empty AI response.";
  if (stage === "parse") return "Could not read this PDF.";
  if (stage === "ai") return "AI service error, try again later.";
  return "Ingest failed.";
}

function isId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

// Returns null for a malformed body so the route can answer 400 rather than quietly
// ingesting the wrong document. A missing body is normal (plain `curl -X POST`).
function parseTarget(body: unknown): Target | null {
  if (body === null || body === undefined) return { exclude: [] };
  if (typeof body !== "object") return null;

  const { id, exclude } = body as { id?: unknown; exclude?: unknown };

  if (id !== undefined && !isId(id)) return null;

  if (exclude === undefined) return { id: id as string | undefined, exclude: [] };
  if (!Array.isArray(exclude) || exclude.length > MAX_SKIPPED) return null;
  if (!exclude.every(isId)) return null;

  return { id: id as string | undefined, exclude: exclude as string[] };
}

export async function POST(req: Request) {
  try {
    // A super admin triggers this from the UI with a session cookie; scripted runs keep
    // using the shared secret header.
    const access = await hasIngestAccess(req);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.viewer ? "Admin access required." : "Unauthorized." },
        { status: access.viewer ? 403 : 401 },
      );
    }

    if (!process.env.AI_API_KEY) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    const target = parseTarget(body);
    if (!target) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { id, exclude } = target;
    const skipped = exclude.length > 0 ? { notIn: exclude } : undefined;
    const remainingWhere = skipped ? { status: "STAGED", id: skipped } : { status: "STAGED" };
    const targetWhere = id ? { status: "STAGED", id } : remainingWhere;

    const openRouter = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://contributors.zedu.chat",
        "X-Title": "Zedu Contributors Helper",
      },
    });

    const [doc] = await prisma.stagedDocument.findMany({
      where: targetWhere,
      orderBy: { uploadedAt: "asc" },
      take: 1,
    });

    const processed: string[] = [];
    const failed: { id: string; error: string }[] = [];

    if (doc) {
      let stage = "read";
      try {
        const bytes = new Uint8Array(doc.data);
        let text: string;
        if (doc.ext === ".pdf") {
          stage = "parse";
          const pdf = await getDocumentProxy(bytes);
          const { text: out } = await extractText(pdf, { mergePages: true });
          text = Array.isArray(out) ? out.join("\n") : out;
        } else {
          text = Buffer.from(bytes).toString("utf8");
        }

        stage = "clean";
        const cleaned = cleanTranscriptText(text);
        if (!cleaned) throw new Error("empty-text");

        // Chunked instead of truncated: every part of the document reaches the summariser.
        stage = "ai";
        const chunks = chunkForSummarize(cleaned);
        const parts: string[] = [];
        for (let index = 0; index < chunks.length; index++) {
          const completion = await openRouter.chat.completions.create({
            model: SUMMARIZE_MODEL,
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT(
                  doc.uploadedAt.toISOString().slice(0, 10),
                  index + 1,
                  chunks.length,
                ),
              },
              { role: "user", content: chunks[index] },
            ],
          });
          const part = completion.choices[0]?.message?.content?.trim();
          if (!part) throw new Error("empty-ai");
          parts.push(part);
        }

        const summary = mergeChunkSummaries(parts);
        if (!summary.trim()) throw new Error("empty-ai");

        stage = "save";
        const title = doc.filename.replace(/\.[^.]+$/, "");
        await prisma.$transaction([
          prisma.ingestedDocument.upsert({
            where: { sourceId: doc.id },
            update: { title, summary, cleaned },
            create: { sourceId: doc.id, title, summary, cleaned },
          }),
          prisma.stagedDocument.update({
            where: { id: doc.id },
            data: { status: "INGESTED" },
          }),
        ]);
        processed.push(doc.id);
      } catch (e) {
        // The document stays STAGED so a later ingest run can retry it.
        console.error(`ingest failed for file ${doc.id} at stage ${stage}:`, e);
        failed.push({ id: doc.id, error: stageError(stage, e) });
      }
    }

    // Newly ingested summaries must reach the chat without a process restart.
    if (processed.length > 0) resetKnowledgeCache();

    const remaining = await prisma.stagedDocument.count({ where: remainingWhere });
    return NextResponse.json({ processed, failed, remaining });
  } catch {
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}
