// GymTime · mobilità e stretching: valori condivisi tra Worker e sito, stima dei tempi e generatore delle sessioni
import { POSE, animazione, durataCiclo } from './omino.js';

export const ZONE = {
  collo: 'Collo', spalle: 'Spalle', torace: 'Torace', dorsale: 'Dorsale', lombare: 'Lombare',
  anche: 'Anche', glutei: 'Glutei', adduttori: 'Adduttori', quadricipiti: 'Quadricipiti', femorali: 'Femorali',
  caviglie: 'Caviglie e polpacci', polsi: 'Polsi e avambracci', corpo: 'Tutto il corpo'
};
export const TIPI = { mobilita: 'Mobilità articolare', dinamico: 'Stretching dinamico', statico: 'Stretching statico', respirazione: 'Respirazione' };
export const ATTREZZI = { corpo_libero: 'Corpo libero', bastone: 'Bastone' };
export const LIVELLI = { 1: 'Base', 2: 'Intermedio', 3: 'Avanzato' };

// Aree su cui concentrare la sessione: le zone singole hanno troppo pochi esercizi
export const AREE = {
  alto: { nome: 'Collo, spalle e braccia', zone: ['collo', 'spalle', 'torace', 'polsi'] },
  schiena: { nome: 'Schiena', zone: ['dorsale', 'lombare'] },
  anche: { nome: 'Anche e glutei', zone: ['anche', 'glutei', 'adduttori'] },
  gambe: { nome: 'Gambe e caviglie', zone: ['quadricipiti', 'femorali', 'caviglie'] }
};
export const areaDi = zona => Object.keys(AREE).find(a => AREE[a].zone.includes(zona)) || null;
export const nomeArea = k => AREE[k]?.nome || ZONE[k] || 'Tutto il corpo';

// Fasi della sessione, in quest'ordine, e fasi ammesse per ogni tipo di esercizio
export const FASI = { riscaldamento: 'Riscaldamento', mobilita: 'Mobilità specifica', statico: 'Allungamento statico', respirazione: 'Respirazione' };
export const FASI_DEL_TIPO = { mobilita: ['riscaldamento', 'mobilita'], dinamico: ['riscaldamento', 'mobilita'], statico: ['statico'], respirazione: ['respirazione'] };
export const faseDi = (tipo, chiesta) => (FASI_DEL_TIPO[tipo] || ['mobilita']).includes(chiesta) ? chiesta : (FASI_DEL_TIPO[tipo] || ['mobilita']).at(-1);

export const DURATE_PREDEFINITE = [10, 15, 20, 30];
export const DURATE_SCELTA = [5, 10, 15, 20, 25, 30];
export const DURATA_MIN = 5;
// Con 35 esercizi, oltre i 30 minuti le sessioni diventano quasi tutte uguali: si alza quando la libreria cresce
export const DURATA_MAX = 30;

// Durate proposte: minuti interi tra 5 e 30, senza doppioni, in ordine, al massimo 6
export function pulisciDurate(v) {
  const lista = (Array.isArray(v) ? v : []).map(Number).filter(n => Number.isInteger(n) && n >= DURATA_MIN && n <= DURATA_MAX);
  return [...new Set(lista)].sort((a, b) => a - b).slice(0, 6);
}

// In piedi o a terra, dall'altezza del bacino nella prima posa dell'omino: serve a non far alzare e sedere di continuo
const POSIZIONI = new Map();
export function posizioneDi(anim) {
  const k = animazione(anim || 'free');
  if (!POSIZIONI.has(k)) { const p = POSE[k].keys[0]; POSIZIONI.set(k, (p.hip ? p.hip[1] : 31.4) < 36 ? 'piedi' : 'terra'); }
  return POSIZIONI.get(k);
}

// Tempi in secondi. Una ripetizione dura quanto un ciclo dell'omino (chi si allena lo segue), mai meno di 1,5 s
export const TEMPI = { ripMin: 1.5, cambioLato: 5, pausaSerie: 10, cambioEsercizio: 10, cambioPosizione: 10 };
export const secondiRip = e => Math.round(Math.max(TEMPI.ripMin, durataCiclo(e.animazione || 'free')) * 10) / 10;

