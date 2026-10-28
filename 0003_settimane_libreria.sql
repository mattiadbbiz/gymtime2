-- GymTime · programmazione settimanale, domande predefinite e libreria esercizi
-- Schede: numero di settimane (1 = fissa), lunedì della settimana 1, settimane di scarico
ALTER TABLE schede ADD COLUMN settimane INTEGER NOT NULL DEFAULT 1 CHECK (settimane BETWEEN 1 AND 12);
ALTER TABLE schede ADD COLUMN inizio TEXT;
ALTER TABLE schede ADD COLUMN scarico TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(scarico));
-- Esercizi: solo i valori che cambiano, settimana per settimana, es. {"2":{"carico":42.5}}
ALTER TABLE esercizi_scheda ADD COLUMN progressione TEXT CHECK (progressione IS NULL OR json_valid(progressione));
-- Giornate: settimana applicata quando l'atleta ha avviato la scheda
ALTER TABLE giornate ADD COLUMN settimana INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_schede_atleta ON schede(atleta_id, archiviata);

-- Domande predefinite (gestite dall'admin), solo se non ce ne sono già
INSERT INTO domande (coach_id, fase, posizione, testo, tipo, opzioni, etichetta_min, etichetta_max) SELECT NULL, 'pre', 0, 'Come hai dormito stanotte?', 'scala', NULL, 'malissimo', 'benissimo' WHERE NOT EXISTS (SELECT 1 FROM domande WHERE coach_id IS NULL AND fase = 'pre' AND posizione = 0);
INSERT INTO domande (coach_id, fase, posizione, testo, tipo, opzioni, etichetta_min, etichetta_max) SELECT NULL, 'pre', 1, 'Quanta energia hai adesso?', 'scala', NULL, 'zero', 'a mille' WHERE NOT EXISTS (SELECT 1 FROM domande WHERE coach_id IS NULL AND fase = 'pre' AND posizione = 1);
INSERT INTO domande (coach_id, fase, posizione, testo, tipo, opzioni, etichetta_min, etichetta_max) SELECT NULL, 'pre', 2, 'Hai dolori o fastidi?', 'scelta', '["Nessuno", "Lievi", "Sì, mi danno fastidio"]', NULL, NULL WHERE NOT EXISTS (SELECT 1 FROM domande WHERE coach_id IS NULL AND fase = 'pre' AND posizione = 2);
INSERT INTO domande (coach_id, fase, posizione, testo, tipo, opzioni, etichetta_min, etichetta_max) SELECT NULL, 'pre', 3, 'Vuoi dire qualcosa al coach prima di iniziare?', 'testo', NULL, NULL, NULL WHERE NOT EXISTS (SELECT 1 FROM domande WHERE coach_id IS NULL AND fase = 'pre' AND posizione = 3);
INSERT INTO domande (coach_id, fase, posizione, testo, tipo, opzioni, etichetta_min, etichetta_max) SELECT NULL, 'post', 0, 'Quanto è stato faticoso?', 'scala', NULL, 'facilissimo', 'al limite' WHERE NOT EXISTS (SELECT 1 FROM domande WHERE coach_id IS NULL AND fase = 'post' AND posizione = 0);
INSERT INTO domande (coach_id, fase, posizione, testo, tipo, opzioni, etichetta_min, etichetta_max) SELECT NULL, 'post', 1, 'Come ti senti adesso?', 'scelta', '["Carico", "Normale", "Stanco", "Distrutto"]', NULL, NULL WHERE NOT EXISTS (SELECT 1 FROM domande WHERE coach_id IS NULL AND fase = 'post' AND posizione = 1);
INSERT INTO domande (coach_id, fase, posizione, testo, tipo, opzioni, etichetta_min, etichetta_max) SELECT NULL, 'post', 2, 'Cosa è andato meglio oggi?', 'testo', NULL, NULL, NULL WHERE NOT EXISTS (SELECT 1 FROM domande WHERE coach_id IS NULL AND fase = 'post' AND posizione = 2);
INSERT INTO domande (coach_id, fase, posizione, testo, tipo, opzioni, etichetta_min, etichetta_max) SELECT NULL, 'post', 3, 'Cosa ti ha messo in difficoltà?', 'testo', NULL, NULL, NULL WHERE NOT EXISTS (SELECT 1 FROM domande WHERE coach_id IS NULL AND fase = 'post' AND posizione = 3);

-- Libreria di base: 134 esercizi. INSERT OR IGNORE non tocca esercizi con lo stesso nome già presenti.
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione presa prona', 'Trazione', NULL, 'Calisthenics', 'Schiena: gran dorsale, romboidi, trapezio basso, bicipiti', 'Sbarra', 'trazione', 'conc', 'setrep', 'pull-up, pull up, trazioni, trazioni prone, trazione', 'Mani poco più larghe delle spalle, palmi in avanti
Parti a braccia tese ma con le spalle attive, non appeso sulle articolazioni
Prima abbassa le scapole, poi piega le braccia
Porta i gomiti verso i fianchi, come per metterli nelle tasche posteriori
Mento sopra la sbarra senza allungare il collo
Scendi controllato fino a braccia tese, niente slanci con le gambe');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Chin-up presa supina', 'Trazione', NULL, 'Calisthenics', 'Schiena e braccia: gran dorsale, bicipiti, brachiale', 'Sbarra', 'trazione', 'conc', 'setrep', 'chin-up, chin up, trazioni supine, trazione supina', 'Palmi verso di te, mani alla larghezza delle spalle
Petto in fuori e spalle lontane dalle orecchie
Tira i gomiti in basso vicino ai fianchi
Mento sopra la sbarra
Scendi lento fino a braccia tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione presa neutra', 'Trazione', NULL, 'Calisthenics', 'Schiena: gran dorsale, brachioradiale, bicipiti', 'Sbarra con maniglie parallele', 'trazione', 'conc', 'setrep', 'trazioni neutre, neutral grip, trazione neutra', 'Palmi uno di fronte all’altro
Scapole giù prima di piegare le braccia
Gomiti stretti lungo il corpo
Sali finché il mento supera le maniglie');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sternal pull-up', 'Trazione', NULL, 'Calisthenics', 'Schiena: gran dorsale, romboidi, trapezio medio', 'Sbarra', 'trazione', 'conc', 'setrep', 'sternum pull-up, trazione allo sterno', 'Avanzato: prima servono almeno 10 trazioni pulite
Petto in fuori e busto inclinato indietro fin dall’inizio
Porta la parte bassa del petto alla sbarra
Stringi forte le scapole in alto
Scendi lento senza perdere la posizione');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione al petto esplosiva', 'Trazione', NULL, 'Calisthenics', 'Schiena: gran dorsale, romboidi, bicipiti', 'Sbarra', 'trazione', 'conc', 'setrep', 'chest to bar, trazione esplosiva, high pull-up', 'Progressione per il muscle up: servono 8-10 trazioni pulite
Parti da braccia tese, poi tira più veloce che puoi
Porta il petto a toccare la sbarra
Gomiti che scendono dietro al corpo
Scendi controllato, poi riparti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione australiana', 'Trazione orizzontale', NULL, 'Calisthenics', 'Schiena: romboidi, trapezio medio, gran dorsale, deltoide posteriore', 'Sbarra bassa o anelli', 'trazione_aus', 'conc', 'setrep', 'inverted row, rematore inverso, australian pull-up, trazioni australiane', 'Corpo dritto dai talloni alle spalle
Glutei e pancia contratti, il bacino non cade
Tira il petto verso la sbarra
Stringi le scapole in alto per un secondo
Più i piedi sono avanti, più è difficile');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione negativa', 'Trazione', NULL, 'Calisthenics', 'Schiena: gran dorsale, bicipiti', 'Sbarra', 'trazione', 'conc', 'setrep', 'negative, trazioni negative, trazione eccentrica', 'Parti dalla posizione alta con un salto o un rialzo
Scendi in 3-5 secondi: il coach lo segna nel tempo esecutivo
Spalle sempre attive, non lasciarti cadere in fondo
Rimetti i piedi sul rialzo per risalire');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione con elastico', 'Trazione', NULL, 'Calisthenics', 'Schiena: gran dorsale, bicipiti', 'Sbarra, elastico', 'trazione', 'conc', 'setrep', 'trazioni assistite, trazione assistita, trazioni con elastico', 'Elastico ben agganciato, piede o ginocchio dentro
Usa un elastico che ti aiuti solo quanto serve
Stessa tecnica della trazione normale
Controlla la discesa, non farti tirare su dall’elastico');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazioni scapolari', 'Trazione', NULL, 'Calisthenics', 'Schiena: trapezio basso, gran dorsale', 'Sbarra', 'scapolari', 'conc', 'setrep', 'scapular pull-up, scapular pull, scapolari', 'Braccia sempre tese
Abbassa e avvicina le scapole: il corpo sale di poco
Torna giù piano senza perdere la presa
Movimento piccolo ma preciso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sospensione alla sbarra', 'Trazione', NULL, 'Calisthenics', 'Avambracci e spalle: flessori delle dita, gran dorsale', 'Sbarra', 'dead_hang', 'conc', 'tempo', 'dead hang, appeso, sospensione', 'Presa salda con tutta la mano
Spalle attive, non lasciarti andare del tutto
Respira tranquillo e non dondolare');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione zavorrata', 'Trazione', NULL, 'Streetlifting', 'Schiena: gran dorsale, romboidi, bicipiti', 'Sbarra, cintura zavorra', 'trazione_zav', 'conc', 'setrep', 'weighted pull-up, trazioni zavorrate, pull zavorrato', 'Zavorra ben fissata e ferma prima di partire
Parti da braccia completamente tese
Mento sopra la sbarra a ogni ripetizione
Niente slanci né gambe che si alzano
Scendi controllato fino a braccia tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Chin-up zavorrato', 'Trazione', NULL, 'Streetlifting', 'Schiena e braccia: gran dorsale, bicipiti', 'Sbarra, cintura zavorra', 'trazione_zav', 'conc', 'setrep', 'weighted chin-up, chin zavorrato', 'Presa supina alla larghezza delle spalle
Zavorra ferma, non farla oscillare
Mento sopra la sbarra
Braccia completamente tese in basso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Muscle up con elastico', 'Muscle up', NULL, 'Calisthenics', 'Schiena, petto e tricipiti: gran dorsale, pettorale, tricipite', 'Sbarra, elastico', 'muscle_up', 'conc', 'setrep', 'muscle up assistito', 'Prima servono 8-10 trazioni al petto e 10 dip
Elastico agganciato alla sbarra, piede dentro
Tira alto verso il petto, poi porta le spalle sopra la sbarra
Spingi fino a braccia tese
Scendi controllato, senza cadere');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Transizione muscle up', 'Muscle up', NULL, 'Calisthenics', 'Petto e tricipiti: pettorale, tricipite, deltoide anteriore', 'Sbarra bassa', 'muscle_up', 'conc', 'setrep', 'transition, transizione', 'Sbarra all’altezza del petto, piedi a terra che aiutano
Allenati a girare i polsi sopra la sbarra
Spalle che passano davanti alla sbarra
Chiudi spingendo fino a braccia tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Muscle up alla sbarra', 'Muscle up', NULL, 'Calisthenics', 'Schiena, petto e tricipiti: gran dorsale, pettorale, tricipite', 'Sbarra', 'muscle_up', 'conc', 'setrep', 'muscle up, muscle-up, mu', 'Avanzato: prima servono 8-10 trazioni al petto, 10 dip e la transizione
Presa un po’ più stretta delle trazioni
Tira esplosivo verso l’ombelico, non verso il mento
Porta il petto sopra la sbarra con un movimento unico
Spingi fino a braccia tese e scendi controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Muscle up agli anelli', 'Muscle up', NULL, 'Calisthenics', 'Schiena, petto e tricipiti: gran dorsale, pettorale, tricipite', 'Anelli', 'muscle_up', 'conc', 'setrep', 'ring muscle up', 'Avanzato: prima servono dip agli anelli stabili e trazioni al petto
Presa falsa: polsi sopra gli anelli
Anelli vicini al corpo per tutta la salita
Chiudi a braccia tese con gli anelli fermi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip alle parallele', 'Dip', NULL, 'Calisthenics', 'Petto e tricipiti: pettorale, tricipite, deltoide anteriore', 'Parallele', 'dip', 'ecc', 'setrep', 'dip, dips, dip parallele', 'Parti a braccia tese con le spalle basse
Leggera inclinazione in avanti
Gomiti che vanno indietro, non aperti di lato
Scendi finché le spalle arrivano circa all’altezza dei gomiti, senza fastidio davanti alla spalla
Spingi fino a braccia completamente tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip negativo', 'Dip', NULL, 'Calisthenics', 'Petto e tricipiti: pettorale, tricipite', 'Parallele', 'dip', 'ecc', 'setrep', 'dip negativi, dip eccentrico', 'Parti in alto con un salto o un rialzo
Scendi in 3-5 secondi
Spalle basse e lontane dalle orecchie
Rimetti i piedi a terra per risalire');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip alla sbarra dritta', 'Dip', NULL, 'Calisthenics', 'Petto e tricipiti: pettorale, tricipite', 'Sbarra', 'dip', 'ecc', 'setrep', 'straight bar dip, dip sbarra', 'Serve per il muscle up
Mani sulla sbarra, polsi sopra
Busto inclinato in avanti, gambe leggermente avanti
Scendi finché la sbarra tocca il petto basso
Spingi fino a braccia tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip alla panca', 'Dip', NULL, 'Calisthenics', 'Braccia: tricipite, deltoide anteriore', 'Panca', 'dip_panca', 'ecc', 'setrep', 'bench dip, dip su panca', 'Mani sul bordo della panca, dita in avanti
Schiena vicina alla panca
Scendi fino a gomiti circa a 90 gradi
Gomiti che puntano indietro
Gambe piegate per renderlo più facile');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip zavorrato', 'Dip', NULL, 'Streetlifting', 'Petto e tricipiti: pettorale, tricipite', 'Parallele, cintura zavorra', 'dip', 'ecc', 'setrep', 'weighted dip, dip zavorrati', 'Zavorra ferma, non farla oscillare
Scendi con controllo fino alla profondità prevista
Spalle basse e stabili in fondo
Chiudi a braccia completamente tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento', 'Piegamento', NULL, 'Calisthenics', 'Petto: pettorale, tricipite, deltoide anteriore, addome', 'Corpo libero', 'push', 'ecc', 'setrep', 'push-up, push up, piegamenti, flessioni', 'Mani sotto le spalle o poco più larghe
Corpo dritto, pancia e glutei contratti
Gomiti a circa 45 gradi dal corpo
Petto vicino a terra, poi spingi via il pavimento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento sulle ginocchia', 'Piegamento', NULL, 'Calisthenics', 'Petto: pettorale, tricipite', 'Corpo libero', 'push', 'ecc', 'setrep', 'push-up sulle ginocchia, piegamenti facilitati', 'Ginocchia a terra, corpo dritto dalle ginocchia alla testa
Mani sotto le spalle
Gomiti a circa 45 gradi
Petto vicino a terra e spingi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento su rialzo', 'Piegamento', NULL, 'Calisthenics', 'Petto: pettorale, tricipite', 'Panca o rialzo', 'push_rialzo', 'ecc', 'setrep', 'incline push-up, piegamenti inclinati', 'Mani su panca o rialzo stabile
Corpo dritto dai talloni alla testa
Petto fino al bordo del rialzo
Più basso è il rialzo, più è difficile');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento declinato', 'Piegamento', NULL, 'Calisthenics', 'Petto alto e spalle: pettorale clavicolare, deltoide anteriore', 'Panca o rialzo', 'push_declinato', 'ecc', 'setrep', 'decline push-up, piegamenti piedi rialzati', 'Piedi sul rialzo, mani a terra
Pancia contratta, la schiena non si inarca
Gomiti a circa 45 gradi
Lavora di più la parte alta del petto e le spalle');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento diamond', 'Piegamento', NULL, 'Calisthenics', 'Braccia: tricipite, pettorale', 'Corpo libero', 'push', 'ecc', 'setrep', 'diamond push-up, piegamenti diamante', 'Mani unite sotto il petto, pollici e indici formano un diamante
Gomiti vicini al corpo
Corpo dritto come una tavola
Scendi fino a sfiorare le mani con il petto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento largo', 'Piegamento', NULL, 'Calisthenics', 'Petto: pettorale', 'Corpo libero', 'push', 'ecc', 'setrep', 'wide push-up, piegamenti larghi', 'Mani più larghe delle spalle
Non far cadere il bacino
Scendi lento e senti l’allungamento del petto
Spingi tenendo le spalle lontane dalle orecchie');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pseudo planche push-up', 'Piegamento', NULL, 'Calisthenics', 'Spalle e petto: deltoide anteriore, pettorale, bicipite', 'Corpo libero', 'push', 'ecc', 'setrep', 'pseudo planche, ppp', 'Mani all’altezza della pancia, dita verso l’esterno
Spalle avanti oltre le mani per tutto il movimento
Braccia tese e scapole aperte in alto
Gomiti vicini al corpo in discesa');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento zavorrato', 'Piegamento', NULL, 'Streetlifting', 'Petto: pettorale, tricipite', 'Disco o giubbotto zavorrato', 'push', 'ecc', 'setrep', 'weighted push-up, piegamenti zavorrati', 'Peso ben fermo sulla schiena
Stessa tecnica del piegamento
Corpo rigido, il bacino non cede');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pike push-up', 'Verticale', NULL, 'Calisthenics', 'Spalle: deltoide anteriore, tricipite, trapezio', 'Corpo libero', 'pike', 'ecc', 'setrep', 'pike, piegamento verticale, piegamento a v', 'Bacino alto, corpo a V rovesciata
La testa scende davanti alle mani formando un triangolo
Gomiti sopra le mani, non aperti di lato
Spingi fino a braccia tese tenendo i fianchi alti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pike push-up piedi rialzati', 'Verticale', NULL, 'Calisthenics', 'Spalle: deltoide anteriore, tricipite, trapezio', 'Panca o rialzo', 'pike_rialzato', 'ecc', 'setrep', 'elevated pike push-up, pike rialzato', 'Piedi sul rialzo e fianchi sopra le mani
Busto il più verticale possibile
Testa che scende in avanti, collo lungo
Pancia contratta, niente schiena inarcata');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Verticale al muro', 'Verticale', NULL, 'Calisthenics', 'Spalle e addome: deltoide, tricipite, trapezio, addome', 'Muro', 'verticale', 'ecc', 'tempo', 'handstand al muro, verticale, wall handstand', 'Mani a una spanna dal muro, larghe come le spalle
Braccia tese, spingi il pavimento lontano
Pancia e glutei contratti, corpo dritto
Scendi una gamba alla volta quando sei stanco');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Camminata al muro', 'Verticale', NULL, 'Calisthenics', 'Spalle e addome: deltoide, tricipite, addome', 'Muro', 'verticale', 'ecc', 'setrep', 'wall walk, camminata in verticale', 'Parti in posizione di piegamento con i piedi al muro
Sali con i piedi e avvicina le mani al muro a piccoli passi
Fermati dove riesci a tenere il corpo dritto
Torna giù con calma, mai saltando');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento in verticale al muro', 'Verticale', NULL, 'Calisthenics', 'Spalle: deltoide anteriore, tricipite, trapezio', 'Muro', 'hspu', 'ecc', 'setrep', 'handstand push-up, hspu, piegamento in verticale', 'Avanzato: prima servono 30 secondi di verticale al muro e pike rialzati puliti
Testa che scende davanti alle mani, a triangolo
Gomiti sopra i polsi
Scendi lento, appoggia appena la testa e spingi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Squat a corpo libero', 'Squat', NULL, 'Calisthenics', 'Gambe: quadricipite, gluteo, adduttori', 'Corpo libero', 'squat', 'ecc', 'setrep', 'air squat, squat corpo libero, squat', 'Piedi alla larghezza delle spalle, punte leggermente in fuori
Talloni sempre a terra
Ginocchia nella direzione delle punte
Petto alto, scendi almeno a cosce parallele');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Squat jump', 'Squat', NULL, 'Calisthenics', 'Gambe: quadricipite, gluteo, polpacci', 'Corpo libero', 'squat_jump', 'ecc', 'setrep', 'jump squat, squat con salto', 'Scendi a mezzo squat
Spingi esplosivo, braccia in alto
Atterra morbido e piega subito le ginocchia
Ginocchia sempre in linea con le punte');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pistol squat assistito', 'Squat', NULL, 'Calisthenics', 'Gambe: quadricipite, gluteo', 'Corpo libero, appoggio', 'squat', 'ecc', 'setrep', 'pistol, squat su una gamba', 'Tieniti a un appoggio stabile
Gamba libera tesa in avanti
Scendi lento senza far cadere il ginocchio verso l’interno
Spingi con tutto il piede per risalire');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Affondo', 'Affondo', NULL, 'Calisthenics', 'Gambe: quadricipite, gluteo', 'Corpo libero', 'affondo', 'ecc', 'setrep', 'affondi, lunge, affondi alternati', 'Passo lungo, busto dritto
Ginocchio davanti sopra il piede
Ginocchio dietro che sfiora terra
Spingi con il tallone davanti per tornare su');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Affondo camminato', 'Affondo', NULL, 'Calisthenics', 'Gambe: quadricipite, gluteo', 'Corpo libero', 'affondo', 'ecc', 'setrep', 'walking lunge, affondi camminati', 'Passi lunghi e busto dritto
Ginocchio dietro che sfiora terra
Spingi con la gamba davanti e porta avanti l’altra
Guarda avanti, non i piedi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Bulgarian split squat', 'Affondo', NULL, 'Calisthenics', 'Gambe: quadricipite, gluteo', 'Panca', 'bulgaro', 'ecc', 'setrep', 'bulgaro, split squat bulgaro, bulgarian', 'Piede dietro appoggiato sulla panca
Peso sulla gamba davanti
Scendi in verticale con il busto leggermente avanti
Il ginocchio davanti non cade verso l’interno');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Step-up', 'Affondo', NULL, 'Calisthenics', 'Gambe: quadricipite, gluteo', 'Panca o box', 'step_up', 'conc', 'setrep', 'step up, salita sul box', 'Tutto il piede sul rialzo
Sali spingendo con la gamba sopra, non con quella a terra
Scendi lento e controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Ponte glutei', 'Ponte', NULL, 'Calisthenics', 'Glutei: grande gluteo, femorali', 'Corpo libero', 'ponte', 'conc', 'setrep', 'glute bridge, ponte', 'Piedi vicini ai glutei
Spingi dai talloni e alza il bacino
Stringi i glutei in alto per un secondo
Non inarcare la schiena');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Nordic curl', 'Femorali', NULL, 'Calisthenics', 'Gambe: femorali', 'Appoggio per i piedi', 'nordic', 'ecc', 'setrep', 'nordic, nordic hamstring', 'Piedi bloccati sotto un appoggio sicuro, cuscino sotto le ginocchia
Corpo dritto dalle ginocchia alla testa
Scendi più lento che puoi
Aiutati con le mani per tornare su');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Calf raise', 'Polpacci', NULL, 'Calisthenics', 'Gambe: gastrocnemio, soleo', 'Corpo libero o gradino', 'calf', 'conc', 'setrep', 'polpacci, sollevamenti sulle punte', 'Sali sulle punte più in alto che puoi
Fermati un secondo in alto
Scendi lento fino in fondo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Plank', 'Core', NULL, 'Calisthenics', 'Addome: retto e trasverso dell’addome, obliqui', 'Corpo libero', 'plank', 'ecc', 'tempo', 'plank frontale', 'Gomiti sotto le spalle
Pancia e glutei contratti
Non alzare e non far cadere il bacino
Respira normalmente');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Plank laterale', 'Core', NULL, 'Calisthenics', 'Addome: obliqui, quadrato dei lombi, gluteo medio', 'Corpo libero', 'plank_lat', 'ecc', 'tempo', 'side plank', 'Gomito sotto la spalla
Corpo dritto, bacino alto
Non ruotare il busto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Hollow body hold', 'Core', NULL, 'Calisthenics', 'Addome: retto e trasverso dell’addome', 'Corpo libero', 'hollow', 'ecc', 'tempo', 'hollow, hollow hold', 'Schiena bassa schiacciata a terra
Braccia vicino alle orecchie, gambe tese
Se la schiena si alza, piega le ginocchia
Respira senza perdere la posizione');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg raise alla sbarra', 'Core', NULL, 'Calisthenics', 'Addome: retto dell’addome, flessori dell’anca', 'Sbarra', 'leg_raise', 'conc', 'setrep', 'hanging leg raise, leg raise, sollevamento gambe', 'Appeso con le spalle attive
Alza le gambe tese senza dondolare
Porta il bacino in avanti in alto
Scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Knee raise alla sbarra', 'Core', NULL, 'Calisthenics', 'Addome: retto dell’addome, flessori dell’anca', 'Sbarra', 'knee_raise', 'conc', 'setrep', 'hanging knee raise, ginocchia al petto', 'Ginocchia verso il petto
Arrotola il bacino in alto
Nessuno slancio');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Crunch', 'Core', NULL, 'Calisthenics', 'Addome: retto dell’addome', 'Corpo libero', 'crunch', 'conc', 'setrep', 'crunch a terra', 'Zona lombare appoggiata a terra
Solleva solo le spalle
Espira mentre sali');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sit-up', 'Core', NULL, 'Calisthenics', 'Addome: retto dell’addome, flessori dell’anca', 'Corpo libero', 'situp', 'conc', 'setrep', 'sit up', 'Piedi fermi a terra
Sali arrotolando la schiena
Scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dead bug', 'Core', NULL, 'Calisthenics', 'Addome: trasverso e retto dell’addome', 'Corpo libero', 'dead_bug', 'conc', 'setrep', 'deadbug', 'Schiena bassa a terra per tutto il tempo
Allunga braccio e gamba opposti
Movimento lento e controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Mountain climber', 'Core', NULL, 'Calisthenics', 'Addome e spalle: retto dell’addome, flessori dell’anca, deltoide', 'Corpo libero', 'mountain', 'conc', 'setrep', 'mountain climbers, scalatore', 'Mani sotto le spalle
Porta le ginocchia al petto alternandole
Bacino basso e fermo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Burpee', 'Total body', NULL, 'CrossFit', 'Total body: gambe, petto, spalle, addome', 'Corpo libero', 'burpee', 'conc', 'setrep', 'burpees', 'Mani a terra, salta indietro in piegamento
Petto a terra
Salta con i piedi vicino alle mani
Salto finale con le braccia in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Box jump', 'Salto', NULL, 'CrossFit', 'Gambe: quadricipite, gluteo, polpacci', 'Box', 'box_jump', 'conc', 'setrep', 'salto sul box, box jumps', 'Piedi alla larghezza delle anche davanti al box
Carica con braccia e anche, poi salta
Atterra morbido con tutto il piede sul box
Chiudi in piedi e scendi un piede alla volta');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Back squat', 'Squat', NULL, 'Powerlifting', 'Gambe: quadricipite, gluteo, adduttori, erettori della schiena', 'Bilanciere', 'squat_bil', 'ecc', 'setrep', 'squat bilanciere, squat con bilanciere, back squat', 'Bilanciere fermo sulla parte alta della schiena, gomiti sotto
Grande respiro e pancia rigida prima di scendere
Ginocchia nella direzione delle punte
Scendi almeno al parallelo se la schiena resta neutra
Spingi su il bilanciere tenendo il petto alto
Usa i fermi di sicurezza del rack');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Front squat', 'Squat', NULL, 'Powerlifting', 'Gambe: quadricipite, gluteo, addome', 'Bilanciere', 'front_squat', 'ecc', 'setrep', 'squat frontale', 'Bilanciere sulle spalle davanti, gomiti alti
Busto il più verticale possibile
Ginocchia in linea con le punte, mai verso l’interno
Gomiti sempre alti anche in salita');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Box squat', 'Squat', NULL, 'Powerlifting', 'Gambe: gluteo, femorali, quadricipite', 'Bilanciere, box', 'box_squat', 'ecc', 'setrep', 'squat al box', 'Scendi portando il bacino indietro fino a sederti sul box
Non rilassarti sul box
Spingi su con i talloni');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Squat con fermo', 'Squat', NULL, 'Powerlifting', 'Gambe: quadricipite, gluteo', 'Bilanciere', 'squat_bil', 'ecc', 'setrep', 'paused squat, squat fermo', 'Fermo di 2 secondi in basso
Resta rigido durante il fermo
Riparti senza rimbalzare');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Overhead squat', 'Squat', NULL, 'CrossFit', 'Gambe e spalle: quadricipite, gluteo, deltoide, trapezio', 'Bilanciere', 'overhead_squat', 'ecc', 'setrep', 'squat sopra la testa, ohs', 'Prima impara con un bastone: serve buona mobilità di spalle e caviglie
Presa larga, braccia tese e bloccate sopra la testa
Bilanciere sopra la metà del piede per tutto il movimento
Scendi lento tenendo il petto alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Goblet squat', 'Squat', NULL, 'Bodybuilding', 'Gambe: quadricipite, gluteo', 'Manubrio o kettlebell', 'goblet', 'ecc', 'setrep', 'goblet, goblet squat kettlebell', 'Peso vicino al petto
Gomiti dentro le ginocchia in basso
Busto dritto, talloni a terra');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Squat al multipower', 'Squat', NULL, 'Bodybuilding', 'Gambe: quadricipite, gluteo', 'Multipower', 'squat_bil', 'ecc', 'setrep', 'smith squat', 'Piedi leggermente avanti rispetto al bilanciere
Regola i fermi di sicurezza
Scendi controllato e spingi dai talloni');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca piana bilanciere', 'Panca', NULL, 'Powerlifting', 'Petto: pettorale, tricipite, deltoide anteriore', 'Bilanciere, panca', 'panca', 'ecc', 'setrep', 'bench press, panca piana, panca', 'Sempre con un compagno che assiste
Occhi sotto il bilanciere
Scapole strette e basse, petto alto, piedi ben piantati
Abbassa il bilanciere a metà petto, gomiti a circa 45 gradi
Spingi su e leggermente indietro verso il rack');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca presa stretta', 'Panca', NULL, 'Powerlifting', 'Braccia e petto: tricipite, pettorale', 'Bilanciere, panca', 'panca', 'ecc', 'setrep', 'close grip bench, panca stretta', 'Sempre con un compagno che assiste
Mani circa alla larghezza delle spalle
Gomiti vicini al corpo
Bilanciere alla parte bassa del petto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca con fermo', 'Panca', NULL, 'Powerlifting', 'Petto: pettorale, tricipite', 'Bilanciere, panca', 'panca', 'ecc', 'setrep', 'paused bench, panca fermo', 'Sempre con un compagno che assiste
Fermo di un secondo con il bilanciere sul petto
Resta rigido durante il fermo, niente rimbalzo
Spingi esplosivo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco da terra', 'Stacco', NULL, 'Powerlifting', 'Schiena e gambe: erettori della schiena, gluteo, femorali, quadricipite, trapezio', 'Bilanciere', 'stacco', 'conc', 'setrep', 'deadlift, stacco, stacco classico', 'Bilanciere sopra metà piede
Prendi il bilanciere e tendi le braccia, dorsali attivi
Respira e blocca la pancia prima di tirare
Bilanciere sempre a contatto con le gambe
Spingi il pavimento e chiudi con i fianchi, senza inarcarti indietro');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco sumo', 'Stacco', NULL, 'Powerlifting', 'Gambe e schiena: gluteo, adduttori, quadricipite, erettori', 'Bilanciere', 'stacco_sumo', 'conc', 'setrep', 'sumo deadlift, sumo', 'Piedi larghi, punte in fuori
Mani dentro le gambe
Ginocchia spinte in fuori in linea con le punte
Busto più verticale dello stacco classico');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco rumeno', 'Stacco', NULL, 'Powerlifting', 'Gambe: femorali, gluteo, erettori della schiena', 'Bilanciere', 'rdl', 'ecc', 'setrep', 'rdl, romanian deadlift, stacco a gambe semitese', 'Ginocchia leggermente piegate e ferme
Porta il bacino indietro
Il bilanciere scivola sulle cosce
Schiena dritta, scendi finché senti tirare dietro le cosce');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Good morning', 'Stacco', NULL, 'Powerlifting', 'Gambe e schiena: femorali, gluteo, erettori', 'Bilanciere', 'good_morning', 'ecc', 'setrep', 'buongiorno', 'Solo con carichi leggeri
Bilanciere sulla parte alta della schiena
Ginocchia morbide, porta il bacino indietro
Schiena sempre dritta, scendi finché la mantieni');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Military press', 'Spinta verticale', NULL, 'Powerlifting', 'Spalle: deltoide anteriore e laterale, tricipite, trapezio', 'Bilanciere', 'press', 'conc', 'setrep', 'overhead press, ohp, lento avanti bilanciere, military', 'In piedi, glutei e pancia contratti
Il bilanciere parte dalle clavicole
Sposta la testa indietro, poi rientra sotto il bilanciere
Chiudi con le braccia tese sopra la testa');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Push press', 'Spinta verticale', NULL, 'CrossFit', 'Spalle e gambe: deltoide, tricipite, quadricipite', 'Bilanciere', 'push_press', 'conc', 'setrep', 'push press', 'Bilanciere sulle spalle davanti, gomiti un po’ avanti
Piccolo piegamento delle ginocchia con il busto dritto
Spingi con le gambe e subito con le braccia
Chiudi a braccia tese, poi riporta il bilanciere sulle spalle');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Thruster', 'Spinta verticale', NULL, 'CrossFit', 'Total body: quadricipite, gluteo, deltoide, tricipite', 'Bilanciere', 'thruster', 'ecc', 'setrep', 'thrusters', 'Bilanciere sulle spalle davanti, gomiti alti
Front squat completo
Risali esplosivo e usa la spinta per portare il bilanciere sopra la testa
Movimento unico, senza fermarti a metà');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Wall ball', 'Spinta verticale', NULL, 'CrossFit', 'Total body: quadricipite, gluteo, spalle', 'Palla medica, muro', 'wall_ball', 'ecc', 'setrep', 'wall balls, palla al muro', 'Palla al petto, gomiti sotto
Squat completo
Risali e lancia la palla verso il bersaglio sul muro
Riprendi la palla e scendi subito nello squat successivo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore con bilanciere', 'Rematore', NULL, 'Powerlifting', 'Schiena: gran dorsale, romboidi, trapezio, deltoide posteriore', 'Bilanciere', 'rematore', 'conc', 'setrep', 'barbell row, rematore bilanciere', 'Busto inclinato, schiena dritta
Bilanciere verso l’ombelico
Gomiti indietro vicini al corpo
Non dare colpi con la schiena');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Hip thrust', 'Ponte', NULL, 'Powerlifting', 'Glutei: grande gluteo, femorali', 'Bilanciere, panca', 'hip_thrust', 'conc', 'setrep', 'hip thrust bilanciere', 'Parte alta della schiena sulla panca, cuscinetto sul bilanciere
Piedi piatti, tibie verticali in alto
Spingi con i talloni
Mento verso il petto, glutei stretti in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca piana manubri', 'Panca', NULL, 'Bodybuilding', 'Petto: pettorale, tricipite, deltoide anteriore', 'Manubri, panca', 'panca_man', 'ecc', 'setrep', 'dumbbell press, panca manubri', 'Scapole strette e petto alto
Scendi con i manubri ai lati del petto
Gomiti a circa 45 gradi
Spingi su senza far sbattere i manubri');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca inclinata bilanciere', 'Panca', NULL, 'Bodybuilding', 'Petto alto: pettorale clavicolare, deltoide anteriore', 'Bilanciere, panca', 'panca_incl', 'ecc', 'setrep', 'incline bench, panca inclinata', 'Sempre con un compagno che assiste
Panca a 30-45 gradi
Bilanciere alla parte alta del petto
Scapole strette sulla panca');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca inclinata manubri', 'Panca', NULL, 'Bodybuilding', 'Petto alto: pettorale clavicolare, deltoide anteriore', 'Manubri, panca', 'panca_incl', 'ecc', 'setrep', 'incline dumbbell press', 'Panca a 30-45 gradi
Scendi lento con i manubri vicino al petto
Spingi su e leggermente verso il centro');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca al multipower', 'Panca', NULL, 'Bodybuilding', 'Petto: pettorale, tricipite', 'Multipower, panca', 'panca', 'ecc', 'setrep', 'smith bench, panca smith', 'Posiziona la panca così il bilanciere scende a metà petto
Scapole strette
Regola i fermi di sicurezza prima di partire');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Croci con manubri', 'Croci', NULL, 'Bodybuilding', 'Petto: pettorale, deltoide anteriore', 'Manubri, panca', 'croci', 'conc', 'setrep', 'dumbbell fly, croci', 'Solo con carichi leggeri
Gomiti leggermente piegati e fermi
Apri lento fino a sentire l’allungamento, senza scendere oltre le spalle
Chiudi come ad abbracciare un albero');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Croci ai cavi', 'Croci', NULL, 'Bodybuilding', 'Petto: pettorale', 'Cavi', 'croci', 'conc', 'setrep', 'cable crossover, croci cavi', 'Un passo avanti, busto leggermente inclinato
Gomiti morbidi e fermi
Porta le mani una verso l’altra davanti al petto
Torna lento senza far tirare le spalle in avanti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pec deck', 'Croci', NULL, 'Bodybuilding', 'Petto: pettorale', 'Macchina', 'croci', 'conc', 'setrep', 'butterfly, peck deck', 'Schiena appoggiata
Gomiti all’altezza delle spalle
Chiudi lento e stringi il petto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Chest press', 'Panca', NULL, 'Bodybuilding', 'Petto: pettorale, tricipite', 'Macchina', 'chest_press', 'conc', 'setrep', 'chest press macchina', 'Regola il sedile con le maniglie all’altezza del petto
Schiena appoggiata e scapole strette
Spingi senza bloccare i gomiti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pullover con manubrio', 'Pullover', NULL, 'Bodybuilding', 'Petto e schiena: pettorale, gran dorsale, tricipite', 'Manubrio, panca', 'pullover', 'ecc', 'setrep', 'pullover', 'Solo con carichi leggeri
Manubrio sopra il petto, gomiti morbidi
Porta il manubrio dietro la testa lentamente, senza fastidio alle spalle
Torna su usando petto e dorsali');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Lat machine avanti', 'Lat machine', NULL, 'Bodybuilding', 'Schiena: gran dorsale, romboidi, bicipiti', 'Macchina', 'lat', 'conc', 'setrep', 'lat pulldown, lat machine, lat', 'Sempre davanti, mai dietro la nuca
Cosce bloccate sotto i rulli
Busto appena inclinato indietro, non sdraiato
Scapole giù prima di piegare le braccia
Barra verso la parte alta del petto, poi risali lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Lat machine presa stretta', 'Lat machine', NULL, 'Bodybuilding', 'Schiena: gran dorsale, bicipiti', 'Macchina', 'lat', 'conc', 'setrep', 'lat triangolo, close grip pulldown', 'Triangolo o presa neutra stretta
Gomiti vicini al corpo
Tira verso il petto senza dondolare');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pulley basso', 'Rematore', NULL, 'Bodybuilding', 'Schiena: gran dorsale, romboidi, trapezio medio', 'Cavi', 'pulley', 'conc', 'setrep', 'seated cable row, pulley, rematore ai cavi', 'Schiena dritta, petto in fuori
Tira la maniglia verso l’ombelico
Stringi le scapole alla fine
Lascia allungare la schiena senza piegarti in avanti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore manubrio', 'Rematore', NULL, 'Bodybuilding', 'Schiena: gran dorsale, romboidi', 'Manubrio, panca', 'rematore_man', 'conc', 'setrep', 'rematore un braccio, one arm row', 'Mano e ginocchio sulla panca, schiena piatta
Tira il manubrio verso il fianco
Gomito vicino al corpo
Non ruotare il busto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore T-bar', 'Rematore', NULL, 'Bodybuilding', 'Schiena: gran dorsale, romboidi, trapezio', 'T-bar', 'rematore', 'conc', 'setrep', 't-bar row', 'Busto inclinato e schiena dritta
Tira verso la parte bassa del petto
Gomiti vicini al corpo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore su panca inclinata', 'Rematore', NULL, 'Bodybuilding', 'Schiena: romboidi, trapezio medio, deltoide posteriore', 'Manubri, panca', 'rematore_man', 'conc', 'setrep', 'chest supported row', 'Petto appoggiato alla panca
Tira i gomiti indietro
Stringi le scapole in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pulldown a braccia tese', 'Lat machine', NULL, 'Bodybuilding', 'Schiena: gran dorsale, grande rotondo', 'Cavi', 'straight_pulldown', 'conc', 'setrep', 'straight arm pulldown, pullover ai cavi', 'Braccia quasi tese per tutto il movimento
Porta la barra verso le cosce con i dorsali
Busto leggermente inclinato e fermo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Hyperextension', 'Lombari', NULL, 'Bodybuilding', 'Schiena bassa: erettori della schiena, gluteo, femorali', 'Panca per iperestensioni', 'hyper', 'conc', 'setrep', 'iperestensioni, back extension', 'Bacino appoggiato al cuscino
Scendi lento con la schiena dritta
Risali fino ad allinearti, senza inarcarti troppo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Scrollate con manubri', 'Trapezio', NULL, 'Bodybuilding', 'Schiena alta: trapezio superiore', 'Manubri', 'shrug', 'conc', 'setrep', 'shrug, scrollate', 'Braccia tese lungo i fianchi
Alza le spalle verso le orecchie, senza ruotarle
Fermati un secondo e scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Lento avanti manubri', 'Spinta verticale', NULL, 'Bodybuilding', 'Spalle: deltoide anteriore e laterale, tricipite', 'Manubri, panca', 'press_man', 'conc', 'setrep', 'shoulder press manubri, lento manubri', 'Seduto con lo schienale quasi verticale
Manubri all’altezza delle spalle
Spingi su senza inarcare la schiena
Scendi lento fino all’altezza delle orecchie');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Shoulder press macchina', 'Spinta verticale', NULL, 'Bodybuilding', 'Spalle: deltoide anteriore, tricipite', 'Macchina', 'press_man', 'conc', 'setrep', 'shoulder press', 'Maniglie all’altezza delle spalle
Schiena appoggiata
Spingi senza bloccare i gomiti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Arnold press', 'Spinta verticale', NULL, 'Bodybuilding', 'Spalle: deltoide anteriore e laterale', 'Manubri', 'press_man', 'conc', 'setrep', 'arnold', 'Parti con i palmi verso di te
Ruota i polsi mentre spingi su
Movimento fluido e controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Lento al multipower', 'Spinta verticale', NULL, 'Bodybuilding', 'Spalle: deltoide anteriore, tricipite', 'Multipower', 'press_man', 'conc', 'setrep', 'smith shoulder press, military press al multipower', 'Sempre davanti al viso, mai dietro la nuca
Panca sotto il bilanciere, schienale quasi verticale
Regola i fermi di sicurezza');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Alzate laterali manubri', 'Alzate', NULL, 'Bodybuilding', 'Spalle: deltoide laterale', 'Manubri', 'alzate_lat', 'conc', 'setrep', 'lateral raise, alzate laterali', 'Gomiti leggermente piegati
Alza le braccia di lato fino all’altezza delle spalle
Guida il movimento con i gomiti, non con le mani
Niente slancio con il busto
Scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Alzate laterali ai cavi', 'Alzate', NULL, 'Bodybuilding', 'Spalle: deltoide laterale', 'Cavi', 'alzate_lat', 'conc', 'setrep', 'cable lateral raise', 'Cavo in basso, dal lato opposto al braccio che lavora
Gomito morbido
Alza fino all’altezza della spalla e scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Alzate frontali', 'Alzate', NULL, 'Bodybuilding', 'Spalle: deltoide anteriore', 'Manubri', 'alzate_front', 'conc', 'setrep', 'front raise', 'Braccia quasi tese
Alza davanti fino all’altezza delle spalle
Busto fermo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Alzate posteriori', 'Alzate', NULL, 'Bodybuilding', 'Spalle: deltoide posteriore, romboidi', 'Manubri', 'alzate_post', 'conc', 'setrep', 'reverse fly, alzate a 90', 'Busto inclinato in avanti, schiena dritta
Braccia aperte di lato con i gomiti morbidi
Pensa a portare le mani lontano, non indietro');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Reverse pec deck', 'Alzate', NULL, 'Bodybuilding', 'Spalle: deltoide posteriore, romboidi', 'Macchina', 'alzate_post', 'conc', 'setrep', 'rear delt machine', 'Petto appoggiato
Apri le braccia all’indietro all’altezza delle spalle
Movimento controllato, niente strappi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Tirate al mento', 'Alzate', NULL, 'Bodybuilding', 'Spalle: deltoide laterale, trapezio', 'Bilanciere o manubri', 'alzate_lat', 'conc', 'setrep', 'upright row, tirate', 'Presa alla larghezza delle spalle o più larga
I gomiti salgono fino all’altezza delle spalle, non oltre
Bilanciere vicino al corpo
Scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Face pull', 'Alzate', NULL, 'Bodybuilding', 'Spalle: deltoide posteriore, cuffia dei rotatori, trapezio medio', 'Cavi', 'face_pull', 'conc', 'setrep', 'facepull', 'Cavo più in alto della testa, con la corda
Tira la corda verso la fronte
Gomiti alti e aperti
Alla fine ruota le mani indietro, come a mostrare i bicipiti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl con bilanciere', 'Curl', NULL, 'Bodybuilding', 'Braccia: bicipite, brachiale', 'Bilanciere', 'curl', 'conc', 'setrep', 'barbell curl, curl bilanciere', 'Gomiti fermi lungo i fianchi
Sali senza dondolare con la schiena
Scendi lento fino a braccia tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl manubri', 'Curl', NULL, 'Bodybuilding', 'Braccia: bicipite', 'Manubri', 'curl_man', 'conc', 'setrep', 'dumbbell curl, curl alternato', 'Ruota il palmo verso l’alto mentre sali
Gomiti fermi
Scendi controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl a martello', 'Curl', NULL, 'Bodybuilding', 'Braccia: brachioradiale, brachiale, bicipite', 'Manubri', 'curl_man', 'conc', 'setrep', 'hammer curl, martello', 'Palmi uno verso l’altro
Gomiti fermi lungo i fianchi
Niente slanci');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl su panca Scott', 'Curl', NULL, 'Bodybuilding', 'Braccia: bicipite, brachiale', 'Bilanciere EZ, panca Scott', 'curl_scott', 'conc', 'setrep', 'preacher curl, scott', 'Ascelle ben appoggiate al cuscino
Scendi quasi a braccia tese senza bloccare
Sali senza staccare i gomiti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl ai cavi', 'Curl', NULL, 'Bodybuilding', 'Braccia: bicipite', 'Cavi', 'curl', 'conc', 'setrep', 'cable curl', 'Gomiti fermi
Tensione costante anche in basso
Stringi in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl concentrato', 'Curl', NULL, 'Bodybuilding', 'Braccia: bicipite', 'Manubrio', 'curl_man', 'conc', 'setrep', 'concentration curl', 'Gomito appoggiato all’interno della coscia
Sali lento e stringi in alto
Scendi fino quasi a braccio teso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Push-down ai cavi', 'Tricipiti', NULL, 'Bodybuilding', 'Braccia: tricipite', 'Cavi', 'pushdown', 'conc', 'setrep', 'pushdown, tricipiti ai cavi, push down', 'Gomiti fermi vicino ai fianchi
Spingi giù fino a braccia tese
Con la corda, apri le mani in fondo
Risali lento senza alzare i gomiti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('French press', 'Tricipiti', NULL, 'Bodybuilding', 'Braccia: tricipite', 'Bilanciere EZ, panca', 'french', 'ecc', 'setrep', 'skull crusher, french', 'Sempre con un compagno che assiste
Gomiti che puntano al soffitto e fermi
Scendi con la barra verso la fronte
Distendi le braccia senza muovere le spalle');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Estensioni sopra la testa', 'Tricipiti', NULL, 'Bodybuilding', 'Braccia: tricipite capo lungo', 'Manubrio o cavo', 'estensioni', 'ecc', 'setrep', 'overhead extension, estensioni tricipiti', 'Gomiti vicini alla testa e fermi
Scendi dietro la testa lentamente
Distendi completamente le braccia');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Kickback tricipiti', 'Tricipiti', NULL, 'Bodybuilding', 'Braccia: tricipite', 'Manubrio', 'kickback', 'conc', 'setrep', 'kick back tricipiti', 'Busto inclinato, braccio parallelo al corpo
Muovi solo l’avambraccio
Braccio teso dietro e stringi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg press', 'Gambe macchine', NULL, 'Bodybuilding', 'Gambe: quadricipite, gluteo, adduttori', 'Macchina', 'leg_press', 'ecc', 'setrep', 'pressa', 'Schiena e bacino sempre appoggiati
Piedi alla larghezza delle spalle
Scendi finché il bacino non si stacca
Non bloccare le ginocchia in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg extension', 'Gambe macchine', NULL, 'Bodybuilding', 'Gambe: quadricipite', 'Macchina', 'leg_ext', 'conc', 'setrep', 'leg ext', 'Ginocchio allineato al perno della macchina
Distendi le gambe e stringi le cosce
Scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg curl sdraiato', 'Gambe macchine', NULL, 'Bodybuilding', 'Gambe: femorali', 'Macchina', 'leg_curl', 'conc', 'setrep', 'lying leg curl', 'Bacino schiacciato sul cuscino
Porta i talloni verso i glutei
Scendi controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg curl seduto', 'Gambe macchine', NULL, 'Bodybuilding', 'Gambe: femorali', 'Macchina', 'leg_curl_seduto', 'conc', 'setrep', 'seated leg curl', 'Cosce bloccate dal rullo
Porta i talloni sotto la seduta
Risali lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Hack squat', 'Gambe macchine', NULL, 'Bodybuilding', 'Gambe: quadricipite, gluteo', 'Macchina', 'hack', 'ecc', 'setrep', 'hack', 'Schiena appoggiata
Piedi a metà pedana
Scendi profondo con controllo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Affondi con manubri', 'Affondo', NULL, 'Bodybuilding', 'Gambe: quadricipite, gluteo', 'Manubri', 'affondo_man', 'ecc', 'setrep', 'dumbbell lunge', 'Manubri lungo i fianchi
Passo lungo e busto dritto
Ginocchio dietro che sfiora terra');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco rumeno con manubri', 'Stacco', NULL, 'Bodybuilding', 'Gambe: femorali, gluteo', 'Manubri', 'rdl_man', 'ecc', 'setrep', 'rdl manubri', 'Manubri vicini alle gambe
Bacino indietro, ginocchia morbide
Schiena dritta, scendi finché senti tirare dietro le cosce');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Calf in piedi alla macchina', 'Polpacci', NULL, 'Bodybuilding', 'Gambe: gastrocnemio', 'Macchina', 'calf', 'conc', 'setrep', 'standing calf raise', 'Spalle sotto i cuscinetti
Scendi con il tallone sotto il livello della pedana
Sali in alto e fermati un secondo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Calf seduto', 'Polpacci', NULL, 'Bodybuilding', 'Gambe: soleo', 'Macchina', 'calf_seduto', 'conc', 'setrep', 'seated calf raise', 'Ginocchia sotto il cuscinetto
Movimento completo, lento in basso
Fermati un secondo in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Adductor machine', 'Gambe macchine', NULL, 'Bodybuilding', 'Gambe: adduttori', 'Macchina', 'adduttori', 'conc', 'setrep', 'adduttori', 'Schiena appoggiata
Chiudi le gambe lentamente
Non far sbattere i pesi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Abductor machine', 'Gambe macchine', NULL, 'Bodybuilding', 'Glutei: gluteo medio e piccolo', 'Macchina', 'adduttori', 'conc', 'setrep', 'abduttori', 'Schiena appoggiata o busto leggermente avanti
Apri le gambe spingendo con i glutei
Torna lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Kickback glutei ai cavi', 'Ponte', NULL, 'Bodybuilding', 'Glutei: grande gluteo', 'Cavi', 'kickback_glutei', 'conc', 'setrep', 'glute kickback', 'Busto fermo, pancia contratta
Spingi la gamba indietro con il gluteo
Non inarcare la schiena');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Crunch ai cavi', 'Core', NULL, 'Bodybuilding', 'Addome: retto dell’addome', 'Cavi', 'crunch', 'conc', 'setrep', 'cable crunch', 'In ginocchio, corda vicino alla testa
Arrotola il busto verso le ginocchia
Non tirare con le braccia');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Ab wheel', 'Core', NULL, 'Bodybuilding', 'Addome: retto e trasverso dell’addome, gran dorsale', 'Ruota per addominali', 'ab_wheel', 'ecc', 'setrep', 'ruota addominali, rollout', 'Parti in ginocchio
Pancia contratta, la schiena non si inarca
Vai avanti solo fin dove controlli');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pallof press', 'Core', NULL, 'Bodybuilding', 'Addome: obliqui, trasverso dell’addome', 'Cavi o elastico', 'pallof', 'conc', 'setrep', 'pallof', 'In piedi di lato al cavo
Spingi le mani avanti senza ruotare il busto
Tieni la posizione un attimo e torna');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Swing russo', 'Kettlebell', NULL, 'Kettlebell', 'Anche e schiena: gluteo, femorali, erettori, addome', 'Kettlebell', 'swing', 'conc', 'setrep', 'kettlebell swing, swing, swing kettlebell', 'È un movimento di anca, non uno squat
Kettlebell che passa alta tra le gambe, avambracci contro l’interno coscia
Chiudi esplosivo con glutei e pancia
Braccia rilassate: il kettlebell sale fino all’altezza del petto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Swing americano', 'Kettlebell', NULL, 'Kettlebell', 'Anche e spalle: gluteo, femorali, deltoide', 'Kettlebell', 'swing_am', 'conc', 'setrep', 'american swing', 'Prima serve uno swing russo sicuro e buona mobilità delle spalle
Stessa spinta dell’anca dello swing russo
Il kettlebell arriva sopra la testa con le braccia tese
Pancia contratta, la schiena non si inarca in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Snatch con kettlebell', 'Kettlebell', NULL, 'Kettlebell', 'Total body: gluteo, femorali, deltoide, trapezio', 'Kettlebell', 'snatch_kb', 'conc', 'setrep', 'kettlebell snatch, strappo kettlebell', 'Avanzato: prima servono swing russo e clean sicuri
Spinta di anca, poi tira il gomito in alto
Infila la mano nel manico, così il kettlebell non sbatte sull’avambraccio
Chiudi a braccio teso sopra la testa');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco con kettlebell', 'Kettlebell', NULL, 'Kettlebell', 'Gambe e schiena: gluteo, femorali, quadricipite', 'Kettlebell', 'stacco_sumo', 'conc', 'setrep', 'kettlebell deadlift', 'Kettlebell tra i piedi
Schiena dritta, porta il bacino indietro
Spingi il pavimento e chiudi con i fianchi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore con kettlebell', 'Kettlebell', NULL, 'Kettlebell', 'Schiena: gran dorsale, romboidi', 'Kettlebell', 'rematore_man', 'conc', 'setrep', 'kettlebell row', 'Schiena piatta, appoggio stabile
Tira il kettlebell verso il fianco
Gomito vicino al corpo');
