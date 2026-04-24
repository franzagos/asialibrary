import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink, emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "./db";
import { invitation } from "./schema";
import { eq, and, gt } from "drizzle-orm";

async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
      to,
      subject,
      html,
    });
  } else {
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    console.log(
      `\n${"=".repeat(60)}\n${subject}\nTo: ${to}\n${text}\n${"=".repeat(60)}\n`
    );
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  database: drizzleAdapter(db, { provider: "pg" }),

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Reset your password",
        `<p>Click <a href="${url}">here</a> to reset your password. The link expires in 1 hour.</p>`
      );
    },
  },

  emailVerification: {
    sendOnSignUp: false,
  },

  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          // Allow admin email without invite token
          if (userData.email === process.env.ADMIN_EMAIL) {
            return { data: userData };
          }
          // All other sign-ups are blocked at the API level via invite token check
          // (handled in the register page POST to /api/auth/sign-up/email)
          return { data: userData };
        },
      },
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail(
          email,
          "Your sign-in link",
          `<p>Click <a href="${url}">here</a> to sign in. The link expires in 1 hour.</p>`
        );
      },
    }),
    emailOTP({
      sendVerificationOTP: async ({
        email,
        otp,
      }: {
        email: string;
        otp: string;
      }) => {
        await sendEmail(
          email,
          "Your verification code",
          `<p>Your code is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`
        );
      },
    }),
  ],
});

// Validate an invite token and mark it used. Returns true if valid.
export async function validateAndUseInviteToken(token: string): Promise<boolean> {
  const now = new Date();
  const rows = await db
    .select()
    .from(invitation)
    .where(
      and(
        eq(invitation.token, token),
        eq(invitation.used, false),
        gt(invitation.expiresAt, now)
      )
    )
    .limit(1);

  if (rows.length === 0) return false;

  await db
    .update(invitation)
    .set({ used: true, usedAt: now })
    .where(eq(invitation.id, rows[0].id));

  return true;
}
