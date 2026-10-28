# GymTime - progetto unificato

Archivio completo dei sorgenti, non una patch. Non eseguire gli applicatori dei vecchi zip.
Base: struttura di mattiadbbiz/gymtime2 (snapshot main 3e6a5b6f8f9f6d7a0da812baa69edf126f444e78), file aggiornati allegati nella conversazione e modifiche approvate.
Le versioni aggiornate degli allegati prevalgono sui moduli più vecchi del repository.

## Avvio locale
Da una nuova cartella estratta, non sovrascrivere il vecchio repository senza un backup:
```sh
cd gymtime2
npm install
mkdir -p public/js/vendor
curl -fL https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js -o public/js/vendor/three.min.js
node strumenti/controllo-pose.mjs
node strumenti/controllo-3d.mjs
npx wrangler d1 migrations apply gymtime --local --config wrangler.toml
npx wrangler dev --config wrangler.toml
```
La copia locale di three.min.js non è inclusa, come concordato. Il renderer esistente mantiene il fallback SVG.
Non sono inclusi account, credenziali, database, .dev.vars, .wrangler, node_modules o dati di esempio.
Su database locale nuovo, dopo le migrazioni, eseguire `bash strumenti/crea-admin-locale.sh`. Chiede username e password locale senza mostrarla e crea un admin SOLO se la tabella utenti è vuota. Non usare una password reale o riutilizzata altrove. Le migrazioni non importano gli utenti dal remoto.

## Incluso
- Navigazione atleta Esercizi / Allenamento / Profilo e guida per ruolo, automatica al primo ingresso per dispositivo.
- Home basata sui dati reali: Visiona, Allenati, Mobilità, Stretching, Cardio.
- Visiona settimana corrente, stampa PDF e condivisione testo/TXT.
- Libreria atleta in sola lettura: esercizi comuni e del proprio coach. Impara con 3D/SVG, accorgimenti reali e ultime cinque esecuzioni per ID.
- Sessioni Mobilità/Stretching separate e full body. La durata scelta è un obiettivo; l'anteprima mostra la stima reale.
- Cardio con esercizi selezionati, data fissata all'avvio, bozza, completamento, durata e metri/calorie facoltativi.
- Profilo con storico allenamenti, schede passate, cambio password e preferenza grafica locale.
- Recuperi +-15 s, pausa facoltativa tra esercizi normali = recupero prescritto +60 s. Nessun minuto aggiuntivo per superserie o dopo l'ultimo esercizio.
- Flussi coach/admin, serie parziali, superserie, varianti e conteggio preesistenti mantenuti.
- Reset password del coach già esistente, senza email; nessun nuovo dato personale.

## Migrazioni e produzione
Le migrazioni 0001-0008 allegate sono mantenute nei loro nomi originali. La nuova 0009 aggiunge tipo_sessione (default mista per sessioni precedenti) e sessioni_cardio.
La vecchia migrazione di solo popolamento 0003_libreria.sql presente su GitHub non viene duplicata: la libreria aggiornata è già nella 0003_settimane_libreria.sql fornita dall'utente. Non cancellare o riscrivere migrazioni remote già registrate.
Prima di qualsiasi rilascio: confrontare l'elenco D1 remoto, fare un backup e applicare SOLO quelle mancanti, poi deploy manuale. Nessuna di queste operazioni è stata eseguita qui.
Il README originale è conservato in documentazione/README-originale.md e contiene indicazioni di pubblicazione precedenti: per questo lavoro fa fede la procedura di deploy manuale concordata.

## Limiti
Nessun service worker o allenamento completamente offline. Il flusso locale di serie/recuperi non sostituisce la sincronizzazione futura.
Le conferme di uscita coprono i link interni e il browser gestisce chiusura/ricarica; Indietro del browser non è bloccato.
Lo storico conserva il limite di 400 record per tipo del progetto originale; nessuna paginazione aggiunta.
Il dettaglio Impara non associa per nome gli elementi storici senza ID.
public/prova-omini.html e i vecchi file frontend non referenziati public/app.js e public/libreria.js non sono inclusi: l'entrypoint reale è public/js/app.js.
Le icone PNG richieste dal manifest sono generate dalle immagini JPG fornite dall'utente.

## Ripartenza in nuova chat
Caricare questo zip e chiedere di leggere README.md e documentazione/VERIFICHE.json. Non ricostruire il progetto applicando di nuovo vecchie patch. Rispettare il deploy manuale e chiedere conferma prima di modificare database o flussi.
