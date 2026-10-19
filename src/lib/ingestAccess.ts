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

export type IngestAccess =
  | { ok: true; via: "secret"; viewer: null }
  | { ok: true; via: "session"; viewer: Viewer }
  | { ok: false; viewer: Viewer | null };

// Upload/ingest are reachable two ways: a correctly signed-in ADMIN+ session (the
// in-app path), or the shared secret header (scripted/cron runs outside a browser).
// `minimum` defaults to ADMIN; SUPER_ADMIN is a stricter caller of the same helper.
export async function hasIngestAccess(req: Request, minimum: UserRole = "ADMIN"): Promise<IngestAccess> {
  const secret = process.env.INGEST_SECRET;
  if (secret && req.headers.get("x-ingest-secret") === secret) {
    return { ok: true, via: "secret", viewer: null };
  }

  const viewer = await currentViewer();
  if (viewer && roleAtLeast(viewer.role, minimum)) {
    return { ok: true, via: "session", viewer };
  }

  return { ok: false, viewer };
}
