-- GymTime · giornate singole: una giornata di allenamento fuori dalla scheda, creata da coach o admin
-- per sé o per un proprio atleta. Nessuna tabella esistente cambia.
-- Avviata da Allena diventa una riga di giornate con scheda_id NULL e giorno_posizione -1,
-- così il giorno suggerito della scheda la ignora.
-- Aggiunta alla scheda attiva diventa giorni_scheda + esercizi_scheda e la riga qui si elimina.
-- esercizi_json: [{ esercizio_id, nome, modalita, parametri, tecnica, nota, variante }],
-- stesso formato degli esercizi delle schede, ripulito con le stesse regole (regole.js).
CREATE TABLE IF NOT EXISTS giornate_singole (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  atleta_id INTEGER NOT NULL REFERENCES utenti(id) ON DELETE CASCADE,
  creata_da INTEGER REFERENCES utenti(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  esercizi_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(esercizi_json)),
  creata_il TEXT NOT NULL DEFAULT (datetime('now')),
  aggiornata_il TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_singole_atleta ON giornate_singole(atleta_id, aggiornata_il);
