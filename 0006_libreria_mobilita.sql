-- GymTime · libreria di mobilità e stretching (35 esercizi)
-- Testi scritti da zero. Riferimenti: i libri del progetto su stretching e mobilità articolare
-- (esercizi per articolazione, tenute di 20-30 secondi, nessun molleggio, mai fino al dolore).
-- INSERT OR IGNORE: non tocca esercizi con lo stesso nome già presenti.
INSERT OR IGNORE INTO libreria_mobilita (nome, zona, tipo, riscaldamento, misura, valore, serie, per_lato, livello, attrezzo, animazione, muscolo, accorgimenti) VALUES
  ('Sì con la testa', 'collo', 'mobilita', 1, 'ripetizioni', 8, 1, 0, 1, 'corpo_libero', 'mob_collo_flesso', 'Coinvolti: trapezio', 'Lento e senza scatti: mento verso il petto, poi sguardo in alto senza buttare indietro la testa.
Spalle basse e rilassate.'),
  ('Allungamento laterale del collo', 'collo', 'statico', 0, 'secondi', 20, 1, 1, 1, 'corpo_libero', 'mob_collo_lat', 'Allungati: trapezio', 'Porta l’orecchio verso la spalla senza alzare l’altra spalla.
Tensione leggera, mai dolore. Respira con calma.'),
  ('Cerchi con le braccia', 'spalle', 'mobilita', 1, 'ripetizioni', 10, 1, 0, 1, 'corpo_libero', 'mob_cerchi_braccia', 'Coinvolti: deltoidi, cuffia dei rotatori', 'Parti con cerchi piccoli e allargali poco alla volta.
Busto fermo, addome attivo. Metà ripetizioni in avanti, metà indietro.'),
  ('Dislocazioni con bastone', 'spalle', 'mobilita', 1, 'ripetizioni', 8, 1, 0, 2, 'bastone', 'mob_dislocazioni', 'Coinvolti: deltoidi, pettorali, cuffia dei rotatori', 'Presa larga e braccia tese mentre il bastone passa sopra la testa e va dietro.
Se le spalle tirano troppo allarga la presa: niente scatti.'),
  ('Braccio incrociato al petto', 'spalle', 'statico', 0, 'secondi', 20, 1, 1, 1, 'corpo_libero', 'mob_spalla_incrociata', 'Allungati: deltoide posteriore, romboidi', 'Braccio teso davanti al petto, l’altra mano lo accompagna sopra il gomito.
Spalla bassa, lontana dall’orecchio.'),
  ('Tricipite dietro la testa', 'spalle', 'statico', 0, 'secondi', 20, 1, 1, 1, 'corpo_libero', 'mob_tricipite', 'Allungati: tricipite, dorsali', 'Gomito in alto, mano tra le scapole.
Testa dritta e addome leggermente contratto: non spingere la testa in avanti.'),
  ('Apertura del petto, mani dietro', 'torace', 'statico', 0, 'secondi', 20, 1, 0, 1, 'corpo_libero', 'mob_apertura_petto', 'Allungati: pettorale, deltoide anteriore', 'Intreccia le mani dietro la schiena e allontanale piano dal corpo.
Non inarcare la schiena bassa e non alzare le spalle.'),
  ('Gatto e mucca', 'dorsale', 'mobilita', 1, 'ripetizioni', 8, 1, 0, 1, 'corpo_libero', 'mob_gatto_mucca', 'Coinvolti: erettori della schiena, addominali', 'Mani sotto le spalle, ginocchia sotto le anche.
Alterna schiena tonda con sguardo all’ombelico e petto aperto con sguardo avanti, seguendo il respiro.'),
  ('Posizione del bambino', 'dorsale', 'statico', 0, 'secondi', 30, 1, 0, 1, 'corpo_libero', 'mob_bambino', 'Allungati: dorsali, erettori della schiena, glutei', 'Seduto sui talloni, braccia lunghe avanti a terra e fronte appoggiata.
Se le ginocchia danno fastidio allarga un po’ le gambe o metti un cuscino.'),
  ('Dondolo a quattro zampe', 'polsi', 'mobilita', 1, 'ripetizioni', 10, 1, 0, 1, 'corpo_libero', 'mob_dondolo', 'Coinvolti: avambracci, glutei', 'Da quattro zampe porta piano il peso verso i talloni e poi di nuovo sulle mani.
Mani ben aperte a terra; avanti non superare la linea delle spalle.'),
  ('Sfinge', 'lombare', 'statico', 0, 'secondi', 20, 1, 0, 1, 'corpo_libero', 'mob_sfinge', 'Allungati: addominali, ileopsoas', 'A pancia in giù sugli avambracci, gomiti sotto le spalle, bacino a terra.
Spalle lontane dalle orecchie. Se senti fastidio alla schiena bassa, abbassa il busto.'),
  ('Ginocchia al petto da supino', 'lombare', 'statico', 0, 'secondi', 30, 1, 0, 1, 'corpo_libero', 'mob_ginocchia_petto', 'Allungati: erettori della schiena, glutei', 'Da supino abbraccia le ginocchia e avvicinale al petto.
Testa e spalle rilassate a terra; respira lento.'),
  ('Basculamento del bacino', 'lombare', 'mobilita', 1, 'ripetizioni', 10, 1, 0, 1, 'corpo_libero', 'mob_bacino', 'Coinvolti: addominali, glutei', 'Da supino con i piedi a terra, appoggia la schiena bassa al pavimento e poi rilasciala.
Movimento piccolo e controllato, glutei a terra.'),
  ('Inclinazioni laterali con bastone', 'lombare', 'dinamico', 1, 'ripetizioni', 8, 1, 1, 1, 'bastone', 'mob_inclinazioni_bastone', 'Allungati: obliqui, dorsali', 'Bastone sopra la testa a braccia tese: inclinati di lato senza ruotare né piegarti in avanti.
Torna al centro ogni volta.'),
  ('Allungamento laterale in piedi', 'dorsale', 'statico', 0, 'secondi', 20, 1, 1, 1, 'corpo_libero', 'mob_laterale', 'Allungati: dorsali, obliqui', 'Allunga il fianco verso l’alto prima di inclinarti.
Bacino fermo e peso su entrambi i piedi.'),
  ('Affondo basso per i flessori dell’anca', 'anche', 'statico', 0, 'secondi', 30, 1, 1, 1, 'corpo_libero', 'mob_affondo_flessori', 'Allungati: ileopsoas, quadricipite', 'Ginocchio dietro a terra, piede davanti ben piantato con il ginocchio sopra la caviglia.
Spingi piano il bacino avanti stringendo il gluteo della gamba dietro, senza inarcare la schiena.'),
  ('Cerchi con le anche', 'anche', 'mobilita', 1, 'ripetizioni', 10, 1, 0, 1, 'corpo_libero', 'mob_cerchi_anche', 'Coinvolti: glutei, addominali, lombari', 'Mani sui fianchi e ginocchia morbide: cerchi ampi con il bacino, metà in un verso e metà nell’altro.
Testa e spalle quasi ferme.'),
  ('Slanci della gamba avanti e indietro', 'anche', 'dinamico', 1, 'ripetizioni', 10, 1, 1, 2, 'corpo_libero', 'mob_slanci', 'Allungati: femorali, glutei, ileopsoas', 'Se serve tieniti a un appoggio.
Slanci controllati che crescono piano in ampiezza: la gamba va dove arriva, senza strappi, busto dritto.'),
  ('Marcia con ginocchia alte', 'anche', 'dinamico', 1, 'ripetizioni', 20, 1, 0, 1, 'corpo_libero', 'mob_marcia', 'Coinvolti: ileopsoas, glutei, polpacci', 'Ginocchio fino all’altezza dell’anca, braccia in opposizione.
Appoggio sull’avampiede, busto alto.'),
  ('Squat profondo tenuto', 'anche', 'mobilita', 1, 'ripetizioni', 6, 1, 0, 2, 'corpo_libero', 'mob_squat_profondo', 'Coinvolti: glutei, adduttori, polpacci', 'Piedi poco più larghi delle spalle e talloni a terra. Scendi piano, gomiti dentro le ginocchia, schiena lunga.
Se i talloni si alzano, fermati più in alto.'),
  ('Ginocchio al petto in piedi', 'glutei', 'dinamico', 1, 'ripetizioni', 8, 1, 1, 1, 'corpo_libero', 'mob_ginocchio_petto', 'Allungati: glutei, femorali', 'Porta il ginocchio al petto e abbraccialo per un attimo, alto sulla gamba d’appoggio.
Alterna le gambe con calma.'),
  ('Figura 4 da supino', 'glutei', 'statico', 0, 'secondi', 30, 1, 1, 2, 'corpo_libero', 'mob_figura4', 'Allungati: gluteo, piriforme', 'Da supino appoggia la caviglia sul ginocchio opposto e porta le gambe verso il petto tirando la coscia di sotto.
Testa a terra; spingi via il ginocchio con dolcezza, mai con forza.'),
  ('Farfalla da seduto', 'adduttori', 'statico', 0, 'secondi', 30, 1, 0, 1, 'corpo_libero', 'mob_farfalla', 'Allungati: adduttori', 'Piante dei piedi unite e schiena dritta.
Lascia scendere le ginocchia da sole o con una leggera pressione dei gomiti: niente molleggi.'),
  ('Affondo laterale', 'adduttori', 'dinamico', 1, 'ripetizioni', 8, 1, 1, 2, 'corpo_libero', 'mob_affondo_laterale', 'Coinvolti: adduttori, glutei, quadricipite', 'Piedi larghi e paralleli: piega una gamba portando indietro il bacino, l’altra resta tesa con il piede intero a terra.
Il ginocchio piegato segue la punta del piede.'),
  ('Femorali da seduto, gambe tese', 'femorali', 'statico', 0, 'secondi', 30, 1, 0, 1, 'corpo_libero', 'mob_femorali_seduto', 'Allungati: femorali, polpacci, erettori della schiena', 'Gambe tese avanti, punte verso l’alto.
Piegati dall’anca con la schiena lunga e fermati dove senti tirare, senza dolore.'),
  ('Inchino a gambe morbide', 'femorali', 'dinamico', 1, 'ripetizioni', 8, 1, 0, 1, 'corpo_libero', 'mob_inchino', 'Allungati: femorali, glutei, lombari', 'Ginocchia leggermente piegate: scendi spingendo indietro il bacino, braccia verso il pavimento.
Risali lentamente.'),
  ('Femorali da supino, gamba tesa', 'femorali', 'statico', 0, 'secondi', 30, 1, 1, 1, 'corpo_libero', 'mob_femorali_supino', 'Allungati: femorali, polpacci', 'Solleva una gamba tesa e tienila con le mani dietro la coscia; l’altra resta distesa a terra.
Se non arrivi, piega un poco il ginocchio.'),
  ('Quadricipite in piedi', 'quadricipiti', 'statico', 0, 'secondi', 20, 1, 1, 1, 'corpo_libero', 'mob_quadricipite', 'Allungati: quadricipite, ileopsoas', 'Prendi la caviglia e avvicina il tallone al gluteo, ginocchia vicine.
Tieniti a un appoggio se perdi l’equilibrio; non tirare il ginocchio di lato.'),
  ('Calci ai glutei sul posto', 'quadricipiti', 'dinamico', 1, 'ripetizioni', 20, 1, 0, 1, 'corpo_libero', 'mob_calciata', 'Coinvolti: quadricipite, femorali, polpacci', 'Corsa leggera sul posto portando i talloni verso i glutei.
Busto dritto, appoggio morbido sull’avampiede.'),
  ('Polpaccio in affondo', 'caviglie', 'statico', 0, 'secondi', 30, 1, 1, 1, 'corpo_libero', 'mob_polpaccio', 'Allungati: polpacci', 'Gamba dietro tesa, tallone a terra e punta dritta avanti.
Porta il peso avanti piegando la gamba davanti: corpo in linea dalla testa al tallone.'),
  ('Cerchi con le caviglie', 'caviglie', 'mobilita', 1, 'ripetizioni', 10, 1, 1, 1, 'corpo_libero', 'mob_cerchi_caviglie', 'Coinvolti: polpacci, tibiali', 'Solleva il piede e disegna cerchi ampi con la punta, metà in un verso e metà nell’altro.
Si muove solo la caviglia.'),
  ('Caviglia: ginocchio avanti', 'caviglie', 'mobilita', 1, 'ripetizioni', 10, 1, 1, 2, 'corpo_libero', 'mob_caviglia_avanti', 'Coinvolti: polpacci, tibiali', 'Da mezzo inginocchiato porta il ginocchio davanti oltre la punta del piede con il tallone a terra, poi torna.
Il ginocchio segue la direzione del secondo dito.'),
  ('Cerchi con i polsi', 'polsi', 'mobilita', 1, 'ripetizioni', 10, 1, 0, 1, 'corpo_libero', 'mob_cerchi_polsi', 'Coinvolti: avambracci', 'Gomiti piegati vicino ai fianchi: ruota i polsi lentamente nei due versi.
Puoi intrecciare le dita per guidare il movimento.'),
  ('Respirazione da supino', 'corpo', 'respirazione', 0, 'secondi', 60, 1, 0, 1, 'corpo_libero', 'mob_resp_supina', 'Coinvolti: addominali', 'Mani sulla pancia: inspira dal naso sentendo la pancia che si alza, espira lento dalla bocca.
L’espirazione dura più dell’inspirazione.'),
  ('Respiro nella posizione del bambino', 'corpo', 'respirazione', 0, 'secondi', 60, 1, 0, 1, 'corpo_libero', 'mob_bambino_resp', 'Coinvolti: dorsali', 'Seduto sui talloni con il busto sulle cosce e le braccia lungo i fianchi.
Respira lento portando l’aria verso la schiena.');
