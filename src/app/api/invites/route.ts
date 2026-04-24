import { db } from "@/lib/db";
import { invitation } from "@/lib/schema";
import {
  apiResponse,
  apiError,
  applyRateLimit,
  requireApiAuth,
  parseBody,
} from "@/lib/api-utils";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

function isAdmin(email: string) {
  return email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  const limited = await applyRateLimit("invites-list");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  if (!isAdmin(session.user.email)) return apiError("Forbidden", 403);

  const invites = await db
    .select()
    .from(invitation)
    .orderBy(desc(invitation.createdAt))
    .limit(100);

  return apiResponse(invites);
}

export async function POST(req: Request) {
  const limited = await applyRateLimit("invites-create");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  if (!isAdmin(session.user.email)) return apiError("Forbidden", 403);

  const { data } = await parseBody(req, z.object({ email: z.string().email().optional() }));
  const email = data?.email;

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invite] = await db
    .insert(invitation)
    .values({ token, email, createdBy: session.user.id, expiresAt })
    .returning();

  return apiResponse(invite, 201);
}