// Durata di un esercizio: lavoro di ogni serie e di ogni lato, cambio lato, pause tra le serie
export function secondiEsercizio(e) {
  const unaVolta = e.misura === 'ripetizioni' ? e.valore * secondiRip(e) : e.valore;
  const lati = e.per_lato ? 2 : 1;
  const serie = Math.max(1, e.serie || 1);
  return Math.round(unaVolta * lati * serie + (lati - 1) * TEMPI.cambioLato * serie + (serie - 1) * TEMPI.pausaSerie);
}

// Durata della sessione: esercizi, cambi tra un esercizio e l'altro, tempo in più per sedersi o rialzarsi
export function durataPiano(esercizi) {
  return esercizi.reduce((s, e, i) => {
    if (!i) return s + secondiEsercizio(e);
    const giu = posizioneDi(esercizi[i - 1].animazione) !== posizioneDi(e.animazione) ? TEMPI.cambioPosizione : 0;
    return s + secondiEsercizio(e) + TEMPI.cambioEsercizio + giu;
  }, 0);
}

// Serie massime: statici fino a 60 s totali per lato (2 × 30 s, 3 × 20 s), mobilità e dinamico 2, respirazione 1
export const maxSerie = e => e.tipo === 'statico' ? Math.min(3, Math.max(1, Math.floor(60 / Math.max(1, e.valore || 1))))
  : e.tipo === 'respirazione' ? 1 : 2;

// Dose leggibile: "30 s per lato", "2 × 10 rip"
export function doseTesto(e) {
  const base = e.misura === 'ripetizioni' ? `${e.valore} rip` : `${e.valore} s`;
  return `${e.serie > 1 ? `${e.serie} × ` : ''}${base}${e.per_lato ? ' per lato' : ''}`;
}
export const tolleranza = secondi => Math.min(90, Math.max(30, Math.round(secondi * 0.08)));

/* ======================= Generatore ======================= */
// Ordine delle zone nel riscaldamento: dall'alto verso il basso
const ORDINE_ZONE = ['collo', 'spalle', 'polsi', 'torace', 'dorsale', 'lombare', 'anche', 'glutei', 'adduttori', 'quadricipiti', 'femorali', 'caviglie', 'corpo'];

// Estrazione casuale pesata: gli esercizi dell'ultima sessione hanno metà probabilità di uscire per primi
function ordineCasuale(lista, recenti, rnd) {
  return lista.map(e => ({ e, k: Math.pow(rnd(), recenti.has(e.id) ? 2 : 1) })).sort((a, b) => b.k - a.k).map(x => x.e);
}
const mescola = (lista, rnd) => ordineCasuale(lista, new Set(), rnd);

// Esercizi utilizzabili: tipi e zone noti, corpo libero, bastone solo se c'è
export const utilizzabili = (lib, { bastone = false } = {}) =>
  lib.filter(e => TIPI[e.tipo] && ZONE[e.zona] && e.valore > 0 && (e.attrezzo === 'corpo_libero' || (bastone && e.attrezzo === 'bastone')));

// Statici a 2 serie da 15 minuti in su; tutto il resto parte da 1
const serieIniziali = (e, minuti) => e.tipo === 'statico' && minuti >= 15 ? Math.min(2, maxSerie(e)) : 1;

// Mai due esercizi di fila sulla stessa zona (tranne nell'area scelta). Prova scambi e spostamenti dentro la stessa
// fase e posizione; se non basta toglie l'esercizio in più, purché la sua area resti coperta
function separaZone(p, area, minuti) {
  const ammessa = z => !!area && areaDi(z) === area;
  const conflitti = q => q.reduce((n, e, k) => n + (k && e.zona === q[k - 1].zona && !ammessa(e.zona) ? 1 : 0), 0);
  for (let giro = 0; giro < 40; giro++) {
    const c = conflitti(p);
    if (!c) break;
    const i = p.findIndex((e, k) => k && e.zona === p[k - 1].zona && !ammessa(e.zona));
    let fatto = false;
    for (const x of [i, i - 1]) {
      const stesso = k => k !== x && p[k].fase === p[x].fase && p[k].posizione === p[x].posizione;
      for (let j = 0; j < p.length && !fatto; j++) {
        if (!stesso(j)) continue;
        const q = [...p]; [q[x], q[j]] = [q[j], q[x]];
        if (conflitti(q) < c) { p = q; fatto = true; break; }
        const r = [...p]; const [el] = r.splice(x, 1); r.splice(j, 0, el);
        if (conflitti(r) < c) { p = r; fatto = true; }
      }
      if (fatto) break;
    }
    if (fatto) continue;
    const e = p[i];
    const altri = p.filter((y, k) => k !== i && y.tipo !== 'respirazione');
    const tieni = e.tipo === 'respirazione' || e.fase === 'riscaldamento' && altri.filter(y => y.fase === 'riscaldamento').length < 2
      || (minuti >= 10 && !altri.some(y => areaDi(y.zona) === areaDi(e.zona) && (y.tipo === 'statico') === (e.tipo === 'statico')));
    if (tieni) break;
    p = p.filter((_, k) => k !== i);
  }
  return p;
}

