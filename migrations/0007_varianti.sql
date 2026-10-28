-- GymTime · variante dell'omino per ogni esercizio della scheda
-- JSON con i soli valori scelti dal coach: { "attrezzo": "manubri|bilanciere|cavi", "panca": 0-90 (gradi),
--   "mani": "paralleline|parallele alte", "piedi": "rialzo basso|panca|box alto" }. NULL = omino della libreria.
-- Le superserie restano nella colonna gruppo; la pausa tra un esercizio e il successivo è parametri.pausa (secondi).
ALTER TABLE esercizi_scheda ADD COLUMN variante TEXT CHECK (variante IS NULL OR json_valid(variante));
