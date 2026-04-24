import { db } from "@/lib/db";
import { book, bookTag } from "@/lib/schema";
import {
  apiResponse,
  apiError,
  applyRateLimit,
  requireApiAuth,
  parseBody,
} from "@/lib/api-utils";
import { eq, and, ilike, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { upload } from "@/lib/storage";

const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  year: z.string().optional(),
  edition: z.string().optional(),
  description: z.string().optional(),
  marketPrice: z.string().optional(),
  coverUrl: z.string().optional(),
  personalNotes: z.string().optional(),
  purchaseStatus: z.enum(["owned", "wishlist", "lent", "sold"]).optional(),
  purchaseLocation: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: Request) {
  const limited = await applyRateLimit("books-list");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId");
  const tag = url.searchParams.get("tag");
  const q = url.searchParams.get("q");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 50);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const conditions = [eq(book.userId, session.user.id)];
  if (categoryId) conditions.push(eq(book.categoryId, categoryId));
  if (q) conditions.push(ilike(book.title, `%${q}%`));

  let bookIds: string[] | null = null;
  if (tag) {
    const tagRows = await db
      .select({ bookId: bookTag.bookId })
      .from(bookTag)
      .where(eq(bookTag.tag, tag));
    bookIds = tagRows.map((r) => r.bookId);
    if (bookIds.length === 0) return apiResponse({ books: [], total: 0 });
  }

  if (bookIds) conditions.push(inArray(book.id, bookIds));

  const [books, countResult] = await Promise.all([
    db
      .select({
        id: book.id,
        title: book.title,
        author: book.author,
        year: book.year,
        coverUrl: book.coverUrl,
        marketPrice: book.marketPrice,
        purchaseStatus: book.purchaseStatus,
        categoryId: book.categoryId,
        createdAt: book.createdAt,
      })
      .from(book)
      .where(and(...conditions))
      .orderBy(book.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(book)
      .where(and(...conditions)),
  ]);

  // Fetch tags for these books
  const ids = books.map((b) => b.id);
  const tags =
    ids.length > 0
      ? await db
          .select()
          .from(bookTag)
          .where(inArray(bookTag.bookId, ids))
      : [];

  const tagsByBook: Record<string, string[]> = {};
  for (const t of tags) {
    if (!tagsByBook[t.bookId]) tagsByBook[t.bookId] = [];
    tagsByBook[t.bookId].push(t.tag);
  }

  const result = books.map((b) => ({ ...b, tags: tagsByBook[b.id] ?? [] }));

  return apiResponse({ books: result, total: countResult[0].count });
}

export async function POST(req: Request) {
  const limited = await applyRateLimit("books-create");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  // Handle multipart (with cover image) or JSON
  const contentType = req.headers.get("content-type") ?? "";
  let data: z.infer<typeof createBookSchema>;
  let coverUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const coverFile = formData.get("cover") as File | null;

    if (coverFile && coverFile.size > 0) {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const result = await upload(buffer, coverFile.name, "covers");
      coverUrl = result.url;
    }

    const raw = {
      title: formData.get("title") as string,
      author: formData.get("author") as string | undefined,
      year: formData.get("year") as string | undefined,
      edition: formData.get("edition") as string | undefined,
      description: formData.get("description") as string | undefined,
      marketPrice: formData.get("marketPrice") as string | undefined,
      personalNotes: formData.get("personalNotes") as string | undefined,
      purchaseStatus: formData.get("purchaseStatus") as string | undefined,
      purchaseLocation: formData.get("purchaseLocation") as string | undefined,
      categoryId: formData.get("categoryId") as string | undefined,
      tags: (formData.get("tags") as string | null)
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const parsed = createBookSchema.safeParse(raw);
    if (!parsed.success)
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    data = parsed.data;
  } else {
    const result = await parseBody(req, createBookSchema);
    if (result.error) return result.error;
    data = result.data;
    coverUrl = data.coverUrl;
  }

  const { tags, ...bookData } = data;

  const [newBook] = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(book)
      .values({
        ...bookData,
        coverUrl,
        userId: session.user.id,
        marketPrice: bookData.marketPrice ?? undefined,
      })
      .returning();

    if (tags && tags.length > 0) {
      await tx
        .insert(bookTag)
        .values(tags.map((tag) => ({ bookId: inserted[0].id, tag })));
    }

    return inserted;
  });

  return apiResponse(newBook, 201);
}
