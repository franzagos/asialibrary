# Crea webapp come Simo

Un template Next.js per costruire web app moderne con Claude Code, con una struttura guidata che ti permette di lavorare con gli stessi strumenti dei developer senza dover partire da zero.

---

## Perché ho creato questo template

Tool come Lovable, Replit e ambienti simili sono ottimi per iniziare. Permettono di costruire applicazioni velocemente e abbassano molto la barriera di ingresso.

Il problema è che spesso ti ritrovi a costruire cose da developer senza capire davvero cosa sta succedendo sotto il cofano. Il codice esiste, ma non è davvero tuo. Non sai bene come è organizzato, non sai come ottimizzarlo, e non sai come intervenire quando vuoi fare qualcosa di più avanzato.

Questo boilerplate nasce per fare un passaggio preciso: passare da tool come Lovable o Replit a costruire applicazioni con gli stessi strumenti dei developer, ma con una guida chiara. Non devi partire da zero, non devi affrontare da solo la complessità. Puoi costruire quello che vuoi, capendo cosa sta succedendo e mantenendo il controllo su ogni passaggio.

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
| **Storage** | Locale in dev, Vercel Blob in produzione |
| **Test** | Playwright E2E |

---

## Prerequisiti (una tantum)

Questi strumenti vanno installati **una sola volta**. Una volta completato questo setup, non dovrai più rifarlo — né per questo progetto né per quelli futuri.

> **Come funziona il terminale**: incolli un comando, premi `Invio`, e aspetti. Sai che ha finito quando ricompare la riga con il tuo nome utente (es. `mario@MacBook %`). A quel punto puoi incollare il comando successivo. Non serve aprire un nuovo terminale tra un comando e l'altro, a meno che non sia indicato esplicitamente.

> **Windows**: questo template è pensato per Mac. Su Windows, installa prima [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) (Ubuntu), poi segui le istruzioni Linux dentro WSL.

### 1. Apri il Terminale

Premi `Cmd + Spazio`, scrivi **Terminale**, premi `Invio`. Si apre una finestra con sfondo scuro e testo bianco — è qui che eseguirai tutti i comandi.

### 2. Homebrew

**Cos'è**: il "negozio" che ti permette di installare programmi da terminale con un solo comando. Senza Homebrew dovresti scaricare ogni tool manualmente.

Incolla questo comando e premi `Invio`:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- Ti chiederà la **password del Mac** — quando la scrivi non vedrai niente a schermo (nemmeno puntini). È normale, scrivi e premi `Invio`.
- L'installazione può durare **5–10 minuti**. Vedrai molto testo scorrere. Aspetta finché non ricompare la riga con il tuo nome utente.
- **Importante**: alla fine Homebrew potrebbe mostrarti 2 righe da copiare sotto la scritta `==> Next steps`. Se le vedi, copiale e incollale nel terminale una alla volta. Servono per attivare Homebrew.

**Come sai che ha funzionato**: chiudi il terminale, riaprilo, e scrivi `brew --version`. Se vedi un numero di versione, è tutto ok.

### 3. Git

**Cos'è**: il sistema che salva la cronologia del tuo codice. Ogni modifica viene registrata, e puoi sempre tornare a una versione precedente.

```bash
brew install git
```

Durata: circa 1 minuto. **Fatto quando**: ricompare la riga col tuo nome utente. Verifica con `git --version`.

### 4. Node.js

**Cos'è**: il motore che esegue il codice della tua app. Senza Node.js, il computer non sa come leggere il codice che scrivi.

```bash
brew install node
```

Durata: circa 2 minuti. **Fatto quando**: ricompare la riga col tuo nome utente. Verifica con `node --version` — deve mostrare v18 o superiore.

### 5. pnpm

**Cos'è**: il gestore delle librerie. La tua app usa centinaia di pezzi di codice scritti da altri (pulsanti, connessione al database, ecc.). pnpm li scarica e li tiene aggiornati.

```bash
sudo npm install -g pnpm
```

Ti chiederà la password del Mac (come per Homebrew, non vedrai niente mentre scrivi). Durata: pochi secondi. Verifica con `pnpm --version`.

### 6. Docker Desktop

**Cos'è**: Docker fa girare un database sul tuo computer senza che tu debba installare o configurare PostgreSQL manualmente. Pensalo come una "scatola" che contiene il database già pronto.

Questo è l'unico strumento che **non** si installa da terminale:

