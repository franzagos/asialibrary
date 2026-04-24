"use client";

import { useState, useEffect, useCallback } from "react";

export interface SetupStatus {
  database: { connected: boolean; configured: boolean };
  auth: { secretConfigured: boolean; googleOAuth: boolean };
  ai: { configured: boolean; model: string };
  resend: { configured: boolean };
  storage: { backend: string };
  github: { connected: boolean };
  environment: string;
}

// Module-level cache so navigating between pages doesn't hammer /api/health.
// Force a refresh via the returned `refresh()` function.
const CACHE_TTL_MS = 30_000;
let cached: { data: SetupStatus; expires: number } | null = null;
let inflight: Promise<SetupStatus> | null = null;

async function fetchStatus(bypassCache: boolean): Promise<SetupStatus> {
  if (!bypassCache && cached && cached.expires > Date.now()) {
    return cached.data;
  }
  if (!bypassCache && inflight) return inflight;

  inflight = (async () => {
    const res = await fetch("/api/health", { cache: "no-store" });
    if (!res.ok) throw new Error("Health check failed");
    const data = (await res.json()) as SetupStatus;
    cached = { data, expires: Date.now() + CACHE_TTL_MS };
    return data;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function useSetupStatus() {
  const [status, setStatus] = useState<SetupStatus | null>(
    cached && cached.expires > Date.now() ? cached.data : null
  );
  const [loading, setLoading] = useState(!status);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStatus(true);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status) return; // already have a cached snapshot
    let cancelled = false;
    fetchStatus(false)
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to check status");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const isComplete =
    status?.database.connected &&
    status?.auth.secretConfigured;

  return { status, loading, error, refresh, isComplete };
}
