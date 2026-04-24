import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { category } from "@/lib/schema";
import { LibraryShell } from "@/components/library/library-shell";

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const categories = await db.select().from(category).orderBy(category.name);
  const isAdmin = session.user.email === process.env.ADMIN_EMAIL;

  return (
    <LibraryShell categories={categories} isAdmin={isAdmin}>
      {children}
    </LibraryShell>
  );
}
