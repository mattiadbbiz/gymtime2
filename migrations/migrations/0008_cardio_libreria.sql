-- GymTime · modalità cardio (metri, calorie, tempo) e pose nuove in libreria
-- SQLite non permette di cambiare un CHECK: esercizi_scheda si ricostruisce con 'cardio' tra le modalità.
-- Nessuna tabella punta a esercizi_scheda; le giornate già avviate hanno la loro copia in piano_json.
PRAGMA defer_foreign_keys = on;

CREATE TABLE esercizi_scheda_nuova (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  giorno_id INTEGER NOT NULL REFERENCES giorni_scheda(id) ON DELETE CASCADE,
  posizione INTEGER NOT NULL,
  gruppo TEXT,
  esercizio_id INTEGER REFERENCES libreria_esercizi(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  modalita TEXT NOT NULL CHECK (modalita IN ('setrep','emom','amrap','tempo','free','rt','ladder','cardio')),
  parametri TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(parametri)),
  tecnica TEXT CHECK (tecnica IS NULL OR json_valid(tecnica)),
  nota TEXT,
  progressione TEXT CHECK (progressione IS NULL OR json_valid(progressione)),
  variante TEXT CHECK (variante IS NULL OR json_valid(variante))
);
INSERT INTO esercizi_scheda_nuova (id, giorno_id, posizione, gruppo, esercizio_id, nome, modalita, parametri, tecnica, nota, progressione, variante)
  SELECT id, giorno_id, posizione, gruppo, esercizio_id, nome, modalita, parametri, tecnica, nota, progressione, variante FROM esercizi_scheda;
DROP TABLE esercizi_scheda;
ALTER TABLE esercizi_scheda_nuova RENAME TO esercizi_scheda;
CREATE INDEX IF NOT EXISTS idx_esercizi_giorno ON esercizi_scheda(giorno_id, posizione);

-- Muscle up agli anelli: omino con gli anelli
UPDATE libreria_esercizi SET animazione = 'muscle_up_anelli' WHERE nome = 'Muscle up agli anelli' AND animazione = 'muscle_up';

