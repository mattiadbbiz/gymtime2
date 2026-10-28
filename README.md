# GymTime

Web app di allenamento per atleti, coach e admin. Cloudflare Workers (API e file statici) + D1, frontend HTML/CSS/JS senza build.

## Struttura
- `src/` Worker: `index.js` smista le rotte `/api/*`, un modulo per area (utenti, schede, allenamento, domande, importa, mobilita, sessioni-libere).
- `public/` sito statico: `index.html` carica `js/app.js`, che importa gli altri moduli. `_headers` imposta le intestazioni di sicurezza.
- `migrations/` schema D1, da 0001 a 0009, tutte applicate sul database remoto `gymtime`.
- `strumenti/` controlli delle pose e creazione di un admin locale.
- `documentazione/legacy/0003_libreria.sql` vecchio seed mai applicato: contiene 22 esercizi assenti dalla libreria attuale.

## Ruoli a matrioska
Barra in basso uguale per tutti: Storico, Allenamento, Profilo. Il coach fa tutto ciò che fa l'atleta e in più, nel Profilo, gestisce atleti, libreria e domande. L'admin fa tutto ciò che fa il coach e in più gestisce i coach (Profilo → Persone) e le funzioni riservate della libreria.

## Avvio locale
```sh
npm install
mkdir -p public/js/vendor
curl -fL https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js -o public/js/vendor/three.min.js
node strumenti/controllo-pose.mjs
node strumenti/controllo-3d.mjs
npx wrangler d1 migrations apply gymtime --local
bash strumenti/crea-admin-locale.sh
npx wrangler dev
```
three.min.js non è nel repository: senza, l'omino resta in SVG.

## Pubblicazione
Il repository è collegato al Worker `gymtime2`: ogni push su `main` lo ripubblica. Le migrazioni non partono da sole: una migrazione nuova si applica PRIMA del push, dopo un backup.
```sh
npx wrangler d1 export gymtime --remote --output backup-$(date +%Y%m%d-%H%M).sql
npx wrangler d1 migrations list gymtime --remote
npx wrangler d1 migrations apply gymtime --remote
```

## Limiti noti
Nessun funzionamento offline. Lo storico carica fino a 400 giornate per tipo in una sola chiamata.
