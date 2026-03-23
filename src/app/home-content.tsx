"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useSetupStatus } from "@/hooks/use-setup-status";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 rounded bg-muted px-2.5 py-1 font-mono text-xs hover:bg-muted/80 transition-colors max-w-full"
    >
      <span className="truncate">{text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-500 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
      )}
    </button>
  );
}

function StatusIcon({ ok, loading }: { ok: boolean; loading: boolean }) {
  if (loading) return <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />;
  if (ok) return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  return <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <RefreshCw className="h-3 w-3" />
      Ricontrolla
    </button>
  );
}

type StepStatus = "done" | "pending" | "optional";

function Section({
  number,
  title,
  status,
  children,
}: {
  number: number;
  title: string;
  status: StepStatus;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
            status === "done"
              ? "bg-green-500/15 text-green-600 dark:text-green-400"
              : "bg-muted text-foreground"
          )}
        >
          {status === "done" ? <Check className="h-3 w-3" /> : number}
        </div>
        <h2 className="text-sm font-medium flex-1">{title}</h2>
        {status === "optional" && (
          <span className="text-xs text-muted-foreground">opzionale</span>
        )}
        {status === "done" && (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        )}
      </div>
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-xs border transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:border-foreground/50"
      )}
    >
      {children}
    </button>
  );
}

function EnvVar({ name, ok, loading }: { name: string; ok: boolean; loading: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <StatusIcon ok={ok} loading={loading} />
      <code className="text-xs font-mono">{name}</code>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

// ---------------------------------------------------------------------------
// localStorage helpers (safe — this component never runs on the server)
// ---------------------------------------------------------------------------

type AuthMethods = {
  emailPassword: boolean;
  magicLink: boolean;
  otp: boolean;
  google: boolean;
  none: boolean;
};

type SavedSetup = { authMethods?: AuthMethods; ai?: boolean; repoUrl?: string };

const STORAGE_KEY = "boilerplate-setup";

const DEFAULT_AUTH: AuthMethods = {
  emailPassword: false,
  magicLink: false,
  otp: false,
  google: false,
  none: false,
};

function loadSaved(): SavedSetup {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? (JSON.parse(s) as SavedSetup) : {};
  } catch { return {}; }
}

function persist(updates: Partial<SavedSetup>) {
  try {
    const existing = loadSaved();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...updates }));
  } catch {}
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

