-- GymTime · storico delle schede
-- Le schede fatte prima di GymTime si importano come schede archiviate con origine 'importata':
-- non diventano mai la scheda attiva. File, foto, audio e testo usati per importarle non si salvano.
-- Periodo: 'AAAA-MM' (solo mese e anno) oppure 'AAAA-MM-GG'.

ALTER TABLE schede ADD COLUMN origine TEXT NOT NULL DEFAULT 'app'
  CHECK (origine = 'app' OR (origine = 'importata' AND archiviata = 1));

ALTER TABLE schede ADD COLUMN periodo_dal TEXT
  CHECK (periodo_dal IS NULL
    OR periodo_dal GLOB '[12][0-9][0-9][0-9]-[01][0-9]'
    OR periodo_dal GLOB '[12][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]');

-- Un mese senza giorno vale dal primo (inizio) all'ultimo (fine) giorno del mese
ALTER TABLE schede ADD COLUMN periodo_al TEXT
  CHECK (periodo_al IS NULL
    OR ((periodo_al GLOB '[12][0-9][0-9][0-9]-[01][0-9]' OR periodo_al GLOB '[12][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]')
        AND (periodo_dal IS NULL OR substr(periodo_al || '-31', 1, 10) >= substr(periodo_dal || '-01', 1, 10))));

ALTER TABLE schede ADD COLUMN nota TEXT;

-- Schede già presenti: inizio dalla settimana 1 (o dalla creazione), fine dalla data di archiviazione.
-- La scheda attiva resta senza fine.
UPDATE schede SET
  periodo_dal = COALESCE(inizio, date(creata_il)),
  periodo_al = CASE WHEN archiviata = 1
    THEN max(date(aggiornata_il), COALESCE(inizio, date(creata_il)))
    ELSE NULL END
WHERE periodo_dal IS NULL;
