import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set([".pdf", ".md", ".txt"]);

export async function POST(req: Request) {
  try {
    // Upload is operator tooling with no UI, so it is gated by the same shared secret as ingest.
    const secret = process.env.INGEST_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Upload is not configured." }, { status: 503 });
    }
    if (req.headers.get("x-ingest-secret") !== secret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 5 MB." }, { status: 413 });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid multipart payload." }, { status: 400 });
    }

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Missing or empty 'file' field." }, { status: 400 });
    }

    let uploaderId = "anonymous";
    const rawUploader = form.get("uploaderId");
    if (rawUploader !== null) {
      if (typeof rawUploader !== "string" || rawUploader.length < 1 || rawUploader.length > 100) {
        return NextResponse.json({ error: "uploaderId must be 1 to 100 chars." }, { status: 400 });
      }
      uploaderId = rawUploader;
    }

    const originalName = file.name || "upload";
    const dot = originalName.lastIndexOf(".");
    const ext = dot >= 0 ? originalName.slice(dot).toLowerCase() : "";
    if (!ALLOWED.has(ext)) {
      return NextResponse.json({ error: "Only .pdf, .md, .txt allowed." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 5 MB." }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (ext === ".pdf" && Buffer.from(bytes.slice(0, 5)).toString("latin1") !== "%PDF-") {
      return NextResponse.json({ error: "Not a valid PDF file." }, { status: 400 });
    }

    const created = await prisma.stagedDocument.create({
      data: { filename: originalName, ext, uploaderId, data: bytes },
    });

    return NextResponse.json({
      id: created.id,
      originalName: created.filename,
      ext: created.ext,
      uploaderId: created.uploaderId,
      uploadedAt: created.uploadedAt.toISOString(),
      status: created.status,
    });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
