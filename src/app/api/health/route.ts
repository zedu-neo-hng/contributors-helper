import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Readiness probe rather than a liveness one. Signing contributors in, authorising admins and
// persisting chat all need Postgres, so an unreachable database is reported as 503 instead of
// a cheerful "ok" that hides a broken DATABASE_URL behind a healthy container.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      { status: "unavailable", database: "unavailable" },
      { status: 503 },
    );
  }
}
