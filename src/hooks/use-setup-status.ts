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

export function useSetupStatus() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Health check failed");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isComplete =
    status?.database.connected &&
    status?.auth.secretConfigured;

  return { status, loading, error, refresh, isComplete };
}
