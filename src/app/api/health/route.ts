import { exec } from "child_process";
import { promisify } from "util";
import { apiResponse, apiError, applyRateLimit } from "@/lib/api-utils";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { getSetupStatus } from "@/lib/env";

const execAsync = promisify(exec);

// Git remote rarely changes during a dev session. Cache for 30s so the wizard
// can re-poll without re-forking git on every hit.
let githubCache: { value: boolean; expires: number } | null = null;
const GITHUB_CACHE_TTL_MS = 30_000;

async function isGithubConnected(): Promise<boolean> {
  if (githubCache && githubCache.expires > Date.now()) return githubCache.value;

  let connected = false;
  try {
    const { stdout } = await execAsync("git remote -v", { cwd: process.cwd() });
    connected =
      stdout.includes("github.com") &&
      !stdout.includes("simomagazzu/create-app-like-simo");
  } catch {
    connected = false;
  }

  githubCache = { value: connected, expires: Date.now() + GITHUB_CACHE_TTL_MS };
  return connected;
}

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

    const githubConnected = await isGithubConnected();

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