1. Vai su [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Scarica la versione per il tuo Mac (Apple Silicon o Intel — se non sai quale hai: menu Mela → Informazioni su questo Mac)
3. Apri il file `.dmg`, trascina Docker nella cartella Applicazioni
4. Apri Docker Desktop dalle Applicazioni. La prima volta chiede dei permessi — accetta tutto

**Importante**: Docker Desktop deve essere **aperto e in esecuzione** ogni volta che lavori al progetto. Vedrai un'icona di balena nella barra in alto del Mac.

Verifica nel terminale: `docker --version`

### 7. Visual Studio Code

**Cos'è**: l'editor dove vedrai e modificherai il codice. È gratuito ed è lo standard usato dalla maggior parte dei developer.

1. Vai su [code.visualstudio.com](https://code.visualstudio.com/)
2. Scarica, apri il `.dmg`, trascina nella cartella Applicazioni
3. Apri VS Code

**Installa l'estensione Claude Code**:

4. Clicca l'icona dei quadratini nella barra laterale sinistra (oppure premi `Cmd + Shift + X`)
5. Cerca **"Claude Code"** nella barra di ricerca
6. Clicca **Install** sull'estensione di Anthropic

**Il terminale dentro VS Code**:

VS Code ha un terminale integrato — funziona esattamente come il Terminale del Mac, ma è comodo perché resta dentro l'editor senza dover cambiare finestra.

7. Apri il terminale integrato: menu **Terminal → New Terminal** (oppure `` Ctrl + ` ``)

Da questo momento puoi usare questo terminale per tutti i comandi del progetto. Non serve più quello del Mac.

### 8. Claude Code

**Cos'è**: l'AI che costruirà la tua app insieme a te. Tu descrivi cosa vuoi, Claude scrive il codice.

Serve uno di questi: un piano [Anthropic Max o Pro](https://claude.ai), una [API key Anthropic](https://console.anthropic.com/), oppure un accesso tramite team o azienda.

Nel terminale di VS Code:

```bash
sudo npm install -g @anthropic-ai/claude-code
```

Durata: circa 30 secondi. Verifica con `claude --version`.

---

> **Qualcosa non funziona?** Se un comando dà errore, copia l'intero messaggio di errore e incollalo su [claude.ai](https://claude.ai) (o ChatGPT) con questo prompt:
>
> *"Sto configurando un progetto Node.js su Mac. Ho eseguito questo comando: `[incolla il comando]` e ho ottenuto questo errore: `[incolla l'errore]`. Mi guidi passo passo per risolverlo?"*
>
> Funziona per qualsiasi errore in questa guida. Non serve capire l'errore — basta copiarlo.

> **Tutto installato?** Questi 8 passaggi non dovrai più ripeterli. Da qui in poi, ogni volta che vuoi lavorare al progetto ti basta aprire il terminale e Docker Desktop.

---

## Come iniziare

Questi passaggi creano il tuo progetto e aprono una guida interattiva che ti accompagna nel resto della configurazione. Eseguili nel terminale di VS Code, uno alla volta.

### 1. Crea la cartella del progetto

Crea una cartella sul tuo computer dove terrai tutti i progetti web — ad esempio sul Desktop:

1. Apri il **Finder**
2. Vai sul **Desktop** (o dove preferisci)
3. Crea una nuova cartella chiamata **Progetti** (se non ce l'hai già)
4. Dentro **Progetti**, crea un'altra cartella con il nome della tua app (es. `la-mia-app`)

### 2. Apri la cartella in VS Code

1. Apri **VS Code**
2. **File → Open Folder** → seleziona la cartella che hai appena creato (es. `la-mia-app`)
3. Apri il terminale integrato: **Terminal → New Terminal**

### 3. Clona il template

Nel terminale di VS Code, incolla:

```bash
git clone https://github.com/simomagazzu/create-app-like-simo.git .
```

Questo scarica tutto il codice del template dentro la cartella che hai aperto. Il punto `.` alla fine è importante — dice a Git di scaricare qui, non in una sotto-cartella.

### 4. Installa le dipendenze

```bash
pnpm install
```

Scarica tutte le librerie che il progetto usa. Durata: 1–2 minuti. Vedrai molto testo — è normale. Aspetta finché non ricompare la riga col tuo nome utente.

### 5. Crea il file di configurazione

```bash
cp env.example .env
```

Questo copia un file di esempio con tutte le impostazioni della tua app. Senza questo file il server non parte. Non vedrai nessun output — è normale, il comando funziona in silenzio.

### 6. Avvia Docker Desktop

Apri **Docker Desktop** dalle Applicazioni (l'hai installato nei prerequisiti). Aspetta che l'icona della balena nella barra in alto smetta di animarsi — significa che Docker è pronto.

### 7. Avvia il database

```bash
docker compose up -d
```

Questo crea un database PostgreSQL sul tuo computer. Durata: la prima volta può richiedere 1–2 minuti (scarica i file necessari), le volte successive pochi secondi.

```bash
pnpm run db:migrate
```

Questo crea le tabelle nel database. Vedrai delle righe con i nomi delle tabelle create.

### 8. Avvia il server

```bash
pnpm dev
```

Dopo qualche secondo vedrai un messaggio con `http://localhost:3000`. Apri quel link nel browser.

**Trovi una guida interattiva** che ti accompagna nei passaggi rimanenti: generare la chiave segreta, configurare l'autenticazione, scegliere se usare l'AI, e collegare il repo a GitHub. Ogni step ha i comandi già pronti da copiare.

> **Il server deve restare attivo.** Finché lavori al progetto, lascia il terminale con `pnpm dev` aperto. Per fermarlo: `Ctrl+C`. Per i comandi successivi, apri un **secondo terminale** in VS Code: **Terminal → New Terminal**.

### 9. Quando la guida è completa

Tutti i check obbligatori sono verdi? Apri un nuovo terminale e scrivi:

```bash
claude
```

Claude Code si apre nel terminale. Scrivi `/starter-prompt` per iniziare a costruire la tua app.

---

## Il problema che questo template risolve in più

Quando inizi a costruire con Claude Code, funziona benissimo. Il problema arriva dopo: più la sessione va avanti, più Claude perde il filo. Inizia a scrivere codice che contraddice quello di prima, fa refactor inutili, introduce bug che non c'erano.

Questo succede perché Claude accumula troppo contesto in una sola sessione — come se dovessi ricordare ogni singola cosa che hai detto in una conversazione di ore.

Questo template risolve il problema alla radice. Ogni task viene gestito in isolamento, con un contesto pulito. Claude rimane preciso e consistente dall'inizio alla fine del progetto, anche quando il codice cresce.

---

## Il flusso di sviluppo

### Costruire una nuova app

Scrivi `/starter-prompt` dentro Claude Code. Claude ti fa una serie di domande: cosa vuoi costruire, chi lo usa, quali feature, che design vuoi. Poi esplora il codice esistente, crea un piano dettagliato, e inizia a costruire tutto in automatico — una fase alla volta, ognuna in isolamento con un contesto pulito.

Al termine ti ritrovi con la tua app funzionante. Rivedi le modifiche, committi quando sei soddisfatto.

### Aggiungere una feature

Scrivi `/create-spec`. Claude ti intervista sulla feature, poi genera una spec dettagliata con tutte le decisioni tecniche. Quando la spec è pronta, scrivi `/continue-feature` per costruire tutto in automatico.

### Modifiche semplici

Per bug, testi, stili, piccole correzioni — descrivi direttamente cosa vuoi. Claude lo fa senza bisogno di spec.

### Prima del deploy

`/deploy-check` — checklist completa: sicurezza, performance, variabili d'ambiente. Ti dice se sei pronto.

---

## Deploy

1. Push su GitHub
2. Importa su [Vercel](https://vercel.com)
3. Aggiungi le variabili d'ambiente di produzione
4. Database in produzione: [Neon](https://neon.tech) ha un tier gratuito

---

## Supporto

Hai problemi con il setup o domande sul progetto? Scrivimi.

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

**Comandi Claude Code**:

| Comando | |
|---|---|
| `/starter-prompt` | Costruisce una nuova app da zero (intervista → spec → build automatica) |
| `/create-spec` | Crea la spec per una nuova feature |
| `/continue-feature` | Esegue tutti i task della spec in automatico |
| `/security-audit` | Scansione di sicurezza completa con report e fix automatici |
| `/deploy-check` | Verifica che tutto sia pronto per il deploy |

**Architettura multi-agente**: ogni task viene eseguito da un sotto-agente con contesto fresco (200k token). L'orchestratore legge solo la spec e coordina. La direzione di design viene estratta dai requisiti e iniettata in ogni brief UI. La qualità rimane costante anche su sessioni lunghe.

*Ispirato dall'[Agentic Coding Starter Kit di Leon van Zyl](https://github.com/leonvanzyl/agentic-coding-starter-kit).*

</details>

MIT License
