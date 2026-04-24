import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { book, bookTag, category } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BookDetail } from "@/components/library/book-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;

  const [row] = await db
    .select()
    .from(book)
    .where(and(eq(book.id, id), eq(book.userId, session.user.id)))
    .limit(1);

  if (!row) notFound();

  const [tags, categories] = await Promise.all([
    db.select({ tag: bookTag.tag }).from(bookTag).where(eq(bookTag.bookId, id)),
    db.select().from(category).orderBy(category.name),
  ]);

  return (
    <BookDetail
      book={{ ...row, tags: tags.map((t) => t.tag) }}
      categories={categories}
    />
  );
}
