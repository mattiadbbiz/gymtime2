-- Le sessioni precedenti rimangono miste.
ALTER TABLE sessioni_mobilita ADD COLUMN tipo_sessione TEXT NOT NULL DEFAULT 'mista' CHECK(tipo_sessione IN ('mista','mobilita','stretching'));
CREATE INDEX idx_mobilita_tipo_utente ON sessioni_mobilita(utente_id,tipo_sessione,data);
CREATE TABLE sessioni_cardio(id INTEGER PRIMARY KEY AUTOINCREMENT,utente_id INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,data TEXT NOT NULL,stato TEXT NOT NULL DEFAULT 'in_corso' CHECK(stato IN ('in_corso','completata')),piano_json TEXT NOT NULL CHECK(json_valid(piano_json)),esiti_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(esiti_json)),avviata_il TEXT NOT NULL DEFAULT(datetime('now')),completata_il TEXT);
CREATE INDEX idx_cardio_utente_data ON sessioni_cardio(utente_id,data);
CREATE UNIQUE INDEX idx_cardio_una_aperta ON sessioni_cardio(utente_id) WHERE stato='in_corso';
