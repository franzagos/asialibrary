import { db } from "@/lib/db";
import { book, bookTag, category } from "@/lib/schema";
import { applyRateLimit, requireApiAuth } from "@/lib/api-utils";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  const limited = await applyRateLimit("books-export");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  const books = await db
    .select({
      id: book.id,
      title: book.title,
      author: book.author,
      year: book.year,
      edition: book.edition,
      descriptionIt: book.descriptionIt,
      descriptionEn: book.descriptionEn,
      descriptionRu: book.descriptionRu,
      marketPrice: book.marketPrice,
      categoryId: book.categoryId,
      purchaseStatus: book.purchaseStatus,
      purchaseLocation: book.purchaseLocation,
      personalNotes: book.personalNotes,
      createdAt: book.createdAt,
    })
    .from(book)
    .where(eq(book.userId, session.user.id))
    .limit(5000);

  const ids = books.map((b) => b.id);
  const [tags, categories] = await Promise.all([
    ids.length > 0
      ? db.select().from(bookTag).where(inArray(bookTag.bookId, ids))
      : [],
    db.select().from(category),
  ]);

  const tagsByBook: Record<string, string[]> = {};
  for (const t of tags) {
    if (!tagsByBook[t.bookId]) tagsByBook[t.bookId] = [];
    tagsByBook[t.bookId].push(t.tag);
  }
  const catById: Record<string, string> = {};
  for (const c of categories) catById[c.id] = c.name;

  const escape = (v: string | null | undefined) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = "title,author,year,edition,descriptionIt,descriptionEn,descriptionRu,marketPrice,category,tags,purchaseStatus,purchaseLocation,personalNotes,createdAt\n";
  const rows = books
    .map((b) =>
      [
        b.title,
        b.author,
        b.year,
        b.edition,
        b.descriptionIt,
        b.descriptionEn,
        b.descriptionRu,
        b.marketPrice,
        b.categoryId ? catById[b.categoryId] : "",
        (tagsByBook[b.id] ?? []).join("; "),
        b.purchaseStatus,
        b.purchaseLocation,
        b.personalNotes,
        b.createdAt.toISOString(),
      ]
        .map(escape)
        .join(",")
    )
    .join("\n");

  const csv = header + rows;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="libreria.csv"',
    },
  });
}
