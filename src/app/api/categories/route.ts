import { db } from "@/lib/db";
import { category } from "@/lib/schema";
import { apiResponse, applyRateLimit, requireApiAuth, parseBody } from "@/lib/api-utils";
import { eq, and, or, isNull } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const limited = await applyRateLimit("categories");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  const categories = await db
    .select({ id: category.id, name: category.name, slug: category.slug })
    .from(category)
    .where(or(eq(category.userId, session.user.id), isNull(category.userId)))
    .orderBy(category.name);

  return apiResponse(categories);
}

export async function POST(req: Request) {
  const limited = await applyRateLimit("categories-write");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { data, error: parseErr } = await parseBody(req, z.object({ name: z.string().min(1) }));
  if (parseErr) return parseErr;

  const slug = data.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const [created] = await db.insert(category).values({ name: data.name, slug, userId: session.user.id }).returning();
  return apiResponse(created, 201);
}

export async function DELETE(req: Request) {
  const limited = await applyRateLimit("categories-write");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { data, error: parseErr } = await parseBody(req, z.object({ id: z.string().uuid() }));
  if (parseErr) return parseErr;

  await db.delete(category).where(and(eq(category.id, data.id), eq(category.userId, session.user.id)));
  return apiResponse({ success: true });
}
