# Crea webapp come Simo

Un template Next.js per costruire web app moderne con un agente AI, con una struttura guidata che ti permette di lavorare con gli stessi strumenti dei developer senza dover partire da zero.

> **Agenti supportati**: **Claude Code**, **OpenAI Codex**, e **Cursor Composer**. Lo sviluppo core dell'app funziona bene con tutti e tre. I workflow multi-agente avanzati (`/starter-prompt`, `/create-spec`, `/continue-feature`) preferiscono i sub-agenti paralleli quando il runtime li supporta, ma includono un percorso sequenziale di fallback che funziona in qualsiasi runtime. Dettagli su compatibilità e limiti in [`docs/agent-runtimes/`](docs/agent-runtimes/).

---

## Perché ho creato questo template

Tool come Lovable, Replit e ambienti simili sono ottimi per iniziare. Permettono di costruire applicazioni velocemente e abbassano molto la barriera di ingresso.

Il problema è che spesso ti ritrovi a costruire cose da developer senza capire davvero cosa sta succedendo sotto il cofano. Il codice esiste, ma non è davvero tuo. Non sai bene come è organizzato, non sai come ottimizzarlo, e non sai come intervenire quando vuoi fare qualcosa di più avanzato.

Questo boilerplate nasce per fare un passaggio preciso: passare da tool come Lovable o Replit a costruire applicazioni con gli stessi strumenti dei developer, ma con una guida chiara.

**La cosa che lo rende diverso dagli altri template**: risolve il problema classico di Claude Code; più la sessione va avanti, più Claude perde il filo, inizia a contraddirsi e introduce bug che non c'erano.

Il motivo è l'accumulo di contesto. Questo template lo risolve alla radice con un'architettura multi-agente:

- **Orchestratore**; legge la spec, coordina i task, non accumula contesto operativo
- **Sotto-agenti**; ognuno riceve un brief preciso, esegue un task in isolamento con 200k token freschi, poi chiude
- **Design system**; la direzione visiva viene estratta dai requisiti e iniettata in ogni brief UI, così lo stile rimane coerente tra un agente e l'altro

Il processo scatta in automatico solo quando serve; per task importanti e strutturati. Per modifiche semplici, Claude lavora direttamente senza overhead.

Il risultato: il codice rimane preciso e consistente dall'inizio alla fine del progetto, anche quando cresce.

---

## Per chi è

- Hai iniziato con tool come Lovable o Replit
- Vuoi costruire applicazioni web reali
- Vuoi capire meglio cosa succede dietro al codice
- Vuoi avere più controllo sul tuo software
- Vuoi lavorare con strumenti da developer senza sentirti completamente perso

---

## Cosa include

Autenticazione, database, AI, UI e sicurezza sono già configurati. Parti subito a costruire le feature.

| | |
|---|---|
| **Auth** | Email/password + Google OAuth |
| **Database** | PostgreSQL + Drizzle ORM |
| **AI** | 100+ modelli via OpenRouter |
| **UI** | shadcn/ui + Tailwind 4 + dark mode |
| **Sicurezza** | Rate limiting, CSP, validazione input, path traversal protection |
| **Storage** | Locale in dev, Vercel in produzione |

---

## Prerequisiti (una tantum)

Questi strumenti vanno installati **una sola volta**. Una volta completato questo setup, non dovrai più rifarlo — né per questo progetto né per quelli futuri.

> **Come funziona il terminale**: incolli un comando, premi `Invio`, e aspetti. Sai che ha finito quando ricompare la riga con il tuo nome utente (es. `mario@MacBook %`). A quel punto puoi incollare il comando successivo. Non serve aprire un nuovo terminale tra un comando e l'altro, a meno che non sia indicato esplicitamente.

Segui le istruzioni per il tuo sistema operativo:

---

### Se usi Mac

#### 1. Apri il Terminale

Premi `Cmd + Spazio`, scrivi **Terminale**, premi `Invio`. Si apre una finestra con sfondo scuro e testo bianco — è qui che eseguirai tutti i comandi.

#### 2. Homebrew

**Cos'è**: il "negozio" che ti permette di installare programmi da terminale con un solo comando. Senza Homebrew dovresti scaricare ogni tool manualmente.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- Ti chiederà la **password del Mac** — quando la scrivi non vedrai niente a schermo (nemmeno puntini). È normale, scrivi e premi `Invio`.
- L'installazione può durare **5–10 minuti**. Vedrai molto testo scorrere. Aspetta finché non ricompare la riga con il tuo nome utente.
- **Importante**: alla fine Homebrew potrebbe mostrarti 2 righe da copiare sotto la scritta `==> Next steps`. Se le vedi, copiale e incollale nel terminale una alla volta. Servono per attivare Homebrew.