// Rifinitura sull'ordine finale: serie in più o in meno per stare nella tolleranza
function rifinisci(p, minuti, area) {
  const target = minuti * 60, tol = tolleranza(target);
  const inArea = e => !!area && areaDi(e.zona) === area;
  for (const e of [...p].reverse().filter(x => !inArea(x)).concat([...p].reverse())) {
    while (durataPiano(p) > target + tol && e.serie > 1 && !(e.tipo === 'statico' && minuti >= 15 && e.serie <= 2 && !inArea(e) && durataPiano(p) - target - tol < 20)) e.serie--;
  }
  // ancora lunga: tolgo un esercizio che non serve alla copertura delle aree, senza mettere due zone uguali di fila
  const conflitti = q => q.reduce((c, e, k) => c + (k && e.zona === q[k - 1].zona && !inArea(e) ? 1 : 0), 0);
  const serve = (e, q) => e.tipo === 'respirazione' || (e.fase === 'riscaldamento' && q.filter(y => y.fase === 'riscaldamento').length <= 2)
    || (minuti >= 10 && !q.some(y => y !== e && areaDi(y.zona) === areaDi(e.zona) && (y.tipo === 'statico') === (e.tipo === 'statico')))
    || (inArea(e) && !q.some(y => y !== e && inArea(y) && y.tipo === e.tipo));
  for (let guardia = 0; durataPiano(p) > target + tol && guardia < 30; guardia++) {
    const c = conflitti(p);
    const cand = [...p.keys()].reverse().sort((a, b) => (inArea(p[a]) - inArea(p[b])) || ((p[b].tipo === 'statico') - (p[a].tipo === 'statico')))
      .find(k => !serve(p[k], p) && conflitti(p.filter((_, j) => j !== k)) <= c);
    if (cand === undefined) break;
    p = p.filter((_, j) => j !== cand);
  }
  const ordine = [...p.filter(x => x.tipo === 'statico' && inArea(x)), ...p.filter(x => x.tipo !== 'statico' && x.tipo !== 'respirazione' && inArea(x)),
    ...p.filter(x => x.tipo === 'statico'), ...p.filter(x => x.fase === 'mobilita'), ...p.filter(x => x.fase === 'riscaldamento' && x.tipo === 'mobilita')];
  for (const e of ordine) {
    while (durataPiano(p) < target - tol && e.serie < maxSerie(e)) {
      e.serie++;
      if (durataPiano(p) > target + tol) { e.serie--; break; }
    }
  }
  return p;
}

/**
 * Genera una sessione dalla libreria.
 * opz: { minuti, area (alto|schiena|anche|gambe|null), bastone, recenti: [id dell'ultima sessione], rnd }
 * Restituisce { esercizi: [{ ...esercizio, serie, fase, posizione }], secondi }
 */
