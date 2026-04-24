import { requireAuth } from "@/lib/session";
import { LibraryView } from "@/components/library/library-view";
import { db } from "@/lib/db";
import { category } from "@/lib/schema";

interface Props {
  searchParams: Promise<{ categoryId?: string; tag?: string; q?: string }>;
}

export default async function LibraryPage({ searchParams }: Props) {
  await requireAuth();
  const params = await searchParams;
  const categories = await db.select().from(category).orderBy(category.name);

  return <LibraryView initialFilters={params} categories={categories} />;
}
