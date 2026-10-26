# GymTime

Diario di allenamento per coach e atleti. Cloudflare Workers (API + file statici), D1 (database `gymtime`), Workers AI (import da file, foto e voce).

## Struttura
- `src/` · Worker: accesso, profili, libreria, schede (con storico e schede importate), allenamento, domande, importazione (testo, voce, file, foto), mobilità
- `public/` · sito: `index.html`, `stile.css`, `atleta.css`, `coach.css`, `js/` (app, atleta, coach, storico-schede, mobilita, mobilita-sessione, mobilita-libreria, omino, regole)
- `migrations/` · schema del database e libreria di 134 esercizi
  - 0004 · storico schede: schede importate dal passato (origine, periodo dal/al, nota)
  - 0005 · mobilità e stretching: libreria, impostazioni per coach, sessioni svolte
  - 0006 · libreria di mobilità e stretching: 35 esercizi, ognuno con il suo omino
- `wrangler.toml` · configurazione (D1, Workers AI, limite tentativi di accesso)

## Pubblicazione
Il repository è collegato a Cloudflare: ogni commit su GitHub ripubblica il Worker.
Le migrazioni del database non partono da sole: il commit pubblica il codice, ma le tabelle si cambiano a mano con
`npx wrangler d1 migrations apply gymtime --remote`. Wrangler applica solo quelle che mancano: `npx wrangler d1 migrations list gymtime --remote` mostra quali sono in attesa.
Prima di ogni migrazione fai un backup: `npx wrangler d1 export gymtime --remote --output=backup-gymtime.sql`.

Controllo rapido: `/api/salute` deve rispondere `{"ok":true,"tabelle":13,"ai":true}`.

## Ruoli
- **Admin**: crea coach e atleti, gestisce la libreria di base e le domande predefinite. Accesso con il tasto Admin.
- **Coach**: crea i suoi atleti, scrive o importa le schede, legge lo storico, sblocca le giornate.
- **Atleta**: si allena con la scheda del giorno e consulta il suo storico.

Le password sono libere e salvate cifrate (PBKDF2). Dei ragazzi si salvano solo nome, username e dati di allenamento. File, foto, audio e testi usati per importare una scheda non si salvano: servono solo a crearla.

## Controllo anatomico delle pose
Ogni posa nuova dell'omino deve passare il controllo: `node strumenti/controllo-pose.mjs` (tutte) oppure `node strumenti/controllo-pose.mjs mob_farfalla` (solo alcune).
Controlla gomiti e ginocchia (mai in iperestensione, mai oltre il possibile), spalle e anche entro i gradi possibili, mani e piedi sugli appoggi, nessuna parte sotto il pavimento.

## Mobilità e stretching
Terzo tasto in home per atleti, coach e admin. Il coach (o l'admin) la accende o la spegne per i suoi atleti e sceglie le durate in Libreria → Mobilità (da 5 a 30 minuti).
Il generatore è in `public/js/mobilita.js` e gira nel telefono: rigenerare non scrive nel database, la sessione si salva da Avvia.
- Fasi: riscaldamento in piedi (circa un terzo), mobilità specifica (circa un quinto), statico, respirazione finale da 60 s.
- Area facoltativa: collo spalle e braccia, schiena, anche e glutei, gambe e caviglie.
- Niente doppioni, mai due zone uguali di fila (tranne nell'area scelta), da 10 minuti ogni area sia nella mobilità sia negli statici, al massimo due volte giù a terra.
- Statici a 2 serie da 15 minuti, mai oltre 60 s per lato; una ripetizione dura quanto un ciclo dell'omino (minimo 1,5 s).
- Durata entro ±8% di quella scelta (almeno 30 s, al massimo 90 s).