export function generaSessione(lib, opz = {}) {
  const { minuti, area = null, bastone = false, recenti = [], rnd = Math.random } = opz;
  const target = minuti * 60, tol = tolleranza(target);
  const inArea = e => !!area && areaDi(e.zona) === area;
  const pool = ordineCasuale(utilizzabili(lib, { bastone }), new Set(recenti), rnd)
    .map(e => ({ ...e, serie: serieIniziali(e, minuti), posizione: posizioneDi(e.animazione) }));
  const usati = new Set();
  const libero = e => !usati.has(e.id);
  const usa = (lista, e) => { lista.push(e); usati.add(e.id); };
  const aree = () => area ? [area, ...mescola(Object.keys(AREE).filter(a => a !== area), rnd)] : mescola(Object.keys(AREE), rnd);
  const dur = durataPiano;

  // Respirazione: sempre l'ultima
  const resp = pool.find(e => e.tipo === 'respirazione') || null;
  if (resp) usati.add(resp.id);
  const B = target - (resp ? secondiEsercizio(resp) + TEMPI.cambioEsercizio : 0);
  const f1 = [], f2 = [], f3 = [];
  // Ordine: aree alternate, prima in piedi poi a terra. Le durate si misurano già con quest'ordine
  const alterna = lista => {
    const out = [], resto = [...lista];
    while (resto.length) {
      const u = out[out.length - 1];
      let i = resto.findIndex(e => !u || (e.zona !== u.zona && areaDi(e.zona) !== areaDi(u.zona)));
      if (i < 0) i = resto.findIndex(e => e.zona !== u.zona);
      out.push(...resto.splice(Math.max(0, i), 1));
    }
    return out;
  };
  const perPosizione = l => [...alterna(l.filter(e => e.posizione === 'piedi')), ...alterna(l.filter(e => e.posizione === 'terra'))];
  const piano = () => [...f1, ...perPosizione(f2), ...perPosizione(f3), ...(resp ? [resp] : [])];

  // Un esercizio per area a ogni passata, su zone non ancora usate, finché la condizione lo permette
  const giro = (lista, cands, entra, zoneUsate) => {
    let aggiunto = true;
    while (aggiunto) {
      aggiunto = false;
      for (const a of aree()) {
        const z = zoneUsate();
        const e = cands.find(x => libero(x) && areaDi(x.zona) === a && !z.has(x.zona));
        if (e && entra(e)) { usa(lista, e); aggiunto = true; }
      }
    }
  };

  // Fase 1 · riscaldamento in piedi (circa un terzo): prima mobilità articolare, poi stretching dinamico
  const c1 = pool.filter(e => e.riscaldamento && e.posizione === 'piedi' && (e.tipo === 'mobilita' || e.tipo === 'dinamico'));
  const lim1 = B * 0.33, zone1 = () => new Set(f1.map(e => e.zona));
  giro(f1, c1.filter(e => e.tipo === 'mobilita'), e => dur([...f1, e]) <= lim1 * 0.5, zone1);
  giro(f1, c1.filter(e => e.tipo === 'dinamico'), e => dur([...f1, e]) <= lim1, zone1);
  giro(f1, c1, e => dur([...f1, e]) <= lim1, zone1);
  f1.sort((a, b) => (a.tipo === 'dinamico') - (b.tipo === 'dinamico') || ORDINE_ZONE.indexOf(a.zona) - ORDINE_ZONE.indexOf(b.zona));

  // Fase 2 · mobilità specifica (circa un quinto): area scelta, poi ogni area almeno una volta, poi zone nuove
  const c2 = pool.filter(e => e.tipo === 'mobilita' || e.tipo === 'dinamico');
  const lim2 = B * 0.22;
  if (area) for (const e of c2) if (libero(e) && inArea(e) && dur([...f2, e]) <= lim2) usa(f2, e);
  if (minuti >= 10) for (const a of Object.keys(AREE)) {
    if ([...f1, ...f2].some(e => areaDi(e.zona) === a)) continue;
    const e = c2.find(x => libero(x) && areaDi(x.zona) === a);
    if (e) usa(f2, e);
  }
  giro(f2, c2, e => dur(perPosizione([...f2, e])) <= lim2, () => new Set([...f1, ...f2].map(e => e.zona)));
  giro(f2, c2, e => dur(perPosizione([...f2, e])) <= lim2, () => new Set(f2.map(e => e.zona)));

  // Fase 3 · statico (il tempo che resta): area scelta, poi uno per area, poi a giro
  const c3 = pool.filter(e => e.tipo === 'statico');
  if (area) for (const e of c3) if (libero(e) && inArea(e) && dur([...piano(), e]) <= target + tol) usa(f3, e);
  if (minuti >= 10) {
    const daCoprire = aree().filter(a => !f3.some(e => areaDi(e.zona) === a));
    daCoprire.forEach((a, k) => {
      const cands = c3.filter(x => libero(x) && areaDi(x.zona) === a);
      if (!cands.length) return;
      // a ogni area la sua parte del tempo che resta: tra gli esercizi che ci stanno uno a caso, altrimenti il più breve
      const quota = (target + tol * 0.5 - dur(piano())) / (daCoprire.length - k) - TEMPI.cambioEsercizio;
      usa(f3, cands.find(x => secondiEsercizio(x) <= quota) || [...cands].sort((x, y) => secondiEsercizio(x) - secondiEsercizio(y))[0]);
    });
  }
  giro(f3, c3, e => dur([...piano(), e]) <= target + tol * 0.5, () => new Set(f3.map(e => e.zona)));
  giro(f3, c3, e => dur([...piano(), e]) <= target + tol * 0.5, () => new Set());

  // Troppo lunga: tolgo serie (prima fuori area), poi esercizi fuori area, tenendo ogni area coperta
  const coperta = (e, lista) => minuti < 10 || lista.some(x => x !== e && areaDi(x.zona) === areaDi(e.zona));
  const togli = (lista, cond) => {
    for (let i = lista.length - 1; i >= 0; i--) if (cond(lista[i])) { usati.delete(lista[i].id); lista.splice(i, 1); return true; }
    return false;
  };
  for (let guardia = 0; dur(piano()) > target + tol && guardia < 200; guardia++) {
    const s = [...f3].reverse().find(e => !inArea(e) && e.serie > 1) || [...f1, ...f2, ...f3].reverse().find(e => e.serie > 1);
    if (s) { s.serie--; continue; }
    if (f3.length > 1 && togli(f3, e => !inArea(e) && coperta(e, f3))) continue;
    if (togli(f2, e => !inArea(e) && coperta(e, [...f1, ...f2]))) continue;
    if (f1.length > 2 && togli(f1, e => coperta(e, [...f1, ...f2]))) continue;
    break;
  }
  // Troppo corta: serie in più (area scelta, statici, mobilità), poi esercizi non ancora usati
  for (const e of [...f3.filter(inArea), ...f2.filter(inArea), ...f3, ...f2, ...f1.filter(x => x.tipo === 'mobilita')]) {
    while (dur(piano()) < target - tol && e.serie < maxSerie(e)) {
      e.serie++;
      if (dur(piano()) > target + tol) { e.serie--; break; }
    }
  }
  for (const e of pool) {
    if (dur(piano()) >= target - tol) break;
    if (!libero(e) || e.tipo === 'respirazione') continue;
    const lista = e.tipo === 'statico' ? f3 : f2;
    lista.push(e);
    if (dur(piano()) > target + tol) lista.pop(); else usati.add(e.id);
  }

  const conFase = (l, fase) => l.map(e => ({ ...e, fase }));
  const esercizi = rifinisci(separaZone([
    ...conFase(f1, 'riscaldamento'), ...conFase(perPosizione(f2), 'mobilita'),
    ...conFase(perPosizione(f3), 'statico'), ...(resp ? conFase([resp], 'respirazione') : [])
  ], area, minuti), minuti, area);
  return { esercizi, secondi: durataPiano(esercizi) };
}

