import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { invitation } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { InvitesPanel } from "@/components/admin/invites-panel";

export default async function InvitesPage() {
  const session = await requireAuth();
  if (session.user.email !== process.env.ADMIN_EMAIL) redirect("/library");

  const invites = await db
    .select()
    .from(invitation)
    .orderBy(desc(invitation.createdAt))
    .limit(100);

  return <InvitesPanel invites={invites} />;
}
