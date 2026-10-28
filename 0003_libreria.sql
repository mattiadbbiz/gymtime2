-- GymTime · libreria esercizi di base (creato_da NULL = visibile a tutti i coach)
-- Accorgimenti uno per riga. INSERT OR IGNORE: non tocca esercizi con lo stesso nome già presenti.

INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione presa prona', 'Trazione', 'presa prona', 'cal', 'Schiena: gran dorsale, romboidi, trapezio basso, bicipiti', 'Sbarra', 'pull', 'conc', 'setrep', 'pull-up, pull up, trazioni, trazioni prone', 'Mani poco più larghe delle spalle, pollice attorno alla sbarra
Parti appeso a braccia tese ma con le spalle attive, non abbandonato sulle articolazioni
Prima abbassa le scapole, poi piega le braccia
Porta i gomiti verso i fianchi e il petto verso la sbarra
Mento sopra la sbarra senza allungare il collo
Gambe unite e pancia contratta, nessuno slancio
Scendi in 2-3 secondi fino a braccia tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Chin-up presa supina', 'Trazione', 'presa supina', 'cal', 'Schiena: gran dorsale, bicipiti, romboidi', 'Sbarra', 'pull', 'conc', 'setrep', 'chin-up, chin up, trazioni supine', 'Palmi verso di te, mani alla larghezza delle spalle
Petto in fuori e spalle lontane dalle orecchie
Tira i gomiti in basso vicino ai fianchi
Mento sopra la sbarra senza spingere la testa in avanti
Niente slanci con le gambe
Scendi lento fino a braccia tese, senza lasciarti cadere sui gomiti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione presa neutra', 'Trazione', 'presa neutra', 'cal', 'Schiena: gran dorsale, brachiale, bicipiti', 'Sbarra con maniglie parallele', 'pull', 'conc', 'setrep', 'trazioni neutre, neutral grip', 'Palmi uno di fronte all’altro
Scapole giù prima di piegare le braccia
Gomiti stretti lungo il corpo
Sali finché il mento supera le maniglie
È la presa più comoda per i polsi e i gomiti: usala se le altre danno fastidio');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sternal pull-up', 'Trazione', 'allo sterno', 'cal', 'Schiena: gran dorsale, romboidi, trapezio medio', 'Sbarra', 'pull', 'conc', 'setrep', 'sternum pull-up, gironda, trazione allo sterno', 'Petto in fuori e busto inclinato indietro fin dall’inizio
Tieni l’inclinazione per tutta la salita
Porta la parte bassa del petto alla sbarra
Stringi forte le scapole in alto
Scendi lento senza perdere la posizione');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione australiana', 'Trazione', 'australiana', 'cal', 'Schiena: romboidi, trapezio medio, gran dorsale, bicipiti', 'Sbarra bassa o anelli', 'row', 'conc', 'setrep', 'inverted row, rematore inverso, australian pull-up', 'Corpo dritto dai talloni alle spalle
Glutei e pancia contratti, il bacino non cade
Tira il petto verso la sbarra, gomiti a circa 45 gradi dal corpo
Stringi le scapole in alto per un secondo
Più i piedi sono avanti, più è difficile: ginocchia piegate per renderla più facile');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione negativa', 'Trazione', 'negativa', 'cal', 'Schiena: gran dorsale, bicipiti', 'Sbarra', 'pull', 'ecc', 'setrep', 'negative, trazioni negative, eccentriche', 'Parti dalla posizione alta con un salto o un rialzo
Mento sopra la sbarra, scapole basse
Scendi in 3-5 secondi, alla stessa velocità dall’inizio alla fine
Spalle sempre attive, non lasciarti cadere nell’ultimo tratto
Torna su con il rialzo, non con un salto a braccia tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione con elastico', 'Trazione', 'assistita', 'cal', 'Schiena: gran dorsale, romboidi, bicipiti', 'Sbarra, elastico', 'pull', 'conc', 'setrep', 'trazioni assistite, trazione assistita', 'Elastico ben agganciato, piede o ginocchio dentro
Usa l’elastico più leggero che ti permette di fare tutte le ripetizioni
Stessa tecnica della trazione: scapole giù, poi braccia
Controlla la discesa, non farti tirare su dall’elastico');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione con fermo', 'Trazione', 'con fermo', 'cal', 'Schiena: gran dorsale, bicipiti, romboidi', 'Sbarra', 'pull', 'conc', 'setrep', 'trazione con blocco, pause pull-up, isometria trazione', 'Il coach indica dove fermarti: in alto, con il gomito a 90 gradi o a 120 gradi
Durante il fermo scapole basse e corpo immobile
Conta il tempo del fermo e continua a respirare
Dopo il fermo completa il movimento senza slanci');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione con blocco scapolare', 'Trazione', 'blocco scapolare', 'cal', 'Schiena: trapezio basso, gran dorsale, romboidi', 'Sbarra', 'pull', 'conc', 'tempo', 'scapular hold, blocco scapolare, active hang', 'Appeso a braccia tese
Abbassa e avvicina le scapole: il corpo sale di pochi centimetri
Tieni la posizione per il tempo indicato senza piegare i gomiti
Collo lungo, spalle lontane dalle orecchie');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Scapular pull-up', 'Trazione', 'scapolare', 'cal', 'Schiena: trapezio basso, gran dorsale, romboidi', 'Sbarra', 'pull', 'conc', 'setrep', 'scapular pull, trazioni scapolari', 'Braccia sempre tese
Abbassa e avvicina le scapole, il corpo sale di poco
Fermati un attimo in alto
Torna giù piano senza perdere la presa');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dead hang', 'Trazione', 'sospensione', 'cal', 'Avambracci e spalle: flessori delle dita, gran dorsale', 'Sbarra', 'pull', 'conc', 'tempo', 'sospensione, appeso', 'Presa salda con tutta la mano, pollice attorno alla sbarra
Spalle leggermente attive, non del tutto abbandonate
Gambe ferme, non dondolare
Respira tranquillo per tutto il tempo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione zavorrata', 'Trazione', 'zavorrata', 'str', 'Schiena: gran dorsale, romboidi, bicipiti', 'Sbarra, cintura zavorra', 'pull', 'conc', 'setrep', 'weighted pull-up, trazioni zavorrate, pull zavorrato', 'Zavorra ben fissata e ferma prima di partire
Parti da braccia completamente tese
Mento sopra la sbarra a ogni ripetizione
Niente slanci né ginocchia che salgono
Scendi controllato fino a braccia tese
Aumenta la zavorra solo se tutte le ripetizioni restano pulite');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Chin-up zavorrato', 'Trazione', 'zavorrata supina', 'str', 'Schiena: gran dorsale, bicipiti', 'Sbarra, cintura zavorra', 'pull', 'conc', 'setrep', 'weighted chin-up, chin zavorrato', 'Presa supina alla larghezza delle spalle
Zavorra ferma, non farla oscillare
Mento sopra la sbarra
Braccia completamente tese in basso, senza rimbalzo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Trazione esplosiva', 'Muscle up', 'trazione esplosiva', 'cal', 'Schiena: gran dorsale, bicipiti, trapezio', 'Sbarra', 'pull', 'conc', 'setrep', 'high pull-up, trazione alta, explosive pull-up', 'Parti da braccia tese con le spalle attive
Tira il più forte e veloce possibile verso la sbarra
Obiettivo: sbarra all’altezza dello sterno o più in basso
Gomiti indietro e vicini al corpo
Scendi controllato e riparti da fermo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Transizione muscle up', 'Muscle up', 'transizione', 'cal', 'Schiena e petto: gran dorsale, pettorali, tricipiti', 'Sbarra bassa o elastico', 'pull', 'conc', 'setrep', 'transition, transizione', 'Allenala prima alla sbarra bassa con i piedi a terra
Polsi sopra la sbarra il prima possibile
Porta il petto sopra la sbarra ruotando velocemente i gomiti in avanti
Spalle sopra le mani prima di spingere
Lenta e controllata finché non è sicura');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip alla sbarra dritta', 'Muscle up', 'dip alla sbarra', 'cal', 'Petto e braccia: tricipiti, pettorali, deltoide anteriore', 'Sbarra', 'dip', 'ecc', 'setrep', 'straight bar dip, dip alla sbarra', 'Parti in appoggio sopra la sbarra, braccia tese
Busto inclinato in avanti, gambe leggermente davanti
Scendi finché la sbarra arriva alla parte bassa del petto
Gomiti indietro, non aperti di lato
Spingi fino a braccia completamente tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Muscle up alla sbarra', 'Muscle up', 'completo', 'cal', 'Schiena, petto e braccia: gran dorsale, pettorali, tricipiti, core', 'Sbarra', 'pull', 'conc', 'setrep', 'muscle-up, muscle up', 'Provalo solo quando trazione esplosiva e dip alla sbarra sono solidi
Parti da fermo, senza grandi slanci se il coach non li prevede
Tira esplosivo verso la parte bassa del petto
Passa sopra con i gomiti veloci e le spalle in avanti
Chiudi con un dip a braccia tese
Scendi controllato, non lasciarti cadere');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip alle parallele', 'Dip', 'parallele', 'cal', 'Petto e braccia: pettorale inferiore, tricipiti, deltoide anteriore', 'Parallele', 'dip', 'ecc', 'setrep', 'dip, dips, dip parallele', 'Parti a braccia tese con le spalle basse
Leggera inclinazione in avanti: più inclini, più lavora il petto
Gomiti che vanno indietro, non aperti di lato
Scendi finché le spalle arrivano circa all’altezza dei gomiti, senza fastidio davanti alla spalla
Spingi fino a braccia completamente tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip semplificato', 'Dip', 'semplificato', 'cal', 'Petto e braccia: tricipiti, pettorale inferiore', 'Parallele basse o elastico', 'dip', 'ecc', 'setrep', 'dip assistiti, dip con elastico, dip piedi a terra', 'Piedi a terra davanti o ginocchia nell’elastico per togliere peso
Usa l’aiuto delle gambe solo quanto serve
Stessa tecnica del dip: spalle basse, gomiti indietro
Scendi solo fin dove le spalle non danno fastidio');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip alla panca', 'Dip', 'alla panca', 'cal', 'Braccia: tricipiti, deltoide anteriore', 'Panca', 'dip', 'ecc', 'setrep', 'bench dip, dip su panca', 'Mani sul bordo della panca, dita in avanti
Schiena vicina alla panca
Scendi fino a gomiti circa a 90 gradi, non oltre
Gomiti che puntano indietro
Gambe piegate per renderlo più facile, tese per renderlo più difficile');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dip zavorrato', 'Dip', 'zavorrato', 'str', 'Petto e braccia: pettorale inferiore, tricipiti', 'Parallele, cintura zavorra', 'dip', 'ecc', 'setrep', 'weighted dip, dip zavorrati', 'Zavorra ferma, non farla oscillare
Scendi con controllo fino alla profondità indicata dal coach
Spalle basse e stabili in fondo
Chiudi a braccia completamente tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento', 'Piegamento', 'classico', 'cal', 'Petto: grande pettorale, tricipiti, deltoide anteriore', 'Corpo libero', 'push', 'ecc', 'setrep', 'push-up, push up, piegamenti, flessioni', 'Mani sotto le spalle o poco più larghe, dita in avanti
Corpo dritto dai talloni alla testa, pancia e glutei contratti
Gomiti a circa 45 gradi dal corpo, non aperti a T
Petto vicino a terra, poi spingi via il pavimento
Testa in linea con la schiena, sguardo poco avanti alle mani');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento sulle ginocchia', 'Piegamento', 'sulle ginocchia', 'cal', 'Petto: grande pettorale, tricipiti', 'Corpo libero', 'push', 'ecc', 'setrep', 'piegamenti facilitati, knee push-up', 'Ginocchia a terra e corpo dritto dalle ginocchia alla testa
Non piegarti ai fianchi
Gomiti a circa 45 gradi
Petto vicino a terra a ogni ripetizione');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento diamond', 'Piegamento', 'diamond', 'cal', 'Braccia: tricipiti, pettorale, deltoide anteriore', 'Corpo libero', 'push', 'ecc', 'setrep', 'diamond push-up, piegamenti diamante', 'Mani unite sotto il petto, pollici e indici formano un diamante
Gomiti vicini al corpo
Corpo dritto come una tavola
Scendi fino a sfiorare le mani con il petto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento largo', 'Piegamento', 'largo', 'cal', 'Petto: grande pettorale, deltoide anteriore', 'Corpo libero', 'push', 'ecc', 'setrep', 'wide push-up, piegamenti larghi', 'Mani più larghe delle spalle
Non far cadere il bacino
Scendi lento e senti l’allungamento del petto
Spingi tenendo le spalle lontane dalle orecchie');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento su rialzo', 'Piegamento', 'su rialzo', 'cal', 'Petto: grande pettorale, tricipiti', 'Panca o rialzo', 'push', 'ecc', 'setrep', 'incline push-up, piegamenti inclinati', 'Mani su panca o rialzo stabile
Corpo dritto dai talloni alla testa
Petto fino al bordo del rialzo
Più basso è il rialzo, più è difficile');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento declinato', 'Piegamento', 'declinato', 'cal', 'Petto: pettorale alto, deltoide anteriore, tricipiti', 'Panca o rialzo', 'push', 'ecc', 'setrep', 'decline push-up, piegamenti piedi rialzati', 'Piedi sul rialzo, mani a terra
Pancia contratta, la schiena non si inarca
Gomiti a circa 45 gradi
Lavora di più la parte alta del petto e le spalle');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento zavorrato', 'Piegamento', 'zavorrato', 'str', 'Petto: grande pettorale, tricipiti', 'Disco o giubbotto zavorrato', 'push', 'ecc', 'setrep', 'weighted push-up, piegamenti zavorrati', 'Peso ben fermo sulla schiena, tra le scapole
Stessa tecnica del piegamento
Corpo rigido, il bacino non cede sotto il peso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pike push-up', 'Pike', 'base', 'cal', 'Spalle: deltoide anteriore, tricipiti, trapezio', 'Corpo libero', 'push', 'ecc', 'setrep', 'pike, piegamento verticale, piegamento a v', 'Bacino alto, corpo a V rovesciata
La testa scende davanti alle mani formando un triangolo
Gomiti sopra i polsi, non aperti di lato
Spingi fino a braccia tese tenendo i fianchi alti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pike push-up su parallele', 'Pike', 'mani su parallele', 'cal', 'Spalle: deltoide anteriore, tricipiti', 'Piccole parallele', 'push', 'ecc', 'setrep', 'pike parallele, pike su parallettes', 'Mani sulle parallele, bacino alto
Le parallele permettono di scendere più in basso: la testa va oltre il livello delle mani
Scendi solo fin dove controlli
Gomiti stretti e sopra i polsi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pike push-up piedi rialzati', 'Pike', 'piedi rialzati', 'cal', 'Spalle: deltoide anteriore, tricipiti, trapezio', 'Panca o rialzo', 'push', 'ecc', 'setrep', 'elevated pike push-up, pike rialzato', 'Piedi sul rialzo e fianchi sopra le mani
Busto il più verticale possibile
Testa che scende in avanti, collo lungo
Pancia contratta, niente schiena inarcata');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pike push-up piedi su box e mani su parallele', 'Pike', 'box e parallele', 'cal', 'Spalle: deltoide anteriore, tricipiti, trapezio', 'Box, piccole parallele', 'push', 'ecc', 'setrep', 'pike box parallele', 'È l’ultimo passo prima della verticale: fallo solo se il pike con piedi rialzati è pulito
Fianchi sopra le mani, busto quasi verticale
Scendi lento oltre il livello delle mani
Spingi fino a braccia tese senza perdere la posizione dei fianchi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Verticale al muro', 'Verticale', 'tenuta al muro', 'cal', 'Spalle: deltoidi, tricipiti, trapezio, core', 'Muro', 'press', 'conc', 'tempo', 'handstand, verticale, tenuta in verticale', 'Mani alla larghezza delle spalle, dita aperte
Braccia tese, spingi il pavimento lontano
Pancia e glutei contratti, schiena non arcuata
Guarda il pavimento tra le mani
Per uscire scendi con una gamba alla volta');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento in verticale schiena al muro', 'Verticale', 'schiena al muro', 'cal', 'Spalle: deltoidi, tricipiti, trapezio', 'Muro', 'press', 'ecc', 'setrep', 'handstand push-up, hspu, verticale al muro', 'Mani a una spanna dal muro, alla larghezza delle spalle
Pancia e glutei contratti, non arcuare la schiena
Scendi lento formando un triangolo tra testa e mani
Appoggia la testa piano, mai di peso
Spingi via il pavimento fino a braccia tese
Le prime volte fallo con il coach vicino');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento in verticale con rialzo', 'Verticale', 'schiena al muro con rialzo', 'cal', 'Spalle: deltoidi, tricipiti, trapezio', 'Muro, rialzi o parallele', 'press', 'ecc', 'setrep', 'deficit handstand push-up, hspu deficit', 'Mani su rialzi o parallele: la testa scende più in basso delle mani
Fallo solo se quello senza rialzo è pulito
Discesa lenta e controllata
Gomiti stretti, non aperti di lato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Piegamento in verticale pancia al muro', 'Verticale', 'pancia al muro', 'cal', 'Spalle: deltoidi, tricipiti, core', 'Muro', 'press', 'ecc', 'setrep', 'wall facing hspu, verticale pancia al muro', 'Entra camminando con i piedi sul muro
Mani a 20-30 cm dal muro
Corpo dritto come una matita, pancia contratta
Scendi lento con la testa leggermente avanti alle mani
Spingi fino a braccia tese restando allineato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Squat a corpo libero', 'Squat', 'corpo libero', 'cal', 'Gambe: quadricipiti, grande gluteo, adduttori', 'Corpo libero', 'squat', 'ecc', 'setrep', 'air squat, squat corpo libero', 'Piedi alla larghezza delle spalle, punte leggermente in fuori
Talloni sempre a terra, peso su tutto il piede
Porta il bacino indietro e in basso
Ginocchia nella direzione delle punte, mai verso l’interno
Petto alto e schiena neutra
Scendi controllato almeno a cosce parallele, senza rimbalzare in fondo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Affondo', 'Affondo', 'alternato', 'cal', 'Gambe: quadricipiti, grande gluteo', 'Corpo libero', 'lunge', 'ecc', 'setrep', 'affondi, lunge, affondi alternati', 'Passo lungo, busto dritto
Scendi in verticale, non in avanti
Ginocchio davanti sopra il piede, in linea con le punte
Ginocchio dietro che sfiora terra senza sbattere
Spingi con il tallone davanti per tornare su');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Bulgarian split squat', 'Affondo', 'bulgaro', 'cal', 'Gambe: quadricipiti, grande gluteo', 'Panca', 'lunge', 'ecc', 'setrep', 'bulgaro, split squat bulgaro, bulgarian', 'Piede dietro appoggiato sulla panca con il collo del piede
Peso sulla gamba davanti
Scendi in verticale con il busto leggermente avanti
Il ginocchio davanti non cade verso l’interno
Distanza giusta: in basso la tibia davanti è circa verticale');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Step-up', 'Affondo', 'step-up', 'cal', 'Gambe: quadricipiti, grande gluteo', 'Panca o box', 'lunge', 'conc', 'setrep', 'step up, salita sul box', 'Tutto il piede sul rialzo
Sali spingendo con la gamba sopra, non saltando con quella a terra
Ginocchio in linea con le punte
Scendi lento e controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sedia al muro', 'Squat', 'isometrico', 'cal', 'Gambe: quadricipiti', 'Muro', 'squat', 'ecc', 'tempo', 'wall sit, sedia, squat al muro', 'Schiena appoggiata al muro
Cosce parallele a terra, ginocchia sopra le caviglie
Peso sui talloni
Respira normalmente e non appoggiare le mani sulle cosce');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Squat jump', 'Salto', 'squat jump', 'cal', 'Gambe: quadricipiti, glutei, polpacci', 'Corpo libero', 'jump', 'ecc', 'setrep', 'jump squat, squat con salto', 'Scendi a mezzo squat
Spingi esplosivo, braccia in alto
Atterra morbido sull’avampiede e piega subito le ginocchia
Ginocchia in linea con le punte anche in atterraggio
Qualità prima della quantità: fermati se l’atterraggio diventa rumoroso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Box jump', 'Salto', 'box jump', 'fn', 'Gambe: quadricipiti, glutei, polpacci', 'Box', 'jump', 'ecc', 'setrep', 'salto sul box', 'Box di altezza adatta, stabile e lontano dai muri
Carica con mezzo squat e braccia indietro
Salta e atterra con tutto il piede al centro del box
Atterra morbido, ginocchia in fuori
Scendi dal box camminando, non saltando all’indietro');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Ponte glutei', 'Ponte', 'a terra', 'cal', 'Glutei: grande gluteo, ischiocrurali', 'Corpo libero', 'core', 'conc', 'setrep', 'glute bridge, ponte', 'Piedi vicini ai glutei, alla larghezza dei fianchi
Spingi dai talloni e alza il bacino
Stringi i glutei in alto per un secondo
Non inarcare la schiena: in alto spalle, fianchi e ginocchia in linea');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Nordic curl', 'Nordic', 'base', 'cal', 'Gambe: ischiocrurali', 'Appoggio per i piedi', 'free', 'ecc', 'setrep', 'nordic, nordic hamstring', 'Piedi bloccati sotto un appoggio sicuro o da un compagno
Corpo dritto dalle ginocchia alla testa, fianchi in avanti
Scendi più lento che puoi
Prendi la caduta con le mani e spingi per tornare su');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Calf raise', 'Polpacci', 'corpo libero', 'cal', 'Gambe: gastrocnemio, soleo', 'Corpo libero o gradino', 'free', 'conc', 'setrep', 'polpacci, sollevamenti sulle punte', 'Sali sulle punte più in alto che puoi
Fermati un secondo in alto
Scendi lento fino in fondo
Sul gradino il tallone scende sotto il livello del gradino');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Plank', 'Plank', 'frontale', 'cal', 'Core: retto addominale, trasverso, obliqui', 'Corpo libero', 'core', 'conc', 'tempo', 'plank frontale', 'Gomiti sotto le spalle
Pancia e glutei contratti
Non alzare e non far cadere il bacino
Respira normalmente
Meglio meno secondi fatti bene che tanti con la schiena che cede');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Plank laterale', 'Plank', 'laterale', 'cal', 'Core: obliqui, quadrato dei lombi, medio gluteo', 'Corpo libero', 'core', 'conc', 'tempo', 'side plank', 'Gomito sotto la spalla
Corpo dritto, bacino alto
Non ruotare il busto né in avanti né indietro
Ginocchia a terra per renderlo più facile');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Hollow body hold', 'Hollow', 'tenuta', 'cal', 'Core: retto addominale, trasverso', 'Corpo libero', 'core', 'conc', 'tempo', 'hollow, hollow hold', 'Schiena bassa schiacciata a terra
Braccia vicino alle orecchie, gambe tese e unite
Se la schiena si alza, piega le ginocchia o porta le braccia lungo i fianchi
Respira senza perdere la posizione');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg raise alla sbarra', 'Leg raise', 'alla sbarra', 'cal', 'Core: retto addominale, flessori dell’anca', 'Sbarra', 'core', 'conc', 'setrep', 'hanging leg raise, leg raise, sollevamento gambe', 'Appeso con le spalle attive
Alza le gambe tese senza dondolare
In alto porta il bacino in avanti arrotolandolo
Scendi lento e fermati prima di dondolare');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Knee raise alla sbarra', 'Leg raise', 'ginocchia alla sbarra', 'cal', 'Core: retto addominale, flessori dell’anca', 'Sbarra', 'core', 'conc', 'setrep', 'hanging knee raise, ginocchia al petto', 'Appeso con le spalle attive
Ginocchia verso il petto
Arrotola il bacino in alto
Scendi lento, nessuno slancio');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Crunch', 'Crunch', 'a terra', 'cal', 'Core: retto addominale', 'Corpo libero', 'core', 'conc', 'setrep', 'crunch a terra', 'Ginocchia piegate, piedi a terra
Mani alle tempie, senza tirare la testa
Solleva solo le spalle arrotolando il busto
Zona lombare sempre appoggiata
Espira mentre sali');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Crunch inverso', 'Crunch', 'inverso', 'cal', 'Core: retto addominale, obliqui', 'Corpo libero o panca', 'core', 'conc', 'setrep', 'reverse crunch', 'Sdraiato, ginocchia piegate a 90 gradi
Porta le ginocchia verso il petto staccando il bacino da terra
Movimento piccolo, senza slancio
Scendi lento fino a sfiorare terra con i piedi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sit-up', 'Crunch', 'sit-up', 'cal', 'Core: retto addominale, flessori dell’anca', 'Corpo libero', 'core', 'conc', 'setrep', 'sit up', 'Piedi fermi a terra
Sali arrotolando la schiena, una vertebra alla volta
Non tirare il collo con le mani
Scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Dead bug', 'Core', 'dead bug', 'cal', 'Core: trasverso, retto addominale', 'Corpo libero', 'core', 'conc', 'setrep', 'deadbug', 'Schiena bassa a terra per tutto il tempo
Allunga braccio e gamba opposti
Espira mentre allunghi
Movimento lento e controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Bird dog', 'Core', 'bird dog', 'cal', 'Core e schiena: erettori, glutei, trasverso', 'Corpo libero', 'core', 'conc', 'setrep', 'quadrupedia braccio gamba', 'A quattro zampe, mani sotto le spalle e ginocchia sotto i fianchi
Allunga braccio e gamba opposti fino a essere in linea
Bacino fermo, non ruotare
Fermati due secondi e torna lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Mountain climber', 'Core', 'mountain climber', 'cal', 'Core e spalle: retto addominale, flessori dell’anca, deltoidi', 'Corpo libero', 'push', 'conc', 'setrep', 'mountain climbers, scalatore', 'Mani sotto le spalle
Porta le ginocchia al petto alternandole
Bacino basso e fermo, non a V
Ritmo costante');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Burpee', 'Burpee', 'classico', 'cal', 'Tutto il corpo: gambe, petto, spalle', 'Corpo libero', 'jump', 'ecc', 'setrep', 'burpees', 'Mani a terra, salta indietro con i piedi
Petto a terra o piegamento completo
Salta con i piedi vicino alle mani
Salto finale con le braccia in alto
Atterra morbido');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Back squat', 'Squat', 'bilanciere dietro', 'pl', 'Gambe: quadricipiti, grande gluteo, adduttori, erettori', 'Bilanciere, rack', 'squat', 'ecc', 'setrep', 'squat bilanciere, squat con bilanciere, squat', 'Bilanciere sulla parte alta della schiena, mai sul collo
Fermi di sicurezza del rack all’altezza giusta
Grande respiro e pancia rigida prima di scendere
Ginocchia nella direzione delle punte
Scendi al parallelo solo se la schiena resta neutra
Spingi su il bilanciere tenendo il petto alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Front squat', 'Squat', 'bilanciere davanti', 'pl', 'Gambe: quadricipiti, grande gluteo, core', 'Bilanciere, rack', 'squat', 'ecc', 'setrep', 'squat frontale', 'Bilanciere appoggiato sulle spalle davanti, gomiti alti
Busto il più verticale possibile
Talloni a terra
Ginocchia in avanti e in fuori, in linea con le punte
Gomiti sempre alti in salita');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Box squat', 'Squat', 'al box', 'pl', 'Gambe: grande gluteo, ischiocrurali, quadricipiti', 'Bilanciere, box', 'squat', 'ecc', 'setrep', 'squat al box', 'Box all’altezza indicata dal coach
Scendi portando il bacino indietro fino a sederti
Non rilassarti sul box, resta rigido
Spingi su con i talloni');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Squat con fermo', 'Squat', 'con fermo', 'pl', 'Gambe: quadricipiti, grande gluteo', 'Bilanciere, rack', 'squat', 'ecc', 'setrep', 'paused squat, squat fermo', 'Fermo di 2 secondi in basso, o come indicato
Resta rigido durante il fermo
Riparti senza rimbalzare');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca piana bilanciere', 'Panca', 'bilanciere', 'pl', 'Petto: grande pettorale, tricipiti, deltoide anteriore', 'Bilanciere, panca', 'bench', 'ecc', 'setrep', 'bench press, panca piana, panca', 'Sempre con un compagno che ti assiste
Occhi sotto il bilanciere
Scapole strette e basse, petto alto
Piedi ben piantati a terra e glutei sulla panca
Abbassa il bilanciere a metà petto con i gomiti a circa 45 gradi
Spingi su e leggermente indietro verso il rack');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca presa stretta', 'Panca', 'presa stretta', 'pl', 'Braccia: tricipiti, pettorale', 'Bilanciere, panca', 'bench', 'ecc', 'setrep', 'close grip bench, panca stretta', 'Mani circa alla larghezza delle spalle, non più strette
Gomiti vicini al corpo
Bilanciere alla parte bassa del petto
Con un compagno che assiste');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco da terra', 'Stacco', 'classico', 'pl', 'Schiena e gambe: erettori, grande gluteo, ischiocrurali, quadricipiti', 'Bilanciere', 'hinge', 'conc', 'setrep', 'deadlift, stacco, stacco classico', 'Bilanciere sopra metà piede, tibie vicine
Prendi il bilanciere e tendi le braccia, dorsali attivi
Respira e blocca la pancia prima di tirare
Schiena neutra dall’inizio alla fine
Bilanciere sempre a contatto con le gambe
Spingi il pavimento e chiudi con i fianchi, senza inarcarti indietro');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco sumo', 'Stacco', 'sumo', 'pl', 'Gambe: adduttori, grande gluteo, quadricipiti, erettori', 'Bilanciere', 'hinge', 'conc', 'setrep', 'sumo deadlift, sumo', 'Piedi larghi, punte in fuori
Mani dentro le gambe
Ginocchia spinte in fuori sopra le punte
Busto più verticale dello stacco classico
Bilanciere vicino al corpo per tutto il movimento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco rumeno', 'Stacco', 'rumeno', 'pl', 'Gambe: ischiocrurali, grande gluteo, erettori', 'Bilanciere', 'hinge', 'ecc', 'setrep', 'rdl, romanian deadlift, stacco a gambe semitese', 'Ginocchia leggermente piegate e ferme
Porta il bacino indietro
Il bilanciere scivola sulle cosce
Schiena dritta, scendi solo finché senti tirare dietro le cosce
Risali spingendo i fianchi in avanti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Good morning', 'Stacco', 'good morning', 'pl', 'Gambe e schiena: ischiocrurali, erettori, grande gluteo', 'Bilanciere', 'hinge', 'ecc', 'setrep', 'esercizio del buongiorno, buongiorno', 'Solo con carichi leggeri e tecnica sicura
Bilanciere sulla parte alta della schiena, ginocchia morbide
Porta il bacino indietro con la schiena neutra
Scendi solo fin dove la schiena resta dritta
Risali spingendo i fianchi in avanti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Military press', 'Lento', 'in piedi bilanciere', 'pl', 'Spalle: deltoide anteriore e laterale, tricipiti, trapezio', 'Bilanciere', 'press', 'conc', 'setrep', 'overhead press, ohp, lento avanti bilanciere, military', 'In piedi, glutei e pancia contratti
Mani poco più larghe delle spalle
Il bilanciere parte dalle clavicole
Sposta la testa indietro, poi rientra sotto il bilanciere
Chiudi con le braccia tese sopra la testa, senza inarcare la schiena');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore con bilanciere', 'Rematore', 'bilanciere', 'pl', 'Schiena: gran dorsale, romboidi, trapezio, deltoide posteriore', 'Bilanciere', 'row', 'conc', 'setrep', 'barbell row, rematore bilanciere', 'Ginocchia morbide, busto inclinato con la schiena dritta
Bilanciere verso l’ombelico
Gomiti indietro vicini al corpo
Stringi le scapole in alto
Non dare colpi con la schiena per tirare su il peso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Hip thrust', 'Ponte', 'hip thrust', 'pl', 'Glutei: grande gluteo, ischiocrurali', 'Bilanciere, panca', 'core', 'conc', 'setrep', 'hip thrust bilanciere', 'Parte alta della schiena sulla panca
Bilanciere sui fianchi con un cuscinetto
Piedi piatti, tibie verticali in alto
Spingi con i talloni
Mento verso il petto, glutei stretti in alto, senza inarcare la schiena');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Overhead squat', 'Squat', 'bilanciere sopra la testa', 'fn', 'Gambe e spalle: quadricipiti, glutei, deltoidi, core', 'Bilanciere o bastone', 'squat', 'ecc', 'setrep', 'ohs, squat sopra la testa', 'Impara il movimento con un bastone prima del bilanciere
Presa larga, braccia tese e bilanciere sopra la nuca
Spingi il bilanciere verso l’alto e allarga le mani sulla sbarra
Scendi con il bacino indietro, petto alto e talloni a terra
Ginocchia in linea con le punte
Il bilanciere resta sopra metà piede per tutto il movimento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Push press', 'Lento', 'push press', 'fn', 'Spalle e gambe: deltoidi, tricipiti, quadricipiti', 'Bilanciere', 'press', 'conc', 'setrep', 'spinta con le gambe', 'Bilanciere sulle spalle davanti, mani poco più larghe delle spalle
Piccolo piegamento delle ginocchia con il busto dritto
Spingi esplosivo con le gambe e poi con le braccia
Chiudi a braccia tese con la testa che passa sotto il bilanciere
Riporta il bilanciere sulle spalle piegando un po’ le ginocchia');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Thruster', 'Squat', 'thruster', 'fn', 'Gambe e spalle: quadricipiti, glutei, deltoidi, tricipiti', 'Bilanciere o manubri', 'squat', 'ecc', 'setrep', 'squat e spinta', 'Front squat seguito da una spinta sopra la testa in un unico movimento
Gomiti alti nello squat
La spinta parte dalle gambe in salita
Chiudi a braccia tese sopra la testa
Riporta il peso sulle spalle prima di riscendere');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Wall ball', 'Squat', 'wall ball', 'fn', 'Gambe e spalle: quadricipiti, glutei, deltoidi', 'Palla medica, muro', 'squat', 'ecc', 'setrep', 'wall balls, palla al muro', 'Palla davanti al petto, gomiti sotto la palla
Squat completo con talloni a terra
Salendo lancia la palla al bersaglio sul muro
Ricevi la palla e scendi subito nello squat successivo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Swing russo', 'Swing', 'russo', 'kb', 'Glutei e ischiocrurali: grande gluteo, ischiocrurali, erettori', 'Kettlebell', 'hinge', 'conc', 'setrep', 'kettlebell swing, swing kettlebell, russian swing', 'È uno stacco veloce, non uno squat e non un’alzata con le braccia
Kettlebell indietro tra le gambe con la schiena dritta
Spingi i fianchi in avanti con forza e stringi i glutei
Le braccia accompagnano: il kettlebell arriva all’altezza del petto
In alto corpo dritto, non inclinarti indietro');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Swing americano', 'Swing', 'americano', 'kb', 'Glutei, spalle e schiena: grande gluteo, ischiocrurali, deltoidi', 'Kettlebell', 'hinge', 'conc', 'setrep', 'american swing', 'Fallo solo se lo swing russo è pulito e le spalle sono mobili
Stessa spinta di fianchi dello swing russo
Il kettlebell arriva sopra la testa con le braccia tese
Pancia contratta, non arcuare la schiena in alto
Se le spalle non arrivano bene, torna allo swing russo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco con kettlebell', 'Stacco', 'kettlebell', 'kb', 'Gambe: grande gluteo, ischiocrurali, quadricipiti', 'Kettlebell', 'hinge', 'conc', 'setrep', 'kettlebell deadlift, stacco kettlebell', 'Kettlebell tra i piedi, all’altezza delle caviglie
Porta il bacino indietro con la schiena dritta
Braccia tese, spalle attive
Spingi il pavimento e chiudi con i glutei');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Clean con kettlebell', 'Clean', 'kettlebell', 'kb', 'Gambe e schiena: glutei, ischiocrurali, trapezio', 'Kettlebell', 'hinge', 'conc', 'setrep', 'kettlebell clean, girata kettlebell', 'Parte come uno swing con una mano
Il kettlebell sale vicino al corpo, gomito vicino al fianco
Infila la mano e accogli il kettlebell sull’avambraccio senza farlo sbattere
Posizione finale: polso dritto, gomito vicino al busto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Press con kettlebell', 'Lento', 'kettlebell', 'kb', 'Spalle: deltoidi, tricipiti, core', 'Kettlebell', 'press', 'conc', 'setrep', 'kettlebell press, distensione kettlebell', 'Parti dalla posizione finale del clean
Polso dritto, gomito sotto il kettlebell
Spingi sopra la testa fino a braccio teso, bicipite vicino all’orecchio
Glutei e pancia contratti, il busto non si inclina');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Snatch con kettlebell', 'Snatch', 'kettlebell', 'kb', 'Tutto il corpo: glutei, ischiocrurali, deltoidi, trapezio', 'Kettlebell', 'hinge', 'conc', 'setrep', 'kettlebell snatch, strappo kettlebell', 'Fallo solo dopo aver imparato swing, clean e press
Parte come uno swing con una mano
Il kettlebell sale vicino al corpo e la mano si infila sotto in alto
Chiudi a braccio teso senza far sbattere il kettlebell sul polso
Scendi controllato tornando allo swing');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Turkish get-up', 'Get-up', 'turco', 'kb', 'Tutto il corpo: spalle, core, glutei', 'Kettlebell', 'free', 'conc', 'setrep', 'tgu, alzata turca', 'Impara la sequenza prima a corpo libero o con una scarpa in equilibrio sul pugno
Braccio con il peso sempre teso e verticale
Occhi sul kettlebell per tutto il movimento
Muoviti lento, una posizione alla volta
Scendi ripetendo i passaggi al contrario');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Goblet squat', 'Squat', 'goblet', 'kb', 'Gambe: quadricipiti, grande gluteo, adduttori', 'Manubrio o kettlebell', 'squat', 'ecc', 'setrep', 'goblet', 'Peso tenuto vicino al petto
Gomiti tra le ginocchia in basso
Busto dritto, talloni a terra
Ginocchia in linea con le punte
Ottimo per imparare lo squat prima del bilanciere');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca piana manubri', 'Panca', 'manubri', 'bb', 'Petto: grande pettorale, tricipiti, deltoide anteriore', 'Manubri, panca', 'bench', 'ecc', 'setrep', 'dumbbell press, panca manubri', 'Scapole strette e petto alto
Scendi con i manubri ai lati del petto
Gomiti a circa 45 gradi
Spingi su avvicinando i manubri senza farli sbattere
Per finire appoggia i manubri sulle cosce, non lasciarli cadere di lato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca inclinata bilanciere', 'Panca', 'inclinata bilanciere', 'bb', 'Petto: pettorale alto, deltoide anteriore, tricipiti', 'Bilanciere, panca', 'bench', 'ecc', 'setrep', 'incline bench, panca inclinata', 'Panca a 30-45 gradi: più inclini, più lavorano le spalle
Bilanciere alla parte alta del petto
Scapole strette sulla panca
Con un compagno che assiste');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca inclinata manubri', 'Panca', 'inclinata manubri', 'bb', 'Petto: pettorale alto, deltoide anteriore', 'Manubri, panca', 'bench', 'ecc', 'setrep', 'incline dumbbell press', 'Panca a 30-45 gradi
Scendi lento con i manubri vicino al petto
Spingi su e leggermente verso il centro');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Croci con manubri', 'Croci', 'manubri', 'bb', 'Petto: grande pettorale, deltoide anteriore', 'Manubri, panca', 'bench', 'ecc', 'setrep', 'dumbbell fly, croci', 'Gomiti leggermente piegati e fermi per tutto il movimento
Apri lento solo fino all’altezza della panca
Chiudi come ad abbracciare un albero
Usa pesi leggeri: con le braccia aperte la spalla è sotto sforzo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Croci ai cavi', 'Croci', 'cavi', 'bb', 'Petto: grande pettorale', 'Cavi', 'raise', 'conc', 'setrep', 'cable crossover, croci cavi', 'Un passo avanti, busto leggermente inclinato
Gomiti morbidi e fermi
Porta le mani una verso l’altra davanti al petto
Torna lento senza far tirare le spalle in avanti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Chest press', 'Panca', 'macchina', 'bb', 'Petto: grande pettorale, tricipiti', 'Macchina', 'bench', 'ecc', 'setrep', 'chest press macchina', 'Regola il sedile con le maniglie all’altezza del petto
Schiena appoggiata e scapole strette
Spingi senza bloccare i gomiti
Torna lento fino a sentire l’allungamento del petto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pec deck', 'Croci', 'macchina', 'bb', 'Petto: grande pettorale', 'Macchina', 'raise', 'conc', 'setrep', 'butterfly, peck deck, croci alla macchina', 'Schiena appoggiata
Gomiti all’altezza delle spalle
Chiudi lento e stringi il petto
Non aprire oltre la linea delle spalle');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Panca al multipower', 'Panca', 'multipower', 'bb', 'Petto: grande pettorale, tricipiti', 'Multipower, panca', 'bench', 'ecc', 'setrep', 'smith bench, panca smith', 'Posiziona la panca così il bilanciere scende a metà petto
Scapole strette
Regola i fermi di sicurezza prima di partire');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pullover con manubrio', 'Pullover', 'manubrio', 'bb', 'Petto e schiena: grande pettorale, gran dorsale, dentato anteriore', 'Manubrio, panca', 'bench', 'ecc', 'setrep', 'pullover', 'Manubrio tenuto con i palmi contro il disco, sopra il petto
Gomiti leggermente piegati e fermi
Porta il manubrio dietro la testa lentamente, inspirando
Scendi solo fin dove le spalle sono comode
Torna sopra il petto espirando, usando petto e dorsali');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Lat machine avanti', 'Lat machine', 'presa larga', 'bb', 'Schiena: gran dorsale, romboidi, bicipiti', 'Macchina', 'pull', 'conc', 'setrep', 'lat pulldown, lat machine, lat', 'Cosce bloccate sotto i rulli
Busto appena inclinato indietro, non sdraiato
Scapole giù prima di piegare le braccia
Barra verso la parte alta del petto, mai dietro la nuca
Risali lento fino a braccia tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Lat machine presa stretta', 'Lat machine', 'presa stretta', 'bb', 'Schiena: gran dorsale, bicipiti', 'Macchina', 'pull', 'conc', 'setrep', 'lat triangolo, close grip pulldown', 'Triangolo o presa neutra stretta
Gomiti vicini al corpo
Tira verso il petto senza dondolare
Risali lento lasciando allungare la schiena');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pulley basso', 'Rematore', 'cavi', 'bb', 'Schiena: gran dorsale, romboidi, trapezio medio', 'Cavi', 'row', 'conc', 'setrep', 'seated cable row, pulley, rematore ai cavi', 'Ginocchia leggermente piegate, schiena dritta e petto in fuori
Tira la maniglia verso l’ombelico
Stringi le scapole alla fine
Lascia allungare la schiena senza piegarti in avanti con la zona lombare');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore manubrio', 'Rematore', 'manubrio', 'bb', 'Schiena: gran dorsale, romboidi, deltoide posteriore', 'Manubrio, panca', 'row', 'conc', 'setrep', 'rematore un braccio, one arm row', 'Mano e ginocchio sulla panca, schiena piatta
Tira il manubrio verso il fianco
Gomito vicino al corpo
Non ruotare il busto per tirare su il peso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore T-bar', 'Rematore', 'T-bar', 'bb', 'Schiena: gran dorsale, romboidi, trapezio', 'T-bar', 'row', 'conc', 'setrep', 't-bar row', 'Busto inclinato e schiena dritta
Tira verso la parte bassa del petto
Gomiti vicini al corpo
Niente colpi con la schiena');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore su panca inclinata', 'Rematore', 'petto appoggiato', 'bb', 'Schiena: romboidi, trapezio medio, gran dorsale', 'Manubri, panca', 'row', 'conc', 'setrep', 'chest supported row', 'Petto appoggiato alla panca
Tira i gomiti indietro
Stringi le scapole in alto
Ottimo per chi deve proteggere la zona lombare');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rematore alla macchina', 'Rematore', 'macchina', 'bb', 'Schiena: gran dorsale, romboidi, trapezio medio', 'Macchina', 'row', 'conc', 'setrep', 'machine row, rematore macchina', 'Petto appoggiato al cuscino, regolato con le maniglie all’altezza del petto
Tira i gomiti indietro vicino al corpo
Stringi le scapole alla fine
Torna lento senza staccare il petto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pulldown a braccia tese', 'Pullover', 'cavi', 'bb', 'Schiena: gran dorsale, grande rotondo', 'Cavi', 'row', 'conc', 'setrep', 'straight arm pulldown, pullover ai cavi', 'Braccia quasi tese per tutto il movimento
Porta la barra verso le cosce con i dorsali
Busto leggermente inclinato e fermo
Risali lento fino all’altezza degli occhi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Hyperextension', 'Estensione lombare', 'panca', 'bb', 'Schiena: erettori, grande gluteo, ischiocrurali', 'Panca per iperestensioni', 'hinge', 'ecc', 'setrep', 'iperestensioni, back extension, estensione lombare', 'Bacino appoggiato al cuscino, che resta sotto le anche
Braccia incrociate sul petto
Scendi lento con la schiena dritta
Risali fino ad allinearti al corpo, senza inarcarti oltre');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Scrollate con manubri', 'Scrollate', 'manubri', 'bb', 'Schiena: trapezio superiore', 'Manubri', 'free', 'conc', 'setrep', 'shrug, scrollate', 'Braccia tese lungo i fianchi
Alza le spalle dritte verso le orecchie, senza ruotarle
Fermati un secondo in alto
Scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Tirate al mento', 'Tirate', 'al mento', 'bb', 'Spalle: deltoide laterale, trapezio', 'Bilanciere o manubri', 'row', 'conc', 'setrep', 'upright row, tirata al mento', 'Presa alla larghezza delle spalle o poco più, non stretta
Il peso sale vicino al corpo, guidato dai gomiti
Fermati quando i gomiti arrivano all’altezza delle spalle, non oltre
Pesi leggeri: se senti pizzicare la spalla, fermati e avvisa il coach');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Lento avanti manubri', 'Lento', 'manubri', 'bb', 'Spalle: deltoide anteriore e laterale, tricipiti', 'Manubri, panca', 'press', 'conc', 'setrep', 'shoulder press manubri, lento manubri', 'Seduto con lo schienale quasi verticale
Manubri all’altezza delle spalle, polsi dritti
Spingi su senza inarcare la schiena
Scendi lento fino all’altezza delle orecchie');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Shoulder press macchina', 'Lento', 'macchina', 'bb', 'Spalle: deltoide anteriore, tricipiti', 'Macchina', 'press', 'conc', 'setrep', 'shoulder press', 'Maniglie all’altezza delle spalle
Schiena appoggiata
Spingi senza bloccare i gomiti
Torna lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Arnold press', 'Lento', 'Arnold', 'bb', 'Spalle: deltoide anteriore e laterale, tricipiti', 'Manubri', 'press', 'conc', 'setrep', 'arnold', 'Parti con i palmi verso di te davanti al viso
Ruota i polsi mentre spingi su
Chiudi con i palmi in avanti
Movimento fluido e controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Military press al multipower', 'Lento', 'multipower', 'bb', 'Spalle: deltoide anteriore, tricipiti', 'Multipower', 'press', 'conc', 'setrep', 'smith shoulder press', 'Panca sotto il bilanciere, schienale quasi verticale
Bilanciere che scende davanti al viso, mai dietro la nuca
Regola i fermi di sicurezza');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Alzate laterali manubri', 'Alzate', 'laterali manubri', 'bb', 'Spalle: deltoide laterale, trapezio', 'Manubri', 'raise', 'conc', 'setrep', 'lateral raise, alzate laterali', 'Gomiti leggermente piegati
Alza le braccia di lato fino all’altezza delle spalle, non oltre
Guida il movimento con i gomiti, non con le mani
Niente slancio con il busto
Scendi lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Alzate laterali ai cavi', 'Alzate', 'laterali cavi', 'bb', 'Spalle: deltoide laterale', 'Cavi', 'raise', 'conc', 'setrep', 'cable lateral raise', 'Cavo in basso, dal lato opposto al braccio che lavora
Gomito morbido
Alza fino all’altezza della spalla e scendi lento
La tensione resta costante anche in basso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Alzate frontali', 'Alzate', 'frontali', 'bb', 'Spalle: deltoide anteriore', 'Manubri', 'raise', 'conc', 'setrep', 'front raise', 'Braccia quasi tese
Alza davanti fino all’altezza degli occhi
Busto fermo, niente slanci');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Alzate posteriori', 'Alzate', 'posteriori', 'bb', 'Spalle: deltoide posteriore, romboidi', 'Manubri', 'row', 'conc', 'setrep', 'reverse fly, alzate a 90', 'Busto inclinato in avanti, schiena dritta
Braccia aperte di lato con i gomiti morbidi
Pensa a portare le mani lontano, non indietro
Pesi leggeri e movimento lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Reverse pec deck', 'Alzate', 'macchina posteriori', 'bb', 'Spalle: deltoide posteriore, romboidi', 'Macchina', 'raise', 'conc', 'setrep', 'rear delt machine', 'Petto appoggiato
Apri le braccia all’indietro all’altezza delle spalle
Movimento controllato, niente strappi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Face pull', 'Face pull', 'cavi', 'bb', 'Spalle: deltoide posteriore, cuffia dei rotatori, trapezio medio', 'Cavi', 'row', 'conc', 'setrep', 'facepull', 'Cavo più in alto della testa, con la corda
Tira la corda verso la fronte
Gomiti alti e aperti
Alla fine ruota le mani indietro, come a mostrare i bicipiti
Ottimo per la salute delle spalle');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Rotazione esterna', 'Cuffia dei rotatori', 'rotazione esterna', 'bb', 'Spalle: sottospinato, piccolo rotondo', 'Cavo o elastico', 'free', 'conc', 'setrep', 'extrarotazione, rotazione esterna spalla', 'Gomito piegato a 90 gradi e attaccato al fianco
Ruota l’avambraccio verso l’esterno come una porta che si apre
Il gomito non si stacca dal fianco
Carico molto leggero, movimento lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl con bilanciere', 'Curl', 'bilanciere', 'bb', 'Braccia: bicipiti, brachiale', 'Bilanciere', 'curl', 'conc', 'setrep', 'barbell curl, curl bilanciere', 'Mani alla larghezza delle spalle, palmi in avanti
Gomiti fermi lungo i fianchi
Sali senza dondolare con la schiena
Scendi lento fino a braccia tese');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl manubri', 'Curl', 'manubri', 'bb', 'Braccia: bicipiti, brachiale', 'Manubri', 'curl', 'conc', 'setrep', 'dumbbell curl, curl alternato', 'Ruota il palmo verso l’alto mentre sali
Gomiti fermi
Scendi controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl a martello', 'Curl', 'martello', 'bb', 'Braccia: brachioradiale, brachiale, bicipiti', 'Manubri', 'curl', 'conc', 'setrep', 'hammer curl, martello', 'Palmi uno verso l’altro per tutto il movimento
Gomiti fermi lungo i fianchi
Niente slanci');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl su panca Scott', 'Curl', 'panca Scott', 'bb', 'Braccia: bicipiti, brachiale', 'Bilanciere EZ, panca Scott', 'curl', 'conc', 'setrep', 'preacher curl, scott', 'Ascelle ben appoggiate al cuscino
Scendi quasi a braccia tese, senza bloccare né rimbalzare
Sali senza staccare i gomiti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl ai cavi', 'Curl', 'cavi', 'bb', 'Braccia: bicipiti', 'Cavi', 'curl', 'conc', 'setrep', 'cable curl', 'Gomiti fermi
Tensione costante anche in basso
Stringi in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Curl concentrato', 'Curl', 'concentrato', 'bb', 'Braccia: bicipiti', 'Manubrio', 'curl', 'conc', 'setrep', 'concentration curl, curl in concentrazione', 'Seduto, gomito appoggiato all’interno della coscia
Sali lento e stringi in alto
Scendi fino quasi a braccio teso');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Push-down ai cavi', 'Tricipiti', 'push-down', 'bb', 'Braccia: tricipiti', 'Cavi', 'curl', 'conc', 'setrep', 'pushdown, tricipiti ai cavi, push down', 'Gomiti fermi vicino ai fianchi
Spingi giù fino a braccia tese
Con la corda, apri le mani in fondo
Risali lento senza alzare i gomiti');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('French press', 'Tricipiti', 'French press', 'bb', 'Braccia: tricipiti', 'Bilanciere EZ, panca', 'bench', 'ecc', 'setrep', 'skull crusher, french', 'Gomiti che puntano al soffitto e fermi
Scendi con la barra verso la fronte, lentamente
Distendi le braccia senza muovere le spalle
Con un compagno vicino quando il carico sale');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Estensioni sopra la testa', 'Tricipiti', 'sopra la testa', 'bb', 'Braccia: tricipiti, capo lungo', 'Manubrio o cavo', 'press', 'ecc', 'setrep', 'overhead extension, estensioni tricipiti', 'Gomiti vicini alla testa e fermi
Scendi dietro la testa lentamente
Distendi completamente le braccia
Pancia contratta, non inarcare la schiena');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Kickback', 'Tricipiti', 'kickback', 'bb', 'Braccia: tricipiti', 'Manubrio', 'row', 'conc', 'setrep', 'kick back tricipiti', 'Busto inclinato, braccio parallelo al corpo
Muovi solo l’avambraccio
Braccio teso dietro e stringi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg press', 'Pressa', 'leg press', 'bb', 'Gambe: quadricipiti, grande gluteo, adduttori', 'Macchina', 'squat', 'ecc', 'setrep', 'pressa', 'Schiena e bacino sempre appoggiati
Piedi alla larghezza delle spalle a metà pedana
Scendi solo finché il bacino resta appoggiato
Ginocchia in linea con le punte
Non bloccare di colpo le ginocchia in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg extension', 'Leg extension', 'macchina', 'bb', 'Gambe: quadricipiti', 'Macchina', 'free', 'conc', 'setrep', 'leg ext', 'Ginocchio allineato al perno della macchina
Rullo appoggiato sopra le caviglie
Distendi le gambe e stringi le cosce un secondo
Scendi lento senza far sbattere i pesi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg curl sdraiato', 'Leg curl', 'sdraiato', 'bb', 'Gambe: ischiocrurali', 'Macchina', 'free', 'conc', 'setrep', 'lying leg curl, leg curl prono', 'Bacino schiacciato sul cuscino
Ginocchio appena fuori dal cuscino, in linea con il perno
Porta i talloni verso i glutei
Scendi controllato');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg curl seduto', 'Leg curl', 'seduto', 'bb', 'Gambe: ischiocrurali', 'Macchina', 'free', 'conc', 'setrep', 'seated leg curl', 'Cosce bloccate dal rullo
Ginocchio in linea con il perno
Porta i talloni sotto la seduta
Risali lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Leg curl monogamba', 'Leg curl', 'monogamba', 'bb', 'Gambe: ischiocrurali', 'Macchina o cavo', 'free', 'conc', 'setrep', 'single leg curl, leg curl una gamba, leg curl in piedi', 'Una gamba alla volta, bacino fermo
Ginocchio in linea con il perno o fermo se in piedi
Porta il tallone verso il gluteo
Scendi lento, stesse ripetizioni per le due gambe');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Hack squat', 'Squat', 'hack squat', 'bb', 'Gambe: quadricipiti, grande gluteo', 'Macchina', 'squat', 'ecc', 'setrep', 'hack', 'Schiena e spalle appoggiate
Piedi a metà pedana, alla larghezza delle spalle
Ginocchia in linea con le punte
Scendi profondo con controllo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Squat al multipower', 'Squat', 'multipower', 'bb', 'Gambe: quadricipiti, grande gluteo', 'Multipower', 'squat', 'ecc', 'setrep', 'smith squat', 'Piedi leggermente avanti rispetto al bilanciere
Regola i fermi di sicurezza
Scendi controllato e spingi dai talloni');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Sumo squat', 'Squat', 'sumo', 'bb', 'Gambe: adduttori, grande gluteo, quadricipiti', 'Manubrio o kettlebell', 'squat', 'ecc', 'setrep', 'squat sumo, plie squat', 'Piedi larghi, punte in fuori
Peso tenuto tra le gambe a braccia tese
Ginocchia spinte in fuori sopra le punte
Busto dritto, scendi in verticale');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Affondi con manubri', 'Affondo', 'manubri', 'bb', 'Gambe: quadricipiti, grande gluteo', 'Manubri', 'lunge', 'ecc', 'setrep', 'dumbbell lunge', 'Manubri lungo i fianchi
Passo lungo e busto dritto
Ginocchio davanti in linea con le punte
Ginocchio dietro che sfiora terra');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Stacco rumeno con manubri', 'Stacco', 'rumeno manubri', 'bb', 'Gambe: ischiocrurali, grande gluteo, erettori', 'Manubri', 'hinge', 'ecc', 'setrep', 'rdl manubri', 'Manubri vicini alle gambe
Bacino indietro, ginocchia morbide
Schiena dritta, scendi finché senti tirare dietro le cosce');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Calf in piedi alla macchina', 'Polpacci', 'in piedi', 'bb', 'Gambe: gastrocnemio, soleo', 'Macchina', 'free', 'conc', 'setrep', 'standing calf raise', 'Spalle sotto i cuscinetti, ginocchia tese ma non bloccate
Scendi con il tallone sotto il livello della pedana
Sali in alto e fermati un secondo');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Calf seduto', 'Polpacci', 'seduto', 'bb', 'Gambe: soleo', 'Macchina', 'free', 'conc', 'setrep', 'seated calf raise', 'Ginocchia sotto il cuscinetto
Movimento completo, lento in basso
Fermati un secondo in alto');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Adductor machine', 'Adduttori', 'macchina', 'bb', 'Gambe: adduttori', 'Macchina', 'free', 'conc', 'setrep', 'adduttori', 'Schiena appoggiata
Chiudi le gambe lentamente
Non far sbattere i pesi');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Abductor machine', 'Abduttori', 'macchina', 'bb', 'Glutei: medio e piccolo gluteo', 'Macchina', 'free', 'conc', 'setrep', 'abduttori', 'Schiena appoggiata o busto leggermente avanti
Apri le gambe spingendo con i glutei
Torna lento');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Kickback glutei ai cavi', 'Glutei', 'kickback cavi', 'bb', 'Glutei: grande gluteo', 'Cavi', 'free', 'conc', 'setrep', 'glute kickback', 'Busto fermo, pancia contratta
Spingi la gamba indietro con il gluteo
Non inarcare la schiena');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Crunch ai cavi', 'Crunch', 'cavi', 'bb', 'Core: retto addominale', 'Cavi', 'core', 'conc', 'setrep', 'cable crunch, crunch all’ercolina', 'In ginocchio, corda vicino alla testa
Arrotola il busto verso le ginocchia
I fianchi restano fermi
Non tirare con le braccia');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Ab wheel', 'Core', 'ab wheel', 'bb', 'Core: retto addominale, trasverso, gran dorsale', 'Ruota per addominali', 'push', 'ecc', 'setrep', 'ruota addominali, rollout', 'Parti in ginocchio
Pancia contratta, la schiena non si inarca
Vai avanti solo fin dove controlli
Torna indietro tirando con l’addome, non con le anche');
INSERT OR IGNORE INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti) VALUES ('Pallof press', 'Core', 'antirotazione', 'bb', 'Core: obliqui, trasverso', 'Cavi o elastico', 'free', 'conc', 'setrep', 'pallof', 'In piedi di lato al cavo, piedi larghi come le spalle
Spingi le mani avanti senza ruotare il busto
Tieni la posizione due secondi e torna
Stesse ripetizioni per i due lati');
