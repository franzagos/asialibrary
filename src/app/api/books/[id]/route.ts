import { db } from "@/lib/db";
import { book, bookTag } from "@/lib/schema";
import {
  apiResponse,
  apiError,
  applyRateLimit,
  requireApiAuth,
  parseBody,
} from "@/lib/api-utils";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { deleteFile, upload } from "@/lib/storage";

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional(),
  year: z.string().optional(),
  edition: z.string().optional(),
  description: z.string().optional(),
  marketPrice: z.string().optional().nullable(),
  personalNotes: z.string().optional(),
  purchaseStatus: z.enum(["owned", "wishlist", "lent", "sold"]).optional(),
  purchaseLocation: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

async function getOwnedBook(id: string, userId: string) {
  const rows = await db
    .select()
    .from(book)
    .where(and(eq(book.id, id), eq(book.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await applyRateLimit("books-get");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;
  const row = await getOwnedBook(id, session.user.id);
  if (!row) return apiError("Not found", 404);

  const tags = await db
    .select({ tag: bookTag.tag })
    .from(bookTag)
    .where(eq(bookTag.bookId, id));

  return apiResponse({ ...row, tags: tags.map((t) => t.tag) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await applyRateLimit("books-update");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;
  const existing = await getOwnedBook(id, session.user.id);
  if (!existing) return apiError("Not found", 404);

  const contentType = req.headers.get("content-type") ?? "";
  let data: z.infer<typeof updateBookSchema>;
  let coverUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const coverFile = formData.get("cover") as File | null;

    if (coverFile && coverFile.size > 0) {
      if (existing.coverUrl) {
        try { await deleteFile(existing.coverUrl); } catch {}
      }
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const result = await upload(buffer, coverFile.name, "covers");
      coverUrl = result.url;
    }

    const raw = {
      title: formData.get("title") as string | undefined,
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
    const parsed = updateBookSchema.safeParse(raw);
    if (!parsed.success)
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    data = parsed.data;
  } else {
    const result = await parseBody(req, updateBookSchema);
    if (result.error) return result.error;
    data = result.data;
  }

  const { tags, ...bookData } = data;

  const [updated] = await db.transaction(async (tx) => {
    const u = await tx
      .update(book)
      .set({ ...bookData, ...(coverUrl ? { coverUrl } : {}), updatedAt: new Date() })
      .where(eq(book.id, id))
      .returning();

    if (tags !== undefined) {
      await tx.delete(bookTag).where(eq(bookTag.bookId, id));
      if (tags.length > 0) {
        await tx.insert(bookTag).values(tags.map((tag) => ({ bookId: id, tag })));
      }
    }

    return u;
  });

  const newTags = await db
    .select({ tag: bookTag.tag })
    .from(bookTag)
    .where(eq(bookTag.bookId, id));

  return apiResponse({ ...updated, tags: newTags.map((t) => t.tag) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await applyRateLimit("books-delete");
  if (limited) return limited;

  const { session, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;
  const existing = await getOwnedBook(id, session.user.id);
  if (!existing) return apiError("Not found", 404);

  if (existing.coverUrl) {
    try { await deleteFile(existing.coverUrl); } catch {}
  }

  await db.delete(book).where(eq(book.id, id));

  return apiResponse({ success: true });
}
