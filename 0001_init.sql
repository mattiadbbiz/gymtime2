-- GymTime · schema iniziale (già applicato al database gymtime)
CREATE TABLE IF NOT EXISTS utenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  ruolo TEXT NOT NULL CHECK (ruolo IN ('admin','coach','atleta')),
  coach_id INTEGER REFERENCES utenti(id) ON DELETE SET NULL,
  attivo INTEGER NOT NULL DEFAULT 1 CHECK (attivo IN (0,1)),
  creato_il TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_utenti_coach ON utenti(coach_id);

CREATE TABLE IF NOT EXISTS sessioni_login (
  token_hash TEXT PRIMARY KEY,
  utente_id INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  scade_il TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessioni_utente ON sessioni_login(utente_id);
CREATE INDEX IF NOT EXISTS idx_sessioni_scadenza ON sessioni_login(scade_il);

CREATE TABLE IF NOT EXISTS libreria_esercizi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE COLLATE NOCASE,
  famiglia TEXT,
  variante TEXT,
  categoria TEXT,
  muscolo TEXT,
  attrezzo TEXT,
  animazione TEXT NOT NULL DEFAULT 'free',
  inizia_con TEXT NOT NULL DEFAULT 'conc' CHECK (inizia_con IN ('ecc','conc')),
  modalita_default TEXT NOT NULL DEFAULT 'setrep',
  altri_nomi TEXT,
  accorgimenti TEXT,
  creato_da INTEGER REFERENCES utenti(id) ON DELETE SET NULL,
  creato_il TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_libreria_famiglia ON libreria_esercizi(famiglia);

CREATE TABLE IF NOT EXISTS schede (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  atleta_id INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  coach_id INTEGER REFERENCES utenti(id) ON DELETE SET NULL,
  archiviata INTEGER NOT NULL DEFAULT 0 CHECK (archiviata IN (0,1)),
  creata_il TEXT NOT NULL DEFAULT (datetime('now')),
  aggiornata_il TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_schede_attiva ON schede(atleta_id) WHERE archiviata = 0;

CREATE TABLE IF NOT EXISTS giorni_scheda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scheda_id INTEGER NOT NULL REFERENCES schede(id) ON DELETE CASCADE,
  posizione INTEGER NOT NULL,
  nome TEXT
);
CREATE INDEX IF NOT EXISTS idx_giorni_scheda ON giorni_scheda(scheda_id, posizione);

CREATE TABLE IF NOT EXISTS esercizi_scheda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  giorno_id INTEGER NOT NULL REFERENCES giorni_scheda(id) ON DELETE CASCADE,
  posizione INTEGER NOT NULL,
  gruppo TEXT,
  esercizio_id INTEGER REFERENCES libreria_esercizi(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  modalita TEXT NOT NULL CHECK (modalita IN ('setrep','emom','amrap','tempo','free','rt','ladder')),
  parametri TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(parametri)),
  tecnica TEXT CHECK (tecnica IS NULL OR json_valid(tecnica)),
  nota TEXT
);
CREATE INDEX IF NOT EXISTS idx_esercizi_giorno ON esercizi_scheda(giorno_id, posizione);

CREATE TABLE IF NOT EXISTS giornate (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  atleta_id INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  scheda_id INTEGER REFERENCES schede(id) ON DELETE SET NULL,
  giorno_posizione INTEGER NOT NULL,
  nome_giorno TEXT,
  piano_json TEXT NOT NULL CHECK (json_valid(piano_json)),
  stato TEXT NOT NULL DEFAULT 'pre' CHECK (stato IN ('pre','in_corso','post','completata')),
  passo_corrente INTEGER NOT NULL DEFAULT 0,
  avviata_il TEXT NOT NULL DEFAULT (datetime('now')),
  completata_il TEXT,
  UNIQUE (atleta_id, data)
);

CREATE TABLE IF NOT EXISTS esercizi_svolti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  giornata_id INTEGER NOT NULL REFERENCES giornate(id) ON DELETE CASCADE,
  rif_esercizio INTEGER NOT NULL,
  esito TEXT NOT NULL CHECK (esito IN ('fatto','modificato','non_fatto')),
  effettivo_json TEXT CHECK (effettivo_json IS NULL OR json_valid(effettivo_json)),
  voto INTEGER CHECK (voto BETWEEN 1 AND 10),
  UNIQUE (giornata_id, rif_esercizio)
);

CREATE TABLE IF NOT EXISTS sensazioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  giornata_id INTEGER NOT NULL REFERENCES giornate(id) ON DELETE CASCADE,
  fase TEXT NOT NULL CHECK (fase IN ('pre','post')),
  modalita TEXT NOT NULL CHECK (modalita IN ('guidato','libero')),
  testo TEXT,
  risposte_json TEXT CHECK (risposte_json IS NULL OR json_valid(risposte_json)),
  UNIQUE (giornata_id, fase)
);

CREATE TABLE IF NOT EXISTS domande (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coach_id INTEGER REFERENCES utenti(id) ON DELETE CASCADE,
  fase TEXT NOT NULL CHECK (fase IN ('pre','post')),
  posizione INTEGER NOT NULL DEFAULT 0,
  testo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('scala','scelta','testo')),
  opzioni TEXT CHECK (opzioni IS NULL OR json_valid(opzioni)),
  etichetta_min TEXT,
  etichetta_max TEXT,
  attiva INTEGER NOT NULL DEFAULT 1 CHECK (attiva IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_domande_coach ON domande(coach_id, fase, posizione);
