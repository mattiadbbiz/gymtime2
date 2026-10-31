#!/usr/bin/env python3
"""GymTime · giornate singole: modifica i file esistenti del repository.

Si lancia dalla cartella del repository, dopo aver estratto lo zip:
    python3 applica-giornate-singole.py
Controlla tutto prima di scrivere: se un punto da modificare non si trova (o si trova due volte)
si ferma e non tocca nessun file. Si può rilanciare: le modifiche già fatte vengono saltate.
"""
from pathlib import Path
import sys

ROTTE = """  // Giornate singole: fuori dalla scheda, avviabili da Allena e aggiungibili alla scheda attiva
  if (p === '/api/giornate-singole' && m === 'GET') return G.elenco(env, io);
  if (p === '/api/giornate-singole' && m === 'POST') return G.crea(request, env, io);
  if (p === '/api/giornate-singole/gestione' && m === 'GET') return G.gestione(env, io);
  if ((r = p.match(/^\\/api\\/giornate-singole\\/(\\d+)$/))) {
    if (m === 'GET') return G.leggi(env, io, +r[1]);
    if (m === 'PUT') return G.modifica(request, env, io, +r[1]);
    if (m === 'DELETE') return G.elimina(env, io, +r[1]);
  }
  if ((r = p.match(/^\\/api\\/giornate-singole\\/(\\d+)\\/avvia$/)) && m === 'POST') return G.avvia(env, io, +r[1]);
  if ((r = p.match(/^\\/api\\/giornate-singole\\/(\\d+)\\/scheda$/)) && m === 'POST') return G.inScheda(env, io, +r[1]);
  if ((r = p.match(/^\\/api\\/giornate\\/(\\d+)\\/rifai$/)) && m === 'POST') return G.rifai(env, io, +r[1]);

"""

ALLENA = "  // Allenamento\n  if (p === '/api/allena' && m === 'GET') return A.statoAllenamento(env, io);\n"
SUGGERITO = "SELECT giorno_posizione FROM giornate WHERE atleta_id = ? AND data < ? ORDER BY data DESC LIMIT 1"

# (file, testo da trovare, testo nuovo, segno che la modifica c'è già)
MODIFICHE = [
    ('src/index.js',
     "import * as L from './sessioni-libere.js';\n",
     "import * as L from './sessioni-libere.js';\nimport * as G from './giornate-singole.js';\n",
     "from './giornate-singole.js'"),
    ('src/index.js', ALLENA, ROTTE + ALLENA, "G.elenco(env, io)"),
    # Il giorno suggerito della scheda ignora le giornate fatte fuori dalla scheda (giorno_posizione -1)
    ('src/allenamento.js', SUGGERITO,
     SUGGERITO.replace('AND data < ?', 'AND data < ? AND giorno_posizione >= 0'),
     "AND giorno_posizione >= 0"),
    # Prima di atleta.js: la rotta #/allena del nuovo modulo ha la precedenza
    ('public/js/app.js', "import './atleta.js';\n", "import './giornate-singole.js';\nimport './atleta.js';\n",
     "import './giornate-singole.js';"),
]

CSS_SEGNO = '/* Giornate singole */'
CSS = CSS_SEGNO + """
.gs-sezione{margin:26px 0 10px}.gs-sezione h2{font-size:26px;margin:0}.gs-sezione p{margin:2px 0 0}
.gs-crea{display:grid;gap:10px;margin:4px 0 6px}
.gs-azioni{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:18px 0}
.gs-dati{display:grid;gap:12px}
.gs-es{display:grid;gap:10px;background:var(--surface,#fff);border:1px solid var(--line,#e6deda);border-radius:14px;padding:12px;margin:10px 0}
.gs-es-testa{display:flex;align-items:center;gap:10px}
.gs-es-testa .mini{width:44px;height:50px;flex-shrink:0;background:var(--surface-2,#f1eae4);border-radius:9px}
.gs-es-testa .mini svg{width:100%;height:100%}
.gs-es-nome{flex:1;min-width:0;display:grid;gap:4px}.gs-es-nome b{overflow-wrap:anywhere}
.gs-es-tasti{display:flex;gap:4px;flex-shrink:0}
.gs-campi{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.gs-campi .gs-largo{grid-column:1/-1}
.gs-aggiungi{width:100%;margin-top:6px}
.gs-scelta{display:grid;gap:12px}
.gs-risultati{max-height:55dvh;overflow:auto;margin:0}
"""


def leggi(percorso):
    raw = Path(percorso).read_bytes().decode('utf-8')
    crlf = '\r\n' in raw
    return raw.replace('\r\n', '\n'), crlf


def scrivi(percorso, testo, crlf):
    Path(percorso).write_bytes((testo.replace('\n', '\r\n') if crlf else testo).encode('utf-8'))


def main():
    mancanti = [f for f in ['src/giornate-singole.js', 'public/js/giornate-singole.js', 'migrations/0010_giornate_singole.sql'] if not Path(f).is_file()]
    if mancanti:
        sys.exit('Mancano i file nuovi dello zip: ' + ', '.join(mancanti) + '\nEstrai lo zip nella cartella del repository e rilancia.')

    file = {}
    errori, da_fare = [], []
    for percorso, cerca, nuovo, segno in MODIFICHE:
        if not Path(percorso).is_file():
            errori.append(f'{percorso}: file non trovato (sei nella cartella del repository?)')
            continue
        if percorso not in file:
            file[percorso] = leggi(percorso)
        testo = file[percorso][0]
        if segno in testo:
            print(f'già fatto  {percorso}: {segno}')
            continue
        n = testo.count(cerca)
        if n != 1:
            errori.append(f'{percorso}: il punto da modificare compare {n} volte invece di 1:\n    {cerca.strip()[:110]}')
            continue
        da_fare.append((percorso, cerca, nuovo))

    css = 'public/gymtime.css'
    if not Path(css).is_file():
        errori.append(f'{css}: file non trovato')
    if errori:
        print('Nessun file modificato. Problemi:')
        for e in errori:
            print(' - ' + e)
        sys.exit(1)

    for percorso, cerca, nuovo in da_fare:
        testo, crlf = file[percorso]
        file[percorso] = (testo.replace(cerca, nuovo, 1), crlf)
    for percorso in {p for p, _, _ in da_fare}:
        scrivi(percorso, *file[percorso])
        print(f'modificato {percorso}')

    testo, crlf = leggi(css)
    if CSS_SEGNO in testo:
        print(f'già fatto  {css}')
    else:
        scrivi(css, testo.rstrip('\n') + '\n' + CSS, crlf)
        print(f'modificato {css}')
    print('Fatto.')


if __name__ == '__main__':
    main()