// Cambia un solo esercizio: stessa fase e stesso tipo, prima la stessa zona, poi la stessa area. null se non c'è alternativa
export function sostituisci(esercizi, i, lib, { bastone = false, recenti = [], rnd = Math.random } = {}) {
  const e = esercizi[i];
  if (!e) return null;
  const presenti = new Set(esercizi.map(x => x.id));
  const adatto = x => !presenti.has(x.id) && x.tipo === e.tipo
    && (e.fase !== 'riscaldamento' || (x.riscaldamento && posizioneDi(x.animazione) === 'piedi'));
  const cands = ordineCasuale(utilizzabili(lib, { bastone }).filter(adatto), new Set(recenti), rnd);
  const vicini = [esercizi[i - 1], esercizi[i + 1]].filter(Boolean);
  const staccato = x => x.zona === e.zona || !vicini.some(v => v.zona === x.zona);
  const scelto = cands.find(x => x.zona === e.zona) || cands.find(x => areaDi(x.zona) === areaDi(e.zona) && staccato(x))
    || cands.find(staccato) || cands[0];
  if (!scelto) return null;
  const nuovo = { ...scelto, serie: Math.max(1, Math.min(e.serie || 1, maxSerie(scelto))), fase: e.fase, posizione: posizioneDi(scelto.animazione) };
  return esercizi.map((x, k) => k === i ? nuovo : x);
}
