import { execSync } from "child_process";
import { apiResponse, apiError, applyRateLimit } from "@/lib/api-utils";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { getSetupStatus } from "@/lib/env";

export async function GET() {
  // Rate limit — prevent enumeration of config state
  const limited = await applyRateLimit("health", RATE_LIMITS.api);
  if (limited) return limited;

  // In production, return a minimal response — don't expose config state
  if (process.env.NODE_ENV === "production") {
    return apiResponse({ status: "ok", timestamp: new Date().toISOString() });
  }

  try {
    const status = getSetupStatus();

    // Test database connectivity
    let dbConnected = false;
    try {
      const { db } = await import("@/lib/db");
      await db.execute("SELECT 1");
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    // Check if the user has connected their own GitHub repo.
    // Must point to github.com but NOT the original boilerplate repo.
    let githubConnected = false;
    try {
      const remotes = execSync("git remote -v", {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      }).toString();
      githubConnected =
        remotes.includes("github.com") &&
        !remotes.includes("simomagazzu/create-app-like-simo");
    } catch {
      githubConnected = false;
    }

    return apiResponse({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        configured: status.database.configured,
      },
      auth: {
        secretConfigured: status.auth.secret,
        googleOAuth: status.auth.google,
      },
      ai: {
        configured: status.ai.configured,
        model: status.ai.model,
      },
      resend: {
        configured: status.resend.configured,
      },
      storage: {
        backend: status.storage.backend,
      },
      github: {
        connected: githubConnected,
      },
      environment: status.app.env,
    });
  } catch {
    return apiError("Health check failed", 500);
  }
}
