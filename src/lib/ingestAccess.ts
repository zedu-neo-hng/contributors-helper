import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type UserRole, isUserRole, roleAtLeast, DEFAULT_ROLE } from "@/lib/roles";

export interface Viewer {
  id: string;
  email: string | null;
  role: UserRole;
}

// The signed-in contributor with their role read fresh from the database. Reading the
// role per request, instead of caching it in the session token, is what makes a
// promotion take effect immediately without the user signing in again.
export async function currentViewer(): Promise<Viewer | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;

  const email = session?.user?.email ?? null;
  const stored = await prisma.user.findUnique({ where: { id } });

  // The row is written at sign-in, so a miss means the account predates roles (or the
  // write failed). Fail closed: the session identity is trusted, the role is not.
  if (!stored) return { id, email, role: DEFAULT_ROLE };

  return {
    id: stored.id,
    email: stored.email ?? email,
    role: isUserRole(stored.role) ? stored.role : DEFAULT_ROLE,
  };
}

export type IngestAccess = { ok: true; viewer: Viewer } | { ok: false; viewer: Viewer | null };

// Upload and ingest are reachable only from a signed-in ADMIN+ session. There is
// deliberately no shared-secret header: a second, weaker way in would undo the point of
// gating the pipeline, and nothing needs unattended access (the committed transcript corpus
// is read from disk, not ingested). `minimum` defaults to ADMIN; SUPER_ADMIN is a stricter
// caller of the same helper.
export async function hasIngestAccess(minimum: UserRole = "ADMIN"): Promise<IngestAccess> {
  const viewer = await currentViewer();

  if (viewer && roleAtLeast(viewer.role, minimum)) {
    return { ok: true, viewer };
  }

  return { ok: false, viewer };
}
