import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Placeholder: the AI flow (answers based on call transcripts) is not implemented yet.
export async function POST(req: Request) {
  const { message } = (await req.json().catch(() => ({}))) as { message?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  return NextResponse.json({
    reply: "The assistant isn't connected yet. Soon it will answer using our call transcripts.",
  });
}
