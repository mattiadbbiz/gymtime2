# GymTime

Diario di allenamento per coach e atleti. Cloudflare Workers (API + file statici), D1 (database `gymtime`), Workers AI (import da file, foto e voce).

## Struttura
- `src/` · Worker: accesso, profili, libreria, schede (con storico e schede importate), allenamento, domande, importazione (testo, voce, file, foto), mobilità
- `public/` · sito: `index.html`, `stile.css`, `atleta.css`, `coach.css`, `js/` (app, atleta, coach, storico-schede, mobilita, mobilita-sessione, mobilita-libreria, omino, regole)
- `migrations/` · schema del database e libreria di 169 esercizi
  - 0004 · storico schede: schede importate dal passato (origine, periodo dal/al, nota)
  - 0005 · mobilità e stretching: libreria, impostazioni per coach, sessioni svolte
  - 0006 · libreria di mobilità e stretching: 35 esercizi, ognuno con il suo omino
  - 0007 · variante dell'omino per esercizio della scheda (attrezzo, gradi della panca, rialzi di mani e piedi)
  - 0008 · modalità cardio (ricostruisce esercizi_scheda per il CHECK) e 35 esercizi nuovi in libreria (cardio, corde, lanci, trasporti, core, anelli, pesistica olimpica)
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

## Superserie, serie e varianti
- **Superserie**: nella scheda, Modalità → "Superserie" e si sceglie l'esercizio successivo. Nel blocco: giri e recupero dopo il giro in comune, pausa (facoltativa) tra un esercizio e il successivo, "Aggiungi esercizio alla superserie", "Sciogli". Nel database restano righe di `esercizi_scheda` con lo stesso `gruppo`: giri = `serie` di tutti, recupero = `rec` dell'ultimo, pausa = `parametri.pausa`.
- **Atleta**: in serie × ripetizioni conta le serie ("Serie fatta") e fa partire da solo il recupero; se preme Fatto con meno serie chiede se segnare solo quelle. Nella superserie va da un esercizio all'altro con pause e recuperi a tempo; "Non lo faccio" toglie un esercizio dai giri che restano, "Termina qui" segna i giri fatti. Il conteggio resta nel telefono (localStorage) fino al salvataggio dell'allenamento.
- **Varianti**: il coach sceglie attrezzo, panca e rialzi nella carta dell'esercizio (solo se l'omino li prevede). L'omino resta fermo solo nelle tenute: un macchinario "a tempo" continua a muoversi.
- **Cardio e distanze**: modalità `cardio` con serie, metri, calorie, tempo, carico e recupero ("5 × 500 m", "20 cal", "10:00"). Solo tempo: conto alla rovescia. Metri o calorie: cronometro ("Segna il tempo"), oppure conteggio delle serie se sono più di una. Si può usare anche dentro le superserie.
