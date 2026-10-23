// Contributor roles. Kept free of Next.js/Prisma imports so both server and client
// code can reason about a role without pulling in the database.

export const USER_ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_ROLE: UserRole = "USER";

// Roles a super admin may assign to someone else. SUPER_ADMIN is deliberately not
// here: super admins come from SUPER_ADMIN_EMAILS, so one cannot promote another.
export const ASSIGNABLE_ROLES: readonly UserRole[] = ["USER", "ADMIN"];

const RANKS: Record<UserRole, number> = { USER: 0, ADMIN: 1, SUPER_ADMIN: 2 };

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function roleAtLeast(role: UserRole, minimum: UserRole): boolean {
  return RANKS[role] >= RANKS[minimum];
}

export function isAdmin(role: UserRole): boolean {
  return roleAtLeast(role, "ADMIN");
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

// Comma-separated allowlist of always-super-admin emails. Keeping this in configuration
// rather than a seeded row means it survives redeploys and database rebuilds.
export function superAdminEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

// The role an email must hold, or undefined when the email grants no special role.
// Undefined means "leave the stored role alone" so a manually promoted admin stays one.
export function seededRole(email: string | null | undefined, raw: string | undefined): UserRole | undefined {
  if (!email) return undefined;
  return superAdminEmails(raw).has(email.trim().toLowerCase()) ? "SUPER_ADMIN" : undefined;
}
