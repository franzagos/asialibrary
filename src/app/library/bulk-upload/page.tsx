import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { category } from "@/lib/schema";
import { BulkUploadView } from "@/components/library/bulk-upload-view";

export default async function BulkUploadPage() {
  await requireAuth();
  const categories = await db.select().from(category).orderBy(category.name);
  return <BulkUploadView categories={categories} />;
}
