import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { category } from "@/lib/schema";
import { UploadFlow } from "@/components/library/upload-flow";

export default async function UploadPage() {
  await requireAuth();
  const categories = await db.select().from(category).orderBy(category.name);
  return <UploadFlow categories={categories} />;
}
