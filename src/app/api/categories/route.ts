import { db } from "@/lib/db";
import { category } from "@/lib/schema";
import { apiResponse, applyRateLimit, requireApiAuth } from "@/lib/api-utils";

export async function GET() {
  const limited = await applyRateLimit("categories");
  if (limited) return limited;

  const { error } = await requireApiAuth();
  if (error) return error;

  const categories = await db
    .select({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })
    .from(category)
    .orderBy(category.name);

  return apiResponse(categories);
}
