import { db } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";

/**
 * Server-side authorization guards.
 *
 * EVERY admin page, Server Component and API route handler must call
 * these functions independently. UI-level hiding of buttons is never
 * treated as access control.
 */

export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR";

export const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** Returns the current authenticated, active user — or null. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await readSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;
  if (!ROLES.includes(user.role as Role)) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
  };
}

/**
 * For API routes: throws 401/403 ApiError when unauthorized.
 * @param roles optional allow-list; omit for any authenticated staff role.
 */
export async function requireUser(roles?: Role[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Authentication required.");
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }
  return user;
}

export const canDeleteRecords = (role: Role) =>
  role === "SUPER_ADMIN" || role === "ADMIN";

export const canPublish = (role: Role) =>
  role === "SUPER_ADMIN" || role === "ADMIN";

export const canFeature = (role: Role) =>
  role === "SUPER_ADMIN" || role === "ADMIN";

export const canManageUsers = (role: Role) => role === "SUPER_ADMIN";

export const canManageSettings = (role: Role) => role === "SUPER_ADMIN";

/** For admin pages: returns user or null (pages redirect to login). */
export async function requirePageUser(roles?: Role[]): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (roles && roles.length > 0 && !roles.includes(user.role)) return null;
  return user;
}
