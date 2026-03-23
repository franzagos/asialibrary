import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink, emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "./db";

/**
 * Shared email sender.
 * Uses Resend when RESEND_API_KEY is configured.
 * Falls back to terminal logging in development.
 */
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
    // Dev fallback — link/code is printed to the terminal running pnpm dev
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    console.log(
      `\n${"=".repeat(60)}\n${subject}\nTo: ${to}\n${text}\n${"=".repeat(60)}\n`
    );
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  database: drizzleAdapter(db, { provider: "pg" }),

  // Email + password (always enabled)
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
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Verify your email",
        `<p>Click <a href="${url}">here</a> to verify your account.</p>`
      );
    },
  },

  // Google OAuth (enabled when credentials are present)
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  // Magic link + Email OTP (always registered; require Resend in production)
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
      sendVerificationOTP: async ({ email, otp }: { email: string; otp: string }) => {
        await sendEmail(
          email,
          "Your verification code",
          `<p>Your code is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`
        );
      },
    }),
  ],
});
