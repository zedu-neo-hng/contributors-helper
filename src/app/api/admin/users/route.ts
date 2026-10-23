import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentViewer } from "@/lib/ingestAccess";
import { ASSIGNABLE_ROLES, isSuperAdmin, isUserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

const PUBLIC_USER = { id: true, email: true, role: true, createdAt: true } as const;

async function superAdminGate() {
  const viewer = await currentViewer();

  if (!viewer) {
    return { ok: false as const, status: 401, error: "Unauthorized." };
  }

  if (!isSuperAdmin(viewer.role)) {
    return { ok: false as const, status: 403, error: "Super admin access required." };
  }

  return { ok: true as const, viewer };
}

export async function GET() {
  const gate = await superAdminGate();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: PUBLIC_USER,
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const gate = await superAdminGate();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id, role } = (payload ?? {}) as { id?: unknown; role?: unknown };

  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "A user id is required." }, { status: 400 });
  }

  // SUPER_ADMIN is seeded from SUPER_ADMIN_EMAILS, so it can never be assigned here.
  if (!isUserRole(role) || !ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Role must be USER or ADMIN." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (isSuperAdmin(isUserRole(target.role) ? target.role : "USER")) {
    return NextResponse.json({ error: "Super admins cannot be demoted." }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: PUBLIC_USER,
  });

  return NextResponse.json({ user });
}
