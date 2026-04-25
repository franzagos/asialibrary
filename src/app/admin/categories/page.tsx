import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { category } from "@/lib/schema";
import { CategoriesPanel } from "@/components/admin/categories-panel";

export default async function CategoriesPage() {
  const session = await requireAuth();
  if (session.user.email !== process.env.ADMIN_EMAIL) redirect("/library");

  const categories = await db
    .select()
    .from(category)
    .orderBy(category.name);

  return <CategoriesPanel categories={categories} />;
}
