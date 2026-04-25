import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { category, bookTag, book } from "@/lib/schema";
import { LibraryShell } from "@/components/library/library-shell";
import { eq } from "drizzle-orm";

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const [categories, tagRows] = await Promise.all([
    db.select().from(category).orderBy(category.name),
    db
      .selectDistinct({ tag: bookTag.tag })
      .from(bookTag)
      .innerJoin(book, eq(book.id, bookTag.bookId))
      .where(eq(book.userId, session.user.id))
      .orderBy(bookTag.tag),
  ]);
  const tags = tagRows.map((r) => r.tag);
  const isAdmin = session.user.email === process.env.ADMIN_EMAIL;

  return (
    <LibraryShell categories={categories} tags={tags} isAdmin={isAdmin}>
      {children}
    </LibraryShell>
  );
}