export default function HomeContent() {
  const { status, loading, refresh } = useSetupStatus();

  const [authMethods, setAuthMethods] = useState<AuthMethods>(
    () => loadSaved().authMethods ?? DEFAULT_AUTH
  );
  const [wantsAI, setWantsAI] = useState<boolean | null>(
    () => loadSaved().ai ?? null
  );
  const [repoUrl, setRepoUrl] = useState(
    () => loadSaved().repoUrl ?? ""
  );

  const toggleAuth = (method: keyof AuthMethods) => {
    const next: AuthMethods =
      method === "none"
        ? { emailPassword: false, magicLink: false, otp: false, google: false, none: true }
        : { ...authMethods, [method]: !authMethods[method], none: false };
    setAuthMethods(next);
    persist({ authMethods: next });
  };

  const dbOk = status?.database.connected ?? false;
  const secretOk = status?.auth.secretConfigured ?? false;
  const googleOk = status?.auth.googleOAuth ?? false;
  const resendOk = status?.resend?.configured ?? false;
  const aiOk = status?.ai.configured ?? false;
  const githubOk = status?.github.connected ?? false;

  const anyAuthSelected = Object.values(authMethods).some(Boolean);
  const needsEmailAuth = authMethods.emailPassword || authMethods.magicLink || authMethods.otp;
  const authDone = anyAuthSelected && (!authMethods.google || googleOk);
  const aiDone = wantsAI === false ? true : wantsAI === true ? aiOk : false;
  const allReady = dbOk && secretOk && authDone && wantsAI !== null && aiDone;

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-2">

        <div className="mb-10">
          <h1 className="text-xl font-semibold tracking-tight">Simo&apos;s Agentic Boilerplate</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Completa la configurazione per iniziare a costruire.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Ogni sezione ti spiega cos&apos;è, perché serve e come configurarla.
            Quando una sezione è completata diventa verde. Alla fine potrai
            iniziare a costruire la tua app con Claude Code.
          </p>
        </div>

        {/* 1. Dev server */}
        <Section number={1} title="Server di sviluppo" status="done">
          <p className="text-muted-foreground">
            Il server è il programma che fa funzionare la tua app sul tuo
            computer. Quando è attivo, puoi vedere la tua app nel browser
            su{" "}
            <code className="bg-muted px-1 rounded">localhost:3000</code>.
          </p>
          <Hint>
            Il server occupa il terminale dove hai eseguito{" "}
            <code className="bg-muted px-1 rounded">pnpm dev</code>.
            Per eseguire altri comandi, apri un secondo terminale in VS Code:{" "}
            <strong className="text-foreground">Terminal → New Terminal</strong>.
          </Hint>
          <Hint>
            Ogni volta che modifichi il file{" "}
            <code className="bg-muted px-1 rounded">.env</code>,
            devi fermare il server (<code className="bg-muted px-1 rounded">Ctrl+C</code>)
            e riavviarlo con{" "}
            <code className="bg-muted px-1 rounded">pnpm dev</code>{" "}
            per applicare le modifiche.
          </Hint>
        </Section>

        {/* 2. Database */}
        <Section number={2} title="Database" status={dbOk ? "done" : "pending"}>
          <p className="text-muted-foreground">
            Il database è dove la tua app salva i dati: utenti registrati,
            contenuti, impostazioni. Senza un database, l&apos;app non può
            ricordare niente tra una visita e l&apos;altra.
          </p>
          <p className="text-muted-foreground">
            Usiamo Docker per avviare un database PostgreSQL sul tuo computer
            — non serve configurare nulla su cloud.
          </p>
          {!dbOk && (
            <div className="space-y-2">
              <Hint>
                Assicurati che Docker Desktop sia aperto (icona della balena
                nella barra in alto), poi esegui in un secondo terminale:
              </Hint>
              <CopyButton text="docker compose up -d" />
              <CopyButton text="pnpm run db:migrate" />
              <RefreshButton onClick={refresh} />
            </div>
          )}
          {dbOk && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Database connesso.
            </p>
          )}
          <div className="border-t border-border pt-3">
            <Hint>
              <strong className="text-foreground">In produzione</strong> userai
              un database cloud (es. Neon o Supabase). Per ora Docker è sufficiente.
            </Hint>
          </div>
        </Section>

        {/* 3. Chiave segreta */}
        <Section
          number={3}
          title="Chiave segreta"
          status={secretOk ? "done" : "pending"}
        >
          <p className="text-muted-foreground">
            La chiave segreta protegge le sessioni degli utenti. Senza di
            essa, chiunque potrebbe fingersi un utente loggato. Ogni progetto
            deve avere la sua chiave unica.
          </p>
          {!secretOk && (
            <div className="space-y-2">
              <Hint>1. Genera una chiave casuale con questo comando:</Hint>
              <CopyButton text="openssl rand -base64 32" />
              <Hint>
                2. Copia il risultato (una stringa tipo{" "}
                <code className="bg-muted px-1 rounded">aB3xK9...</code>),
                apri il file{" "}
                <code className="bg-muted px-1 rounded">.env</code> e
                sostituisci{" "}
                <code className="bg-muted px-1 rounded">CHANGE-ME-generate-a-random-32-char-string</code>{" "}
                con la tua chiave.
              </Hint>
              <Hint>
                3. Ferma il server (Ctrl+C) e riavvialo con{" "}
                <code className="bg-muted px-1 rounded">pnpm dev</code>.
              </Hint>
              <RefreshButton onClick={refresh} />
            </div>
          )}
          {secretOk && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Chiave segreta configurata.
            </p>
          )}
        </Section>

        {/* 4. Auth */}
        <Section
          number={4}
          title="Autenticazione"
          status={
            !anyAuthSelected
              ? "pending"
              : authDone
              ? "done"
              : "pending"
          }
        >
          <p className="text-muted-foreground">
            L&apos;autenticazione permette agli utenti di creare un account e
            accedere alla tua app. Puoi scegliere come vuoi che si registrino
            — anche più metodi contemporaneamente.
          </p>
          <div className="flex flex-wrap gap-2">
            <ChoiceButton selected={authMethods.emailPassword} onClick={() => toggleAuth("emailPassword")}>
              Email + Password
            </ChoiceButton>
            <ChoiceButton selected={authMethods.magicLink} onClick={() => toggleAuth("magicLink")}>
              Magic Link
            </ChoiceButton>
            <ChoiceButton selected={authMethods.otp} onClick={() => toggleAuth("otp")}>
              Email OTP
            </ChoiceButton>
            <ChoiceButton selected={authMethods.google} onClick={() => toggleAuth("google")}>
              Google
            </ChoiceButton>
            <ChoiceButton selected={authMethods.none} onClick={() => toggleAuth("none")}>
              Nessuna
            </ChoiceButton>
          </div>

          {!anyAuthSelected && (
            <Hint>
              <strong className="text-foreground">Email + Password</strong>: l&apos;utente
              si registra con email e sceglie una password.{" "}
              <strong className="text-foreground">Magic Link</strong>: riceve un link via
              email per accedere senza password.{" "}
              <strong className="text-foreground">Email OTP</strong>: riceve un codice
              numerico via email.{" "}
              <strong className="text-foreground">Google</strong>: accesso con un click
              usando il proprio account Google.
            </Hint>
          )}

          {authMethods.none && (
            <Hint>Ok — potrai aggiungere l&apos;autenticazione in seguito se necessario.</Hint>
          )}

          {/* Resend — required for any email-based method */}
          {needsEmailAuth && (
            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-muted-foreground text-xs">
                I metodi via email hanno bisogno di un servizio che invii le email
                (link di verifica, codici OTP, reset password). Usiamo{" "}
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Resend
                </a>
                . In locale le email vengono stampate nel terminale, quindi
                puoi lavorare anche senza Resend — serve solo in produzione.
              </p>
              <Hint>
                Vai su resend.com → registrati → API Keys → Create Key. Poi
                aggiungi al .env:
              </Hint>
              <div className="space-y-1.5">
                <EnvVar name="RESEND_API_KEY" ok={resendOk} loading={loading} />
                <CopyButton text="RESEND_API_KEY=incolla-qui" />
              </div>
              <div className="space-y-1.5">
                <EnvVar name="RESEND_FROM_EMAIL" ok={resendOk} loading={loading} />
                <CopyButton text="RESEND_FROM_EMAIL=noreply@tuodominio.com" />
              </div>
              <Hint>
                Il dominio mittente deve essere verificato su Resend. Per i test puoi
                usare l&apos;indirizzo email del tuo account Resend.
              </Hint>
              <RefreshButton onClick={refresh} />
            </div>
          )}

          {/* Google credentials */}
          {authMethods.google && (
            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-muted-foreground text-xs">
                Per il login con Google serve creare delle credenziali sulla
                Google Cloud Console. È gratuito.
              </p>
              <Hint>
                1. Vai su{" "}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  console.cloud.google.com
                </a>{" "}
                → Crea un progetto → API e servizi → Credenziali → Crea credenziali →
                ID client OAuth 2.0. Quando ti chiede gli URI di reindirizzamento
                autorizzati, aggiungi:
              </Hint>
              <CopyButton text="http://localhost:3000/api/auth/callback/google" />
              <Hint>2. Poi aggiungi al .env:</Hint>
              <div className="space-y-1.5">
                <EnvVar name="GOOGLE_CLIENT_ID" ok={googleOk} loading={loading} />
                <CopyButton text="GOOGLE_CLIENT_ID=incolla-qui" />
              </div>
              <div className="space-y-1.5">
                <EnvVar name="GOOGLE_CLIENT_SECRET" ok={googleOk} loading={loading} />
                <CopyButton text="GOOGLE_CLIENT_SECRET=incolla-qui" />
              </div>
              <RefreshButton onClick={refresh} />
            </div>
          )}
        </Section>

        {/* 5. AI */}
        <Section
          number={5}
          title="Intelligenza Artificiale"
          status={
            wantsAI === null
              ? "pending"
              : wantsAI === false || aiOk
              ? "done"
              : "pending"
          }
        >
          <p className="text-muted-foreground">
            Se la tua app userà funzionalità AI (chatbot, generazione di testo,
            analisi dati), serve una chiave API per accedere ai modelli.
            Se non ti serve, puoi saltare — potrai aggiungerla in qualsiasi momento.
          </p>
          <div className="flex gap-2">
            <ChoiceButton
              selected={wantsAI === true}
              onClick={() => {
                setWantsAI(true);
                persist({ ai: true });
              }}
            >
              Sì, la mia app userà l&apos;AI
            </ChoiceButton>
            <ChoiceButton
              selected={wantsAI === false}
              onClick={() => {
                setWantsAI(false);
                persist({ ai: false });
              }}
            >
              No, per ora
            </ChoiceButton>
          </div>

          {wantsAI === false && (
            <Hint>Ok — nessuna configurazione necessaria.</Hint>
          )}

          {wantsAI === true && (
            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-muted-foreground text-xs">
                Usiamo{" "}
                <a
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  OpenRouter
                </a>{" "}
                — un servizio che ti dà accesso a oltre 100 modelli AI (GPT-4,
                Claude, Gemini e altri) con una sola chiave API. Paghi solo
                quello che usi.
              </p>
              <Hint>
                Vai su openrouter.ai → registrati → API Keys → Create Key. Poi
                aggiungi al .env:
              </Hint>
              <div className="space-y-1.5">
                <EnvVar name="OPENROUTER_API_KEY" ok={aiOk} loading={loading} />
                <CopyButton text="OPENROUTER_API_KEY=incolla-qui" />
              </div>
              <Hint>
                Modello di default:{" "}
                <code className="bg-muted px-1 rounded">openai/gpt-4.1-mini</code>.
                Puoi cambiarlo aggiungendo{" "}
                <code className="bg-muted px-1 rounded">OPENROUTER_MODEL</code> al
                .env.
              </Hint>
              <RefreshButton onClick={refresh} />
            </div>
          )}
        </Section>

        {/* 6. GitHub */}
        <Section number={6} title="Repository GitHub" status={githubOk ? "done" : "optional"}>
          <p className="text-muted-foreground">
            GitHub è dove il tuo codice viene salvato online. Serve a due cose:
            avere un backup sicuro del progetto, e poter tornare a qualsiasi
            versione precedente se qualcosa va storto. È opzionale per iniziare,
            ma consigliato.
          </p>
          {!githubOk && (
            <div className="space-y-3">
              <Hint>
                1.{" "}
                <a
                  href="https://github.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Crea un nuovo repo su GitHub
                </a>{" "}
                (lascia tutte le opzioni di default, non aggiungere README o .gitignore),
                poi incolla qui l&apos;URL del repo:
              </Hint>
              <input
                type="text"
                placeholder="https://github.com/username/repo.git"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  persist({ repoUrl: e.target.value });
                }}
                className="w-full rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {repoUrl && (
                <div className="space-y-2">
                  <Hint>2. Esegui questi comandi nel terminale:</Hint>
                  <CopyButton text={`git remote set-url origin ${repoUrl} 2>/dev/null || git remote add origin ${repoUrl}`} />
                  <CopyButton text="git push -u origin main" />
                </div>
              )}
              <RefreshButton onClick={refresh} />
            </div>
          )}
          {githubOk && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Repository connesso.
            </p>
          )}
        </Section>

        {/* All done */}
        {allReady && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5 space-y-3">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Tutto pronto. Apri un nuovo terminale in VS Code e scrivi:
            </p>
            <div className="flex flex-col gap-2">
              <CopyButton text="claude" />
              <Hint>
                Dentro Claude Code scrivi{" "}
                <code className="bg-muted px-1 rounded">/starter-prompt</code>{" "}
                — Claude ti farà delle domande su cosa vuoi costruire e poi
                creerà la tua app automaticamente.
              </Hint>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-4">
          Non sai come procedere? Leggi il{" "}
          <a
            href="https://github.com/simomagazzu/create-app-like-simo"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            README
          </a>
          .
        </p>

      </div>
    </div>
  );
}
