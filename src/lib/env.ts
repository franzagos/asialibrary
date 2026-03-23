import { z } from "zod";

/**
 * Server-side environment variables.
 * Validated at startup — the app won't boot with invalid config.
 */
const serverEnvSchema = z.object({
  POSTGRES_URL: z.string().min(1, "POSTGRES_URL is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openai/gpt-4.1-mini"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Client-side environment variables (exposed to the browser).
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error("❌ Invalid environment variables:", errors);
    throw new Error("Invalid server environment variables");
  }
  return parsed.data;
}

export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    console.error(
      "❌ Invalid client environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid client environment variables");
  }
  return parsed.data;
}

/**
 * Returns an object describing what's configured and what's missing.
 * Used by the setup wizard to show the checklist.
 */
export function getSetupStatus() {
  return {
    database: {
      configured: Boolean(process.env.POSTGRES_URL),
      value: process.env.POSTGRES_URL ? "Connected" : "Not configured",
    },
    auth: {
      secret: Boolean(
        process.env.BETTER_AUTH_SECRET &&
          process.env.BETTER_AUTH_SECRET !== "CHANGE-ME-generate-a-random-32-char-string"
      ),
      google: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
    },
    ai: {
      configured: Boolean(process.env.OPENROUTER_API_KEY),
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini",
    },
    resend: {
      configured: Boolean(process.env.RESEND_API_KEY),
    },
    storage: {
      backend: process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local",
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      env: process.env.NODE_ENV || "development",
    },
  };
}
