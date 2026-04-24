# Action Required: Asia's Library

## Before you start building

- [ ] **Aggiungi la tua email come admin** — Nel file `.env` del progetto, aggiungi questa riga: `ADMIN_EMAIL=francesco@loopsrl.agency` (o l'email che Asia usa per accedere). Questo è come l'app capisce chi è l'amministratore.

- [ ] **Aggiungi la chiave API di OpenRouter** — Se non è già presente nel `.env`, aggiungila: `OPENROUTER_API_KEY=...`. Puoi trovarla su openrouter.ai → Keys. Serve per il riconoscimento dei libri dalle foto.

- [ ] **Aggiungi la chiave API di Resend** — Se non è già configurata, vai su resend.com → API Keys → Create API Key, e aggiungi `RESEND_API_KEY=...` e `RESEND_FROM_EMAIL=noreply@tuodominio.com` nel `.env`. Serve per inviare i link di invito via email. (In sviluppo locale funziona anche senza — i link appaiono nel terminale.)

## After deploying

- [ ] **Aggiorna la variabile BETTER_AUTH_URL** — Una volta che l'app è live, imposta `BETTER_AUTH_URL=https://tuodominio.com` nelle variabili d'ambiente del tuo hosting (es. Vercel). Senza questo, i link di invito non funzioneranno correttamente in produzione.
