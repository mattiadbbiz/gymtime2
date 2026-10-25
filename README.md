# GymTime

Diario di allenamento per coach e atleti. Cloudflare Workers (API + file statici), D1 (database `gymtime`), Workers AI (import da file, foto e voce).

## Struttura
- `src/` · Worker: accesso, profili, libreria, schede (con storico e schede importate), allenamento, domande, importazione (testo, voce, file, foto), mobilità
- `public/` · sito: `index.html`, `stile.css`, `atleta.css`, `coach.css`, `js/` (app, atleta, coach, omino, regole, mobilita)
- `migrations/` · schema del database e libreria di 134 esercizi
  - 0004 · storico schede: schede importate dal passato (origine, periodo dal/al, nota)
  - 0005 · mobilità e stretching: libreria, impostazioni per coach, sessioni svolte
- `wrangler.toml` · configurazione (D1, Workers AI, limite tentativi di accesso)

## Pubblicazione
Il repository è collegato a Cloudflare: ogni commit su GitHub ripubblica il Worker.
Le migrazioni del database non partono da sole: si applicano con
`npx wrangler d1 migrations apply gymtime --remote`.
Prima di ogni migrazione fai un backup: `npx wrangler d1 export gymtime --remote --output=backup-gymtime.sql`.

Controllo rapido: `/api/salute` deve rispondere `{"ok":true,"tabelle":13,"ai":true}`.

## Ruoli
- **Admin**: crea coach e atleti, gestisce la libreria di base e le domande predefinite. Accesso con il tasto Admin.
- **Coach**: crea i suoi atleti, scrive o importa le schede, legge lo storico, sblocca le giornate.
- **Atleta**: si allena con la scheda del giorno e consulta il suo storico.

Le password sono libere e salvate cifrate (PBKDF2). Dei ragazzi si salvano solo nome, username e dati di allenamento. File, foto, audio e testi usati per importare una scheda non si salvano: servono solo a crearla.
