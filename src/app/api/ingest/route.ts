import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import Groq from "groq-sdk";
import { extractText, getDocumentProxy } from "unpdf";
import { DATA_DIR, appendKnowledge, listStaged, markIngested } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_CHARS = 12000;

const SYSTEM_PROMPT = `Turn the document text into clean Markdown with exactly three sections: "## Key Decisions", "## Action Items", "## Q&A". Use only information from the text. For a section with nothing to report, write "None found." Do not invent content.`;

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

    const groq = new Groq({ apiKey: process.env.AI_API_KEY });
    const staged = await listStaged();
    const processed: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const meta of staged) {
      try {
        const raw = await readFile(path.join(DATA_DIR, `${meta.id}${meta.ext}`));
        let text: string;
        if (meta.ext === ".pdf") {
          const pdf = await getDocumentProxy(new Uint8Array(raw));
          const { text: out } = await extractText(pdf, { mergePages: true });
          text = Array.isArray(out) ? out.join("\n") : out;
        } else {
          text = raw.toString("utf8");
        }
        if (!text.trim()) throw new Error("No extractable text.");
        const completion = await groq.chat.completions.create({
          model: "qwen/qwen3.8-27b",
          max_tokens: 800, // account OTPM limit is 1000; the model default (2048) gets 429'd
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text.slice(0, MAX_CHARS) },
          ],
        });
        const structured = completion.choices[0]?.message?.content?.trim();
        if (!structured) throw new Error("Empty AI response.");
        await appendKnowledge(`# Source: ${meta.originalName} (${meta.uploadedAt})\n\n${structured}\n\n`);
        await markIngested(meta.id);
        processed.push(meta.id);
      } catch (e) {
        console.error(`ingest failed for file ${meta.id}`);
        failed.push({ id: meta.id, error: e instanceof Error ? e.message : "Ingest failed." });
      }
    }

    const remaining = (await listStaged()).length;
    return NextResponse.json({ processed, failed, remaining });
  } catch {
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}
