import { NextResponse } from "next/server";
import { currentViewer } from "@/lib/ingestAccess";

export const dynamic = "force-dynamic";

// Lets the UI decide which controls to render. The role is read from the database on
// every call, so a promotion or demotion shows up without signing in again.
export async function GET() {
  const viewer = await currentViewer();

  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ role: viewer.role, email: viewer.email });
}
