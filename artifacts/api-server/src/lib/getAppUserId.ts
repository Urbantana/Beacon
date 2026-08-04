import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request } from "express";

/**
 * Translates the currently-authenticated Replit user (identified by their
 * OIDC `sub`) into the app's integer user ID.
 *
 * - If the user is authenticated and has never visited before, a new row is
 *   created in `usersTable` and its integer `id` is returned.
 * - If the user is authenticated and has visited before, the existing integer
 *   `id` is returned.
 * - If the user is not authenticated, the default guest user (id = 1) is
 *   returned so all existing functionality keeps working.
 */
export const DEFAULT_USER_ID = 1;

export async function getAppUserId(req: Request): Promise<number> {
  if (!req.isAuthenticated?.()) return DEFAULT_USER_ID;

  const replitId = req.user?.id;
  if (!replitId) return DEFAULT_USER_ID;

  // Look up the existing integer app-user linked to this Replit identity
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.replitId, replitId))
    .limit(1);

  if (existing) return existing.id;

  // First login — provision a new integer app-user row
  const firstName  = (req.user as any)?.firstName as string | null;
  const lastName   = (req.user as any)?.lastName  as string | null;
  const email      = (req.user as any)?.email     as string | null;

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    email?.split("@")[0] ||
    "User";

  const initials =
    [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
    "U";

  // Guard against duplicate-username race; append a short random suffix if needed
  const baseUsername = displayName.slice(0, 40);
  const suffix       = Math.random().toString(36).slice(2, 6);
  const username     = `${baseUsername}_${suffix}`;

  const [created] = await db
    .insert(usersTable)
    .values({ username, avatarInitials: initials, replitId })
    .returning({ id: usersTable.id });

  return created.id;
}