**Come sai che ha funzionato**: chiudi il terminale, riaprilo, e scrivi `brew --version`. Se vedi un numero di versione, è tutto ok.

#### 3. Git

**Cos'è**: il sistema che salva la cronologia del tuo codice. Ogni modifica viene registrata, e puoi sempre tornare a una versione precedente.

```bash
brew install git
```

Durata: circa 1 minuto. **Fatto quando**: ricompare la riga col tuo nome utente. Verifica con `git --version`.

**Configura il tuo nome e email** (usa gli stessi del tuo account GitHub):

```bash
git config --global user.name "Il Tuo Nome"
git config --global user.email "la-tua-email@esempio.com"
```

Questi comandi non danno nessun output — è normale. Devi farlo **una volta sola**, vale per tutti i progetti futuri. Se non hai ancora un account GitHub, creane uno su [github.com](https://github.com) — ti servirà dopo.

#### 4. Node.js

**Cos'è**: il motore che esegue il codice della tua app. Senza Node.js, il computer non sa come leggere il codice che scrivi.

```bash
brew install node
```

Durata: circa 2 minuti. Verifica con `node --version` — deve mostrare v18 o superiore.

#### 5. pnpm

**Cos'è**: il gestore delle librerie. La tua app usa centinaia di pezzi di codice scritti da altri (pulsanti, connessione al database, ecc.). pnpm li scarica e li tiene aggiornati.

```bash
sudo npm install -g pnpm
```

Ti chiederà la password del Mac. Verifica con `pnpm --version`.

#### 6. Docker Desktop

**Cos'è**: Docker fa girare un database sul tuo computer senza che tu debba installare o configurare PostgreSQL manualmente. Pensalo come una "scatola" che contiene il database già pronto.

1. Vai su [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Scarica la versione per il tuo Mac (Apple Silicon o Intel — se non sai quale hai: menu Mela → Informazioni su questo Mac)
3. Apri il file `.dmg`, trascina Docker nella cartella Applicazioni
4. Apri Docker Desktop dalle Applicazioni. La prima volta chiede dei permessi — accetta tutto

**Importante**: Docker Desktop deve essere **aperto e in esecuzione** ogni volta che lavori al progetto. Vedrai un'icona di balena nella barra in alto del Mac.

Verifica nel terminale: `docker --version`

#### 7. Visual Studio Code

**Cos'è**: l'editor dove vedrai e modificherai il codice. È gratuito ed è lo standard usato dalla maggior parte dei developer.

1. Vai su [code.visualstudio.com](https://code.visualstudio.com/)
2. Scarica, apri il `.dmg`, trascina nella cartella Applicazioni
3. Apri VS Code

**Installa l'estensione del tuo agente AI**:

Scegli uno tra questi — tutti funzionano con il boilerplate. Se non sei sicuro, vai con **Claude Code** (è quello su cui il boilerplate è stato sviluppato).

4. Clicca l'icona dei quadratini nella barra laterale sinistra (oppure premi `Cmd + Shift + X`)
5. Cerca e installa **una** tra queste estensioni:
   - **Claude Code** (Anthropic) — il più testato con questo boilerplate
   - **OpenAI Codex** — agente CLI di OpenAI
   - Oppure usa **Cursor** come editor al posto di VS Code (scarica da [cursor.com](https://cursor.com)) — ha Composer integrato

**Il terminale dentro VS Code**:

VS Code ha un terminale integrato — funziona esattamente come il Terminale del Mac, ma è comodo perché resta dentro l'editor senza dover cambiare finestra.

7. Apri il terminale integrato: menu **Terminal → New Terminal** (oppure `` Ctrl + ` ``)

Da questo momento puoi usare questo terminale per tutti i comandi del progetto.

#### 8. L'agente AI (CLI)

**Cos'è**: l'AI che costruirà la tua app insieme a te. Tu descrivi cosa vuoi, l'agente scrive il codice.

Scegli **uno** tra questi tre (quello della cui estensione hai installato al passo 7):

<details>
<summary><b>Claude Code</b> (consigliato per il boilerplate)</summary>

Serve uno di questi: un piano [Anthropic Max o Pro](https://claude.ai), una [API key Anthropic](https://console.anthropic.com/), oppure un accesso tramite team o azienda.

```bash
sudo npm install -g @anthropic-ai/claude-code
```

Verifica: `claude --version`
</details>

<details>
<summary><b>OpenAI Codex CLI</b></summary>

Serve un abbonamento [ChatGPT Plus/Pro/Business](https://openai.com/chatgpt/pricing/) oppure una [API key OpenAI](https://platform.openai.com/api-keys).

```bash
sudo npm install -g @openai/codex
```

Verifica: `codex --version`
</details>

<details>
<summary><b>Cursor Composer</b></summary>

Composer è integrato dentro Cursor (l'editor che hai scaricato al passo 7). Non serve installare niente da terminale. Aprilo con `Cmd + I` dentro Cursor.

Serve un abbonamento Cursor (c'è un tier gratuito per iniziare).
</details>

Durata totale: circa 30 secondi.

---

### Se usi Windows

Prima di tutto, installa **WSL 2** (Windows Subsystem for Linux): segui la [guida ufficiale Microsoft](https://learn.microsoft.com/en-us/windows/wsl/install), scegli Ubuntu come distribuzione. WSL ti permette di usare un ambiente Linux dentro Windows — tutti i tool qui sotto vanno installati dentro Ubuntu, non nel terminale Windows classico.

Apri il terminale Ubuntu e procedi con questi passaggi:

#### 1. Apri il terminale Ubuntu

Cerca "Ubuntu" nel menu Start. Si apre una finestra con sfondo scuro — è qui che eseguirai tutti i comandi.

#### 2. Git

```bash
sudo apt update && sudo apt install git
```

Verifica con `git --version`, poi configura nome e email (usa gli stessi del tuo account GitHub):

```bash
git config --global user.name "Il Tuo Nome"
git config --global user.email "la-tua-email@esempio.com"
```

#### 3. Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
```

Verifica con `node --version` — deve mostrare v18 o superiore.

#### 4. pnpm

```bash
sudo npm install -g pnpm
```

Verifica con `pnpm --version`.

#### 5. Docker Desktop

1. Scarica Docker Desktop per Windows da [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Durante l'installazione, assicurati di selezionare **"Use WSL 2 instead of Hyper-V"**
3. Apri Docker Desktop → Settings → Resources → WSL Integration → abilita la tua distribuzione Ubuntu
4. Riavvia Docker Desktop

**Importante**: Docker Desktop deve essere **aperto e in esecuzione** ogni volta che lavori al progetto.

Verifica nel terminale Ubuntu: `docker --version`

#### 6. Visual Studio Code

1. Scarica VS Code per Windows da [code.visualstudio.com](https://code.visualstudio.com/)
2. Installa l'estensione **WSL** (cerca "WSL" nel marketplace delle estensioni) — ti permette di aprire cartelle Linux dentro VS Code
3. Installa l'estensione **Claude Code** (cerca "Claude Code" nel marketplace)

Per aprire il terminale integrato: menu **Terminal → New Terminal** (oppure `` Ctrl + ` ``). Assicurati che il terminale sia Ubuntu/WSL, non PowerShell.

#### 7. Claude Code

Serve uno di questi: un piano [Anthropic Max o Pro](https://claude.ai), una [API key Anthropic](https://console.anthropic.com/), oppure un accesso tramite team o azienda.

Nel terminale Ubuntu:

```bash
sudo npm install -g @anthropic-ai/claude-code
```

Verifica con `claude --version`.

---

> **Qualcosa non funziona?** Se un comando dà errore, copia l'intero messaggio di errore e incollalo su [claude.ai](https://claude.ai) con questo prompt:
>
> *"Sto configurando un progetto Node.js su [Mac / Windows con WSL]. Ho eseguito questo comando: `[incolla il comando]` e ho ottenuto questo errore: `[incolla l'errore]`. Mi guidi passo passo per risolverlo?"*

> **Tutto installato?** Questi passaggi non dovrai più ripeterli. Da qui in poi, ogni volta che vuoi lavorare al progetto ti basta aprire il terminale e Docker Desktop.

---

## Come iniziare

Questi passaggi creano il tuo progetto e aprono una guida interattiva che ti accompagna nel resto della configurazione. Eseguili nel terminale di VS Code, uno alla volta.

### 1. Crea la cartella del progetto

Crea una cartella sul tuo computer dove terrai tutti i progetti web — ad esempio sul Desktop:

1. Apri il **Finder** (Mac) o l'**Esplora file** (Windows, dentro la home di Ubuntu: `/home/tuonome`)
2. Crea una nuova cartella chiamata **Progetti** (se non ce l'hai già)
3. Dentro **Progetti**, crea un'altra cartella con il nome della tua app (es. `la-mia-app`)

### 2. Apri la cartella in VS Code

1. Apri **VS Code**
2. **File → Open Folder** → seleziona la cartella che hai appena creato (es. `la-mia-app`)
3. Apri il terminale integrato: **Terminal → New Terminal**

### 3. Clona il template

```bash
git clone https://github.com/simomagazzu/create-app-like-simo.git .
```

Il punto `.` alla fine è importante — dice a Git di scaricare qui, non in una sotto-cartella.

### 4. Installa le dipendenze

```bash
pnpm install
```

Durata: 1–2 minuti. Vedrai molto testo — è normale.

### 5. Crea il file di configurazione (.env)

Il file `.env` è il posto dove la tua app tiene tutte le informazioni segrete: password del database, chiavi API, impostazioni di sicurezza. Non viene mai caricato su GitHub — rimane solo sul tuo computer.

```bash
cp env.example .env
```

Non vedrai nessun output — il comando funziona in silenzio. La guida interattiva su localhost ti accompagnerà nel riempirlo passo per passo.

### 6. Avvia Docker Desktop

Apri **Docker Desktop** dalle Applicazioni. Aspetta che l'icona smetta di animarsi — significa che Docker è pronto.

### 7. Avvia il database

```bash
docker compose up -d
```

La prima volta può richiedere 1–2 minuti. Le volte successive pochi secondi.

```bash
pnpm run db:migrate
```

Vedrai delle righe con i nomi delle tabelle create.

### 8. Avvia il server

```bash
pnpm dev
```

Dopo qualche secondo vedrai un messaggio con `http://localhost:3000`. Apri quel link nel browser.

**Trovi una guida interattiva** che ti accompagna nei passaggi rimanenti: generare la chiave segreta, configurare l'autenticazione, scegliere se usare l'AI, e collegare il repo a GitHub.

> **Il server deve restare attivo.** Finché lavori al progetto, lascia il terminale con `pnpm dev` aperto. Per fermarlo: `Ctrl+C`. Per i comandi successivi, apri un **secondo terminale** in VS Code: **Terminal → New Terminal**.

### 9. Quando la guida è completa

Tutti i check obbligatori sono verdi? Avvia il tuo agente AI e scrivi `/starter-prompt`.

- **Claude Code**: apri un nuovo terminale e digita `claude`, poi scrivi `/starter-prompt`
- **Codex**: apri un nuovo terminale e digita `codex`, poi scrivi `/starter-prompt`
- **Cursor Composer**: apri Composer con `Cmd + I` dentro Cursor, poi scrivi `/starter-prompt`

> **Se l'agente non riconosce `/starter-prompt`** (la discovery dei comandi custom varia tra i runtime): apri `.shared/commands/starter-prompt.md`, copia il contenuto e incollalo direttamente nella sessione dell'agente come prompt. Ogni comando shared è autosufficiente e funziona anche in questa modalità. Dettagli specifici per runtime in [`docs/agent-runtimes/`](docs/agent-runtimes/) (es. [`codex.md`](docs/agent-runtimes/codex.md)).

L'agente ti farà delle domande su cosa vuoi costruire e poi creerà la tua app automaticamente.

---

## Il flusso di sviluppo

### Costruire una nuova app

Scrivi `/starter-prompt` dentro il tuo agente AI. L'agente ti fa una serie di domande: cosa vuoi costruire, chi lo usa, quali feature, che design vuoi. Poi esplora il codice esistente, crea un piano dettagliato, e inizia a costruire tutto in automatico — una fase alla volta, ognuna in isolamento con un contesto pulito.

Al termine ti ritrovi con la tua app funzionante. Rivedi le modifiche, committi quando sei soddisfatto.

### Aggiungere una feature

Scrivi `/create-spec`. L'agente ti intervista sulla feature, poi genera una spec dettagliata con tutte le decisioni tecniche. Quando la spec è pronta, scrivi `/continue-feature` per costruire tutto in automatico — in parallelo se il runtime supporta sub-agenti in background, altrimenti in modalità sequenziale nella sessione principale (stesso output, più lento).

### Modifiche semplici

Per bug, testi, stili, piccole correzioni — descrivi direttamente cosa vuoi. L'agente lo fa senza bisogno di spec.

### Prima del deploy

`/deploy-check` — checklist completa: sicurezza, performance, variabili d'ambiente. Ti dice se sei pronto.

---

## Deploy

1. Push su GitHub
2. Importa su [Vercel](https://vercel.com)
3. Aggiungi le variabili d'ambiente di produzione
4. Database in produzione: [Neon](https://neon.tech) ha un tier gratuito

---

<details>
<summary>Riferimento tecnico (per developer)</summary>

**Stack completo**: Next.js 16, React 19, TypeScript 5.9, Better Auth, PostgreSQL + Drizzle ORM, Vercel AI SDK 5 + OpenRouter, shadcn/ui, Tailwind 4, Playwright

**Script utili**:

| Comando | |
|---|---|
| `pnpm dev` | Server locale (Turbopack) |
| `pnpm check` | lint + typecheck |
| `pnpm db:generate` | Genera migrazioni dopo modifiche allo schema |
| `pnpm db:migrate` | Applica le migrazioni |
| `pnpm db:studio` | GUI database |
| `pnpm db:reset` | Svuota e ricrea le tabelle |
| `pnpm test:e2e` | Test E2E headless |
| `pnpm test:e2e:ui` | Playwright UI interattiva |

**Comandi disponibili**

Invocabili come slash command nei runtime che supportano la discovery (`.claude/commands/`, `.agents/commands/`, `.cursor/commands/` — tutti symlink a `.shared/commands/`). Dove la discovery non funziona, il contenuto del file `.shared/commands/{nome}.md` può essere incollato direttamente nella sessione dell'agente — ogni comando è scritto per funzionare anche così.

| Comando | |
|---|---|
| `/starter-prompt` | Costruisce una nuova app da zero (intervista → spec → build automatica) |
| `/create-spec` | Crea la spec per una nuova feature |
| `/continue-feature` | Esegue tutti i task della spec (parallelo o sequenziale, in base al runtime) |
| `/security-audit` | Security review basata su confidence: prima produce il report, poi chiede conferma prima di applicare fix |
| `/deploy-check` | Verifica che tutto sia pronto per il deploy |

**Architettura agent-agnostica**:

Il boilerplate è strutturato per funzionare con Claude Code, OpenAI Codex, e Cursor Composer con un'unica fonte di verità:

```
AGENTS.md                   ← regole del progetto (CLAUDE.md è un symlink)
.shared/
  commands/*.md             ← comandi slash (source of truth)
  skills/{name}/SKILL.md    ← skill auto-triggered
.claude/commands → ../.shared/commands   (symlink)
.claude/skills   → ../.shared/skills     (symlink)
.agents/commands → ../.shared/commands   (symlink)   ← Codex
.agents/skills   → ../.shared/skills     (symlink)   ← Codex
.cursor/commands → ../.shared/commands   (symlink)   ← Cursor
.cursor/rules/project.mdc                ← generato da AGENTS.md
scripts/sync-cursor-rules.sh             ← rigenera il .mdc quando cambi AGENTS.md
```

**Architettura multi-agente (capability-aware)**: i comandi shared sono scritti in modo tool-agnostico con un modello a capability esplicito (vedi [`.shared/CAPABILITIES.md`](.shared/CAPABILITIES.md)). Quando il runtime supporta sub-agenti paralleli in background (Claude Code `Task` tool, Codex `/agent` con Agents SDK, Cursor 2.0 parallel agents), ogni task di una wave gira con contesto fresco in parallelo. Quando i sub-agenti non sono disponibili o affidabili, lo stesso orchestratore esegue i task sequenzialmente nella sessione principale — stesso output, più lento. La direzione di design viene estratta dai requisiti e iniettata in ogni brief UI in entrambe le modalità.

**Cosa è verificato oggi**: lo sviluppo base (editing di file, lint, typecheck, build) funziona identicamente in tutti e tre i runtime. Il fallback sequenziale dei comandi shared è progettato per non dipendere da feature avanzate. Il percorso parallelo è verificato su Claude Code; su Codex e Cursor dipende dal supporto runtime corrente — vedi [`docs/agent-runtimes/codex.md`](docs/agent-runtimes/codex.md) per lo status.

*Ispirato dall'[Agentic Coding Starter Kit di Leon van Zyl](https://github.com/leonvanzyl/agentic-coding-starter-kit).*

</details>

MIT License
