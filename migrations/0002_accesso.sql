-- GymTime · password iniziale da cambiare al primo accesso e un solo admin (già applicato)
ALTER TABLE utenti ADD COLUMN cambio_password INTEGER NOT NULL DEFAULT 1 CHECK (cambio_password IN (0,1));
CREATE UNIQUE INDEX IF NOT EXISTS idx_un_solo_admin ON utenti(ruolo) WHERE ruolo = 'admin';
