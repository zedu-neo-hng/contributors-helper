import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractText, getDocumentProxy } from "unpdf";
import { cleanTranscriptText } from "@/lib/cleanText";
import { resetKnowledgeCache } from "@/lib/knowledge";
import { prisma } from "@/lib/prisma";
import {
  SUMMARIZE_MODEL,
  buildSummarizePrompt,
  chunkForSummarize,
  mergeChunkSummaries,
} from "@/lib/summarize";

export const dynamic = "force-dynamic";

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

export async function POST(req: Request) {
  try {
    const secret = process.env.INGEST_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Ingest is not configured." }, { status: 503 });
    }
    if (req.headers.get("x-ingest-secret") !== secret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (!process.env.AI_API_KEY) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const openRouter = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://contributors.zedu.chat",
        "X-Title": "Zedu Contributors Helper",
      },
    });

    const staged = await prisma.stagedDocument.findMany({
      where: { status: "STAGED" },
      orderBy: { uploadedAt: "asc" },
    });
    const processed: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const doc of staged) {
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

    const remaining = await prisma.stagedDocument.count({ where: { status: "STAGED" } });
    return NextResponse.json({ processed, failed, remaining });
  } catch {
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}