-- 35 esercizi nuovi, uno per ogni posa dei gruppi 5-8 e delle varianti anelli e parallele.
-- INSERT OR IGNORE non tocca esercizi con lo stesso nome già presenti.
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sostegno alle parallele', 'Dip', NULL, 'Calisthenics', 'Spalle e braccia: deltoide, tricipiti, gran dorsale, core', 'Parallele', 'sostegno_parallele', 'ecc', 'tempo', 'support hold, tenuta alle parallele, sostegno parallele', 'Braccia tese, spalle basse lontane dalle orecchie
Petto aperto, sguardo avanti
Gambe unite e glutei contratti
Respira con calma, scendi appena le spalle salgono');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sostegno agli anelli', 'Dip', NULL, 'Calisthenics', 'Spalle e braccia: deltoide, tricipiti, bicipiti, core', 'Anelli', 'sostegno_anelli', 'ecc', 'tempo', 'ring support, support hold agli anelli, tenuta agli anelli', 'Braccia tese e anelli vicini ai fianchi
Ruota leggermente i palmi in avanti quando sei stabile
Spalle basse, corpo dritto
Se gli anelli tremano, accorcia la tenuta e ripeti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip agli anelli', 'Dip', NULL, 'Calisthenics', 'Petto e tricipiti: gran pettorale, tricipiti, deltoide anteriore', 'Anelli', 'dip_anelli', 'ecc', 'setrep', 'ring dip, dip anelli, dips agli anelli', 'Parti dal sostegno a braccia tese, anelli vicini al corpo
Scendi finché la spalla arriva poco sotto il gomito
Gomiti stretti, gli anelli non si allargano
Spingi fino a braccia tese senza slanci
Prima servono 20 secondi puliti di sostegno');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione agli anelli', 'Trazione', NULL, 'Calisthenics', 'Schiena: gran dorsale, romboidi, bicipiti, brachiale', 'Anelli', 'trazione_anelli', 'conc', 'setrep', 'ring pull-up, trazioni agli anelli, trazione anelli', 'Parti appeso con le braccia tese e le spalle attive
Lascia ruotare i palmi verso di te mentre sali
Tira i gomiti verso i fianchi
Petto verso gli anelli, scendi controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore agli anelli', 'Trazione orizzontale', NULL, 'Calisthenics', 'Schiena: romboidi, trapezio medio, gran dorsale, bicipiti', 'Anelli', 'rematore_anelli', 'conc', 'setrep', 'ring row, rematore anelli, australian agli anelli', 'Corpo dritto dai talloni alle spalle
Più i piedi sono avanti, più è difficile
Porta gli anelli ai lati del petto
Stringi le scapole in alto, scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('L-sit alle paralleline', 'Core', NULL, 'Calisthenics', 'Core: retto dell’addome, flessori dell’anca, quadricipiti, tricipiti', 'Paralleline', 'lsit_paralleline', 'ecc', 'tempo', 'l-sit, l sit, l-sit parallettes, squadra', 'Braccia tese e spalle spinte verso il basso
Gambe tese e unite, punte dei piedi in fuori
Se non tieni le gambe tese, piega le ginocchia
Tieni poco ma pulito, poi riposa');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento al muro', 'Piegamento', NULL, 'Calisthenics', 'Petto e braccia: gran pettorale, tricipiti, deltoide anteriore', 'Muro', 'piegamento_muro', 'ecc', 'setrep', 'wall push-up, piegamenti al muro, flessioni al muro', 'Mani sul muro all’altezza delle spalle
Corpo dritto dalla testa ai talloni
Petto verso il muro, gomiti a 45°
Più i piedi sono lontani, più è difficile');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('GHD sit-up', 'Core', NULL, 'CrossFit', 'Core: retto dell’addome, flessori dell’anca, quadricipiti', 'GHD', 'ghd_situp', 'ecc', 'setrep', 'ghd situp, sit-up al ghd, glute ham developer sit-up', 'Bacino appena fuori dal cuscino
Scendi fino al parallelo all’inizio, poi più giù
Risali calciando le ginocchia e portando le mani verso i piedi
Poche ripetizioni la prima volta: il giorno dopo l’addome si fa sentire');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Reverse hyper', 'Lombari', NULL, 'Powerlifting', 'Catena posteriore: glutei, femorali, erettori della colonna', 'Reverse hyper', 'reverse_hyper', 'conc', 'setrep', 'reverse hyperextension, reverse hyper, iperestensioni inverse', 'Busto sul cuscino, anche sul bordo, mani salde
Sali con le gambe tese fino alla linea del busto
Stringi i glutei in alto, non inarcare la schiena
Scendi controllato e lascia oscillare poco il pendolo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Camminata sul tapis roulant', 'Cardio', NULL, 'Cardio', 'Gambe e cuore: quadricipiti, glutei, polpacci', 'Tapis roulant', 'tapis_camminata', 'conc', 'cardio', 'camminata, treadmill walk, tapis camminata, camminata in salita', 'Passo naturale, braccia che oscillano
Non tenerti ai corrimano
Con la pendenza accorcia il passo
Parla senza fiatone: è l’intensità giusta');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Corsa sul tapis roulant', 'Cardio', NULL, 'Cardio', 'Gambe e cuore: quadricipiti, femorali, glutei, polpacci', 'Tapis roulant', 'tapis_corsa', 'conc', 'cardio', 'corsa, treadmill, tapis, running, tapis roulant', 'Appoggio sotto il bacino, non davanti
Busto alto, spalle sciolte
Passi corti e veloci
Aumenta la velocità poco per volta');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Corsa sul tapis curvo', 'Cardio', NULL, 'Cardio', 'Gambe e cuore: glutei, femorali, quadricipiti, polpacci', 'Tapis curvo', 'tapis_curvo', 'conc', 'cardio', 'curve, assault runner, tapis curvo, skillmill, tapis senza motore', 'La velocità la decidi tu: più avanti corri, più va veloce
Appoggio sull’avampiede
Busto leggermente in avanti
Per rallentare torna verso il centro');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Cyclette', 'Cardio', NULL, 'Cardio', 'Gambe e cuore: quadricipiti, glutei, polpacci', 'Cyclette', 'cyclette', 'conc', 'cardio', 'bike, bici da camera, cyclette, stationary bike', 'Sella all’altezza dell’anca da in piedi
Ginocchio quasi teso in basso
Pedala rotondo, senza dondolare il bacino
Resistenza che ti fa lavorare, non che ti blocca');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Spinning', 'Cardio', NULL, 'Cardio', 'Gambe e cuore: quadricipiti, glutei, femorali, polpacci', 'Bici da spinning', 'spinning', 'conc', 'cardio', 'spin bike, indoor cycling, bici da spinning', 'Regola sella e manubrio prima di partire
Schiena lunga, gomiti morbidi
In piedi solo con resistenza sufficiente
Freno di emergenza: premi la leva rossa');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Ellittica', 'Cardio', NULL, 'Cardio', 'Corpo intero: quadricipiti, glutei, petto, schiena', 'Ellittica', 'ellittica', 'conc', 'cardio', 'elliptical, ellittica, cross trainer', 'Piedi piatti sulle pedane
Spingi e tira con le braccia
Busto dritto, non appoggiarti
Movimento fluido, senza scatti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stair climber', 'Cardio', NULL, 'Cardio', 'Gambe e cuore: glutei, quadricipiti, polpacci', 'Stair climber', 'stair_climber', 'conc', 'cardio', 'stairmaster, scala, stair climber, scale', 'Tutto il piede sul gradino
Mani appena appoggiate, non sostenerti
Busto alto, leggermente in avanti
Velocità che riesci a tenere senza aggrapparti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Air bike', 'Cardio', NULL, 'Cardio', 'Corpo intero: gambe, spalle, braccia, cuore', 'Air bike', 'air_bike', 'conc', 'cardio', 'assault bike, echo bike, air bike, airdyne', 'Spingi e tira con le braccia mentre pedali
Più forte vai, più aumenta la resistenza
Negli sprint parti forte già dai primi colpi
Sella all’altezza dell’anca');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('BikeErg', 'Cardio', NULL, 'Cardio', 'Gambe e cuore: quadricipiti, glutei, polpacci', 'BikeErg', 'bikeerg', 'conc', 'cardio', 'bike erg, concept2 bike, bikeerg', 'Regola la leva della ventola: più alta, più pesante
Pedala rotondo con il busto fermo
Guarda watt o calorie sul monitor
Ginocchio quasi teso in basso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Vogatore', 'Cardio', NULL, 'Cardio', 'Corpo intero: gambe, glutei, gran dorsale, braccia, core', 'Vogatore', 'vogatore', 'conc', 'cardio', 'rower, row, rowing, vogatore, concept2, remoergometro', 'Ordine in andata: gambe, busto, braccia
Ordine al ritorno: braccia, busto, gambe
Maniglia sotto lo sterno, gomiti verso dietro
La forza viene dalle gambe, non dalle braccia');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('SkiErg', 'Cardio', NULL, 'Cardio', 'Corpo intero: gran dorsale, tricipiti, core, gambe', 'SkiErg', 'skierg', 'conc', 'cardio', 'ski erg, ski, skierg, concept2 ski', 'Mani in alto, braccia quasi tese
Tira giù con le braccia e piega anche e ginocchia
Le maniglie passano vicino alle cosce
Risali lungo, senza fretta');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Salto con la corda', 'Corde', NULL, 'CrossFit', 'Gambe e cuore: polpacci, quadricipiti, spalle', 'Corda per saltare', 'salto_corda', 'conc', 'cardio', 'single under, salto corda, corda, single unders, jump rope', 'Gomiti vicini ai fianchi, gira con i polsi
Salti bassi sulle punte
Corda della misura giusta: maniglie alle ascelle
Guarda avanti, non i piedi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Double under', 'Corde', NULL, 'CrossFit', 'Gambe e cuore: polpacci, quadricipiti, avambracci', 'Corda per saltare', 'double_under', 'conc', 'cardio', 'double unders, du, doppi salti, doppio giro', 'Salto un po’ più alto del single, corpo dritto
Polsi veloci, gomiti fermi
Prova un double ogni tre single
Corda leggera e della misura giusta');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Arrampicata alla corda', 'Corde', NULL, 'CrossFit', 'Schiena e braccia: gran dorsale, bicipiti, avambracci, core', 'Corda da arrampicata', 'corda_salita', 'conc', 'setrep', 'rope climb, salita alla corda, arrampicata corda', 'Blocca la corda tra i piedi: sotto una scarpa, sopra l’altra
Spingi con le gambe, le braccia tengono
Mani una sopra l’altra, senza saltare
Scendi mano dopo mano, non scivolare');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Battle rope', 'Corde', NULL, 'CrossFit', 'Spalle e braccia: deltoidi, avambracci, core, cuore', 'Battle rope', 'battle_rope', 'conc', 'tempo', 'battle ropes, corde navali, battling rope, onde', 'Mezzo squat, piedi alla larghezza delle spalle
Onde veloci e alternate dalle spalle
Core contratto, schiena dritta
Tieni il ritmo fino alla fine del tempo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Slam ball', 'Lanci', NULL, 'CrossFit', 'Corpo intero: gran dorsale, addome, spalle, gambe', 'Slam ball', 'slam_ball', 'conc', 'setrep', 'ball slam, slam, slamball, lancio a terra', 'Porta la palla sopra la testa a braccia tese
Lanciala a terra con tutto il corpo, non solo le braccia
Piega le gambe quando la raccogli
Schiena dritta nella raccolta');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('D-ball sopra la spalla', 'Lanci', NULL, 'CrossFit', 'Catena posteriore: glutei, femorali, schiena, braccia', 'D-ball', 'dball_spalla', 'conc', 'setrep', 'd-ball over shoulder, dball, palla sopra la spalla, atlas ball', 'Abbraccia la palla tra le gambe
Portala in grembo, poi estendi le anche
Lanciala sopra una spalla, alterna i lati
Schiena dritta quando la riprendi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sandbag clean', 'Lanci', NULL, 'CrossFit', 'Corpo intero: glutei, femorali, schiena, bicipiti', 'Sandbag', 'sandbag_clean', 'conc', 'setrep', 'sandbag, sacco, clean con sandbag, sacco sulle spalle', 'Sacco tra i piedi, schiena dritta
Strappalo con le anche e portalo al petto
Ricevilo in mezzo squat con i gomiti sotto
Rimettilo giù piegando le gambe');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Spinta della slitta', 'Trasporti', NULL, 'CrossFit', 'Gambe: quadricipiti, glutei, polpacci', 'Slitta', 'slitta_spinta', 'conc', 'cardio', 'sled push, prowler, spinta slitta, slitta', 'Braccia tese o piegate sulle maniglie
Busto inclinato, schiena dritta
Passi corti spingendo con l’avampiede
Non alzare il bacino');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Traino della slitta', 'Trasporti', NULL, 'CrossFit', 'Gambe e schiena: quadricipiti, glutei, dorsali', 'Slitta con corda o imbracatura', 'slitta_traino', 'conc', 'cardio', 'sled pull, sled drag, traino slitta, slitta all’indietro', 'Cammina all’indietro con le ginocchia piegate
Braccia tese verso la slitta
Passi corti e continui
Busto dritto, peso sui talloni');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Farmer carry', 'Trasporti', NULL, 'CrossFit', 'Presa e core: avambracci, trapezio, core, gambe', 'Manubri o kettlebell', 'farmer_carry', 'conc', 'cardio', 'farmer walk, farmers carry, camminata del contadino', 'Pesi ai fianchi, spalle basse
Busto alto, non ondeggiare
Passi corti e veloci
Posa i pesi piegando le gambe');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Power clean', 'Girata', NULL, 'Pesistica olimpica', 'Corpo intero: glutei, femorali, quadricipiti, trapezio', 'Bilanciere', 'power_clean', 'conc', 'setrep', 'power clean, girata, girata al petto, clean', 'Parti come uno stacco: bilanciere sulla metà del piede
Bilanciere vicino al corpo per tutta la salita
Estendi le anche con forza, poi tira sotto
Ricevi in mezzo squat con i gomiti alti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Hang power clean', 'Girata', NULL, 'Pesistica olimpica', 'Corpo intero: glutei, femorali, trapezio, spalle', 'Bilanciere', 'hang_power_clean', 'conc', 'setrep', 'hang power clean, hang clean, girata dall’hang', 'Parti in piedi e scendi con il bilanciere sopra le ginocchia
Anche indietro, schiena dritta
Estendi le anche di colpo
Ricevi alto con i gomiti avanti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Squat clean', 'Girata', NULL, 'Pesistica olimpica', 'Corpo intero: quadricipiti, glutei, femorali, trapezio', 'Bilanciere', 'squat_clean', 'conc', 'setrep', 'squat clean, full clean, girata in squat', 'Stessa salita del power clean
Dopo l’estensione vai giù in squat completo
Gomiti alti, busto dritto in basso
Risali come un front squat');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Power snatch', 'Strappo', NULL, 'Pesistica olimpica', 'Corpo intero: glutei, femorali, trapezio, spalle', 'Bilanciere', 'power_snatch', 'conc', 'setrep', 'power snatch, strappo, snatch', 'Presa larga: bilanciere sulle anche da in piedi
Bilanciere vicino al corpo
Estendi le anche e tira sotto il bilanciere
Ricevi a braccia tese sopra la testa, in mezzo squat');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Clean and jerk', 'Slancio', NULL, 'Pesistica olimpica', 'Corpo intero: gambe, glutei, spalle, tricipiti', 'Bilanciere', 'clean_jerk', 'conc', 'setrep', 'clean and jerk, slancio, c&j, girata e slancio', 'Prima la girata, poi alzati in piedi
Piccolo piegamento con il busto dritto
Spingi con le gambe e vai sotto il bilanciere in affondo
Rientra con il piede avanti, poi con quello dietro');
