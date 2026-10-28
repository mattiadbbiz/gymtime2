-- GymTime · sezione Mobilità e stretching
-- Sezione libera, accanto ad Allena e Storico: atleti e coach generano una sessione e la svolgono.
-- Nessuna scheda di mobilità. Gli esercizi della libreria arrivano con una migrazione separata.

-- Libreria. Zona e attrezzo si controllano nel Worker, così se ne aggiungono altri senza ricostruire la tabella.
-- Zone: collo, spalle, torace, dorsale, lombare, anche, glutei, adduttori, quadricipiti, femorali, caviglie, polsi, corpo
-- Attrezzi: corpo_libero, bastone (elastico più avanti)
CREATE TABLE IF NOT EXISTS libreria_mobilita (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE COLLATE NOCASE,
  zona TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('mobilita','dinamico','statico','respirazione')),
  riscaldamento INTEGER NOT NULL DEFAULT 0 CHECK (riscaldamento IN (0,1)),
  misura TEXT NOT NULL DEFAULT 'secondi' CHECK (misura IN ('secondi','ripetizioni')),
  valore INTEGER NOT NULL CHECK (valore BETWEEN 1 AND 600),
  serie INTEGER NOT NULL DEFAULT 1 CHECK (serie BETWEEN 1 AND 10),
  per_lato INTEGER NOT NULL DEFAULT 0 CHECK (per_lato IN (0,1)),
  livello INTEGER NOT NULL DEFAULT 1 CHECK (livello BETWEEN 1 AND 3),
  attrezzo TEXT NOT NULL DEFAULT 'corpo_libero',
  animazione TEXT NOT NULL DEFAULT 'free',
  muscolo TEXT,
  accorgimenti TEXT,
  creato_da INTEGER REFERENCES utenti(id) ON DELETE SET NULL,
  creato_il TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Impostazioni di admin e coach per sé e per i propri atleti.
-- Senza una riga valgono i predefiniti: sezione attiva, durate 10, 15, 20 e 30 minuti.
CREATE TABLE IF NOT EXISTS impostazioni_mobilita (
  coach_id INTEGER PRIMARY KEY REFERENCES utenti(id) ON DELETE CASCADE,
  attiva INTEGER NOT NULL DEFAULT 1 CHECK (attiva IN (0,1)),
  durate TEXT NOT NULL DEFAULT '[10,15,20,30]' CHECK (json_valid(durate) AND json_type(durate) = 'array'),
  aggiornata_il TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessioni svolte. Si salvano solo quando si preme Avvia: le proposte rigenerate non scrivono niente.
-- Più sessioni nello stesso giorno sono ammesse, anche insieme a un allenamento.
-- piano_json: copia degli esercizi come li ha visti chi si allena. esiti_json: {"0":"fatto","1":"non_fatto"}
CREATE TABLE IF NOT EXISTS sessioni_mobilita (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utente_id INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  data TEXT NOT NULL CHECK (data GLOB '[12][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]'),
  durata_scelta INTEGER NOT NULL CHECK (durata_scelta BETWEEN 5 AND 60),
  zona TEXT,
  durata_stimata INTEGER NOT NULL CHECK (durata_stimata > 0),
  piano_json TEXT NOT NULL CHECK (json_valid(piano_json)),
  esiti_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(esiti_json)),
  stato TEXT NOT NULL DEFAULT 'in_corso' CHECK (stato IN ('in_corso','completata')),
  passo_corrente INTEGER NOT NULL DEFAULT 0,
  avviata_il TEXT NOT NULL DEFAULT (datetime('now')),
  completata_il TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobilita_utente_data ON sessioni_mobilita(utente_id, data);
