"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (mode !== "login") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: "/library",
      });
      if (result.error) {
        setError(result.error.message || "Errore nell'invio del link.");
        return;
      }
      setSent(true);
    } catch {
      setError("Qualcosa è andato storto. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: "var(--terracotta)" }}
        >
          <span className="text-white text-lg">📚</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Bentornata</h1>
        <p className="text-sm text-muted-foreground mt-1">Asia&apos;s Library</p>
      </div>

      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="font-medium">Controlla la tua email</p>
          <p className="text-sm text-muted-foreground">
            Abbiamo inviato un link di accesso a <strong>{email}</strong>.
            <br />
            Clicca il link per entrare nella libreria.
          </p>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-xs text-muted-foreground underline underline-offset-2 mt-2"
          >
            Usa un&apos;altra email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@esempio.com"
              autoComplete="email"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Mail className="h-4 w-4 mr-1.5" />
            )}
            Invia magic link
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Non hai un account? Chiedi un invito ad Asia.
      </p>
    </div>
  );
}
