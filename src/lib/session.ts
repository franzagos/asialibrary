import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Routes that require authentication.
 * Add your protected routes here.
 */
export const protectedRoutes = ["/library", "/admin", "/profile"];

/**
 * Require authentication in a Server Component.
 * Redirects to home if not logged in.
 *
 * Usage:
 *   const session = await requireAuth();
 *   // session.user is guaranteed to exist here
 */
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Get the current session without requiring auth.
 * Returns null if not logged in.
 */
export async function getOptionalSession() {
  return await auth.api.getSession({ headers: await headers() });
}

/**
 * Check if a path requires authentication.
 */
export function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}
