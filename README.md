# GymTime

Diario di allenamento per coach e atleti. Cloudflare Workers (API + file statici), D1 (database `gymtime`), Workers AI (import da file e voce).

## Struttura
- `src/` · Worker: accesso, profili, libreria, schede, allenamento, domande, importazione
- `public/` · sito: `index.html`, `stile.css`, `atleta.css`, `coach.css`, `js/` (app, atleta, coach, omino, regole)
- `migrations/` · schema del database e libreria di 134 esercizi
- `wrangler.toml` · configurazione (D1, Workers AI, limite tentativi di accesso)

## Pubblicazione
Il repository è collegato a Cloudflare: ogni commit su GitHub ripubblica il Worker.
Le migrazioni del database non partono da sole: si applicano con
`npx wrangler d1 migrations apply gymtime --remote` (la 0003 è già applicata).

Controllo rapido: `/api/salute` deve rispondere `{"ok":true,"tabelle":10,"ai":true}`.

## Ruoli
- **Admin**: crea coach e atleti, gestisce la libreria di base e le domande predefinite. Accesso con il tasto Admin.
- **Coach**: crea i suoi atleti, scrive o importa le schede, legge lo storico, sblocca le giornate.
- **Atleta**: si allena con la scheda del giorno e consulta il suo storico.

Le password sono libere e salvate cifrate (PBKDF2). Dei ragazzi si salvano solo nome, username e dati di allenamento.
