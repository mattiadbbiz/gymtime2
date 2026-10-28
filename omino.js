// GymTime · omino animato
// Ogni animazione è una serie di pose chiave. Le ossa hanno lunghezza fissa:
// mani e piedi appoggiati restano fermi grazie alla cinematica inversa, quindi
// ginocchia e gomiti si piegano come nel corpo vero. Il ritmo segue il tempo
// esecutivo (eccentrica-fermo-concentrica-fermo) e la fase da cui si parte.
// Di lato gomiti e ginocchia scelgono sempre la piegatura anatomica: il gomito
// si chiude verso il bicipite, il ginocchio verso il polpaccio.
// Il corpo è muscoloso: ogni osso ha il suo profilo con i ventri muscolari,
// e i muscoli che lavorano (dal campo "muscoli" della libreria) si accendono in oro.

const L = { tr: 15, nk: 5.4, hr: 4, ua: 9, fa: 8.6, th: 11, sh: 11, ft: 3.6 };
const G = 54.5;                 // linea del pavimento
const RAD = Math.PI / 180;
const dir = a => [Math.sin(a * RAD), Math.cos(a * RAD)];      // 0 = giù, 90 = avanti, 180 = su
const ang = (dx, dy) => Math.atan2(dx, dy) / RAD;             // inverso di dir
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const lerp = (a, b, u) => a + (b - a) * u;
const lerpP = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
const lerpA = (a, b, u) => { let d = ((b - a + 540) % 360) - 180; return a + d * u; };
const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Aiuti per scrivere le pose ---------- */
// Corpo rigido dalla caviglia (piegamenti, plank, rematore inverso): angolo di elevazione in gradi
function linea(caviglia, elev) {
  const u = [Math.cos(elev * RAD), -Math.sin(elev * RAD)];
  return { hip: add(caviglia, u, L.th + L.sh - 0.1), nk: add(caviglia, u, L.th + L.sh + L.tr) };
}
const st = (o = {}) => ({ hip: [30, 31.4], t: 0, legs: { ik: [30, 53] }, arms: { a: [3, 8] }, ...o });
const piedi = { ik: [30, 53] };

// Andatura sul tapis roulant: il bacino resta fermo e il nastro porta indietro il piede d'appoggio.
// o: hip [x,y] medio · cav: y della caviglia sul nastro · avanti: caviglia davanti al bacino quando il tallone tocca
// passo: distanza tra i piedi · appoggio: parte del ciclo con il piede giù · ciclo: secondi per due passi
// alza: quanto sale la caviglia in volo · tallone: quanto si stacca il tallone in spinta
// mol: molleggio del bacino (− sale a metà appoggio, come nel cammino; + scende, come nella corsa) · t: busto · br: [ampiezza, piega del gomito, chiusura in avanti]
// suolo: (facoltativo) y della caviglia in funzione di x, per i nastri curvi · avampiede: tallone sempre un po' staccato
// piano: piede in piano anche se suolo è inclinato (gradini della scala mobile)
// indietro: cammino all'indietro (traino della slitta): le pose girano al contrario, il piede arriva di punta e il suolo scorre in avanti
function andatura(o) {
  const n = o.n || 20, corsa = 2 * o.passo * o.appoggio, avanti = o.hip[0] + o.avanti, x0 = avanti - corsa;
  const suolo = o.suolo || (() => o.cav), av = o.avampiede || 0;
  const gamba = f => {
    f = ((f % 1) + 1) % 1;
    if (f < o.appoggio) {
      const x = avanti - corsa * f / o.appoggio, s0 = o.appoggio * 0.75;
      const alto = av * (1 - 0.7 * Math.sin(Math.PI * f / o.appoggio));   // sull'avampiede il tallone scende appena a metà appoggio
      const punta = [x + 3.5, suolo(o.piano ? x : x + 3.5) + 0.65];
      if (f <= s0) return av ? { ik: [x, suolo(x) - alto], toe: punta } : { ik: [x, suolo(x)] };
      const h = o.tallone * (f - s0) / (o.appoggio - s0);      // il tallone si stacca, la punta resta sul nastro
      return { ik: [x, suolo(x) - alto - h], toe: punta };
    }
    const s = (f - o.appoggio) / (1 - o.appoggio);
    const x = x0 + (avanti - x0) * (1 - Math.cos(Math.PI * s)) / 2;
    const y = suolo(x) - av - o.tallone * (1 - s) - o.alza * Math.sin(Math.PI * Math.pow(s, 0.7));
    if (s <= 0.65) return { ik: [x, y] };
    return { ik: [x, y], toe: av ? [x + 3.5, y + av + 0.65] : 'perp' };   // sull'avampiede arriva con la punta appena più bassa del tallone
  };
  const [A, piega, chiude = 0.5] = o.br;                  // chiude: quanto si piega in più il gomito quando il braccio va avanti
  const braccio = f => { const sup = -A * Math.cos(2 * Math.PI * f) + o.t; return { a: [sup, sup + piega + Math.max(0, sup) * chiude] }; };
  const keys = Array.from({ length: n }, (_, i) => {
    const f = i / n;
    return { hip: [o.hip[0], o.hip[1] + o.mol * Math.cos(4 * Math.PI * (f - o.appoggio / 2))], t: o.t,
      legs: [gamba(f), gamba(f + 0.5)], arms: [braccio(f), braccio(f + 0.5)] };
  });
  if (o.indietro) keys.reverse();
  return { keys, seg: keys.map(() => o.ciclo / n), lineare: true, nastro: (o.indietro ? -2 : 2) * o.passo / o.ciclo, passi: { corsa, appoggio: o.appoggio, ciclo: o.ciclo, passo: o.passo } };
}

// Pedalata: bacino fermo sulla sella, mani ferme sul manubrio, caviglie su un cerchio attorno al movimento centrale.
// o: hip · t · c: centro pedivelle · r: lunghezza pedivella · cav: dove sta la caviglia rispetto al pedale
// mani: [x,y] sul manubrio · giri: pedalate al minuto · n: pose per giro
// leva: (facoltativo, air bike) manici mobili {perno, lung, a: angolo medio, amp: oscillazione}: ogni manico va avanti
//   quando il pedale dello stesso lato torna su dietro, come braccia e gambe nel cammino
function pedalata(o) {
  const n = o.n || 16, cav = o.cav || [-0.5, -1.6], centro = [o.c[0] + cav[0], o.c[1] + cav[1]];
  const gamba = f => {
    const a = 2 * Math.PI * f - Math.PI / 2;            // parte dall'alto e gira in avanti
    const x = centro[0] + o.r * Math.cos(a), y = centro[1] + o.r * Math.sin(a);
    const punta = (o.punta ?? 0.9) + 0.6 * Math.sin(a);  // in spinta la punta scende un po', in risalita torna piatta
    return { ik: [x, y], toe: [x + 3.5, y + punta] };
  };
  const lv = o.leva, mano = f => ({ ik: add(lv.perno, dir(180 - lv.a - lv.amp * Math.cos(2 * Math.PI * (f - 0.875))), lv.lung) });
  const braccia = f => lv ? [mano(f), mano(f + 0.5)] : { ik: o.mani };
  const keys = Array.from({ length: n }, (_, i) => ({ hip: o.hip, t: o.t, hd: o.hd || 0, legs: [gamba(i / n), gamba(i / n + 0.5)], arms: braccia(i / n) }));
  return { keys, seg: keys.map(() => 60 / o.giri / n), lineare: true, giri: o.giri };
}

// Ellittica: quadrilatero articolato. La pedivella dietro (centro c, raggio r) porta il fondo del braccio-pedale,
// la punta del braccio-pedale è legata al fondo del manico, che oscilla sul perno: piedi su un'ellisse, mani avanti e indietro.
// o: c, r · perno · giu: perno → fondo del manico · su: perno → mano · lung: braccio-pedale · k: dove sta il piede (0 dietro, 1 davanti)
// hip, mol (su e giù del bacino), t · giri: pedalate al minuto
function quadrilatero(o, f) {
  const a = 2 * Math.PI * f - Math.PI / 2, q = [o.c[0] + o.r * Math.cos(a), o.c[1] + o.r * Math.sin(a)];
  const d = dist(q, o.perno), x = (d * d + o.giu * o.giu - o.lung * o.lung) / (2 * d), h = Math.sqrt(Math.max(0, o.giu * o.giu - x * x));
  const u = [(q[0] - o.perno[0]) / d, (q[1] - o.perno[1]) / d];
  const r1 = [o.perno[0] + u[0] * x - u[1] * h, o.perno[1] + u[1] * x + u[0] * h], r2 = [o.perno[0] + u[0] * x + u[1] * h, o.perno[1] + u[1] * x - u[0] * h];
  const r = r1[1] > r2[1] ? r1 : r2;                                                   // fondo del manico, sotto il perno
  const v = [(r[0] - q[0]) / o.lung, (r[1] - q[1]) / o.lung], nrm = [v[1], -v[0]];     // lungo il braccio-pedale e normale verso l'alto
  const pd = add(q, v, o.lung * o.k), cav = add(pd, nrm, 1.5);
  const m = add(o.perno, [(o.perno[0] - r[0]) / o.giu, (o.perno[1] - r[1]) / o.giu], o.su);
  return { gamba: { ik: cav, toe: add(cav, v, 3.6) }, mano: { ik: m } };
}
function ellittica(o) {
  const n = o.n || 16;
  const keys = Array.from({ length: n }, (_, i) => {
    const f = i / n, A = quadrilatero(o, f), B = quadrilatero(o, f + 0.5);
    return { hip: [o.hip[0], o.hip[1] + o.mol * Math.cos(4 * Math.PI * (f - (o.mf || 0)))], t: o.t, hd: o.hd || 0, legs: [A.gamba, B.gamba], arms: [A.mano, B.mano] };
  });
  return { keys, seg: keys.map(() => 60 / o.giri / n), lineare: true };
}

// Movimento fluido da poche pose chiave in loop: ogni valore numerico (bacino, busto, testa, bersagli di mani e piedi)
// segue una curva di Hermite con velocità continua, quindi il corpo non si ferma sulle pose chiave.
// K: pose chiave · tempi: quando arriva ciascuna (frazione del ciclo, da 0) · ciclo: secondi · n: pose generate
function fluido(K, tempi, ciclo, n = 24) {
  const N = K.length, T = i => tempi[((i % N) + N) % N] + Math.floor(i / N);   // tempi anche oltre il giro
  const herm = (a, b, c, d, ta, tb, tc, td, u) => {
    if (typeof b === 'number') {
      // tangenti limitate (Fritsch-Carlson): niente rimbalzi oltre le pose chiave, fermo sulle pose uguali o di inversione
      const h = tc - tb, sec = c - b, lim = (m, ok) => !ok || sec === 0 ? 0 : sec * Math.max(0, Math.min(3, m / sec));
      const m1 = lim((c - a) / (tc - ta) * h, (b - a) * sec > 0), m2 = lim((d - b) / (td - tb) * h, (d - c) * sec > 0), u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * b + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * c + (u3 - u2) * m2;
    }
    if (Array.isArray(b)) return b.map((_, i) => herm(a[i], b[i], c[i], d[i], ta, tb, tc, td, u));
    if (b && typeof b === 'object') return Object.fromEntries(Object.keys(b).map(k => [k, herm(a[k], b[k], c[k], d[k], ta, tb, tc, td, u)]));
    return b;
  };
  const keys = Array.from({ length: n }, (_, i) => {
    const f = i / n; let j = N - 1;
    while (j > 0 && tempi[j] > f) j--;
    const k = q => K[((q % N) + N) % N], u = (f - T(j)) / (T(j + 1) - T(j));
    return herm(k(j - 1), k(j), k(j + 1), k(j + 2), T(j - 1), T(j), T(j + 1), T(j + 2), u);
  });
  return { keys, seg: keys.map(() => ciclo / n), lineare: true };
}
// Punto sul busto: lungo (dal bacino verso il collo) e avanti (perpendicolare, verso il petto)
const sulBusto = (hip, t, lungo, avanti) => add(add(hip, dir(180 - t), lungo), dir(90 - t), avanti);
// Mano a braccio quasi teso, all'altezza y: dalla spalla verso avanti a distanza R
const manoTesa = (hip, t, y, R) => { const s = sulBusto(hip, t, L.tr - 1.2, 0); return [s[0] + Math.sqrt(Math.max(0, R * R - (y - s[1]) ** 2)), y]; };

// Vogatore: presa (ginocchia al petto, braccia tese) → spinta di gambe → apertura del busto → tirata delle braccia al petto,
// poi il ritorno al contrario: braccia, busto, scivolata in avanti. La spinta dura circa un terzo del ciclo.
// o: piedi {ik, toe} sulla pedana · y: altezza del bacino sulla sella · presa, finale: x del bacino · yM: altezza della maniglia · colpi al minuto
function vogata(o) {
  const k = (x, t, mano, hd = 0) => ({ hip: [x, o.y], t, hd, legs: o.piedi, arms: { ik: mano } });
  const tesa = (x, t) => manoTesa([x, o.y], t, o.yM, o.R);
  const K = [
    k(o.presa, 15, tesa(o.presa, 15), -4),
    k(o.presa - (o.presa - o.finale) * 0.72, 14, tesa(o.presa - (o.presa - o.finale) * 0.72, 14), -2),
    k(o.finale, -22, sulBusto([o.finale, o.y], -22, 9.6, 3.2), 6),
    k(o.finale, -20, tesa(o.finale, -20), 4),
    k(o.finale + 1, 16, tesa(o.finale + 1, 16), -2)];
  return fluido(K, [0, 0.16, 0.36, 0.5, 0.66], 60 / o.colpi);
}

// Salto con la corda: saltelli sull'avampiede, polsi che girano su un cerchietto in fase con la corda.
// La corda gira in avanti (sopra la testa, davanti, sotto i piedi) e passa sotto i piedi a metà del volo:
// giri 1 = singolo, giri 2 = double under (volo più lungo e più alto, due passaggi). o: x, y (bacino a terra),
// volo: [inizio, fine] del volo nel ciclo · alza: altezza del salto · ciclo: secondi per salto · rp: raggio dei polsi
const CORDA_SALTO = { polsi: [4.5, 0.5], centro: [1, -1.5], rx: 14, ry: 24.6 };   // rispetto al bacino
function saltoCorda(o) {
  const n = o.n || 16, [v1, v2] = o.volo;
  const keys = Array.from({ length: n }, (_, i) => {
    const f = i / n, aria = f > v1 && f < v2, s = (f - v1) / (v2 - v1);
    const su = aria ? o.alza * 4 * s * (1 - s) : 0;
    const terra = aria ? 0 : ((f >= v2 ? f - v2 : f + 1 - v2) / (1 - (v2 - v1)));      // 0 → 1 durante l'appoggio
    const hip = [o.x, o.y - su + (aria ? 0 : o.molla * Math.sin(Math.PI * terra))];
    const a = 360 * o.giri * ((o.giri === 1 ? 0.5 : 0.25) - f);     // gradi della corda: 0 = sotto i piedi (a metà volo, o a 1/4 e 3/4)
    const cav = [o.x + 1, 52.4 - su];
    return { hip, t: 2, hd: -4, legs: { ik: cav, toe: aria ? [cav[0] + 3.3, cav[1] + 2.3] : [cav[0] + 3.5, 54.4] },
      arms: { ik: add(add(hip, CORDA_SALTO.polsi), dir(a), o.rp) } };
  });
  return { keys, seg: keys.map(() => o.ciclo / n), lineare: true };
}

// Arrampicata alla corda: la corda scorre verso il basso quando il corpo sale, il corpo resta sul posto.
// A (0-0.4): mani ferme sulla corda, ginocchia su, i piedi agganciano la corda più in alto.
// B (0.4-0.8): piedi e mani ferme sulla corda, le gambe si distendono e il corpo sale.
// C (0.8-1): piedi fermi, le mani si staccano e risalgono. o: x della corda · d1, d2: salita in A e in B · ciclo
function scalataCorda(o) {
  const n = 25, x = o.x, D = o.d1 + o.d2;
  const corda = f => f < 0.4 ? o.d1 * f / 0.4 : f < 0.8 ? o.d1 + o.d2 * (f - 0.4) / 0.4 : D;   // quanto è scesa la corda
  const ss = u => u * u * (3 - 2 * u);
  const keys = Array.from({ length: n }, (_, i) => {
    const f = i / n, c = corda(f);
    const mani = f < 0.8 ? [o.mano + c, o.mano + 3.5 + c] : [lerp(o.mano + D, o.mano, ss((f - 0.8) / 0.2)), lerp(o.mano + 3.5 + D, o.mano + 3.5, ss((f - 0.8) / 0.2))];
    let piede, punta;
    if (f >= 0.4) { const y = o.piede - o.d2 + (c - o.d1); piede = [x, y]; punta = [x + 3.5, y + 0.6]; }
    else if (f < 0.06) { piede = [x, o.piede + c]; punta = [x + 3.5, o.piede + c + 0.6]; }
    else { const u = ss((f - 0.06) / 0.34); piede = [x + 2.5 * Math.sin(Math.PI * u), lerp(o.piede + o.d1 * 0.06 / 0.4, o.piede - o.d2, u)]; punta = 'perp'; }
    const sale = f < 0.4 ? ss(f / 0.4) : f < 0.8 ? 1 - ss((f - 0.4) / 0.4) : 0;          // anche flesse a ginocchia su
    return { hip: [o.hip[0] - 0.8 * sale, o.hip[1] + 0.6 * sale], t: -3 + 9 * sale, hd: 6 - 4 * sale,
      legs: [{ ik: piede, toe: punta }, { ik: [piede[0] - 0.4, piede[1] - 1.4], toe: punta === 'perp' ? 'perp' : [punta[0] - 0.4, punta[1] - 1.4] }],   // piede sopra la corda, l'altro sotto
      arms: [{ ik: [x, mani[0]] }, { ik: [x + 1.1, mani[1]] }] };
  });
  return { keys, seg: keys.map(() => o.ciclo / n), lineare: true, corda: { d1: o.d1, d2: o.d2, ciclo: o.ciclo } };
}

// Battle rope: mezzo squat, le mani girano su piccole ellissi alternate e mandano le onde lungo le due corde
// o: hip · piedi · c: centro delle mani · rx, ry · ciclo: secondi per onda
function battleRope(o) {
  const n = 16;
  const mano = f => ({ ik: [o.c[0] + o.rx * Math.cos(2 * Math.PI * f), o.c[1] + o.ry * Math.sin(2 * Math.PI * f)] });
  const keys = Array.from({ length: n }, (_, i) => ({ hip: [o.hip[0], o.hip[1] + 0.4 * Math.sin(4 * Math.PI * i / n)], t: o.t, hd: -12,
    legs: { ik: o.piedi }, arms: [mano(i / n), mano(i / n + 0.5)] }));
  return { keys, seg: keys.map(() => o.ciclo / n), lineare: true };
}

// Girata (clean) con il bilanciere: da terra o dall'hang, ricezione in power (mezzo squat) o in squat completo.
// Da terra: stacco fino al ginocchio → spinta completa sulle punte con le spalle su → tirata alta con i gomiti in alto →
// ricezione in front rack → in piedi → giù ai fianchi e di nuovo a terra. La sbarra resta vicina alle gambe.
// o: hang (parte dall'hang a metà coscia) · squat (ricezione in squat completo) · ciclo: secondi
// Pezzi comuni di girata, strappo e slancio: piedi, front rack, braccia tese sopra la testa
const OLY = {
  piedi: (y = 53, x = 30) => ({ ik: [x, y], toe: [x + 3.6, 54.3] }),
  rack: (hip, t) => sulBusto(hip, t, L.tr - 2.4, 3.6),                  // mani accanto alle spalle, gomiti alti: come front_squat
  sopra: (hip, t, sy = 0.6) => add(sulBusto(hip, t, L.tr - 1.2 + sy, 0), dir(176), L.ua + L.fa - 0.3),   // sbarra sopra la nuca
  k: (hip, t, hd, mani, legs, sy = 0) => ({ hip, t, hd, sy, legs, arms: { ik: mani } })
};
// Tra due pose a braccia tese la curva delle mani va più lontano della spalla: la sbarra resta appesa alle braccia tese
function braccioTeso(F) {
  for (const q of F.keys) {
    const sp = sulBusto(q.hip, q.t, L.tr - 1.2 + q.sy, 0), m = q.arms.ik, d = dist(sp, m), R = L.ua + L.fa - 0.25;
    if (d > R) q.arms = { ik: lerpP(sp, m, R / d) };
  }
  return F;
}
// Le pose della tirata da terra, uguali per girata, strappo e slancio. due: piedi come coppia [davanti, dietro] (serve allo slancio)
function tirataDaTerra(due = false) {
  const p = (y = 53) => due ? [OLY.piedi(y), OLY.piedi(y)] : OLY.piedi(y), k = OLY.k;
  return { p, terra: k([21, 39.9], 53, -16, [32, 49], p()), ginocchio: k([22.6, 34.5], 45, -12, [32.8, 41.6], p()),
    hang: k([25, 33.6], 32, -8, [32.6, 38.6], p()), spinta: k([29.6, 30.4], -8, 4, [31, 32.6], p(51.6), 1.2),
    fianchi: k([29.5, 31.4], -2, 0, [31.6, 34.4], p()) };
}
function girata(o) {
  const { p, terra, ginocchio, hang, spinta, fianchi } = tirataDaTerra(), k = OLY.k;
  const tirata = k([29.2, 32.4], 0, 0, [33.6, 23.5], p(), 1);
  const [ph, pt] = o.squat ? [[22, 44], 22] : [[26.8, 37], 14];
  const ricezione = k(ph, pt, -2, OLY.rack(ph, pt), p());
  const su = k([29.5, 31.4], 0, 0, OLY.rack([29.5, 31.4], 0), p());
  return braccioTeso(o.hang ? fluido([hang, spinta, tirata, ricezione, su, fianchi], [0, 0.12, 0.19, 0.27, o.squat ? 0.52 : 0.46, 0.72], o.ciclo)
    : fluido([terra, ginocchio, spinta, tirata, ricezione, su, fianchi, ginocchio], [0, 0.15, 0.25, 0.31, 0.39, o.squat ? 0.62 : 0.56, 0.74, 0.88], o.ciclo));
}
// Strappo (power snatch): stessa tirata, poi gomiti alti e la sbarra passa davanti al viso mentre il corpo scende sotto,
// ricezione a braccia tese sopra la testa in mezzo squat → in piedi → la sbarra torna davanti al viso, ai fianchi e a terra
function strappo(o) {
  const { p, terra, ginocchio, spinta, fianchi } = tirataDaTerra(), k = OLY.k;
  const tirata = k([29.2, 32.6], 0, -2, [34, 19], p(), 1);
  const sotto = k([28.4, 34.2], 4, -8, [34.6, 9.4], p(), 0.6);
  const ricezione = k([26.8, 37], 10, -6, OLY.sopra([26.8, 37], 10), p(), 0.6);
  const su = k([29.5, 31.4], 0, -4, OLY.sopra([29.5, 31.4], 0), p(), 0.6);
  const giu = k([29.5, 31.4], 0, -6, [37.5, 5], p(), 0.4);
  return braccioTeso(fluido([terra, ginocchio, spinta, tirata, sotto, ricezione, su, giu, fianchi, ginocchio],
    [0, 0.14, 0.23, 0.28, 0.32, 0.37, 0.55, 0.66, 0.76, 0.88], o.ciclo, 32));
}
// Slancio (clean and jerk): squat clean fino al front rack, poi jerk in sforbiciata: piegata → spinta sulle punte →
// gamba davanti avanti e gamba dietro sull'avampiede, braccia tese → rientro (prima il piede davanti, poi quello dietro) →
// in piedi con la sbarra sopra la testa → giù in rack, ai fianchi e a terra
function slancio(o) {
  const { p, terra, ginocchio, spinta, fianchi } = tirataDaTerra(true), k = OLY.k, P = OLY.piedi;
  const tirata = k([29.2, 32.4], 0, 0, [33.6, 23.5], p(), 1);
  const ricezione = k([22, 44], 22, -2, OLY.rack([22, 44], 22), p());
  const rack = k([29.5, 31.4], 0, 0, OLY.rack([29.5, 31.4], 0), p());
  const piegata = k([28.9, 34.6], 2, -4, OLY.rack([28.9, 34.6], 2), p());
  const sale = k([29.6, 30.6], -2, -10, [34.4, 9.6], p(51.6), 1);
  const sforbiciata = k([28, 36], 0, -4, OLY.sopra([28, 36], 0), [P(53, 38), { ik: [17.6, 51.4], toe: [20.9, 54.4] }], 0.6);
  const rientro = k([29, 34.2], 0, -4, OLY.sopra([29, 34.2], 0), [P(53, 33.5), { ik: [19.4, 51.4], toe: [22.7, 54.4] }], 0.6);
  const sopra = k([29.5, 31.4], 0, -4, OLY.sopra([29.5, 31.4], 0), p(), 0.6);
  const giu = k([29.5, 31.4], 0, -8, [37, 7], p(), 0.4);
  return braccioTeso(fluido([terra, ginocchio, spinta, tirata, ricezione, rack, piegata, sale, sforbiciata, rientro, sopra, giu, rack, fianchi, ginocchio],
    [0, 0.08, 0.13, 0.16, 0.2, 0.33, 0.42, 0.45, 0.48, 0.55, 0.62, 0.72, 0.77, 0.85, 0.93], o.ciclo, 48));
}

// Tapis roulant curvo: nastro a parabola, punto più basso in xc, punta davanti più alta
const CURVO = { x1: 6, x2: 46, xc: 21, y: 51.4, k: 0.0105 };
const curvaY = (c, x) => c.y - c.k * (x - c.xc) ** 2;
// Ellittica a trazione posteriore e stair climber (scala mobile con gradini da passo × alzata)
const ELL = { c: [10, 45], r: 6, perno: [37, 31], giu: 12, su: 11, lung: 30, k: 0.58 };
const SCALA = { x: 29, y: 42.5, passo: 7, alzata: 6 };          // dove appoggia la caviglia all'inizio del ciclo
const scalaY = x => SCALA.y - SCALA.alzata / SCALA.passo * (x - SCALA.x);
// GHD: cuscino del bacino (x1, x2, y del piano), caviglia tra i rulli · Reverse hyper: cuscino, maniglie, perno del pendolo
const GHD = { x1: 25.5, x2: 37, y: 33.6, piede: [52.3, 31.4] };
const RHY = { x1: 23, x2: 47, y: 31.8, mani: [47.6, 34.2], perno: [25.6, 33.4] };
const conMani = (o, mani) => { o.keys.forEach(k => { k.arms = mani; }); return o; };

/* ---------- Libreria delle animazioni ---------- */
// Chiavi della posa: hip, t (busto: 0 dritto, + in avanti) oppure nk (punto del collo),
// hd (testa rispetto al busto), legs/arms: {ik:[x,y], f:'w'|'n'|'t'|'h', b:±1} oppure {a:[sup, inf]},
// toe (punta del piede), sy (spalle sollevate), og e ogs (oggetto libero e sua scala). Una lista [davanti, dietro] separa i due arti.
export const POSE = {
  /* --- Gambe --- */
  squat: { nome: 'Squat a corpo libero', inizia: 'ecc', keys: [
    st({ t: 3, arms: { a: [8, 14] } }),
    st({ hip: [20.5, 43], t: 40, arms: { a: [86, 92] } })] },
  squat_bil: { nome: 'Squat con bilanciere dietro', inizia: 'ecc', props: [{ p: 'bil', at: 'w1', r: 4.6 }], keys: [
    st({ t: 4, arms: { ik: [-2.4, 2], f: 't', b: 1, libero: true } }),
    st({ hip: [20, 43], t: 44, arms: { ik: [-2.4, 2], f: 't', b: 1, libero: true } })] },
  front_squat: { nome: 'Front squat', inizia: 'ecc', props: [{ p: 'bil', at: 'w1' }], keys: [
    st({ t: 2, arms: { ik: [3.2, 1.2], f: 't', b: -1 } }),
    st({ hip: [22, 44], t: 22, arms: { ik: [3.2, 1.2], f: 't', b: -1 } })] },
  goblet: { nome: 'Goblet squat', inizia: 'ecc', props: [{ p: 'peso', at: 'w1', r: 2.8, off: [0.6, 1.2] }], keys: [
    st({ t: 2, arms: { ik: [4.2, 4.4], f: 't', b: -1 } }),
    st({ hip: [21.5, 44], t: 26, arms: { ik: [4.2, 4.4], f: 't', b: -1 } })] },
  overhead_squat: { nome: 'Overhead squat', inizia: 'ecc', sc: [0.86, 30, G], props: [{ p: 'bil', at: 'w1', r: 4.2 }], keys: [
    st({ t: 0, arms: { a: [181, 181] } }),
    st({ hip: [21.5, 43.5], t: 28, arms: { a: [166, 168] } })] },
  box_squat: { nome: 'Box squat', inizia: 'ecc', props: [{ p: 'bil', at: 'w1', r: 4.6 }, { p: 'box', x1: 9, x2: 22, y: 44.8 }], keys: [
    st({ t: 4, arms: { ik: [-2.4, 2], f: 't', b: 1, libero: true } }),
    st({ hip: [20, 42.6], t: 38, arms: { ik: [-2.4, 2], f: 't', b: 1, libero: true } })] },
  affondo: { nome: 'Affondo', inizia: 'ecc', keys: [
    { hip: [29, 32.6], t: 0, legs: [{ ik: [36.5, 53] }, { ik: [21.5, 52.2], toe: [24.6, 54.4] }], arms: { a: [3, 8] } },
    { hip: [28.5, 41.5], t: 2, legs: [{ ik: [36.5, 53] }, { ik: [21.5, 52.2], toe: [24.6, 54.4] }], arms: { a: [3, 8] } }] },
  affondo_man: { nome: 'Affondo con manubri', inizia: 'ecc', props: [{ p: 'man', at: 'w1' }, { p: 'man', at: 'w2' }], keys: [
    { hip: [29, 32.6], t: 0, legs: [{ ik: [36.5, 53] }, { ik: [21.5, 52.2], toe: [24.6, 54.4] }], arms: { a: [2, 2] } },
    { hip: [28.5, 41.5], t: 2, legs: [{ ik: [36.5, 53] }, { ik: [21.5, 52.2], toe: [24.6, 54.4] }], arms: { a: [2, 2] } }] },
  bulgaro: { nome: 'Bulgarian split squat', inizia: 'ecc', props: [{ p: 'panca', x1: 4, x2: 19, y: 43.5 }], keys: [
    { hip: [27.5, 33.2], t: 4, legs: [{ ik: [35, 53] }, { ik: [15.5, 41.4], toe: [11.8, 42.4], b: -1 }], arms: { a: [3, 8] } },
    { hip: [26.5, 41.6], t: 10, legs: [{ ik: [35, 53] }, { ik: [15.5, 41.4], toe: [11.8, 42.4], b: -1 }], arms: { a: [3, 8] } }] },
  step_up: { nome: 'Step-up', inizia: 'conc', props: [{ p: 'box', x1: 31, x2: 50, y: 42 }], keys: [
    { hip: [27.5, 32.5], t: 10, legs: [{ ik: [37, 40.6] }, { ik: [26, 53] }], arms: { a: [3, 8] } },
    { hip: [36.2, 19.5], t: 2, legs: [{ ik: [37, 40.6] }, { ik: [36, 33.5], b: 1 }], arms: { a: [3, 8] } }] },
  squat_jump: { nome: 'Squat jump', inizia: 'ecc', g: G, keys: [
    st({ arms: { a: [6, 10] } }),
    st({ hip: [22, 42], t: 36, arms: { a: [-40, -30] } }),
    { hip: [30, 24.5], t: 0, legs: { ik: [30, 46.3] }, arms: { a: [176, 178] }, toe: 'punta' }],
    seg: [0.55, 0.3, 0.55] },
  box_jump: { nome: 'Box jump', inizia: 'conc', sc: [0.86, 30, G], props: [{ p: 'box', x1: 33, x2: 53, y: 41.5 }], keys: [
    { hip: [15, 41.5], t: 38, legs: { ik: [24, 53] }, arms: { a: [-45, -35] } },
    { hip: [29, 21], t: 15, legs: { ik: [30, 37], b: 1 }, arms: { a: [150, 165] }, toe: 'punta' },
    { hip: [32, 31.5], t: 34, legs: { ik: [41, 40.4] }, arms: { a: [80, 88] } },
    { hip: [40.5, 19.6], t: 0, legs: { ik: [41, 40.4] }, arms: { a: [3, 8] } }],
    seg: [0.45, 0.35, 0.4, 0.9] },
  leg_press: { nome: 'Leg press', inizia: 'ecc', g: null, props: [{ p: 'linea', a: [6, 24], b: [22, 44] }, { p: 'linea', a: [22, 44], b: [40, 44] }, { p: 'piatto', at: 'a1', ang: 45 }], keys: [
    { hip: [21, 41.5], t: -52, legs: { ik: [36, 25.8], toe: 'perp' }, arms: { a: [20, 60] } },
    { hip: [21, 41.5], t: -52, legs: { ik: [29.5, 32.5], toe: 'perp' }, arms: { a: [20, 60] } }] },
  leg_ext: { nome: 'Leg extension', inizia: 'conc', props: [{ p: 'panca', x1: 16, x2: 35, y: 42.4 }, { p: 'linea', a: [17, 42.4], b: [13, 24] }, { p: 'rullo', at: 'a1' }], keys: [
    { hip: [21, 40.2], t: -8, legs: { a: [92, 2] }, arms: { a: [10, 40] } },
    { hip: [21, 40.2], t: -8, legs: { a: [92, 86] }, arms: { a: [10, 40] } }] },
  leg_curl: { nome: 'Leg curl sdraiato', inizia: 'conc', props: [{ p: 'panca', x1: 10, x2: 46, y: 45.6 }, { p: 'rullo', at: 'a1' }], keys: [
    { hip: [26, 43.4], t: 90, hd: -8, legs: { a: [-89, -89] }, arms: { a: [60, 95] } },
    { hip: [26, 43.4], t: 90, hd: -8, legs: { a: [-89, -170] }, arms: { a: [60, 95] } }] },
  leg_curl_seduto: { nome: 'Leg curl seduto', inizia: 'conc', props: [{ p: 'panca', x1: 16, x2: 35, y: 42.4 }, { p: 'linea', a: [17, 42.4], b: [13, 24] }, { p: 'rullo', at: 'a1' }], keys: [
    { hip: [21, 40.2], t: -8, legs: { a: [92, 82] }, arms: { a: [10, 40] } },
    { hip: [21, 40.2], t: -8, legs: { a: [92, -18] }, arms: { a: [10, 40] } }] },
  hack: { nome: 'Hack squat', inizia: 'ecc', g: G, props: [{ p: 'linea', a: [10, 4], b: [24, 47] }], keys: [
    { hip: [21.5, 32], t: -12, legs: { ik: [27, 53] }, arms: { a: [150, 170] } },
    { hip: [16, 42.5], t: 8, legs: { ik: [27, 53] }, arms: { a: [140, 175] } }] },
  calf: { nome: 'Calf raise', inizia: 'conc', keys: [
    st({ legs: { ik: [30, 53], toe: [33.6, 54.3] } }),
    st({ hip: [30, 28.8], legs: { ik: [30, 50.4], toe: [33.6, 54.3] } })] },
  calf_seduto: { nome: 'Calf seduto', inizia: 'conc', props: [{ p: 'panca', x1: 12, x2: 28, y: 41.8 }], keys: [
    { hip: [22, 39.6], t: 0, legs: { ik: [33, 53], toe: [36.6, 54.3], b: 1 }, arms: { a: [40, 70] } },
    { hip: [22, 37.8], t: 0, legs: { ik: [33, 51], toe: [36.6, 54.3], b: 1 }, arms: { a: [40, 70] } }] },
  adduttori: { nome: 'Adductor e abductor', vista: 'fronte', inizia: 'conc', props: [{ p: 'panca', x1: 18, x2: 42, y: 41 }], lenK: { th: 0.45 }, keys: [
    { hip: [30, 39], t: 0, legs: { a: [62, 2] }, arms: { a: [12, 4] } },
    { hip: [30, 39], t: 0, legs: { a: [20, 2] }, arms: { a: [12, 4] } }] },
  nordic: { nome: 'Nordic curl', inizia: 'ecc', props: [{ p: 'rullo', at: 'a1' }], keys: [
    { hip: [29, 40.6], t: 0, legs: { ik: [18, 52.6], b: -1, toe: [14.6, 53.8] }, arms: { a: [20, 60] } },
    { hip: [37.4, 46], t: 52, legs: { ik: [18, 52.6], b: -1, toe: [14.6, 53.8] }, arms: { a: [70, 100] } }] },

  /* --- Anca e schiena bassa --- */
  stacco: { nome: 'Stacco da terra', inizia: 'conc', props: [{ p: 'bil', at: 'w1' }], keys: [
    st({ hip: [21, 40.2], t: 56, hd: -18, arms: { ik: [32, 49], b: -1 } }),
    st({ t: -3, arms: { ik: [31.6, 34.4], b: -1 } })] },
  stacco_sumo: { nome: 'Stacco sumo', inizia: 'conc', props: [{ p: 'bil', at: 'w1' }], keys: [
    st({ hip: [23.5, 42.2], t: 40, hd: -12, legs: { ik: [31, 53] }, arms: { ik: [32.5, 49], b: -1 } }),
    st({ t: -3, legs: { ik: [31, 53] }, arms: { ik: [31.6, 34.4], b: -1 } })] },
  rdl: { nome: 'Stacco rumeno', inizia: 'ecc', props: [{ p: 'bil', at: 'w1' }], keys: [
    st({ arms: { a: [2, 4] } }),
    st({ hip: [23.5, 32.4], t: 74, hd: -14, legs: { ik: [30, 53] }, arms: { a: [-2, 0] } })] },
  rdl_man: { nome: 'Stacco rumeno con manubri', inizia: 'ecc', props: [{ p: 'man', at: 'w1' }, { p: 'man', at: 'w2' }], keys: [
    st({ arms: { a: [2, 4] } }),
    st({ hip: [23.5, 32.4], t: 74, hd: -14, legs: { ik: [30, 53] }, arms: { a: [-2, 0] } })] },
  good_morning: { nome: 'Good morning', inizia: 'ecc', props: [{ p: 'bil', at: 'w1', r: 4.6 }], keys: [
    st({ arms: { ik: [-2.4, 2], f: 't', b: 1, libero: true } }),
    st({ hip: [24, 32.2], t: 72, hd: -12, arms: { ik: [-2.4, 2], f: 't', b: 1, libero: true } })] },
  swing: { nome: 'Swing russo', inizia: 'conc', props: [{ p: 'kb', at: 'w1' }], keys: [
    st({ hip: [23, 33.5], t: 62, hd: -14, arms: { a: [-28, -28] } }),
    st({ t: -4, arms: { a: [92, 92] } })], tempo: '0.6-0-0.5-0' },
  swing_am: { nome: 'Swing americano', inizia: 'conc', sc: [0.88, 30, G], props: [{ p: 'kb', at: 'w1' }], keys: [
    st({ hip: [23, 33.5], t: 62, hd: -14, arms: { a: [-28, -28] } }),
    st({ t: -5, arms: { a: [176, 176] } })], tempo: '0.7-0-0.6-0.1' },
  snatch_kb: { nome: 'Snatch con kettlebell', inizia: 'conc', sc: [0.88, 30, G], props: [{ p: 'kb', at: 'w1' }], keys: [
    st({ hip: [23, 33.5], t: 62, hd: -14, arms: { a: [-28, -28] } }),
    st({ t: -3, arms: { a: [105, 168] } }),
    st({ t: -2, arms: { a: [179, 179] } })], seg: [0.45, 0.3, 0.9] },
  hip_thrust: { nome: 'Hip thrust', inizia: 'conc', props: [{ p: 'panca', x1: 4, x2: 17, y: 42.6 }, { p: 'bil', at: 'hip', off: [0, -2.6] }], keys: [
    { hip: [26.5, 48], nk: [15.5, 40.6], hd: 22, legs: { ik: [37.5, 53], b: 1 }, arms: { ik: [0, -2.6], f: 'h', b: 1 } },
    { hip: [29.8, 40.4], nk: [15.5, 40.4], hd: 30, legs: { ik: [37.5, 53], b: 1 }, arms: { ik: [0, -2.6], f: 'h', b: 1 } }] },
  ponte: { nome: 'Ponte glutei', inizia: 'conc', keys: [
    { hip: [27, 50.8], nk: [12, 50.8], hd: 8, legs: { ik: [36.5, 53], b: 1 }, arms: { a: [86, 88] } },
    { hip: [28.6, 44.2], nk: [13.4, 50.4], hd: 14, legs: { ik: [36.5, 53], b: 1 }, arms: { a: [86, 88] } }] },
  hyper: { nome: 'Hyperextension', inizia: 'conc', props: [{ p: 'linea', a: [24, 43], b: [33, 35] }, { p: 'linea', a: [12, 54.5], b: [29, 39] }, { p: 'rullo', at: 'a1' }], keys: [
    { hip: [30.5, 37.5], t: 135, hd: -10, legs: { ik: [15, 51.5], toe: 'perp' }, arms: { ik: [2, 3], f: 't', b: -1 } },
    { hip: [30.5, 37.5], t: 46, hd: 0, legs: { ik: [15, 51.5], toe: 'perp' }, arms: { ik: [2, 3], f: 't', b: -1 } }] },
  kickback_glutei: { nome: 'Kickback glutei ai cavi', inizia: 'conc', props: [{ p: 'cavo', at: 'a2', to: [4, 52] }], keys: [
    { hip: [30, 31.4], t: 12, legs: [{ ik: [30, 53] }, { a: [2, -35] }], arms: { a: [48, 78] } },
    { hip: [30, 31.4], t: 18, legs: [{ ik: [30, 53] }, { a: [-42, -48] }], arms: { a: [48, 78] } }] },

  /* --- Spinta orizzontale --- */
  push: { nome: 'Piegamento', inizia: 'ecc', keys: [
    { ...linea([8, 52.6], 27.5), hd: -6, legs: { ik: [8, 52.6], toe: [9.4, 54.4] }, arms: { ik: [41.5, 53.2], b: -1 } },
    { ...linea([8, 52.6], 6), hd: -6, legs: { ik: [8, 52.6], toe: [9.4, 54.4] }, arms: { ik: [41.5, 53.2], b: -1 } }] },
  push_rialzo: { nome: 'Piegamento su rialzo', inizia: 'ecc', props: [{ p: 'box', x1: 38, x2: 52, y: 42 }], keys: [
    { ...linea([8.5, 52.6], 40.5), hd: -6, legs: { ik: [8.5, 52.6], toe: [9.9, 54.4] }, arms: { ik: [42, 41.8], b: -1 } },
    { ...linea([8.5, 52.6], 23.5), hd: -6, legs: { ik: [8.5, 52.6], toe: [9.9, 54.4] }, arms: { ik: [42, 41.8], b: -1 } }] },
  push_declinato: { nome: 'Piegamento declinato', inizia: 'ecc', props: [{ p: 'box', x1: 3, x2: 17, y: 43.6 }], keys: [
    { ...linea([11, 42.2], 10.5), hd: -6, legs: { ik: [11, 42.2], toe: [12.4, 44] }, arms: { ik: [44.5, 53.2], b: -1 } },
    { ...linea([11, 42.2], -6.5), hd: -6, legs: { ik: [11, 42.2], toe: [12.4, 44] }, arms: { ik: [44.5, 53.2], b: -1 } }] },
  plank: { nome: 'Plank', inizia: 'ecc', tenuta: 0, keys: [
    { ...linea([7, 52.6], 13.2), hd: -6, legs: { ik: [7, 52.6], toe: [8.4, 54.4] }, arms: { ik: [50.4, 53.3], b: -1 } }] },
  plank_lat: { nome: 'Plank laterale', vista: 'fronte', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [27, 44.9], t: 72, hd: 0, legs: { a: [-7, 0] }, arms: [{ a: [252, 252] }, { ik: [44.5, 54], f: 'w', b: 1 }] }] },
  mountain: { nome: 'Mountain climber', inizia: 'conc', keys: [
    { ...linea([8, 52.6], 26), hd: -6, legs: [{ ik: [8, 52.6], toe: [9.4, 54.4] }, { ik: [30, 49.5], toe: 'perp' }], arms: { ik: [41.5, 53.2], b: -1 } },
    { ...linea([8, 52.6], 26), hd: -6, legs: [{ ik: [30, 49.5], toe: 'perp' }, { ik: [8, 52.6], toe: [9.4, 54.4] }], arms: { ik: [41.5, 53.2], b: -1 } }], tempo: '0.35-0-0.35-0' },
  ab_wheel: { nome: 'Ab wheel', inizia: 'ecc', props: [{ p: 'ruota', at: 'w1' }], keys: [
    { hip: [22.5, 43.5], t: 50, hd: -12, legs: { ik: [10, 52.6], b: -1, toe: [6.6, 53.8] }, arms: { ik: [33, 52], b: -1 } },
    { hip: [28.5, 46.6], t: 82, hd: -12, legs: { ik: [10, 52.6], b: -1, toe: [6.6, 53.8] }, arms: { ik: [51.5, 52], b: -1 } }] },
  burpee: { nome: 'Burpee', inizia: 'conc', sc: [0.9, 30, G], keys: [
    st({ arms: { a: [5, 10] } }),
    { hip: [24, 44.5], t: 58, hd: -10, legs: { ik: [30, 53] }, arms: { ik: [40, 53.2], b: -1 } },
    { hip: [27, 43.2], t: 70, hd: -8, legs: { ik: [10, 48.6], toe: 'punta' }, arms: { ik: [40, 53.2], b: -1 } },   // salto indietro: piedi in volo
    { ...linea([8, 52.6], 6), hd: -6, legs: { ik: [8, 52.6], toe: [9.4, 54.4] }, arms: { ik: [40, 53.2], b: -1 } },
    { hip: [27, 43.2], t: 70, hd: -8, legs: { ik: [10, 48.6], toe: 'punta' }, arms: { ik: [40, 53.2], b: -1 } },   // salto in avanti
    { hip: [24, 44.5], t: 58, hd: -10, legs: { ik: [30, 53] }, arms: { ik: [40, 53.2], b: -1 } },
    { hip: [30, 25], t: 0, legs: { ik: [30, 46.5] }, arms: { a: [176, 178] }, toe: 'punta' }],
    seg: [0.45, 0.2, 0.2, 0.2, 0.2, 0.4, 0.5] },

  /* --- Panca --- */
  panca: { nome: 'Panca piana con bilanciere', inizia: 'ecc', props: [{ p: 'panca', x1: 5, x2: 33, y: 44.2 }, { p: 'bil', at: 'w1' }], keys: [
    { hip: [29, 41.8], t: -90, hd: 4, legs: { ik: [40, 53], b: 1 }, arms: { ik: [15.5, 24.6], b: 1 } },
    { hip: [29, 41.8], t: -90, hd: 4, legs: { ik: [40, 53], b: 1 }, arms: { ik: [17.5, 36.2], b: 1 } }] },
  panca_man: { nome: 'Panca con manubri', inizia: 'ecc', props: [{ p: 'panca', x1: 5, x2: 33, y: 44.2 }, { p: 'man', at: 'w1' }], keys: [
    { hip: [29, 41.8], t: -90, hd: 4, legs: { ik: [40, 53], b: 1 }, arms: { ik: [15.5, 24.6], b: 1 } },
    { hip: [29, 41.8], t: -90, hd: 4, legs: { ik: [40, 53], b: 1 }, arms: { ik: [16, 37.4], b: 1 } }] },
  panca_incl: { nome: 'Panca inclinata', inizia: 'ecc', props: [{ p: 'linea', a: [29, 44], b: [12, 30] }, { p: 'linea', a: [29, 44], b: [29, 54.5] }, { p: 'bil', at: 'w1' }], keys: [
    { hip: [28.5, 41.6], t: -55, hd: 8, legs: { ik: [40, 53], b: 1 }, arms: { ik: [21, 16.8], b: 1 } },
    { hip: [28.5, 41.6], t: -55, hd: 8, legs: { ik: [40, 53], b: 1 }, arms: { ik: [20.5, 28.5], b: 1 } }] },
  chest_press: { nome: 'Chest press', inizia: 'conc', props: [{ p: 'panca', x1: 14, x2: 30, y: 42.4 }, { p: 'linea', a: [15, 42.4], b: [12, 20] }, { p: 'cavo', at: 'w1', to: [52, 22] }], keys: [
    { hip: [19, 40.2], t: -6, legs: { ik: [33, 53], b: 1 }, arms: { ik: [26.5, 25.6], b: -1 } },
    { hip: [19, 40.2], t: -6, legs: { ik: [33, 53], b: 1 }, arms: { ik: [34.8, 25.6], b: -1 } }] },
  croci: { nome: 'Croci e pec deck', vista: 'fronte', inizia: 'conc', props: [{ p: 'man', at: 'w1' }, { p: 'man', at: 'w2' }], keys: [
    st({ legs: { a: [6, 4] }, arms: { a: [96, 102] } }),
    st({ legs: { a: [6, 4] }, arms: { a: [62, -88] } })] },
  pullover: { nome: 'Pullover', inizia: 'ecc', props: [{ p: 'panca', x1: 11, x2: 39, y: 44.2 }, { p: 'peso', at: 'w1', r: 2.6 }], keys: [
    { hip: [35, 41.8], t: -90, hd: 4, legs: { ik: [46, 53], b: 1 }, arms: { a: [192, 200] } },
    { hip: [35, 41.8], t: -90, hd: 4, legs: { ik: [46, 53], b: 1 }, arms: { a: [252, 262] } }] },

  /* --- Spinta verticale --- */
  press: { nome: 'Military press', inizia: 'conc', sc: [0.86, 30, G], props: [{ p: 'bil', at: 'w1', r: 4.2 }], keys: [
    st({ t: -3, hd: -6, arms: { ik: [3.4, 2.2], f: 't', b: -1 } }),
    st({ t: 0, arms: { a: [179, 179] } })] },
  press_man: { nome: 'Lento con manubri', inizia: 'conc', sc: [0.86, 30, G], props: [{ p: 'panca', x1: 16, x2: 34, y: 42.4 }, { p: 'man', at: 'w1' }], keys: [
    { hip: [26, 40.2], t: -4, legs: { ik: [38, 53], b: 1 }, arms: { a: [20, 178] } },
    { hip: [26, 40.2], t: -4, legs: { ik: [38, 53], b: 1 }, arms: { a: [176, 178] } }] },
  push_press: { nome: 'Push press', inizia: 'conc', sc: [0.86, 30, G], props: [{ p: 'bil', at: 'w1', r: 4.6 }], keys: [
    st({ t: -2, arms: { ik: [3.4, 2.2], f: 't', b: -1 } }),
    st({ hip: [27.5, 35.5], t: 4, arms: { ik: [3.4, 2.2], f: 't', b: -1 } }),
    st({ t: 0, arms: { a: [179, 179] } })], seg: [0.45, 0.35, 1] },
  thruster: { nome: 'Thruster', inizia: 'ecc', sc: [0.86, 30, G], props: [{ p: 'bil', at: 'w1', r: 4.6 }], keys: [
    st({ t: 2, arms: { ik: [3.2, 1.6], f: 't', b: -1 } }),
    st({ hip: [22, 44], t: 22, arms: { ik: [3.2, 1.6], f: 't', b: -1 } }),
    st({ t: 0, arms: { a: [179, 179] } })], seg: [0.9, 0.7, 0.8] },
  wall_ball: { nome: 'Wall ball', inizia: 'ecc', sc: [0.86, 30, G], props: [{ p: 'muro', x: 52 }, { p: 'palla', at: 'w1' }], keys: [
    st({ t: 2, arms: { ik: [4.6, 3.6], f: 't', b: -1 } }),
    st({ hip: [21.5, 44], t: 26, arms: { ik: [4.6, 3.6], f: 't', b: -1 } }),
    st({ t: -2, arms: { a: [160, 162] } })], seg: [0.9, 0.6, 0.8] },
  pike: { nome: 'Pike push-up', inizia: 'ecc', keys: [
    { hip: [22, 33], t: 109, hd: 0, legs: { ik: [12, 52.6], toe: [13.4, 54.4] }, arms: { ik: [35, 53.2], b: -1 } },
    { hip: [23, 34], t: 138, hd: 0, legs: { ik: [12, 52.6], toe: [13.4, 54.4] }, arms: { ik: [35, 53.2], b: -1 } }] },
  pike_rialzato: { nome: 'Pike push-up piedi rialzati', inizia: 'ecc', props: [{ p: 'box', x1: 4, x2: 19, y: 39 }], keys: [
    { hip: [27, 25], t: 158, hd: 0, legs: { ik: [14, 37.6], toe: [15.4, 39.4] }, arms: { ik: [33.5, 53.2], b: -1 } },
    { hip: [28, 27], t: 172, hd: 0, legs: { ik: [14, 37.6], toe: [15.4, 39.4] }, arms: { ik: [33.5, 53.2], b: -1 } }] },
  hspu: { nome: 'Verticale al muro con piegamento', inizia: 'ecc', sc: [0.84, 30, G], props: [{ p: 'muro', x: 45.5 }], keys: [
    { hip: [40.8, 22.2], t: 181, hd: 0, legs: { a: [176, 178] }, arms: { ik: [38.5, 53.2], b: 1 } },
    { hip: [40, 28], t: 178, hd: 0, legs: { a: [174, 176] }, arms: { ik: [38.5, 53.2], b: 1 } }] },
  verticale: { nome: 'Verticale al muro', inizia: 'ecc', sc: [0.84, 30, G], tenuta: 0, props: [{ p: 'muro', x: 45.5 }], keys: [
    { hip: [40.8, 22.2], t: 181, hd: 0, legs: { a: [176, 178] }, arms: { ik: [38.5, 53.2], b: 1 } }] },

  /* --- Trazioni e tirate --- */
  trazione: { nome: 'Trazione alla sbarra', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'sbarra', x: 31.5, y: 4 }], keys: [
    { hip: [30.1, 35.3], t: 0, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [28.6, 22.4], t: -9, hd: 6, legs: { a: [12, -12] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  trazione_zav: { nome: 'Trazione zavorrata', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'sbarra', x: 31.5, y: 4 }, { p: 'peso', at: 'hip', r: 3, off: [1.5, 6] }], keys: [
    { hip: [30.1, 35.3], t: 0, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [28.6, 22.4], t: -9, hd: 6, legs: { a: [12, -12] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  dead_hang: { nome: 'Sospensione alla sbarra', inizia: 'conc', g: null, sc: [0.86, 30, 4], tenuta: 0, props: [{ p: 'sbarra', x: 31.5, y: 4 }], keys: [
    { hip: [30.1, 35.3], t: 0, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  scapolari: { nome: 'Trazioni scapolari', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'sbarra', x: 31.5, y: 4 }], keys: [
    { hip: [30.1, 35.3], t: 0, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [29.7, 32.6], t: -4, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  muscle_up: { nome: 'Muscle up', inizia: 'conc', g: null, sc: [0.72, 30, 30], props: [{ p: 'sbarra', x: 31, y: 18 }], keys: [
    { hip: [30, 49.4], t: 0, legs: { a: [6, -6] }, arms: { ik: [31, 18.2] } },
    { hip: [26.5, 38], t: -18, hd: 8, legs: { a: [30, 10] }, arms: { ik: [31, 18.2] } },
    { hip: [24.6, 24.4], t: 30, hd: -10, legs: { a: [-4, -24] }, arms: { ik: [31, 18.2] } },
    { hip: [30.4, 14.9], t: 4, legs: { a: [8, -6] }, arms: { ik: [31, 18.2] } },
    { hip: [26, 34], t: -6, legs: { a: [10, -4] }, arms: { ik: [31, 18.2] } }],
    seg: [0.7, 0.35, 0.6, 0.6, 0.6] },
  trazione_aus: { nome: 'Trazione australiana', inizia: 'conc', props: [{ p: 'sbarra', x: 27, y: 24.5, basso: true }], keys: [
    { ...linea([48.5, 52.6], 155), hd: 4, legs: { ik: [48.5, 52.6], toe: [48.1, 49.2] }, arms: { ik: [27, 24.7] } },
    { ...linea([48.5, 52.6], 134.0), hd: 4, legs: { ik: [48.5, 52.6], toe: [48.1, 49.2] }, arms: { ik: [27, 24.7] } }] },
  lat: { nome: 'Lat machine', inizia: 'conc', props: [{ p: 'panca', x1: 18, x2: 34, y: 42.4 }, { p: 'cavo', at: 'w1', to: [30, 1] }, { p: 'maniglia', at: 'w1' }, { p: 'rullo', at: 'k1', off: [0, -2.4] }], keys: [
    { hip: [26, 40.2], t: -8, legs: { ik: [36, 53], b: 1 }, arms: { ik: [28.8, 9.8], b: 1 } },
    { hip: [26, 40.2], t: -16, legs: { ik: [36, 53], b: 1 }, arms: { ik: [29.8, 22.6], b: 1 } }] },
  pulley: { nome: 'Pulley basso', inizia: 'conc', props: [{ p: 'panca', x1: 12, x2: 30, y: 47.8 }, { p: 'linea', a: [44, 54.5], b: [44, 40] }, { p: 'cavo', at: 'w1', to: [54, 43] }, { p: 'maniglia', at: 'w1' }], keys: [
    { hip: [21, 45.6], t: 16, legs: { ik: [42.5, 47.5], b: 1, toe: 'perp' }, arms: { ik: [40.5, 36.6], b: -1 } },
    { hip: [21, 45.6], t: -6, legs: { ik: [42.5, 47.5], b: 1, toe: 'perp' }, arms: { ik: [27.5, 37], b: -1 } }] },
  rematore: { nome: 'Rematore con bilanciere', inizia: 'conc', props: [{ p: 'bil', at: 'w1' }], keys: [
    st({ hip: [23, 32.6], t: 66, hd: -14, arms: { a: [2, 2] } }),
    st({ hip: [23, 32.6], t: 66, hd: -14, arms: { ik: [32.5, 39.2], b: -1 } })] },
  rematore_man: { nome: 'Rematore con manubrio', inizia: 'conc', props: [{ p: 'man', at: 'w1' }, { p: 'panca', x1: 30, x2: 50, y: 42 }], keys: [
    { hip: [23, 32], t: 76, hd: -14, legs: { ik: [24, 53] }, arms: [{ a: [2, 2] }, { ik: [41, 41.6], b: -1 }] },
    { hip: [23, 32], t: 76, hd: -14, legs: { ik: [24, 53] }, arms: [{ ik: [33, 37.6], b: -1 }, { ik: [41, 41.6], b: -1 }] }] },
  face_pull: { nome: 'Face pull', inizia: 'conc', sc: [0.92, 30, G], props: [{ p: 'cavo', at: 'w1', to: [55, 11] }, { p: 'maniglia', at: 'w1' }], keys: [
    st({ t: -4, arms: { ik: [45.5, 13.5], b: -1 } }),
    st({ t: -6, arms: { ik: [34, 11.8], b: 1 } })] },
  straight_pulldown: { nome: 'Pulldown a braccia tese', inizia: 'conc', props: [{ p: 'cavo', at: 'w1', to: [52, 4] }, { p: 'maniglia', at: 'w1' }], keys: [
    st({ hip: [28, 31.8], t: 22, legs: { ik: [29, 53] }, arms: { a: [148, 150] } }),
    st({ hip: [28, 31.8], t: 22, legs: { ik: [29, 53] }, arms: { a: [22, 24] } })] },
  shrug: { nome: 'Scrollate', vista: 'fronte', inizia: 'conc', props: [{ p: 'man', at: 'w1' }, { p: 'man', at: 'w2' }], keys: [
    st({ legs: { a: [6, 4] }, arms: { a: [8, 6] } }),
    st({ legs: { a: [6, 4] }, arms: { a: [8, 6] }, sy: 2.6 })] },

  /* --- Dip --- */
  dip: { nome: 'Dip alle parallele', inizia: 'ecc', sc: [0.8, 30, G], props: [{ p: 'parallele', x1: 10, x2: 52, y: 20.7 }], keys: [
    { hip: [30.3, 16.3], t: 4, legs: { a: [-4, -46] }, arms: { ik: [31.5, 19.6] } },
    { hip: [29.8, 23.3], t: 22, hd: -6, legs: { a: [-10, -56] }, arms: { ik: [31.5, 19.6] } }] },
  sostegno_parallele: { nome: 'Sostegno alle parallele', inizia: 'ecc', sc: [0.8, 30, G], tenuta: 0, props: [{ p: 'parallele', x1: 10, x2: 52, y: 20.7 }], keys: [
    { hip: [30.3, 16.3], t: 4, legs: { a: [-4, -46] }, arms: { ik: [31.5, 19.6] } }] },
  dip_panca: { nome: 'Dip alla panca', inizia: 'ecc', props: [{ p: 'panca', x1: 3, x2: 16, y: 38.6 }], keys: [
    { hip: [18, 36.6], t: -2, legs: { ik: [31, 53], b: 1 }, arms: { ik: [15, 38.4], b: -1 } },
    { hip: [18.2, 43], t: 4, legs: { ik: [31, 53], b: 1 }, arms: { ik: [15, 38.4], b: -1 } }] },

  /* --- Anelli --- */
  dip_anelli: { nome: 'Dip agli anelli', inizia: 'ecc', sc: [0.8, 30, G], props: [{ p: 'anelli', at: 'w2', ay: -40 }, { p: 'anelli', at: 'w1', ay: -40 }], keys: [
    { hip: [30.3, 16.3], t: 4, legs: { a: [-4, -46] }, arms: { ik: [31.5, 19.6] } },
    { hip: [29.8, 23.3], t: 22, hd: -6, legs: { a: [-10, -56] }, arms: { ik: [31.5, 19.6] } }] },
  sostegno_anelli: { nome: 'Sostegno agli anelli', inizia: 'ecc', sc: [0.8, 30, G], tenuta: 0, props: [{ p: 'anelli', at: 'w2', ay: -40 }, { p: 'anelli', at: 'w1', ay: -40 }], keys: [
    { hip: [30.3, 16.3], t: 4, legs: { a: [-4, -46] }, arms: { ik: [31.5, 19.6] } }] },
  trazione_anelli: { nome: 'Trazione agli anelli', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'anelli', at: 'w2', ay: -40 }, { p: 'anelli', at: 'w1', ay: -40 }], keys: [
    { hip: [30.1, 35.3], t: 0, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2] } },
    { hip: [28.6, 22.4], t: -9, hd: 6, legs: { a: [12, -12] }, arms: { ik: [31.5, 4.2] } }] },
  rematore_anelli: { nome: 'Rematore agli anelli', inizia: 'conc', props: [{ p: 'anelli', at: 'w2', ay: -40 }, { p: 'anelli', at: 'w1', ay: -40 }], keys: [
    { ...linea([48.5, 52.6], 155), hd: 4, legs: { ik: [48.5, 52.6], toe: [48.1, 49.2] }, arms: { ik: [27, 24.7] } },
    { ...linea([48.5, 52.6], 133.6), hd: 4, legs: { ik: [48.5, 52.6], toe: [48.1, 49.2] }, arms: { ik: [27, 24.7] } }] },
  muscle_up_anelli: { nome: 'Muscle up agli anelli', inizia: 'conc', g: null, sc: [0.72, 30, 30], props: [{ p: 'anelli', at: 'w2', ay: -40 }, { p: 'anelli', at: 'w1', ay: -40 }], keys: [
    { hip: [30, 49.4], t: 0, legs: { a: [6, -6] }, arms: { ik: [31, 18.2] } },
    { hip: [26.5, 38], t: -18, hd: 8, legs: { a: [30, 10] }, arms: { ik: [31, 18.2] } },
    { hip: [24.6, 24.4], t: 30, hd: -10, legs: { a: [-4, -24] }, arms: { ik: [31, 18.2] } },
    { hip: [30.4, 14.9], t: 4, legs: { a: [8, -6] }, arms: { ik: [31, 18.2] } },
    { hip: [26, 34], t: -6, legs: { a: [10, -4] }, arms: { ik: [31, 18.2] } }],
    seg: [0.7, 0.35, 0.6, 0.6, 0.6] },

  /* --- Braccia --- */
  curl: { nome: 'Curl con bilanciere', inizia: 'conc', props: [{ p: 'bil', at: 'w1', r: 4.4 }], keys: [
    st({ arms: { a: [3, 6] } }),
    st({ arms: { a: [6, 150] } })] },
  curl_man: { nome: 'Curl con manubri', inizia: 'conc', props: [{ p: 'man', at: 'w1' }, { p: 'man', at: 'w2' }], keys: [
    st({ arms: { a: [3, 6] } }),
    st({ arms: { a: [6, 148] } })] },
  curl_scott: { nome: 'Curl alla panca Scott', inizia: 'conc', props: [{ p: 'linea', a: [33, 22], b: [41, 31] }, { p: 'bil', at: 'w1', r: 4.2 }], keys: [
    { hip: [26, 38.6], t: 8, legs: { ik: [32, 53], b: 1 }, arms: { a: [42, 46] } },
    { hip: [26, 38.6], t: 8, legs: { ik: [32, 53], b: 1 }, arms: { a: [42, 168] } }] },
  pushdown: { nome: 'Push-down ai cavi', inizia: 'conc', props: [{ p: 'cavo', at: 'w1', to: [38, 1] }, { p: 'maniglia', at: 'w1' }], keys: [
    st({ t: 8, arms: { a: [6, 112] } }),
    st({ t: 8, arms: { a: [6, 8] } })] },
  french: { nome: 'French press', inizia: 'ecc', props: [{ p: 'panca', x1: 5, x2: 33, y: 44.2 }, { p: 'bil', at: 'w1', r: 4 }], keys: [
    { hip: [29, 41.8], t: -90, hd: 4, legs: { ik: [40, 53], b: 1 }, arms: { a: [194, 194] } },
    { hip: [29, 41.8], t: -90, hd: 4, legs: { ik: [40, 53], b: 1 }, arms: { a: [194, 292] } }] },
  estensioni: { nome: 'Estensioni sopra la testa', inizia: 'ecc', sc: [0.88, 30, G], props: [{ p: 'peso', at: 'w1', r: 2.4 }], keys: [
    st({ arms: { a: [178, 178] } }),
    st({ arms: { a: [174, 330] } })] },
  kickback: { nome: 'Kickback tricipiti', inizia: 'conc', props: [{ p: 'man', at: 'w1' }], keys: [
    st({ hip: [23, 32.6], t: 70, hd: -12, arms: { a: [-80, 4] } }),
    st({ hip: [23, 32.6], t: 70, hd: -12, arms: { a: [-84, -86] } })] },

  /* --- Spalle --- */
  alzate_lat: { nome: 'Alzate laterali', vista: 'fronte', inizia: 'conc', props: [{ p: 'man', at: 'w1' }, { p: 'man', at: 'w2' }], keys: [
    st({ legs: { a: [6, 4] }, arms: { a: [14, 16] } }),
    st({ legs: { a: [6, 4] }, arms: { a: [86, 90] } })] },
  alzate_front: { nome: 'Alzate frontali', inizia: 'conc', props: [{ p: 'man', at: 'w1' }], keys: [
    st({ arms: { a: [4, 8] } }),
    st({ arms: { a: [92, 96] } })] },
  alzate_post: { nome: 'Alzate posteriori', vista: 'fronte', inizia: 'conc', lenK: { tr: 0.62 }, props: [{ p: 'man', at: 'w1' }, { p: 'man', at: 'w2' }], keys: [
    st({ hip: [30, 31.4], hd: 0, legs: { a: [8, 2] }, arms: { a: [6, 8] } }),
    st({ hip: [30, 31.4], hd: 0, legs: { a: [8, 2] }, arms: { a: [84, 88] } })] },

  /* --- Addome --- */
  hollow: { nome: 'Hollow body hold', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [31, 50.6], t: -72, hd: 14, legs: { a: [102, 102], toe: 'punta' }, arms: { a: [254, 254] } }] },
  crunch: { nome: 'Crunch', inizia: 'conc', keys: [
    { hip: [28, 50.8], t: -90, hd: 8, legs: { ik: [39, 53], b: 1 }, arms: { ik: [-1, -5.5], f: 't', b: -1 } },
    { hip: [28, 50.8], t: -58, hd: 16, legs: { ik: [39, 53], b: 1 }, arms: { ik: [-1, -5.5], f: 't', b: -1 } }] },
  situp: { nome: 'Sit-up', inizia: 'conc', keys: [
    { hip: [28, 50.8], t: -90, hd: 8, legs: { ik: [39, 53], b: 1 }, arms: { ik: [-1, -5.5], f: 't', b: -1 } },
    { hip: [28, 50.8], t: -6, hd: 8, legs: { ik: [39, 53], b: 1 }, arms: { ik: [-1, -5.5], f: 't', b: -1 } }] },
  leg_raise: { nome: 'Leg raise alla sbarra', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'sbarra', x: 31.5, y: 4 }], keys: [
    { hip: [30.1, 35.3], t: 0, legs: { a: [4, 2] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [28.7, 34.3], t: -10, legs: { a: [92, 92] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  knee_raise: { nome: 'Knee raise alla sbarra', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'sbarra', x: 31.5, y: 4 }], keys: [
    { hip: [30.1, 35.3], t: 0, legs: { a: [4, 2] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [29.4, 34.7], t: -8, legs: { a: [110, 8] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  dead_bug: { nome: 'Dead bug', inizia: 'conc', keys: [
    { hip: [30, 50.8], t: -90, hd: 8, legs: { a: [180, 90] }, arms: { a: [180, 180] } },
    { hip: [30, 50.8], t: -90, hd: 8, legs: [{ a: [180, 90] }, { a: [100, 100] }], arms: [{ a: [256, 256] }, { a: [180, 180] }] }] },
  pallof: { nome: 'Pallof press', inizia: 'conc', props: [{ p: 'cavo', at: 'w1', to: [30, 24], lato: true }], keys: [
    st({ arms: { ik: [3, 7.4], f: 't', b: -1 } }),
    st({ arms: { ik: [46.5, 23.2], b: -1 } })] },

  /* --- Cardio --- */
  tapis_camminata: { nome: 'Camminata sul tapis roulant', inizia: 'conc', props: [{ p: 'tapis', x1: 5, x2: 47, y: 50.8 }],
    ...andatura({ hip: [25, 28.55], cav: 49.5, avanti: 8.4, passo: 14, appoggio: 0.6, ciclo: 1.1, alza: 3, tallone: 1.4, mol: -0.84, t: 2, br: [22, 18] }) },
  tapis_corsa: { nome: 'Corsa sul tapis roulant', inizia: 'conc', props: [{ p: 'tapis', x1: 5, x2: 47, y: 50.8 }],
    ...andatura({ hip: [24, 28.45], cav: 49.5, avanti: 5, passo: 20, appoggio: 0.36, ciclo: 0.73, alza: 9, tallone: 2, mol: 0.5, t: 8, br: [28, 78, 0.1] }) },
  tapis_curvo: { nome: 'Corsa sul tapis roulant curvo', inizia: 'conc', props: [{ p: 'curvo', ...CURVO }],
    ...andatura({ hip: [25, 27.6], suolo: x => curvaY(CURVO, x) - 1.3, avanti: 5, passo: 20, appoggio: 0.34, ciclo: 0.72, alza: 9, tallone: 1.6, avampiede: 1.2, mol: 0.8, t: 11, br: [28, 78, 0.1] }) },
  cyclette: { nome: 'Cyclette', inizia: 'conc', props: [{ p: 'cyclette', c: [30, 47.5], sella: [23, 32], manubrio: [43.5, 24.5], volano: [42, 47, 5.5] },
    { p: 'pedivella', at: 'a2', c: [30, 47.5], dietro: true }, { p: 'pedivella', at: 'a1', c: [30, 47.5] }],
    ...pedalata({ hip: [24.5, 29.6], t: 20, hd: -4, c: [30, 47.5], r: 4.2, mani: [43.5, 24.5], giri: 80 }) },
  spinning: { nome: 'Bici da spinning', inizia: 'conc', props: [{ p: 'cyclette', c: [28, 47.5], sella: [21, 32], manubrio: [46.4, 26], volano: [41, 46.5, 6.5], pesante: true },
    { p: 'pedivella', at: 'a2', c: [28, 47.5], dietro: true }, { p: 'pedivella', at: 'a1', c: [28, 47.5] }],
    ...pedalata({ hip: [22.5, 29.6], t: 40, hd: -22, c: [28, 47.5], r: 4.2, mani: [46.4, 26], giri: 95 }) },
  ellittica: { nome: 'Ellittica', inizia: 'conc', sc: [0.84, 30, G], props: [{ p: 'ellittica', ...ELL },
    { p: 'braccioEll', lato: 2, ...ELL, dietro: true }, { p: 'braccioEll', lato: 1, ...ELL }],
    ...ellittica({ ...ELL, hip: [26, 23.4], mol: 0.6, t: 4, hd: -4, giri: 60 }) },
  stair_climber: { nome: 'Stair climber', inizia: 'conc', props: [{ p: 'scala', ...SCALA, mani: [33, 31] }],
    ...conMani(andatura({ hip: [24, 30.2], suolo: scalaY, piano: true, avanti: 5, passo: SCALA.passo, appoggio: 0.62, ciclo: 1.7, alza: 4.5, tallone: 1.2, mol: -0.6, t: 10, br: [0, 0] }), { ik: [33, 31] }) },
  air_bike: { nome: 'Air bike (Assault, Echo)', inizia: 'conc', props: [{ p: 'airbike', c: [27, 46.5], sella: [20.5, 31.5], ventola: [44.5, 41, 8.5] },
    { p: 'pedivella', at: 'a2', c: [27, 46.5], dietro: true }, { p: 'leva', at: 'w2', perno: [37.5, 47] },
    { p: 'pedivella', at: 'a1', c: [27, 46.5] }, { p: 'leva', at: 'w1', perno: [37.5, 47] }],
    ...pedalata({ hip: [21.5, 28.6], t: 14, hd: -6, c: [27, 46.5], r: 4.2, leva: { perno: [37.5, 47], lung: 23, a: -8, amp: 10 }, giri: 70 }) },
  vogatore: { nome: 'Vogatore', inizia: 'conc', tenuta: 9, props: [{ p: 'vogatore', uscita: [49, 38.6], piedi: [38, 46.6] }, { p: 'sella', at: 'hip', dietro: true },
    { p: 'cavo', at: 'w1', to: [49, 38.6], z: 0 }, { p: 'bastone', at: 'w1' }],
    ...vogata({ y: 45.2, presa: 26, finale: 17.2, piedi: { ik: [38, 46.6], toe: [40.5, 44] }, yM: 39.4, R: 14.4, colpi: 26 }) },
  skierg: { nome: 'SkiErg', inizia: 'conc', tenuta: 6, sc: [0.88, 30, G], props: [{ p: 'skierg', x: 46, puleggia: [42.5, 3] },
    { p: 'cavo', at: 'w2', to: [41.4, 3] }, { p: 'cavo', at: 'w1', to: [42.5, 3] }, { p: 'bastone', at: 'w1', corto: true }],
    ...fluido([
      { hip: [26, 31], t: -4, hd: 4, legs: { ik: [26, 53] }, arms: { ik: [34, 4.5] } },
      { hip: [24.5, 32.5], t: 22, hd: 0, legs: { ik: [26, 53] }, arms: { ik: [41, 25] } },
      { hip: [21.5, 35.5], t: 52, hd: -10, legs: { ik: [26, 53] }, arms: { ik: [31.5, 44] } },
      { hip: [24, 32.5], t: 24, hd: -2, legs: { ik: [26, 53] }, arms: { ik: [39, 10] } }], [0, 0.17, 0.36, 0.64], 1.5) },
  salto_corda: { nome: 'Salto con la corda', inizia: 'conc', tenuta: 5, props: [{ p: 'cordaSalto', dietro: true }, { p: 'cordaSalto' }],
    ...saltoCorda({ x: 29.5, y: 31.2, giri: 1, volo: [0.32, 0.68], alza: 1.4, molla: 0.7, ciclo: 0.46, rp: 1.1 }) },
  double_under: { nome: 'Double under', inizia: 'conc', tenuta: 4, props: [{ p: 'cordaSalto', dietro: true }, { p: 'cordaSalto' }],
    ...saltoCorda({ x: 29.5, y: 31.2, giri: 2, volo: [0.2, 0.8], alza: 4.2, molla: 1.1, ciclo: 0.62, rp: 1.6, n: 24 }) },
  corda_salita: { nome: 'Arrampicata alla corda', inizia: 'conc', tenuta: 12, sc: [0.86, 30, G], z3d: { gambe: 1.2, braccia: 0.9 }, props: [{ p: 'corda', x: 31 }],
    ...scalataCorda({ x: 31, hip: [26, 28.6], mano: -0.8, piede: 49.4, d1: 4, d2: 9.2, ciclo: 2.4 }) },
  battle_rope: { nome: 'Battle rope', inizia: 'conc', props: [{ p: 'onda', at: 'w2', c: [34.9, 34], rx: 1, ry: 4.4, ancora: [58, 52], dietro: true },
    { p: 'onda', at: 'w1', c: [36, 34], rx: 1, ry: 4.4, ancora: [58, 52.6] }],
    ...battleRope({ hip: [24, 36], t: 26, piedi: [27, 53], c: [36, 34], rx: 1, ry: 4.4, ciclo: 0.5 }) },
  /* --- Sollevare e lanciare un peso: l'oggetto (og) vola libero quando lascia le mani --- */
  slam_ball: { nome: 'Slam ball', inizia: 'conc', tenuta: 5, sc: [0.86, 30, G], props: [{ p: 'palla', at: 'og', r: 3.4, scura: true }],
    ...fluido([
      { hip: [29.2, 30.9], t: -6, hd: 6, legs: { ik: [30, 52.2], toe: [33.5, 54.4] }, arms: { ik: [29.2, 0.2] }, og: [30, -3] },
      { hip: [25.5, 34], t: 38, hd: -10, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [39, 36.5] }, og: [40, 39.5] },
      { hip: [23.5, 39], t: 52, hd: -14, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [36.5, 47.5] }, og: [39.5, 51] },
      { hip: [24, 43], t: 45, hd: -10, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [35, 49.5] }, og: [38.6, 51] },
      { hip: [29.5, 31.4], t: 2, hd: 0, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [34.5, 22.5] }, og: [37, 21.5] }],
      [0, 0.13, 0.22, 0.42, 0.68], 2) },
  dball_spalla: { nome: 'D-ball sopra la spalla', inizia: 'conc', tenuta: 8, sc: [0.86, 30, G], props: [{ p: 'palla', at: 'og', r: 4.2, scura: true }],
    ...fluido([
      { hip: [24, 44], t: 42, hd: -8, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [33.6, 50] }, og: [35, 50.2], ogs: 1, ogz: 0 },
      { hip: [26, 38], t: 22, hd: -2, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [33, 32] }, og: [35.5, 30.5], ogs: 1, ogz: 0 },
      { hip: [29.5, 30.8], t: -10, hd: 8, legs: { ik: [30, 52.2], toe: [33.5, 54.4] }, arms: { ik: [32, 11.4] }, og: [32.5, 8], ogs: 1, ogz: 2 },
      { hip: [29.5, 30.6], t: -14, hd: 10, legs: { ik: [30, 52.6], toe: [33.6, 54.4] }, arms: { ik: [26.5, 4.4] }, og: [23, 5], ogs: 1, ogz: 5 },
      { hip: [29.5, 31], t: -6, hd: 4, legs: { ik: [30, 52.8], toe: [33.6, 54.4] }, arms: { ik: [38, 22.5] }, og: [18.5, 24], ogs: 1, ogz: 5 },
      { hip: [29.5, 31.4], t: 0, hd: 0, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [31.5, 34] }, og: [14, 50.2], ogs: 1, ogz: 4 },
      { hip: [29.5, 31.4], t: 0, hd: 0, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [31.5, 34] }, og: [14, 50.2], ogs: 0, ogz: 4 },
      { hip: [26, 38], t: 25, hd: -4, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [34, 40] }, og: [35, 50.2], ogs: 0, ogz: 0 },
      { hip: [24.5, 42], t: 38, hd: -8, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [33.8, 47] }, og: [35, 50.2], ogs: 1, ogz: 0 }],
      [0, 0.2, 0.34, 0.44, 0.5, 0.58, 0.7, 0.82, 0.9], 2.8) },
  sandbag_clean: { nome: 'Sandbag clean', inizia: 'conc', tenuta: 15, props: [{ p: 'sacco', at: 'og', rx: 4.6, ry: 2.6 }],
    ...fluido([
      { hip: [24, 43], t: 45, hd: -10, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [33.4, 50.1] }, og: [34.6, 51.8] },
      { hip: [23.5, 39], t: 28, hd: -4, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [31.5, 38.6] }, og: [32.6, 36.6] },
      { hip: [29.5, 30.2], t: -8, hd: 6, legs: { ik: [30, 52.2], toe: [33.5, 54.4] }, arms: { ik: [32.6, 24.5] }, og: [34, 22.6] },
      { hip: [28, 33.6], t: 6, hd: 0, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [34.6, 21.6] }, og: [34.2, 19.6] },
      { hip: [29.5, 31.3], t: 2, hd: 0, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [34.8, 19.6] }, og: [34.4, 17.6] },
      { hip: [26.5, 35.5], t: 22, hd: -4, legs: { ik: [30, 53], toe: [33.6, 54.3] }, arms: { ik: [34.5, 38.5] }, og: [35.5, 47.8] }],
      [0, 0.22, 0.36, 0.48, 0.62, 0.78], 2.6) },
  bikeerg: { nome: 'BikeErg', inizia: 'conc', props: [{ p: 'cyclette', c: [28, 47.5], sella: [21, 32], manubrio: [46, 27.5], volano: [41, 45.5, 7.5], ventola: true },
    { p: 'pedivella', at: 'a2', c: [28, 47.5], dietro: true }, { p: 'pedivella', at: 'a1', c: [28, 47.5] }],
    ...pedalata({ hip: [22.5, 29.6], t: 42, hd: -20, c: [28, 47.5], r: 4.2, mani: [46, 27.5], giri: 90 }) },
  /* --- Trasporti e slitta: andatura() sul pavimento, il corpo resta fermo e la pista scorre sotto i piedi --- */
  slitta_spinta: { nome: 'Spinta della slitta', inizia: 'conc', tenuta: 6, sc: [0.88, 30, G], props: [{ p: 'pista' }, { p: 'slitta', x1: 43, x2: 57, mani: [43.2, 24.2] }],
    ...conMani(andatura({ hip: [15, 34], cav: 53, avanti: 3, passo: 13, appoggio: 0.62, ciclo: 1.3, alza: 4, tallone: 1.5, avampiede: 1.2, mol: 0.4, t: 52, br: [0, 0] }), { ik: [43.2, 24.2] }) },
  // Traino in avanti: busto inclinato, braccia tese lungo i fianchi che tengono le cinghie, slitta dietro
  slitta_traino: { nome: 'Traino della slitta', inizia: 'conc', tenuta: 6, props: [{ p: 'pista' }, { p: 'slitta', x1: 3, x2: 15 },
    { p: 'cavo', at: 'w2', to: [15.4, G - 2.6], cinghia: true }, { p: 'cavo', at: 'w1', to: [15.4, G - 2.6], cinghia: true }],
    ...conMani(andatura({ hip: [31, 32.6], cav: 53, avanti: 5, passo: 11, appoggio: 0.64, ciclo: 1.25, alza: 3.4, tallone: 1.6, mol: 0.4, t: 24, br: [0, 0] }), { ik: [29.6, 35.6] }) },
  farmer_carry: { nome: 'Farmer carry', inizia: 'conc', tenuta: 1, props: [{ p: 'pista' }, { p: 'man', at: 'w2' }, { p: 'man', at: 'w1' }],
    ...andatura({ hip: [26, 31.9], cav: 53, avanti: 7, passo: 12, appoggio: 0.62, ciclo: 1.05, alza: 2.6, tallone: 1.3, mol: -0.6, t: 0, br: [3, 3, 0] }) },

  /* --- Core e supporto --- */
  // GHD sit-up: bacino sul cuscino, caviglie bloccate tra i rulli; il busto scende indietro fin sotto l'orizzontale con le braccia sopra la testa,
  // poi la spinta delle ginocchia lo riporta su e le mani vanno verso i piedi
  ghd_situp: { nome: 'GHD sit-up', inizia: 'ecc', tenuta: 9, sc: [0.8, 30, G], props: [{ p: 'ghd', ...GHD }],
    ...fluido([
      { hip: [30.6, 31], t: 22, hd: -6, legs: { ik: GHD.piede, toe: 'perp' }, arms: { a: [80, 82] } },
      { hip: [30.9, 31.1], t: -48, hd: 4, legs: { ik: GHD.piede, toe: 'perp' }, arms: { a: [196, 198] } },
      { hip: [31.3, 31.3], t: -98, hd: 8, legs: { ik: GHD.piede, toe: 'perp' }, arms: { a: [262, 264] } },
      { hip: [30.8, 31.1], t: -40, hd: -2, legs: { ik: GHD.piede, toe: 'perp' }, arms: { a: [150, 156] } }],
      [0, 0.3, 0.5, 0.72], 2.4) },
  // Reverse hyper: prono sul cuscino con il bacino sul bordo, mani alle maniglie; le gambe tese salgono fino alla linea del busto
  // e tornano giù oltre la verticale, portandosi dietro il pendolo con il carico
  reverse_hyper: { nome: 'Reverse hyper', inizia: 'conc', tenuta: 9, props: [{ p: 'reverseHyper', ...RHY }, { p: 'pendolo', at: 'a1', perno: RHY.perno, dietro: true }],
    ...fluido([
      { hip: [24, 29.4], t: 90, hd: 6, legs: { a: [12, 9], toe: 'punta' }, arms: { ik: RHY.mani } },
      { hip: [24, 29.4], t: 90, hd: 2, legs: { a: [-97, -100], toe: 'punta' }, arms: { ik: RHY.mani } },
      { hip: [24, 29.4], t: 90, hd: 4, legs: { a: [-30, -34], toe: 'punta' }, arms: { ik: RHY.mani } }],
      [0, 0.38, 0.7], 2.2) },
  // L-sit alle paralleline: braccia tese e spalle basse, busto dritto, gambe tese in avanti all'altezza del bacino
  lsit_paralleline: { nome: 'L-sit alle paralleline', inizia: 'ecc', tenuta: 0, props: [{ p: 'paralleline', x: 28.4, y: 49 }], keys: [
    { hip: [27.6, 44.25], t: -2, hd: 2, legs: { a: [90, 90], toe: 'punta' }, arms: { ik: [28.4, 47.9] } }] },
  // Piegamento al muro: corpo dritto inclinato dalle caviglie, mani al muro all'altezza delle spalle, il petto va verso il muro
  piegamento_muro: { nome: 'Piegamento al muro', inizia: 'ecc', props: [{ p: 'muro', x: 45.5 }], keys: [
    { ...linea([16, 53], 70), hd: -4, legs: { ik: [16, 53] }, arms: { ik: [44.8, 24] } },
    { ...linea([16, 53], 58.5), hd: -6, legs: { ik: [16, 53] }, arms: { ik: [44.8, 24] } }] },

  /* --- Girate con il bilanciere: girata() --- */
  power_clean: { nome: 'Power clean', inizia: 'conc', tenuta: 10, sc: [0.9, 30, G], props: [{ p: 'bil', at: 'w1' }], ...girata({ ciclo: 3.4 }) },
  hang_power_clean: { nome: 'Hang power clean', inizia: 'conc', tenuta: 7, sc: [0.9, 30, G], props: [{ p: 'bil', at: 'w1' }], ...girata({ hang: true, ciclo: 3 }) },
  squat_clean: { nome: 'Squat clean', inizia: 'conc', tenuta: 10, sc: [0.9, 30, G], props: [{ p: 'bil', at: 'w1' }], ...girata({ squat: true, ciclo: 3.8 }) },

  /* --- Strappo e slancio con il bilanciere: strappo(), slancio() --- */
  power_snatch: { nome: 'Power snatch', inizia: 'conc', tenuta: 12, sc: [0.84, 30, G], props: [{ p: 'bil', at: 'w1' }], ...strappo({ ciclo: 3.6 }) },
  clean_jerk: { nome: 'Clean and jerk', inizia: 'conc', tenuta: 23, sc: [0.84, 30, G], props: [{ p: 'bil', at: 'w1' }], ...slancio({ ciclo: 7 }) },

  /* --- Mobilità e stretching (Parte 4): tutte passano strumenti/controllo-pose.mjs --- */
  // Collo
  mob_collo_flesso: { nome: 'Collo: sì con la testa', inizia: 'conc', tempo: '1.2-0.4-1.2-0.4', keys: [
    st({ hd: -24, arms: { a: [4, 8] } }), st({ hd: 32, arms: { a: [4, 8] } })] },
  mob_collo_lat: { nome: 'Collo: allungamento laterale', vista: 'fronte', inizia: 'ecc', tenuta: 0, keys: [
    st({ hd: 26, legs: { a: [3, 2] }, arms: [{ a: [6, 6] }, { a: [8, 8] }] })] },
  // Spalle e torace
  mob_cerchi_braccia: { nome: 'Cerchi con le braccia', vista: 'fronte', sc: [0.86, 30, G], inizia: 'conc', seg: [0.55, 0.55, 0.55, 0.55], keys: [
    st({ legs: { a: [3, 2] }, arms: { a: [12, 12] } }), st({ legs: { a: [3, 2] }, arms: { a: [90, 90] } }),
    st({ legs: { a: [3, 2] }, arms: { a: [172, 172] } }), st({ legs: { a: [3, 2] }, arms: { a: [90, 90] } })] },
  mob_dislocazioni: { nome: 'Dislocazioni con bastone', vista: 'fronte', sc: [0.86, 30, G], inizia: 'conc', tempo: '1.4-0.2-1.4-0.2', props: [{ p: 'bastone' }], keys: [
    st({ legs: { a: [3, 2] }, arms: { a: [32, 32] } }), st({ legs: { a: [3, 2] }, arms: { a: [158, 158] } })] },
  mob_spalla_incrociata: { nome: 'Spalla: braccio incrociato', vista: 'fronte', inizia: 'ecc', tenuta: 0, keys: [
    st({ legs: { a: [3, 2] }, arms: [{ a: [-84, -90] }, { ik: [24.4, 24.4], b: 1 }] })] },
  mob_tricipite: { nome: 'Tricipite dietro la testa', inizia: 'ecc', tenuta: 0, keys: [
    st({ hd: 6, arms: [{ a: [172, 318] }, { a: [6, 10] }] })] },
  mob_apertura_petto: { nome: 'Apertura del petto, mani dietro', inizia: 'ecc', tenuta: 0, keys: [
    st({ t: 6, hd: -10, arms: { a: [-34, -34] } })] },
  // Quadrupedia e a terra
  mob_gatto_mucca: { nome: 'Gatto e mucca', inizia: 'conc', tempo: '1.2-0.4-1.2-0.4', keys: [
    { hip: [20, 41.4], t: 64, hd: 48, legs: { ik: [9.2, 53] }, arms: { ik: [32.6, 53.2], b: -1 } },
    { hip: [20.2, 42.4], t: 70, hd: -34, legs: { ik: [9.2, 53] }, arms: { ik: [32.6, 53.2], b: -1 } }] },
  mob_dondolo: { nome: 'Dondolo a quattro zampe', inizia: 'ecc', tempo: '1.2-0.4-1.2-0.4', keys: [
    { hip: [20.4, 41.6], t: 66, hd: 0, legs: { ik: [9.4, 53] }, arms: { ik: [33, 53.2], b: -1 } },
    { hip: [14.4, 43.4], t: 76, hd: -4, legs: { ik: [9.4, 53] }, arms: { ik: [33, 53.2], b: -1 } }] },
  mob_bambino: { nome: 'Posizione del bambino', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [19.5, 47], t: 95, hd: 32, legs: { ik: [18, 53] }, arms: { ik: [48.5, 53], b: -1 } }] },
  mob_bambino_resp: { nome: 'Respiro nella posizione del bambino', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [19.5, 47], t: 95, hd: 32, legs: { ik: [18, 53] }, arms: { ik: [17, 52.6] } }] },
  mob_sfinge: { nome: 'Sfinge', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [26, 50.6], t: 62, hd: -18, legs: { a: [-86, -88], toe: 'punta' }, arms: { ik: [46.2, 53.2], b: -1 } }] },
  mob_ginocchia_petto: { nome: 'Ginocchia al petto da supino', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [30, 50.8], t: -90, hd: 10, legs: { a: [222, 104] }, arms: { ik: [25.4, 42.6], b: -1 } }] },
  mob_bacino: { nome: 'Basculamento del bacino', inizia: 'conc', tempo: '1.2-0.5-1.2-0.5', keys: [
    { hip: [27, 50.8], nk: [12, 50.8], hd: 8, legs: { ik: [36.5, 53], b: 1 }, arms: { a: [86, 88] } },
    { hip: [27.4, 49.4], nk: [12.1, 50.7], hd: 10, legs: { ik: [36.5, 53], b: 1 }, arms: { a: [86, 88] } }] },
  mob_resp_supina: { nome: 'Respirazione da supino', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [27, 50.8], nk: [12, 50.8], hd: 8, legs: { ik: [36.5, 53], b: 1 }, arms: { ik: [27.4, 47.6], b: -1 } }] },
  // Laterali
  mob_inclinazioni_bastone: { nome: 'Inclinazioni laterali con bastone', vista: 'fronte', sc: [0.86, 30, G], inizia: 'conc', seg: [0.9, 0.9, 0.9, 0.9], props: [{ p: 'bastone' }], keys: [
    st({ t: 0, legs: { a: [6, 4] }, arms: { a: [166, 166] } }), st({ t: 18, legs: { a: [6, 4] }, arms: { a: [166, 166] } }),
    st({ t: 0, legs: { a: [6, 4] }, arms: { a: [166, 166] } }), st({ t: -18, legs: { a: [6, 4] }, arms: { a: [166, 166] } })] },
  mob_laterale: { nome: 'Allungamento laterale in piedi', vista: 'fronte', sc: [0.86, 30, G], inizia: 'ecc', tenuta: 0, keys: [
    st({ t: -16, legs: { a: [6, 4] }, arms: [{ a: [150, 132] }, { a: [6, 4] }] })] },
  // Anche e glutei
  mob_affondo_flessori: { nome: 'Affondo basso per i flessori dell’anca', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [25, 43.4], t: -2, legs: [{ ik: [39.6, 53] }, { ik: [11, 53], toe: 'punta' }], arms: { a: [8, 20] } }] },
  mob_cerchi_anche: { nome: 'Cerchi con le anche', inizia: 'conc', seg: [0.6, 0.6, 0.6, 0.6], keys: [
    { hip: [31.6, 31.8], t: -5, legs: { ik: [30, 53] }, arms: { ik: [1.4, -2.2], f: 'h' } },
    { hip: [30, 31.5], t: 0, legs: { ik: [30, 53] }, arms: { ik: [1.4, -2.2], f: 'h' } },
    { hip: [28.2, 31.9], t: 7, legs: { ik: [30, 53] }, arms: { ik: [1.4, -2.2], f: 'h' } },
    { hip: [30, 31.5], t: 0, legs: { ik: [30, 53] }, arms: { ik: [1.4, -2.2], f: 'h' } }] },
  mob_slanci: { nome: 'Slanci della gamba avanti e indietro', inizia: 'conc', tempo: '0.6-0-0.6-0', keys: [
    { hip: [30, 31.4], t: 2, legs: [{ a: [-24, -40], toe: 'perp' }, { ik: [30, 53] }], arms: [{ a: [40, 60] }, { a: [-20, -10] }] },
    { hip: [30, 31.6], t: -4, legs: [{ a: [68, 50], toe: 'perp' }, { ik: [30, 53] }], arms: [{ a: [-20, -10] }, { a: [40, 60] }] }] },
  mob_marcia: { nome: 'Marcia con ginocchia alte', inizia: 'conc', tempo: '0.45-0-0.45-0', keys: [
    { hip: [30, 31], t: 0, legs: [{ a: [86, 4], toe: 'punta' }, { ik: [30, 53] }], arms: [{ a: [-28, 20] }, { a: [50, 110] }] },
    { hip: [30, 31], t: 0, legs: [{ ik: [30, 53] }, { a: [86, 4], toe: 'punta' }], arms: [{ a: [50, 110] }, { a: [-28, 20] }] }] },
  mob_calciata: { nome: 'Calci ai glutei sul posto', inizia: 'conc', tempo: '0.4-0-0.4-0', keys: [
    { hip: [30, 31.4], t: 4, legs: [{ a: [-6, -140], toe: 'punta' }, { ik: [30, 53] }], arms: [{ a: [30, 100] }, { a: [-20, 60] }] },
    { hip: [30, 31.4], t: 4, legs: [{ ik: [30, 53] }, { a: [-6, -140], toe: 'punta' }], arms: [{ a: [-20, 60] }, { a: [30, 100] }] }] },
  mob_squat_profondo: { nome: 'Squat profondo tenuto', inizia: 'ecc', tempo: '1.6-0.8-1.2-0.4', keys: [
    st({ hip: [24, 40.8], t: 24, legs: { ik: [30.4, 53] }, arms: { ik: [5, 5.6], f: 't', b: -1 } }),
    st({ hip: [23.4, 45.6], t: 30, legs: { ik: [30.4, 53] }, arms: { ik: [5, 5.6], f: 't', b: -1 } })] },
  mob_ginocchio_petto: { nome: 'Ginocchio al petto in piedi', inizia: 'conc', tempo: '0.8-0.6-0.8-0.2', keys: [
    { hip: [30, 31.4], t: 0, legs: [{ ik: [30, 53] }, { ik: [30, 53] }], arms: { a: [6, 12] } },
    { hip: [30, 31.2], t: 2, legs: [{ a: [124, 4], toe: 'punta' }, { ik: [30, 53] }], arms: { ik: [39.2, 28.6], b: -1 } }] },
  mob_figura4: { nome: 'Figura 4 da supino', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [27, 50.8], nk: [12, 50.8], hd: 12, legs: [{ a: [168, 80] }, { ik: [36.5, 53], b: 1 }], arms: { ik: [30.4, 47.6], b: -1 } }] },
  // Adduttori
  // Di fronte cosce e tibie vanno verso chi guarda: si vedono più corte (lenK)
  mob_farfalla: { nome: 'Farfalla da seduto', vista: 'fronte', inizia: 'ecc', tenuta: 0, lenK: { th: 0.694, sh: 0.915 }, keys: [
    { hip: [30, 50.2], t: 0, legs: [{ ik: [30.9, 54], b: 1, toe: [34.4, 54.2] }, { ik: [29.1, 54], b: -1, toe: [25.6, 54.2] }], arms: [{ ik: [31.8, 52.2], b: 1 }, { ik: [28.2, 52.2], b: -1 }] }] },
  mob_affondo_laterale: { nome: 'Affondo laterale', vista: 'fronte', inizia: 'ecc', tempo: '1-0.4-1-0.2', keys: [
    { hip: [30, 32.6], t: 0, legs: [{ ik: [41, 53], b: 1 }, { ik: [19, 53], b: -1 }], arms: { a: [12, 12] } },
    { hip: [36.6, 40.8], t: 8, legs: [{ ik: [41, 53], b: 1 }, { ik: [19, 53], b: -1 }], arms: { a: [60, 40] } }] },
  // Femorali
  mob_femorali_seduto: { nome: 'Femorali da seduto, gambe tese', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [25.8, 50.4], t: 46, hd: -8, legs: { ik: [47.4, 53], toe: 'perp' }, arms: { ik: [43.2, 49.6], b: -1 } }] },
  mob_inchino: { nome: 'Inchino a gambe morbide', inizia: 'ecc', tempo: '1.6-0.4-1.4-0.3', keys: [
    st({ arms: { a: [4, 8] } }),
    st({ hip: [24.6, 32.4], t: 86, hd: -12, legs: { ik: [30, 53] }, arms: { a: [2, 4] } })] },
  mob_femorali_supino: { nome: 'Femorali da supino, gamba tesa', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [27, 50.8], t: -90, hd: 14, legs: [{ a: [166, 166], toe: 'perp' }, { a: [90, 90], toe: 'perp' }], arms: { ik: [28.6, 42.4], b: -1 } }] },
  // Quadricipiti
  mob_quadricipite: { nome: 'Quadricipite in piedi', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [30, 31.4], t: 2, legs: [{ a: [-6, -150], toe: 'punta' }, { ik: [30, 53] }], arms: [{ ik: [24.8, 33], b: -1 }, { a: [70, 86] }] }] },
  // Caviglie e polpacci
  mob_polpaccio: { nome: 'Polpaccio in affondo', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [28.4, 35.4], t: 16, hd: -4, legs: [{ ik: [37.4, 53] }, { ik: [16.4, 53] }], arms: { a: [78, 84] } }] },
  mob_cerchi_caviglie: { nome: 'Cerchi con le caviglie', inizia: 'conc', tempo: '0.7-0-0.7-0', keys: [
    { hip: [30, 31.4], t: 0, legs: [{ a: [42, 22], toe: 'punta' }, { ik: [30, 53] }], arms: { ik: [1.4, -2.2], f: 'h' } },
    { hip: [30, 31.4], t: 0, legs: [{ a: [42, 22], toe: 'perp' }, { ik: [30, 53] }], arms: { ik: [1.4, -2.2], f: 'h' } }] },
  mob_caviglia_avanti: { nome: 'Caviglia: ginocchio avanti', inizia: 'conc', tempo: '1-0.4-1-0.3', keys: [
    { hip: [24.6, 42.6], t: 0, legs: [{ ik: [36, 53] }, { ik: [10.8, 53], toe: 'punta' }], arms: { ik: [8.4, 9.2], f: 't', b: -1 } },
    { hip: [28, 43.6], t: 4, legs: [{ ik: [36, 53] }, { ik: [10.8, 53], toe: 'punta' }], arms: { ik: [8.4, 9.2], f: 't', b: -1 } }] },
  // Polsi
  mob_cerchi_polsi: { nome: 'Cerchi con i polsi', inizia: 'conc', tempo: '0.5-0-0.5-0', keys: [
    st({ arms: { a: [26, 96] } }), st({ arms: { a: [26, 70] } })] },

  /* --- Generico --- */
  free: { nome: 'Generico', vista: 'fronte', inizia: 'conc', keys: [
    st({ legs: { a: [4, 2] }, arms: { a: [14, 18] } }),
    st({ legs: { a: [18, 18] }, arms: { a: [150, 158] } })], tempo: '0.6-0-0.6-0' }
};

// Nomi del prototipo e dei dati vecchi → animazione nuova
const ALIAS = { lunge: 'affondo', hinge: 'stacco', bench: 'panca', pull: 'trazione', row: 'rematore', raise: 'alzate_lat', core: 'crunch', jump: 'squat_jump' };
export const animazione = k => POSE[k] ? k : (POSE[ALIAS[k]] ? ALIAS[k] : 'free');
export const ANIMAZIONI = Object.fromEntries(Object.entries(POSE).map(([k, v]) => [k, v.nome]));

/* ---------- Cinematica ---------- */
function ik(root, target, l1, l2, b) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  let d = Math.hypot(dx, dy);
  d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, d));
  const base = Math.atan2(dy, dx);
  const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const a1 = base - b * A;
  const mid = [root[0] + l1 * Math.cos(a1), root[1] + l1 * Math.sin(a1)];
  const a2 = Math.atan2(target[1] - mid[1], target[0] - mid[0]);
  return [mid, [mid[0] + l2 * Math.cos(a2), mid[1] + l2 * Math.sin(a2)]];
}
function fk(root, a, l1, l2) { const m = add(root, dir(a[0]), l1); return [m, add(m, dir(a[1]), l2)]; }

// Flessione con segno: positiva se il gomito si chiude verso il bicipite
// (o il ginocchio verso il polpaccio). Vale per ogni rotazione del corpo.
function flessione(root, [mid, end], gambe) {
  const u = [mid[0] - root[0], mid[1] - root[1]], v = [end[0] - mid[0], end[1] - mid[1]];
  const c = Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]);
  return gambe ? c : -c;
}

// Angoli assoluti di un arto già risolto (per interpolare specifiche miste)
const angoliDi = (root, mid, end) => [ang(mid[0] - root[0], mid[1] - root[1]), ang(end[0] - mid[0], end[1] - mid[1])];

// Angolo del segmento vicino rispetto al busto (0 = lungo il busto verso il basso, + in avanti)
// e piega dell'articolazione (+ = flessione anatomica), entrambi senza salti di 360°
const fascia = (x, da) => { let v = ((x - da) % 360 + 360) % 360; return v + da; };
function giunti(a, t, gambe) {
  return [fascia(a[0] + t, -100), fascia(gambe ? a[0] - a[1] : a[1] - a[0], -90)];
}

function busto(k) {
  const t = k.nk ? ang(k.nk[0] - k.hip[0], -(k.nk[1] - k.hip[1])) : (k.t || 0);
  return t;
}
const specArto = (s, i) => Array.isArray(s) ? s[i] : s;

function risolviArto(spec, root, ctx, l1, l2, i, specchio) {
  const def = ctx.gambe ? 1 : -1;
  if (spec.ik) {
    let tg = spec.ik;
    const f = spec.f || 'w';
    if (f === 'n') tg = add(ctx.neck, tg);
    else if (f === 'h') tg = add(ctx.hip, tg);
    else if (f === 't') { const up = dir(180 - ctx.t), av = dir(90 - ctx.t); tg = add(add(ctx.neck, av, tg[0]), up, -tg[1]); }
    if (specchio) tg = specchio(tg);
    tg = [tg[0] + ctx.dx, tg[1]];
    let b = spec.b ?? def;
    if (specchio) b = -b;
    let r;
    if (ctx.vista === 'fronte' || spec.libero) r = ik(root, tg, l1, l2, b);
    else {
      // Di lato: delle due piegature possibili tengo quella anatomica
      const s1 = ik(root, tg, l1, l2, 1), s2 = ik(root, tg, l1, l2, -1);
      r = flessione(root, s1, ctx.gambe) >= flessione(root, s2, ctx.gambe) ? s1 : s2;
    }
    if (mancati) mancati.push(dist(r[1], tg));   // solo durante il controllo anatomico
    return r;
  }
  let a = spec.a || [0, 0];
  if (ctx.vista === 'fronte') {
    a = i === 0 ? [a[0] - ctx.t, a[1] - ctx.t] : [-a[0] - ctx.t, -a[1] - ctx.t];
  }
  return fk(root, a, l1, l2);
}

function posa(P, kA, kB, u) {
  const vista = P.vista || 'lato';
  const hip = lerpP(kA.hip, kB.hip, u);
  const t = lerpA(busto(kA), busto(kB), u);
  const lk = P.lenK || {};
  const TR = L.tr * (lk.tr || 1), TH = L.th * (lk.th || 1), SH = L.sh * (lk.sh || 1);
  const up = dir(180 - t);
  const neck = add(hip, up, TR);
  const hd = lerp(kA.hd || 0, kB.hd || 0, u);
  const head = add(neck, dir(180 - t - hd), L.nk);
  const sy = lerp(kA.sy || 0, kB.sy || 0, u);
  const shoulderBase = add(neck, up, sy - 1.2);
  const J = { hip, neck, head, t, vista };
  const perp = dir(90 - t);                                // perpendicolare al busto (verso avanti)
  const mirror = p => {                                    // riflessione rispetto all'asse del busto
    const v = [p[0] - hip[0], p[1] - hip[1]];
    const along = v[0] * up[0] + v[1] * up[1];
    const across = v[0] * perp[0] + v[1] * perp[1];
    return add(add(hip, up, along), perp, -across);
  };

  for (const [nome, l1, l2, chiave] of [['legs', TH, SH, 'k'], ['arms', L.ua, L.fa, 'e']]) {
    for (let i = 0; i < 2; i++) {
      const sA = specArto(kA[nome], i), sB = specArto(kB[nome], i);
      const gambe = nome === 'legs';
      let root = gambe ? hip : shoulderBase;
      let dx = 0, specchio = null;
      if (vista === 'fronte') {
        const off = gambe ? 2.4 : 3.6;
        root = add(root, perp, i === 0 ? off : -off);
        if (i === 1 && !Array.isArray(kA[nome])) specchio = mirror;
      } else if (i === 1) { dx = -1.1; root = [root[0] + dx, root[1]]; }
      const ctx = { gambe, neck: shoulderBase, hip, t, dx, vista };
      let mid, end;
      if (sA.ik && sB.ik && (sA.f || 'w') === (sB.f || 'w') && (sA.b ?? 0) === (sB.b ?? 0)) {
        const s = { ...sA, ik: lerpP(sA.ik, sB.ik, u) };
        [mid, end] = risolviArto(s, root, ctx, l1, l2, i, specchio);
      } else if (sA === sB) {
        [mid, end] = risolviArto(sA, root, ctx, l1, l2, i, specchio);
      } else if (!sA.ik && !sB.ik) {
        const aA = sA.a || [0, 0], aB = sB.a || [0, 0];
        [mid, end] = risolviArto({ a: [lerp(aA[0], aB[0], u), lerp(aA[1], aB[1], u)] }, root, ctx, l1, l2, i, specchio);
      } else {
        const n0 = mancati ? mancati.length : 0;
        const ra = risolviArto(sA, root, ctx, l1, l2, i, specchio);
        const n1 = mancati ? mancati.length : 0;
        const rb = risolviArto(sB, root, ctx, l1, l2, i, specchio);
        if (mancati) { const m = u < 0.5 ? mancati.slice(n0, n1) : mancati.slice(n1); mancati.length = n0; mancati.push(...m); }   // nel controllo conta solo la posa chiave mostrata
        const aa = angoliDi(root, ...ra), ab = angoliDi(root, ...rb);
        if (vista === 'fronte') {
          [mid, end] = fk(root, [lerpA(aa[0], ab[0], u), lerpA(aa[1], ab[1], u)], l1, l2);
        } else {
          // Di lato: angolo rispetto al busto e piega dell'articolazione, senza scorciatoie dietro la schiena
          const ta = busto(kA), tb = busto(kB);
          const ga = giunti(aa, ta, gambe), gb = giunti(ab, tb, gambe);
          const rel = lerp(ga[0], gb[0], u), pg = lerp(ga[1], gb[1], u);
          const a0 = rel - t;
          [mid, end] = fk(root, [a0, gambe ? a0 - pg : a0 + pg], l1, l2);
        }
      }
      J[chiave + (i + 1)] = mid;
      J[(gambe ? 'a' : 'w') + (i + 1)] = end;
      J[(gambe ? 'r' : 's') + (i + 1)] = root;
      if (gambe) {
        // Punta del piede: fissa a terra, a punta (salti) o perpendicolare alla tibia
        const toeA = sA.toe || kA.toe, toeB = sB.toe || kB.toe;
        const tibia = ang(end[0] - mid[0], end[1] - mid[1]);
        const verso = vista === 'fronte' ? (i === 0 ? 1 : -1) : 1;
        const calcola = (toe, sospeso) => {
          if (Array.isArray(toe)) {
            const tg = [toe[0] + dx, toe[1]];
            const d = dist(end, tg) || 1;
            return [end[0] + (tg[0] - end[0]) / d * L.ft, end[1] + (tg[1] - end[1]) / d * L.ft];
          }
          if (vista === 'fronte') return add(end, dir(tibia + 90 * verso), L.ft * 0.7);
          if (toe === 'punta') return add(end, dir(tibia + 25), L.ft);
          if (toe === 'perp') return add(end, dir(tibia + 90), L.ft);
          if (sospeso) return add(end, dir(tibia + 32), L.ft);
          return add(end, [0.98, 0.18], L.ft);
        };
        const pA = calcola(toeA, !sA.ik), pB = calcola(toeB, !sB.ik);
        let f = toeA === toeB && !sA.ik === !sB.ik ? pA : lerpP(pA, pB, u);
        const suolo = P.g === undefined ? G : P.g, fondo = suolo === null ? null : suolo + 0.95;
        if (fondo !== null && f[1] > fondo && end[1] < fondo) {   // la punta non entra nel pavimento: scivola sulla linea
          const lf = dist(end, f), dy = fondo - end[1];
          f = [end[0] + Math.sign(f[0] - end[0] || 1) * Math.sqrt(Math.max(0, lf * lf - dy * dy)), fondo];
        }
        J['f' + (i + 1)] = f;
      }
    }
  }
  // Oggetto libero (palla, sacco): segue la sua traiettoria anche quando lascia le mani; ogs = scala (0 = non si vede)
  if (kA.og && kB.og) J.og = lerpP(kA.og, kB.og, u);
  J.ogs = Math.max(0, Math.min(1, lerp(kA.ogs ?? 1, kB.ogs ?? 1, u)));
  J.ogz = lerp(kA.ogz ?? 0, kB.ogz ?? 0, u);              // profondità dell'oggetto, solo per il 3D
  return J;
}

/* ---------- Disegno ---------- */
const fx = n => Math.round(n * 100) / 100;
const pt = p => `${fx(p[0])} ${fx(p[1])}`;

/* Muscoli. Ogni osso ha un nucleo e dei ventri muscolari sul lato anteriore (+1) o posteriore (-1).
   u = posizione lungo l'osso (0 = articolazione di partenza, 1 = arrivo), t = spessore, p = dove sta il picco. */
const GROSSO = 1.15;
const SEGMENTI = {
  coscia: { core: 1.5, m: [
    { id: 'gluteo', lato: -1, u: [-0.2, 0.38], t: 2.1, p: 0.42 },
    { id: 'quadricipite', lato: 1, u: [-0.02, 0.97], t: 2.0, p: 0.4 },
    { id: 'femorali', lato: -1, u: [0.22, 0.95], t: 1.35, p: 0.4 }] },
  tibia: { core: 0.88, m: [
    { id: 'polpacci', lato: -1, u: [0.03, 0.66], t: 1.7, p: 0.3 },
    { id: 'tibiale', lato: 1, u: [0.04, 0.74], t: 0.5, p: 0.3 }] },
  braccio: { core: 0.98, m: [
    { id: 'tricipite', lato: -1, u: [0.18, 0.92], t: 1.3, p: 0.4 },
    { id: 'bicipite', lato: 1, u: [0.28, 0.93], t: 1.2, p: 0.56 },
    { id: 'deltoide', lato: 1, u: [-0.2, 0.46], t: 1.3, p: 0.3 },
    { id: 'deltoide', lato: -1, u: [-0.2, 0.46], t: 1.2, p: 0.3 }] },
  avambraccio: { core: 0.74, m: [
    { id: 'avambraccio', lato: 1, u: [-0.02, 0.74], t: 0.9, p: 0.25 },
    { id: 'avambraccio', lato: -1, u: [-0.02, 0.68], t: 0.72, p: 0.25 }] },
  busto: { core: 1.95, segno: -1, m: [
    { id: 'lombari', lato: -1, u: [0.02, 0.5], t: 0.9, p: 0.5 },
    { id: 'dorsali', lato: -1, u: [0.38, 0.96], t: 1.85, p: 0.64 },
    { id: 'trapezio', lato: -1, u: [0.8, 1.14], t: 1.15, p: 0.42 },
    { id: 'addominali', lato: 1, u: [0.06, 0.64], t: 1.05, p: 0.5, addome: true },
    { id: 'pettorale', lato: 1, u: [0.58, 0.99], t: 2.05, p: 0.6 }] },
};

// Dal testo della libreria ("Gambe: quadricipite, gluteo…") ai muscoli da accendere
const MAPPA_MUSCOLI = [[/quadricipit/, ['quadricipite']], [/glute/, ['gluteo']], [/femoral/, ['femorali']], [/polpacc|gastrocnem|soleo/, ['polpacci']],
  [/tibial/, ['tibiale']], [/pettoral/, ['pettorale']], [/deltoid|cuffia/, ['deltoide']], [/bicipit|\bbrachiale\b/, ['bicipite']],
  [/tricipit/, ['tricipite']], [/dorsal|grande rotondo/, ['dorsali']], [/trapezi|romboid/, ['trapezio']], [/erettor|lombar|quadrato dei lombi/, ['lombari']],
  [/addom|obliqu|\bretto dell|\btrasverso/, ['addominali']], [/avambracc|brachioradial|flessori/, ['avambraccio']]];
// Parole generiche (es. "Total body: gambe, petto, spalle"); "erettori della schiena" non conta come schiena
const GENERICHE = [[/\bgambe\b/, ['quadricipite', 'gluteo', 'femorali', 'polpacci']], [/\bpetto\b/, ['pettorale']], [/\bspalle\b/, ['deltoide']],
  [/\bbraccia\b/, ['bicipite', 'tricipite']], [/(?<!della )\bschiena\b/, ['dorsali', 'trapezio']], [/\baddome\b/, ['addominali']]];
export function muscoliDa(testo) {
  const t = String(testo || '').toLowerCase();
  const parte = t.includes(':') ? t.split(':').slice(1).join(':') : t;
  const out = new Set();
  for (const [re, ids] of MAPPA_MUSCOLI) if (re.test(parte)) ids.forEach(i => out.add(i));
  for (const [re, ids] of GENERICHE) if (re.test(parte)) ids.forEach(i => out.add(i));
  return out;
}
const accesi = opz => opz.evidenzia instanceof Set ? opz.evidenzia : (opz.muscoli ? muscoliDa(opz.muscoli) : new Set());

const gonfia = (mu, u, vf) => {
  if (u <= mu.u[0] || u >= mu.u[1]) return 0;
  const x = (u - mu.u[0]) / (mu.u[1] - mu.u[0]);
  const y = Math.pow(x, Math.log(0.5) / Math.log(mu.p));
  return (vf ? mu.t * 0.75 : mu.t) * GROSSO * Math.pow(Math.sin(Math.PI * y), 0.9);
};
// Profilo continuo del segmento: davanti e dietro = nucleo + ventri muscolari di quel lato
function profilo(A, B, S, vf) {
  const dx = B[0] - A[0], dy = B[1] - A[1], Lg = Math.hypot(dx, dy) || 1;
  const d = [dx / Lg, dy / Lg], sg = S.segno || 1;
  const n = [d[1] * sg, -d[0] * sg];                       // verso il lato anteriore
  const muscoli = vf ? S.m.flatMap(m => m.lato === 1 ? [m, { ...m, lato: -1 }] : []) : S.m;
  const u0 = Math.min(0, ...muscoli.map(m => m.u[0])), u1 = Math.max(1, ...muscoli.map(m => m.u[1]));
  const W = (lato, u) => {
    let max = 0, somma = 0;
    for (const m of muscoli) if (m.lato === lato) { const g = gonfia(m, u, vf); somma += g; if (g > max) max = g; }
    return S.core + max + 0.35 * (somma - max);
  };
  const punto = (u, lato, w) => [A[0] + d[0] * u * Lg + n[0] * w * lato, A[1] + d[1] * u * Lg + n[1] * w * lato];
  return { u0, u1, W, punto, muscoli };
}
const percorso = pts => pts.map((q, k) => `${k ? 'L' : 'M'}${pt(q)}`).join(' ') + ' Z';

function segmentoSVG(A, B, nome, cls, ev, vf) {
  const S = SEGMENTI[nome];
  const P = profilo(A, B, S, vf);
  const N = 22, us = Array.from({ length: N + 1 }, (_, k) => P.u0 + (P.u1 - P.u0) * k / N);
  const davanti = us.map(u => P.punto(u, 1, P.W(1, u)));
  const dietro = us.map(u => P.punto(u, -1, P.W(-1, u))).reverse();
  let out = `<line class="mcore ${cls}" x1="${fx(A[0])}" y1="${fx(A[1])}" x2="${fx(B[0])}" y2="${fx(B[1])}" stroke-width="${fx(S.core * 2)}"/>`
    + `<path class="mpelle ${cls}" d="${percorso([...davanti, ...dietro])}"/>`;
  for (const mu of P.muscoli) {                            // muscoli che lavorano, in oro
    if (!ev.has(mu.id)) continue;
    const zu = Array.from({ length: 15 }, (_, k) => mu.u[0] + (mu.u[1] - mu.u[0]) * k / 14);
    const fuori = zu.map(u => P.punto(u, mu.lato, P.W(mu.lato, u) - 0.05));
    const dentro = zu.map(u => P.punto(u, mu.lato, Math.max(0.15, S.core * 0.3 - gonfia(mu, u, vf) * 0.15))).reverse();
    out += `<path class="mlavora ${cls}" d="${percorso([...fuori, ...dentro])}"/>`;
  }
  for (const mu of P.muscoli) {                            // solchi sottili tra un muscolo e l'altro
    const a = mu.u[0] + (mu.u[1] - mu.u[0]) * 0.22, b = mu.u[0] + (mu.u[1] - mu.u[0]) * 0.8;
    const linea = Array.from({ length: 9 }, (_, k) => P.punto(a + (b - a) * k / 8, mu.lato, S.core * 0.42 + gonfia(mu, a + (b - a) * k / 8, vf) * 0.08));
    out += `<polyline class="msolco" points="${linea.map(pt).join(' ')}"/>`;
    if (mu.addome) for (const f of [0.32, 0.5, 0.68]) {
      const u = mu.u[0] + (mu.u[1] - mu.u[0]) * f;
      const p1 = P.punto(u, 1, S.core * 0.5), p2 = P.punto(u, 1, P.W(1, u) - 0.25);
      out += `<line class="msolco" x1="${fx(p1[0])}" y1="${fx(p1[1])}" x2="${fx(p2[0])}" y2="${fx(p2[1])}"/>`;
    }
  }
  return out;
}

function arto(J, i, cls, ev, vf) {
  const r = J['r' + i], k = J['k' + i], a = J['a' + i], f = J['f' + i];
  const s = J['s' + i], e = J['e' + i], w = J['w' + i];
  return {
    gamba: segmentoSVG(r, k, 'coscia', cls, ev, vf) + segmentoSVG(k, a, 'tibia', cls, ev, vf)
      + `<line class="mcore ${cls}" x1="${fx(a[0])}" y1="${fx(a[1])}" x2="${fx(f[0])}" y2="${fx(f[1])}" stroke-width="1.8"/>`,
    braccio: segmentoSVG(s, e, 'braccio', cls, ev, vf) + segmentoSVG(e, w, 'avambraccio', cls, ev, vf)
      + `<circle class="${ev.has('deltoide') ? 'mlavora' : 'mpelle'} ${cls}" cx="${fx(s[0])}" cy="${fx(s[1])}" r="2"/>`
      + `<circle class="mpelle ${cls}" cx="${fx(w[0])}" cy="${fx(w[1])}" r="1.05"/>`
  };
}

/* Geometrie degli attrezzi mobili, condivise con l'omino 3D */
function geoBraccioEll(pr, J) {
  const w = J['w' + pr.lato], a = J['a' + pr.lato], P0 = pr.perno, dm = dist(P0, w) || 1;
  const r = add(P0, [(P0[0] - w[0]) / dm, (P0[1] - w[1]) / dm], pr.giu), cima = add(w, [(w[0] - P0[0]) / dm, (w[1] - P0[1]) / dm], 2);
  let pd = [a[0], a[1] + 1.5], v = [1, 0];
  for (let i = 0; i < 2; i++) { const d = dist(r, pd) || 1; v = [(r[0] - pd[0]) / d, (r[1] - pd[1]) / d]; pd = add(a, [v[1], -v[0]], -1.5); }
  return { r, cima, q: add(r, v, -pr.lung), p1: add(pd, v, -1.2), p2: add(pd, v, 4.2) };
}
function geoCordaSalto(J) {
  const C = CORDA_SALTO, c = add(J.hip, C.polsi), a = ang(J.w1[0] - c[0], J.w1[1] - c[1]), cr = add(J.hip, C.centro);
  return { a, cima: add(cr, [C.rx * Math.sin(a * RAD), C.ry * Math.cos(a * RAD)]),
    ctl: add(cr, [1.15 * C.rx * Math.sin((a + 52) * RAD), 1.05 * C.ry * Math.cos((a + 52) * RAD)]) };
}
function geoOnda(pr, J) {
  const w = J[pr.at], c = pr.c, fi = Math.atan2((w[1] - c[1]) / pr.ry, (w[0] - c[0]) / pr.rx), A = pr.ancora, lg = dist(c, A);
  const pts = Array.from({ length: 25 }, (_, i) => { const u = i / 24, b = lerpP(c, A, u); return [b[0], b[1] + pr.ry * Math.sin(fi - 2 * Math.PI * lg * u / 15) * (1 - 0.85 * u)]; });
  pts[0] = w;
  return pts;
}
const geoPendolo = (pr, J) => lerpP(pr.perno, J[pr.at], 0.74);   // dove stanno i dischi sulla leva del pendolo
const geoLeva = (pr, J) => { const w = J[pr.at], d = dist(pr.perno, w) || 1; return add(w, [(w[0] - pr.perno[0]) / d, (w[1] - pr.perno[1]) / d], 2.2); };

/* Attrezzi che si muovono con il corpo */
function propSVG(pr, J) {
  const at = k => {
    const base = typeof k === 'string' ? (J[k] || J.hip) : k;
    const off = pr.off || [0, 0];
    return [base[0] + off[0], base[1] + off[1]];
  };
  switch (pr.p) {
    case 'bil': { const c = at(pr.at); const r = pr.r || 5.5; return `<circle class="ld" cx="${fx(c[0])}" cy="${fx(c[1])}" r="${r}"/><circle class="ldin" cx="${fx(c[0])}" cy="${fx(c[1])}" r="${fx(r * 0.28)}"/>`; }
    case 'man': { const c = at(pr.at); return `<rect class="ld" x="${fx(c[0] - 2.6)}" y="${fx(c[1] - 1.3)}" width="5.2" height="2.6" rx="1.2"/>`; }
    case 'peso': case 'palla': { const c = at(pr.at), r = (pr.r || 3.2) * (pr.at === 'og' ? J.ogs : 1); if (pr.at === 'og') c[1] = Math.min(c[1], G - r); return r < 0.05 ? '' : `<circle class="ld" cx="${fx(c[0])}" cy="${fx(c[1])}" r="${fx(r)}"/>`; }
    case 'sacco': { const c = at(pr.at), s = pr.at === 'og' ? J.ogs : 1, w = pr.rx * 2 * s, h = pr.ry * 2 * s;   // sacco morbido: rettangolo molto arrotondato
      c[1] = Math.min(c[1], G - h / 2);
      return s < 0.02 ? '' : `<rect class="ld" x="${fx(c[0] - w / 2)}" y="${fx(c[1] - h / 2)}" width="${fx(w)}" height="${fx(h)}" rx="${fx(h * 0.42)}"/><line class="ldin" stroke-width="0.5" x1="${fx(c[0] - w * 0.18)}" x2="${fx(c[0] - w * 0.18)}" y1="${fx(c[1] - h / 2)}" y2="${fx(c[1] + h / 2)}"/><line class="ldin" stroke-width="0.5" x1="${fx(c[0] + w * 0.18)}" x2="${fx(c[0] + w * 0.18)}" y1="${fx(c[1] - h / 2)}" y2="${fx(c[1] + h / 2)}"/>`; }
    case 'kb': { const w = J.w1, e = J.e1; const d = dist(e, w) || 1; const c = [w[0] + (w[0] - e[0]) / d * 3.2, w[1] + (w[1] - e[1]) / d * 3.2];
      return `<circle class="ld" cx="${fx(c[0])}" cy="${fx(c[1])}" r="3"/>`; }
    case 'ruota': { const c = at(pr.at); return `<circle class="eq" cx="${fx(c[0])}" cy="${fx(c[1])}" r="2.3"/>`; }
    case 'rullo': { const c = at(pr.at); return `<circle class="eqf" cx="${fx(c[0])}" cy="${fx(c[1])}" r="1.7"/>`; }
    case 'maniglia': { const c = at(pr.at); return `<line class="eq" x1="${fx(c[0] - 2)}" x2="${fx(c[0] + 2)}" y1="${fx(c[1])}" y2="${fx(c[1])}"/>`; }
    case 'cavo': { const c = at(pr.at); const to = pr.to; return `<line class="${pr.cinghia ? 'cinghia' : 'cv'}${pr.cinghia && pr.at === 'w2' ? ' dietro' : ''}" x1="${fx(c[0])}" y1="${fx(c[1])}" x2="${to[0]}" y2="${to[1]}"/><circle class="eqf" cx="${to[0]}" cy="${to[1]}" r="1.4"/>`; }
    case 'piatto': { const c = J.a1; const v = dir(pr.ang + 90); return `<line class="eqs" x1="${fx(c[0] - v[0] * 6 + 1.2)}" y1="${fx(c[1] - v[1] * 6 + 1.2)}" x2="${fx(c[0] + v[0] * 6 + 1.2)}" y2="${fx(c[1] + v[1] * 6 + 1.2)}"/>`; }
    case 'pedivella': {
      // Pedivella dal movimento centrale al pedale, che sta sotto la caviglia
      const a = J[pr.at], c = pr.c, q = [a[0] + 0.5, a[1] + 1.6];
      const cl = pr.dietro ? ' class="lontano"' : '';
      return `<g${cl}><line class="eqs" x1="${c[0]}" y1="${c[1]}" x2="${fx(q[0])}" y2="${fx(q[1])}"/><line class="eqs" x1="${fx(q[0] - 1.6)}" x2="${fx(q[0] + 1.6)}" y1="${fx(q[1])}" y2="${fx(q[1])}"/></g>`;
    }
    case 'cordaSalto': {
      // Corda vista di lato: dalle mani al punto più lontano dell'ellisse, che si ricava dall'angolo dei polsi.
      // Due copie: quella "dietro" si disegna solo quando la corda passa alle spalle, l'altra quando è davanti.
      const { a, cima, ctl } = geoCordaSalto(J);
      if ((Math.sin(a * RAD) < -0.15) !== !!pr.dietro) return '';
      return `<path class="cordina" d="M${pt(J.w1)} Q${pt(ctl)} ${pt(cima)}"/>`;
    }
    case 'onda': {
      // Battle rope: onda che corre dalla mano all'ancoraggio, più bassa man mano che si allontana
      const A = pr.ancora, pts = geoOnda(pr, J);
      const cl = pr.dietro ? ' lontano' : '';
      return `<path class="cordone${cl}" d="M${pts.map(pt).join(' L')}"/><circle class="eqf${cl}" cx="${A[0]}" cy="${A[1]}" r="1"/>`;
    }
    case 'sella': { const c = at(pr.at); const cl = pr.dietro ? ' class="lontano"' : '';   // carrello del vogatore: segue il bacino sulla rotaia
      return `<line class="eqs" x1="${fx(c[0] - 3.4)}" x2="${fx(c[0] + 2.4)}" y1="${fx(c[1] + 1.6)}" y2="${fx(c[1] + 1.6)}"/><circle class="eqf" cx="${fx(c[0] - 1.8)}" cy="${fx(c[1] + 2.5)}" r="0.6"/><circle class="eqf" cx="${fx(c[0] + 0.8)}" cy="${fx(c[1] + 2.5)}" r="0.6"/>`; }
    case 'pendolo': {
      // Pendolo del reverse hyper: leva dal perno sotto il cuscino alla cinghia delle caviglie, con i dischi verso il fondo
      const a = J[pr.at], d = geoPendolo(pr, J);
      return `<g class="lontano"><line class="eqs" x1="${pr.perno[0]}" y1="${pr.perno[1]}" x2="${fx(a[0])}" y2="${fx(a[1])}"/><circle class="eqf" cx="${pr.perno[0]}" cy="${pr.perno[1]}" r="1.1"/></g>`
        + `<circle class="ld" cx="${fx(d[0])}" cy="${fx(d[1])}" r="2.6"/><circle class="ldin" cx="${fx(d[0])}" cy="${fx(d[1])}" r="0.7"/>`;
    }
    case 'leva': {
      // Manico mobile dell'air bike: dal perno in basso alla mano, con l'impugnatura un po' oltre
      const m = geoLeva(pr, J);
      const cl = pr.at === 'w2' ? ' class="lontano"' : '';
      return `<g${cl}><line class="eqs" x1="${pr.perno[0]}" y1="${pr.perno[1]}" x2="${fx(m[0])}" y2="${fx(m[1])}"/><circle class="eqf" cx="${pr.perno[0]}" cy="${pr.perno[1]}" r="1.2"/></g>`;
    }
    case 'braccioEll': {
      // Ellittica: manico che oscilla sul perno, braccio-pedale dal fondo del manico alla pedivella, pedana sotto il piede
      const { r, cima, q, p1, p2 } = geoBraccioEll(pr, J);
      const cl = pr.dietro ? ' class="lontano"' : '';
      return `<g${cl}><line class="eq" x1="${pr.c[0]}" y1="${pr.c[1]}" x2="${fx(q[0])}" y2="${fx(q[1])}"/><line class="eqs" x1="${fx(q[0])}" y1="${fx(q[1])}" x2="${fx(r[0])}" y2="${fx(r[1])}"/>`
        + `<line class="eqs" x1="${fx(r[0])}" y1="${fx(r[1])}" x2="${fx(cima[0])}" y2="${fx(cima[1])}"/><line class="eqs" x1="${fx(p1[0])}" y1="${fx(p1[1] + 0.4)}" x2="${fx(p2[0])}" y2="${fx(p2[1] + 0.4)}"/></g>`;
    }
    case 'bilf': {
      // Bilanciere visto di fronte: la sbarra passa per le due mani, i dischi alle estremità
      const a = J.w1, b = J.w2, d = dist(a, b) || 1, v = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
      const p1 = add(a, v, -6), p2 = add(b, v, 6);
      const disco = c => `<rect class="ld" x="${fx(c[0] - 0.9)}" y="${fx(c[1] - 3.6)}" width="1.8" height="7.2" rx="0.6"/>`;
      return `<line class="eqs" x1="${fx(p1[0])}" y1="${fx(p1[1])}" x2="${fx(p2[0])}" y2="${fx(p2[1])}"/>${disco(add(a, v, -4.6))}${disco(add(b, v, 4.6))}`;
    }
    case 'bastone': {
      // Di fronte il bastone passa per le due mani; di lato si vede di punta
      if (J.vista === 'fronte') { const a = J.w1, b = J.w2, d = dist(a, b) || 1, v = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
        return `<line class="eqs" x1="${fx(a[0] - v[0] * 3.5)}" y1="${fx(a[1] - v[1] * 3.5)}" x2="${fx(b[0] + v[0] * 3.5)}" y2="${fx(b[1] + v[1] * 3.5)}"/>`; }
      const c = at(pr.at || 'w1'); return `<circle class="eqf" cx="${fx(c[0])}" cy="${fx(c[1])}" r="1.1"/>`;
    }
    case 'anelli': {
      // Anello da ginnastica (circa 23 cm, spessore 28 mm) impugnato nella parte bassa, appeso con una cinghia
      const w = at(pr.at), r = 2.6, c = [w[0], w[1] - r + 0.55];
      const ancora = [pr.ax ?? c[0], pr.ay ?? -30];
      const cl = pr.at === 'w2' ? ' dietro' : '';
      return `<line class="cinghia${cl}" x1="${fx(c[0])}" y1="${fx(c[1] - r)}" x2="${fx(ancora[0])}" y2="${fx(ancora[1])}"/><circle class="anello${cl}" cx="${fx(c[0])}" cy="${fx(c[1])}" r="${r}"/>`;
    }
    default: return '';
  }
}
/* Attrezzi fermi */
// Ventola o volano a raggi: gira solo negli omini animati, più veloce dei pedali
function ventolaSVG(cx, cy, r, raggi, P, vivo) {
  const rr = Array.from({ length: raggi }, (_, i) => { const v = dir(i * 360 / raggi); return `<line class="eq" x1="${cx}" y1="${cy}" x2="${fx(cx + v[0] * (r - 0.6))}" y2="${fx(cy + v[1] * (r - 0.6))}"/>`; }).join('');
  const gira = vivo && !reduceMotion && P.giri ? `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${fx(60 / P.giri / 2.2)}s" repeatCount="indefinite"/>` : '';
  return `<circle class="eqs" fill="none" cx="${cx}" cy="${cy}" r="${r}"/><g>${gira}${rr}</g><circle class="eqf" cx="${cx}" cy="${cy}" r="1.4"/>`;
}
function scenaSVG(P, vivo = false) {
  const out = [];
  for (const pr of P.props || []) {
    if (pr.p === 'ellittica') {
      // Ellittica a trazione posteriore: carter tondo dietro con la pedivella, base a terra, colonna con perno dei manici e console
      const [cx, cy] = pr.c, [px, py] = pr.perno;
      out.push(`<line class="eqs" x1="2" x2="${px + 9}" y1="${G}" y2="${G}"/><circle class="box" cx="${cx}" cy="${cy}" r="${pr.r + 2.6}"/><circle class="eqf" cx="${cx}" cy="${cy}" r="1.3"/>`
        + `<line class="eq" x1="${cx}" y1="${fx(cy + pr.r + 2.6)}" x2="${cx}" y2="${G}"/>`
        + `<line class="eqs" x1="${px + 7}" y1="${G}" x2="${px + 1}" y2="${py - 15}"/><line class="eqs" x1="${px - 2.5}" y1="${py - 16}" x2="${px + 3.5}" y2="${py - 17.5}"/><circle class="eqf" cx="${px}" cy="${py}" r="1.3"/>`);
    }
    if (pr.p === 'scala') {
      // Stair climber: gradini (passo × alzata) che scendono verso dietro alla velocità dei piedi, corrimano ai lati
      const { passo: dp, alzata: dh, mani } = pr, x0 = pr.x - 2.5, y0 = pr.y + 1.3;          // spigolo del gradino sotto il primo piede
      let d = `M${fx(x0 - 3 * dp)} ${fx(y0 + 3 * dh)}`;
      for (let k = -3; k <= 3; k++) d += ` H${fx(x0 + (k + 1) * dp)} V${fx(y0 - (k + 1) * dh)}`;
      const vel = P.passi ? P.passi.ciclo / 2 : 0.85;
      const scende = vivo && !reduceMotion ? `<animateTransform attributeName="transform" type="translate" from="0 0" to="${-dp} ${dh}" dur="${fx(vel)}s" repeatCount="indefinite"/>` : '';
      const xa = 9, xb = 41, ya = y0 + (x0 - xa) * dh / dp, yb = y0 - (xb - x0) * dh / dp;     // fianco inclinato della macchina
      out.push(`<clipPath id="gt-scala"><polygon points="${xa},${G - 1} ${xa},${fx(ya - 3)} ${xb},${fx(yb - 3 - dh)} ${xb},${G - 1}"/></clipPath>`
        + `<g clip-path="url(#gt-scala)"><path class="eq" fill="none" d="${d}">${scende}</path></g>`
        + `<line class="eqs" x1="${xa - 1}" y1="${G}" x2="${xb + 9}" y2="${G}"/><line class="eqs" x1="${xa}" y1="${G}" x2="${xb}" y2="${fx(Math.min(G, yb + 5))}"/>`
        + `<line class="eqs" x1="${xb + 6}" y1="${G}" x2="${xb + 3}" y2="13"/><line class="eqs" x1="${xb}" y1="12" x2="${xb + 6.5}" y2="14.5"/>`
        + `<line class="eqs" x1="${fx(mani[0] - 9)}" y1="${fx(mani[1] + 0.6)}" x2="${xb + 4}" y2="${fx(mani[1] + 0.6)}"/>`);
    }
    if (pr.p === 'corda') {
      // Corda da arrampicata appesa: la treccia scende quando il corpo sale (fermo nella fase in cui cambiano le mani)
      const { x } = pr, C = P.corda;
      const scende = vivo && !reduceMotion && C ? `<animate attributeName="stroke-dashoffset" values="0;${-C.d1};${fx(-C.d1 - C.d2)};${fx(-C.d1 - C.d2)}" keyTimes="0;0.4;0.8;1" dur="${C.ciclo}s" repeatCount="indefinite"/>` : '';
      out.push(`<line class="cordone" x1="${x}" x2="${x}" y1="-14" y2="${G - 0.8}"/><line class="treccia" x1="${x}" x2="${x}" y1="-14" y2="${G - 0.8}">${scende}</line>`
        + `<path class="cordone" d="M${x} ${G - 0.8} Q${x + 1} ${G} ${x + 5} ${G - 0.9} Q${x + 9} ${G - 2} ${x + 4} ${G - 1.6}"/>`);
    }
    if (pr.p === 'vogatore') {
      // Vogatore: rotaia bassa con piede dietro, pedana inclinata, carter del volano davanti con l'uscita della catena e il monitor
      const [ux, uy] = pr.uscita, [px, py] = pr.piedi, vx = ux + 4.6, vy = uy + 0.8, ry = py + 3.6;
      out.push(`<line class="eqs" x1="3" x2="${px + 6}" y1="${ry}" y2="${ry}"/><line class="eqs" x1="${px + 6}" y1="${ry}" x2="${vx - 1}" y2="${fx(vy + 4.6)}"/>`
        + `<line class="eq" x1="5" x2="5" y1="${ry}" y2="${G}"/><line class="eqs" x1="2.5" x2="8" y1="${G}" y2="${G}"/>`
        + `<line class="eqs" x1="${fx(px - 0.8)}" y1="${fx(py + 1.4)}" x2="${fx(px + 4)}" y2="${fx(py - 3.6)}"/><line class="eq" x1="${px + 1}" y1="${fx(py + 1)}" x2="${px + 1}" y2="${ry}"/>`
        + `<circle class="box" cx="${vx}" cy="${fx(vy)}" r="4.8"/><circle class="eqf" cx="${vx}" cy="${fx(vy)}" r="1"/>`
        + `<line class="eq" x1="${vx}" y1="${fx(vy + 4.8)}" x2="${vx}" y2="${G}"/><line class="eqs" x1="${vx - 3}" x2="${vx + 3}" y1="${G}" y2="${G}"/>`
        + `<line class="eq" x1="${fx(vx - 1.2)}" y1="${fx(vy - 4.6)}" x2="${fx(vx - 6)}" y2="${fx(vy - 12)}"/><rect class="box" x="${fx(vx - 9.4)}" y="${fx(vy - 16)}" width="4.6" height="3.8" rx="0.6"/>`);
    }
    if (pr.p === 'skierg') {
      // SkiErg: colonna alta con il volano in cima, pulegge da cui scendono le corde, pedana sotto i piedi
      const { x, puleggia: [qx, qy] } = pr;
      out.push(`<line class="eqs" x1="16" x2="${x + 5}" y1="${G}" y2="${G}"/><line class="eqs" x1="${x + 2}" y1="${G}" x2="${x}" y2="-6"/>`
        + `<rect class="box" x="${fx(qx - 1)}" y="${fx(qy - 9)}" width="${fx(x - qx + 3)}" height="7" rx="1"/><rect class="box" x="${x + 0.6}" y="16" width="3.4" height="3" rx="0.5"/>`);
    }
    if (pr.p === 'airbike') {
      // Air bike: grande ventola davanti, telaio basso dalla sella alla pedivella e al mozzo della ventola
      const [sx, sy] = pr.sella, [cx, cy] = pr.c, [vx, vy, vr] = pr.ventola;
      out.push(`<line class="eqs" x1="${sx - 9}" x2="${sx + 1}" y1="${G}" y2="${G}"/><line class="eqs" x1="${vx - 6}" x2="${vx + 7}" y1="${G}" y2="${G}"/>`
        + `<line class="eqs" x1="${sx - 4}" y1="${G}" x2="${fx(sx + 0.6)}" y2="${fx(sy + 2)}"/><line class="eqs" x1="${fx(sx - 3.6)}" y1="${sy}" x2="${fx(sx + 3.4)}" y2="${fx(sy - 0.4)}"/>`
        + `<line class="eqs" x1="${fx(sx - 0.8)}" y1="${fx(sy + 7)}" x2="${cx}" y2="${cy}"/><line class="eqs" x1="${cx}" y1="${cy}" x2="${vx}" y2="${vy}"/>`
        + `<line class="eqs" x1="${vx}" y1="${vy}" x2="${vx + 1}" y2="${G}"/>${ventolaSVG(vx, vy, vr, 8, P, vivo)}<circle class="box" cx="${cx}" cy="${cy}" r="2.4"/>`);
    }
    if (pr.p === 'cyclette') {
      // Cyclette vista di lato: base a terra, tubo della sella, colonna del manubrio, volano davanti
      const [sx, sy] = pr.sella, [mx, my] = pr.manubrio, [vx, vy, vr] = pr.volano, [cx, cy] = pr.c;
      out.push(`<line class="eqs" x1="${sx - 9}" x2="${sx + 1}" y1="${G}" y2="${G}"/><line class="eqs" x1="${vx - 4}" x2="${vx + 8}" y1="${G}" y2="${G}"/>`
        + `<line class="eqs" x1="${sx - 4}" y1="${G}" x2="${fx(sx + 0.6)}" y2="${fx(sy + 2)}"/>`
        + `<line class="eqs" x1="${fx(sx - 0.8)}" y1="${fx(sy + 7)}" x2="${cx}" y2="${cy}"/>`
        + `<line class="eqs" x1="${cx}" y1="${cy}" x2="${vx + 3}" y2="${G}"/>`
        + `<line class="eqs" x1="${vx + 3}" y1="${G}" x2="${fx(mx - 2.5)}" y2="${fx(my + 2)}"/>`
        + `<line class="eqs" x1="${fx(mx - 3.5)}" y1="${fx(my + 1.4)}" x2="${fx(mx + 1.8)}" y2="${fx(my - 0.8)}"/>`
        + `<line class="eqs" x1="${fx(sx - 3.6)}" y1="${sy}" x2="${fx(sx + 3.4)}" y2="${fx(sy - 0.4)}"/>`
        + (pr.ventola   // BikeErg: ventola nella gabbia tonda e monitor sopra il manubrio
          ? ventolaSVG(vx, vy, vr, 6, P, vivo) + `<line class="eq" x1="${fx(mx - 2)}" y1="${fx(my + 1)}" x2="${fx(mx - 3)}" y2="${fx(my - 6)}"/><rect class="box" x="${fx(mx - 5.5)}" y="${fx(my - 10)}" width="5" height="4" rx="0.6"/>`
          : pr.pesante   // volano pesante della spinning: cerchio spesso con il mozzo grande
          ? `<circle class="eqs" fill="none" cx="${vx}" cy="${vy}" r="${vr}"/><circle class="box" cx="${vx}" cy="${vy}" r="${fx(vr - 2.4)}"/><circle class="eqf" cx="${vx}" cy="${vy}" r="1.4"/>`
          : `<circle class="box" cx="${vx}" cy="${vy}" r="${vr}"/><circle class="eqf" cx="${vx}" cy="${vy}" r="1"/>`)
        + `<circle class="box" cx="${cx}" cy="${cy}" r="2.4"/>`);
    }
    if (pr.p === 'curvo') {
      // Tapis roulant curvo, senza motore: il nastro corre solo quando spingono i piedi,
      // quindi accelera durante gli appoggi e rallenta un po' nei voli
      const pts = Array.from({ length: 25 }, (_, i) => { const x = pr.x1 + (pr.x2 - pr.x1) * i / 24; return [x, curvaY(pr, x)]; });
      const d = (dy = 0) => 'M' + pts.map(q => `${fx(q[0])} ${fx(q[1] + dy)}`).join(' L');
      const tratto = [3.6, 2.4], giro = 6;
      let scorre = '';
      if (vivo && !reduceMotion && P.passi) {
        const { corsa, appoggio, ciclo } = P.passi;
        const volo = (corsa / appoggio) * (0.5 - appoggio) * 0.65;                 // nel volo il nastro scorre a circa 2/3 della velocità
        const tot = Math.max(1, Math.round((2 * corsa + 2 * volo) / giro)) * giro; // giri interi: il tratteggio riparte senza scatti
        const v1 = (tot - 2 * corsa) / 2;
        const vals = [0, corsa, corsa + v1, 2 * corsa + v1, tot].map(fx).join(';');
        scorre = `<animate attributeName="stroke-dashoffset" values="${vals}" keyTimes="0;${appoggio};0.5;${0.5 + appoggio};1" dur="${ciclo}s" repeatCount="indefinite"/>`;
      }
      const yb = curvaY(pr, pr.xc), y1 = curvaY(pr, pr.x1), y2 = curvaY(pr, pr.x2);
      out.push(`<path class="eq" fill="none" d="${d()}" stroke-dasharray="${tratto.join(' ')}">${scorre}</path>`
        + `<path class="eqs" fill="none" d="${d(2.4)}"/>`
        + `<circle class="eqf" cx="${pr.x1}" cy="${fx(y1 + 1.2)}" r="1.3"/><circle class="eqf" cx="${pr.x2}" cy="${fx(y2 + 1.2)}" r="1.3"/>`
        + `<line class="eq" x1="${pr.x1 + 2}" x2="${pr.x1 + 1}" y1="${fx(curvaY(pr, pr.x1 + 2) + 2.4)}" y2="${G}"/><line class="eq" x1="${pr.xc}" x2="${pr.xc}" y1="${fx(yb + 2.4)}" y2="${G}"/><line class="eq" x1="${pr.x2 - 2}" x2="${pr.x2 - 1}" y1="${fx(curvaY(pr, pr.x2 - 2) + 2.4)}" y2="${G}"/>`
        + `<line class="eqs" x1="${pr.x2 - 1}" y1="${fx(y2 + 1)}" x2="${pr.x2 + 2.5}" y2="${fx(y2 - 21)}"/>`
        + `<line class="eqs" x1="${pr.x2 - 1}" y1="${fx(y2 - 23)}" x2="${pr.x2 + 4.5}" y2="${fx(y2 - 20)}"/>`
        + `<line class="eq" x1="${pr.x2 + 1.2}" y1="${fx(y2 - 13)}" x2="${pr.x2 - 7}" y2="${fx(y2 - 13)}"/>`);
    }
    if (pr.p === 'ghd') {
      // GHD: cuscino del bacino sulla colonna, binario basso fino al supporto dei piedi, pedana dietro la pianta e due rulli (sopra la caviglia e sotto il polpaccio)
      const { x1, x2, y, piede: [ax, ay] } = pr, cx = (x1 + x2) / 2, px = ax + 1.6, yb = 46;
      out.push(`<line class="eqs" x1="${x1 - 4}" x2="${ax + 5}" y1="${G}" y2="${G}"/><line class="eqs" x1="${cx}" y1="${fx(y + 2.6)}" x2="${cx + 1}" y2="${G}"/>`
        + `<line class="eqs" x1="${cx + 0.6}" y1="${yb}" x2="${fx(px)}" y2="${yb}"/><line class="eqs" x1="${fx(px)}" y1="${G}" x2="${fx(px)}" y2="${fx(ay - 4.6)}"/>`
        + `<line class="eq" x1="${fx(px)}" y1="${fx(ay - 2.3)}" x2="${fx(ax - 1.5)}" y2="${fx(ay - 2.3)}"/><line class="eq" x1="${fx(px)}" y1="${fx(ay + 2.4)}" x2="${fx(ax - 4.5)}" y2="${fx(ay + 2.4)}"/>`
        + `<circle class="eqf" cx="${fx(ax - 1.5)}" cy="${fx(ay - 2.3)}" r="1.3"/><circle class="eqf" cx="${fx(ax - 4.5)}" cy="${fx(ay + 2.4)}" r="1.3"/>`
        + `<rect class="box" x="${x1}" y="${y}" width="${fx(x2 - x1)}" height="2.6" rx="1.2"/>`);
    }
    if (pr.p === 'reverseHyper') {
      // Reverse hyper: cuscino alto, montante con la base a terra, staffa del perno sotto il bordo, maniglie davanti
      const { x1, x2, y, mani: [mx, my], perno: [qx, qy] } = pr, xm = x1 + 11;
      out.push(`<line class="eqs" x1="${xm - 4}" x2="${x2 + 2}" y1="${G}" y2="${G}"/><line class="eqs" x1="${xm}" y1="${fx(y + 2.4)}" x2="${xm}" y2="${G}"/>`
        + `<line class="eqs" x1="${x2 - 3}" y1="${fx(y + 2.4)}" x2="${x2 - 1}" y2="${G}"/><line class="eq" x1="${qx}" y1="${fx(y + 2.4)}" x2="${qx}" y2="${qy}"/>`
        + `<line class="eq" x1="${qx}" y1="${fx(qy + 1.6)}" x2="${xm}" y2="${fx(qy + 5)}"/><line class="eqs" x1="${x2 - 0.6}" y1="${fx(y + 2.4)}" x2="${mx}" y2="${fx(my + 0.4)}"/>`
        + `<rect class="box" x="${x1}" y="${y}" width="${x2 - x1}" height="2.4" rx="1.1"/>`);
    }
    if (pr.p === 'pista') {
      // Pavimento che scorre: il corpo resta fermo e i segni a terra vanno indietro alla velocità del piede d'appoggio
      // (in avanti nel cammino all'indietro). Stesso passo dei segni in 3D: un segno ogni 6.
      const v = P.nastro || 0, giro = 6;
      const scorre = vivo && !reduceMotion && v ? `<animate attributeName="stroke-dashoffset" from="0" to="${v > 0 ? giro : -giro}" dur="${fx(giro / Math.abs(v))}s" repeatCount="indefinite"/>` : '';
      out.push(`<line class="eq" x1="2" x2="58" y1="${fx(G + 1.5)}" y2="${fx(G + 1.5)}" stroke-width="1.6" stroke-dasharray="0.7 5.3">${scorre}</line>`);
    }
    if (pr.p === 'slitta') {
      // Slitta vista di lato: pattini con la punta rialzata davanti (verso 1 = davanti a destra, −1 = a sinistra), pianale,
      // perno con due dischi impilati; con mani: due pali fino alle impugnature (quello lontano spostato di 1,1)
      const { x1, x2 } = pr, sv = pr.verso || 1, punta = sv > 0 ? x2 : x1, cx = (x1 + x2) / 2, y = G - 0.7;
      let pali = '';
      if (pr.mani) {
        const [hx, hy] = pr.mani, px = x1 + 1.6;
        pali = `<g class="lontano"><line class="eqs" x1="${fx(px - 1.1)}" y1="${fx(G - 3.4)}" x2="${fx(hx - 1.1)}" y2="${fx(hy - 1)}"/></g>`
          + `<line class="eqs" x1="${px}" y1="${fx(G - 3.4)}" x2="${hx}" y2="${fx(hy - 1)}"/>`;
      }
      out.push(`<line class="eqs" x1="${x1}" x2="${x2}" y1="${fx(y)}" y2="${fx(y)}"/><line class="eqs" x1="${punta}" y1="${fx(y)}" x2="${fx(punta + sv * 1.6)}" y2="${fx(y - 2.2)}"/>`
        + `<rect class="box" x="${x1 + 1}" y="${fx(G - 3.4)}" width="${x2 - x1 - 2}" height="1.8" rx="0.4"/><line class="eq" x1="${cx}" x2="${cx}" y1="${fx(G - 3.4)}" y2="${fx(G - 11)}"/>`
        + `<rect class="ld" x="${fx(cx - 4.6)}" y="${fx(G - 5.4)}" width="9.2" height="1.8" rx="0.5"/><rect class="ld" x="${fx(cx - 4.6)}" y="${fx(G - 7.3)}" width="9.2" height="1.8" rx="0.5"/>` + pali);
    }
    if (pr.p === 'tapis') {
      // Tapis roulant visto di lato: pedana sul pavimento, nastro tratteggiato che scorre indietro, montante con console e corrimano
      // Tratteggio più lungo quando il nastro va veloce, così a 60 fotogrammi al secondo non sfarfalla
      const { x1, x2, y } = pr, v = pr.v ?? P.nastro ?? 10, tratto = v > 40 ? [4, 2.4] : [2.2, 1.4], giro = tratto[0] + tratto[1];
      const scorre = vivo && !reduceMotion ? `<animate attributeName="stroke-dashoffset" from="0" to="${giro}" dur="${fx(giro / v)}s" repeatCount="indefinite"/>` : '';
      out.push(`<line class="eq" x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke-dasharray="${tratto.join(' ')}">${scorre}</line>`
        + `<line class="eqs" x1="${x1}" x2="${x2}" y1="${fx(y + 2.4)}" y2="${fx(y + 2.4)}"/>`
        + `<circle class="eqf" cx="${x1}" cy="${fx(y + 1.2)}" r="1.3"/><circle class="eqf" cx="${x2}" cy="${fx(y + 1.2)}" r="1.3"/>`
        + `<line class="eq" x1="${x1 + 3}" x2="${x1 + 3}" y1="${fx(y + 2.4)}" y2="${G}"/><line class="eq" x1="${x2 - 3}" x2="${x2 - 3}" y1="${fx(y + 2.4)}" y2="${G}"/>`
        + `<line class="eqs" x1="${x2 - 1}" y1="${fx(y + 1)}" x2="${x2 + 3}" y2="${fx(y - 26)}"/>`
        + `<line class="eqs" x1="${x2 - 1.5}" y1="${fx(y - 28.5)}" x2="${x2 + 5}" y2="${fx(y - 25)}"/>`
        + `<line class="eq" x1="${x2 + 1.6}" y1="${fx(y - 18)}" x2="${x2 - 6}" y2="${fx(y - 18)}"/>`);
    }
    if (pr.p === 'panca') out.push(`<line class="eqs" x1="${pr.x1}" x2="${pr.x2}" y1="${pr.y}" y2="${pr.y}"/><line class="eq" x1="${pr.x1 + 2}" x2="${pr.x1 + 2}" y1="${pr.y}" y2="${G}"/><line class="eq" x1="${pr.x2 - 2}" x2="${pr.x2 - 2}" y1="${pr.y}" y2="${G}"/>`);
    if (pr.p === 'box') out.push(`<rect class="box" x="${pr.x1}" y="${pr.y}" width="${pr.x2 - pr.x1}" height="${G - pr.y}" rx="1"/>`);
    if (pr.p === 'paralleline') {
      // Paralleline basse o alte: una maniglia orizzontale su due piedini
      const { x, y } = pr;
      out.push(`<line class="staggio" x1="${fx(x - 3.4)}" x2="${fx(x + 3.4)}" y1="${y}" y2="${y}"/><line class="eq" x1="${fx(x - 2.6)}" x2="${fx(x - 3.6)}" y1="${y}" y2="${G}"/><line class="eq" x1="${fx(x + 2.6)}" x2="${fx(x + 3.6)}" y1="${y}" y2="${G}"/>`);
    }
    if (pr.p === 'muro') out.push(`<line class="eqs" x1="${pr.x}" x2="${pr.x}" y1="-8" y2="${G}"/>`);
    if (pr.p === 'linea') out.push(`<line class="eqs" x1="${pr.a[0]}" y1="${pr.a[1]}" x2="${pr.b[0]}" y2="${pr.b[1]}"/>`);
    if (pr.p === 'sbarra') out.push(pr.basso
      ? `<line class="eq" x1="${pr.x}" x2="${pr.x}" y1="${pr.y}" y2="${G}"/><circle class="eqf" cx="${pr.x}" cy="${pr.y}" r="1.5"/>`
      : `<line class="eq" x1="${pr.x}" x2="${pr.x}" y1="${pr.y}" y2="-8"/><circle class="eqf" cx="${pr.x}" cy="${pr.y}" r="1.5"/>`);
    if (pr.p === 'parallele') {
      // Due staggi lunghi sorretti da montanti: di lato quello lontano si vede appena dietro quello vicino
      const { x1, x2, y } = pr, m1 = x1 + 2, m2 = x2 - 2, d = -1.1;
      const base = x => `<line class="eq" x1="${fx(x - 2.6)}" x2="${fx(x + 2.6)}" y1="${G}" y2="${G}"/>`;
      out.push(`<g class="lontano"><line class="staggio" x1="${fx(x1 + d)}" x2="${fx(x2 + d)}" y1="${fx(y - 0.7)}" y2="${fx(y - 0.7)}"/>`
        + `<line class="eq" x1="${fx(m1 + d)}" x2="${fx(m1 + d)}" y1="${fx(y - 0.7)}" y2="${G}"/><line class="eq" x1="${fx(m2 + d)}" x2="${fx(m2 + d)}" y1="${fx(y - 0.7)}" y2="${G}"/></g>`
        + `<line class="staggio" x1="${x1}" x2="${x2}" y1="${y}" y2="${y}"/>`
        + `<line class="eq" x1="${m1}" x2="${m1}" y1="${y}" y2="${G}"/><line class="eq" x1="${m2}" x2="${m2}" y1="${y}" y2="${G}"/>${base(m1)}${base(m2)}`);
    }
  }
  return out.join('');
}
const SCENA_DINAMICA = new Set(['bil', 'bilf', 'man', 'peso', 'palla', 'kb', 'ruota', 'rullo', 'maniglia', 'cavo', 'piatto', 'anelli', 'bastone', 'pedivella', 'leva', 'braccioEll', 'sella', 'cordaSalto', 'onda', 'sacco', 'pendolo']);

function corpoSVG(P, J, ev = new Set()) {
  const vf = J.vista === 'fronte';
  const props = (P.props || []).filter(p => SCENA_DINAMICA.has(p.p));
  const sfondo = p => p.at === 'w2' || p.dietro;
  const dietroProps = props.filter(sfondo).map(p => propSVG(p, J)).join('');
  const davantiProps = props.filter(p => !sfondo(p)).map(p => propSVG(p, J)).join('');
  const dietro = arto(J, 2, vf ? 'm1' : 'm2', ev, vf), davanti = arto(J, 1, 'm1', ev, vf);
  const collo = lerpP(J.neck, J.head, 0.55);
  return dietroProps + dietro.gamba + dietro.braccio
    + segmentoSVG(J.hip, J.neck, 'busto', 'm1', ev, vf)
    + `<line class="mcore m1" x1="${fx(J.neck[0])}" y1="${fx(J.neck[1])}" x2="${fx(collo[0])}" y2="${fx(collo[1])}" stroke-width="2.9"/>`
    + `<circle class="hd" cx="${fx(J.head[0])}" cy="${fx(J.head[1])}" r="${L.hr}"/>`
    + davanti.gamba + davanti.braccio + davantiProps;
}

function trasformazione(P) {
  if (!P.sc) return '';
  const [s, cx, cy] = P.sc;
  return ` transform="translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})"`;
}

/* ---------- Tempo ---------- */
export function leggiTempo(t) {
  if (!t) return null;
  const s = String(t).trim().toUpperCase().replace(/X/g, '0.6');
  let p = s.includes('-') || s.includes(' ') || s.includes('.') ? s.split(/[-\s/]+/) : s.split('');
  p = p.map(Number).filter(n => !Number.isNaN(n));
  if (p.length !== 4) return null;
  return p.map(n => Math.max(0, Math.min(8, n)));
}
const easing = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

// Restituisce [indice posa A, indice posa B, u] al tempo s
function fase(P, s, tempo, inizia) {
  const K = P.keys.length;
  if (K === 1) return [0, 0, 0];
  if (K === 2) {
    const [E, P1, C, P2] = leggiTempo(tempo) || leggiTempo(P.tempo) || [1.3, 0.2, 1.0, 0.35];
    const prima = (inizia || P.inizia) === 'conc' ? [C, P2, E, P1] : [E, P1, C, P2];
    const d1 = Math.max(prima[0], 0.25), h1 = prima[1], d2 = Math.max(prima[2], 0.25), h2 = prima[3];
    const tot = d1 + h1 + d2 + h2;
    let x = s % tot;
    if (x < d1) return [0, 1, easing(x / d1)];
    x -= d1; if (x < h1) return [0, 1, 1];
    x -= h1; if (x < d2) return [0, 1, 1 - easing(x / d2)];
    return [0, 1, 0];
  }
  const seg = P.seg || P.keys.map(() => 0.7);
  const tot = seg.reduce((a, b) => a + b, 0);
  let x = s % tot;
  for (let i = 0; i < K; i++) {
    if (x < seg[i]) return [i, (i + 1) % K, P.lineare ? x / seg[i] : easing(x / seg[i])];
    x -= seg[i];
  }
  return [0, 1, 0];
}

/* ---------- Controllo anatomico (strumenti/controllo-pose.mjs) ---------- */
// Giunti di un fotogramma più la distanza massima tra mano o piede e il suo appoggio
let mancati = null;
export function giuntiPerControllo(anim, kA, kB, u) {
  const P = POSE[anim];
  mancati = [];
  try { const J = posa(P, kA, kB, u); J.manca = Math.max(0, ...mancati); return J; }
  finally { mancati = null; }
}
export const MISURE = { L, G, flessione, giunti, angoliDi };

/* ---------- API ---------- */
function frame(P, s, opz) {
  if (opz.tenuta || P.tenuta !== undefined && P.keys.length === 1) {
    const k = P.keys[P.tenuta ?? (P.keys.length > 1 ? 1 : 0)] || P.keys[0];
    const respiro = Math.sin(s * 2 * Math.PI / 3.2) * 0.22;
    const kk = { ...k, hip: [k.hip[0], k.hip[1] + respiro] };
    if (k.nk) kk.nk = [k.nk[0], k.nk[1] + respiro * 0.6];
    return posa(P, kk, kk, 0);
  }
  const [a, b, u] = fase(P, s, opz.tempo, opz.inizia);
  return posa(P, P.keys[a], P.keys[b], u);
}

function svgCompleto(P, J, cls, ev, vivo = false) {
  const g = P.g === undefined ? G : P.g;
  const suolo = g === null ? '' : `<line class="gr" x1="2" x2="58" y1="${g}" y2="${g}"/>`;
  return `<svg class="${cls}" viewBox="0 0 60 60" aria-hidden="true"><g${trasformazione(P)}>${suolo}${scenaSVG(P, vivo)}<g class="corpo">${corpoSVG(P, J, ev)}</g></g></svg>`;
}

// Omino fermo nella posa più rappresentativa (fine della prima fase)
export function ominoSVG(anim, opz = {}) {
  const P = POSE[animazione(anim)];
  const k = P.keys[P.tenuta ?? Math.min(1, P.keys.length - 1)];
  const J = posa(P, k, k, 0);
  return svgCompleto(P, J, opz.cls || 'omino', accesi(opz));
}

const vivi = new Set();
let loopAttivo = false;
function loop(ts) {
  for (const v of vivi) {
    if (!v.el.isConnected) { vivi.delete(v); continue; }
    const s = (ts - v.t0) / 1000;
    v.g.innerHTML = corpoSVG(v.P, frame(v.P, s, v.opz), v.ev);
  }
  if (vivi.size) requestAnimationFrame(loop); else loopAttivo = false;
}

// Monta un omino animato dentro el.
// opz: { tempo:'3-1-1-0', inizia:'ecc'|'conc', tenuta:bool, muscoli:'testo della libreria' }
export function montaOmino(el, anim, opz = {}) {
  const P = POSE[animazione(anim)];
  if (!el) return;
  el._ferma3d?.();                                        // se sul palco girava l'omino 3D, si ferma
  for (const v of vivi) if (v.el === el) vivi.delete(v);
  const ev = accesi(opz);
  const J0 = frame(P, 0, opz);
  el.innerHTML = svgCompleto(P, J0, 'omino grande', ev, true);
  if (reduceMotion && !opz.forza) { el.innerHTML = ominoSVG(anim, { ...opz, cls: 'omino grande' }); return; }
  const g = el.querySelector('g.corpo');
  el.querySelector('svg')?.setCurrentTime?.(0);           // il nastro animato parte insieme all'omino
  vivi.add({ el, g, P, opz, ev, t0: performance.now() });
  if (!loopAttivo) { loopAttivo = true; requestAnimationFrame(loop); }
}

// Ferma l'omino SVG animato di el (lo usa omino3d.js quando lo sostituisce)
export function smontaOmino(el) { for (const v of vivi) if (v.el === el) vivi.delete(v); }
// Giunti al tempo s, per l'omino 3D
export const giuntiAlTempo = (anim, s, opz = {}) => frame(POSE[animazione(anim)], s, opz);
// Misure, muscoli e geometrie degli attrezzi condivise con omino3d.js
export const DISEGNO = { L, G, GROSSO, SEGMENTI, accesi, curvaY, CORDA_SALTO, geoBraccioEll, geoCordaSalto, geoOnda, geoLeva, geoPendolo };

export const durataCiclo = (anim, opz = {}) => {
  const P = POSE[animazione(anim)];
  if (P.keys.length === 1) return 3.2;
  if (P.keys.length === 2) {
    const t = leggiTempo(opz.tempo) || leggiTempo(P.tempo) || [1.3, 0.2, 1.0, 0.35];
    return Math.max(t[0], .25) + t[1] + Math.max(t[2], .25) + t[3];
  }
  return (P.seg || P.keys.map(() => 0.7)).reduce((a, b) => a + b, 0);
};

/* ---------- Varianti: attrezzo, panca inclinabile e rialzi ---------- */
// Le pose delle varianti nascono dalle regole qui sotto e si aggiungono a POSE con generata: true:
// passano dal controllo anatomico come le altre, ma non compaiono negli elenchi degli omini.
export const GRADI_PANCA = [0, 15, 30, 45, 60, 75, 90];
export const ATTREZZI = ['manubri', 'bilanciere', 'cavi'];
// Altezze dei rialzi in unità dell'omino (una unità è circa 3,8 cm)
export const RIALZI = {
  mani: { paralleline: 3.2, 'parallele alte': 8 },          // circa 12 e 30 cm
  piedi: { 'rialzo basso': 5, panca: 12, 'box alto': 16 }   // circa 20, 45 e 60 cm
};
const SIGLA = { paralleline: 'pl', 'parallele alte': 'pa', 'rialzo basso': 'rb', panca: 'pn', 'box alto': 'ba' };
const SPALLA = L.tr - 1.2;                                  // dal bacino alla spalla, lungo il busto
const senD = g => Math.sin(g * RAD);
const pp = p => [fx(p[0]), fx(p[1])];
const ATTREZZO_PROP = new Set(['bil', 'bilf', 'man', 'peso', 'kb', 'cavo', 'maniglia']);
const genera = (k, P) => { POSE[k] = { ...P, generata: true }; return k; };

// Attrezzo in mano: di lato si vede la mano vicina, di fronte tutte e due
function inMano(att, { fronte = false, due = false, cavo = [46, 54], cavo2 = null, rBil = 4.6 } = {}) {
  const mani = fronte || due ? ['w1', 'w2'] : ['w1'];
  if (att === 'manubri') return mani.map(at => ({ p: 'man', at }));
  if (att === 'bilanciere') return fronte ? [{ p: 'bilf' }] : [{ p: 'bil', at: 'w1', r: rBil }];
  if (att === 'cavi') return mani.flatMap((at, i) => [{ p: 'cavo', at, to: i && cavo2 ? cavo2 : cavo }, { p: 'maniglia', at }]);
  return [];
}

// Corpo seduto o sdraiato su una panca a d gradi (0 = piana, 90 = schienale dritto)
function suPanca(d) {
  const hip = d === 0 ? [29, 41.8] : [28.5, 41.7];
  const t = d - 90, up = dir(180 - t), avanti = dir(90 - t);
  const spalla = add(hip, up, SPALLA);
  let props;
  if (d === 0) props = [{ p: 'panca', x1: 5, x2: 33, y: 44.2 }];
  else {
    const seduta = [hip[0], hip[1] + 2.4];
    const b0 = add(add(hip, avanti, -3.3), up, -1.5), b1 = add(b0, up, d >= 60 ? 17 : 19);
    props = [{ p: 'linea', a: pp([seduta[0] - 3, seduta[1]]), b: pp([seduta[0] + 6, seduta[1]]) },
      { p: 'linea', a: pp(b0), b: pp(b1) },
      { p: 'linea', a: pp([seduta[0] + 1.5, seduta[1]]), b: [fx(seduta[0] + 1.5), G] }];
  }
  return { spalla, props, corpo: { hip, t, hd: lerp(4, 0, d / 90), legs: { ik: [40, 53], b: 1 } } };
}
// Braccia tese: inclinate in avanti di phi gradi rispetto alla verticale
const sopra = (s, phi, r) => [s[0] + r * senD(phi), s[1] - r * Math.cos(phi * RAD)];
const phiSpinta = d => 1 + 12 * senD(2 * d) + 15 * (d / 90) ** 2;

const SU_PANCA = {
  // Distensioni: in basso le mani all'altezza del petto, in alto braccia verticali sopra le spalle
  spinta: { nome: 'Spinta su panca', inizia: 'ecc', gradi: GRADI_PANCA,
    braccia: (s, d) => [{ ik: [s[0] + 2.3 + 1.2 * senD(2 * d) + 1.7 * (d / 90) ** 2, s[1] - 5.6 + 3.6 * d / 90], b: 1 },
      { ik: sopra(s, phiSpinta(d), 17.2), b: 1 }],
    cavo: s => [fx(s[0] + 1), G] },
  // Croci: di lato le braccia si aprono verso il basso e si chiudono sopra il petto, gomiti morbidi
  croci: { nome: 'Croci su panca', inizia: 'ecc', gradi: [0, 15, 30, 45, 60],
    braccia: (s, d) => [{ ik: [s[0] + 10, s[1] + 3], b: 1 }, { ik: sopra(s, phiSpinta(d), 16.4), b: 1 }],
    cavo: s => [fx(s[0] + 2), G] },
  // Curl seduto o su panca inclinata: il braccio resta giù, l'avambraccio sale
  curl: { nome: 'Curl su panca', inizia: 'conc', gradi: [45, 60, 75, 90],
    braccia: () => [{ a: [2, 4] }, { a: [6, 150] }], cavo: s => [fx(s[0] + 12), G] },
  // Tricipiti sopra la testa: sdraiato è il french press, seduto le estensioni
  tricipiti: { nome: 'Tricipiti su panca', inizia: 'ecc', gradi: GRADI_PANCA,
    braccia: (s, d) => { const w = 104 + 76 * Math.sqrt(d / 90) - (d - 90); return [{ a: [w, w] }, { a: [w, w + 98] }]; },
    cavo: s => [fx(s[0] - 14), G] },
  // Alzate frontali da seduto
  frontali: { nome: 'Alzate frontali da seduto', inizia: 'conc', gradi: [75, 90],
    braccia: () => [{ a: [4, 8] }, { a: [92, 96] }], cavo: s => [fx(s[0] - 4), G] }
};

// Rematore con il petto appoggiato a una panca inclinata (prono)
function rematoreProno(d) {
  const t = 90 - d, hip = [24, 37], up = dir(180 - t), fr = dir(90 - t);
  const s = add(hip, up, SPALLA);
  const c0 = add(add(hip, fr, 2.4), up, -1), c1 = add(c0, up, 17), piede = add(c0, up, 5);
  return { props: [{ p: 'linea', a: pp(c0), b: pp(c1) }, { p: 'linea', a: pp(piede), b: [fx(piede[0]), G] }],
    keys: [{ hip, t, hd: -6, legs: { ik: [12, 53] }, arms: { a: [2, 3] } },
      { hip, t, hd: -6, legs: { ik: [12, 53] }, arms: { ik: pp(add(add(s, up, -4), fr, 4)), b: -1 } }] };
}

// Di quale famiglia è un'animazione di base e cosa sa disegnare
const FAMIGLIA = {
  panca: 'spinta', panca_man: 'spinta', panca_incl: 'spinta', press_man: 'spinta', press: 'spinta', chest_press: null,
  croci: 'croci', curl: 'curl', curl_man: 'curl', french: 'tricipiti', estensioni: 'tricipiti', alzate_front: 'frontali',
  alzate_lat: 'laterali', rematore: 'rematore', rematore_man: 'rematore'
};
// Solo cambio d'attrezzo, in piedi: dove arriva il cavo
const SOLO_ATTREZZO = {
  curl: { cavo: [46, 54] }, curl_man: { cavo: [46, 54], due: true }, alzate_front: { cavo: [24, 54] }, estensioni: { cavo: [16, 54] },
  kickback: { cavo: [50, 30], niente: ['bilanciere'] }, rematore: { niente: ['cavi'] }, rematore_man: { niente: ['cavi'] }, rdl_man: { cavo: [48, 54], due: true },
  affondo_man: { cavo: [50, 54], due: true }, pullover: { cavo: [2, 40] }, press: { cavo: [30, 54] }, press_man: { cavo: [30, 54] },
  alzate_lat: { fronte: true, cavo: [18, 54], cavo2: [42, 54], niente: ['bilanciere'] },
  alzate_post: { fronte: true, cavo: [20, 54], cavo2: [40, 54], niente: ['bilanciere'] },
  shrug: { fronte: true, cavo: [34, 54], cavo2: [26, 54], niente: ['cavi'] },
  croci: { fronte: true, cavo: [52, 30], cavo2: [8, 30], niente: ['bilanciere'] }
};
// Cosa sa disegnare l'omino per ogni animazione: la libreria sceglie poi cosa offrire esercizio per esercizio
export const VARIANTI_OMINO = {};

for (const [base, o] of Object.entries(SOLO_ATTREZZO)) {
  if (!POSE[base]) continue;
  const P = POSE[base];
  const attrezzi = ATTREZZI.filter(a => !(o.niente || []).includes(a));
  for (const att of attrezzi) {
    const props = [...(P.props || []).filter(p => !ATTREZZO_PROP.has(p.p)), ...inMano(att, { ...o, due: o.due })];
    genera(`${base}~${att}`, { ...P, nome: `${P.nome} (${att})`, props });
  }
  VARIANTI_OMINO[base] = { attrezzi, gradi: {} };
}

for (const [fam, f] of Object.entries(SU_PANCA)) {
  for (const d of f.gradi) {
    const { spalla, props, corpo } = suPanca(d);
    const [bA, bB] = f.braccia(spalla, d);
    for (const att of ATTREZZI) {
      if (fam === 'croci' && att === 'bilanciere') continue;
      if (fam === 'curl' && att === 'bilanciere' && d < 75) continue;
      genera(`${fam}~${att}~p${d}`, { nome: `${f.nome} a ${d}° (${att})`, inizia: f.inizia,
        props: [...props, ...inMano(att, { cavo: f.cavo(spalla) })],
        keys: [{ ...corpo, arms: bA }, { ...corpo, arms: bB }] });
    }
  }
}
for (const d of [15, 30, 45]) {
  const r = rematoreProno(d);
  for (const att of ['manubri', 'bilanciere'])
    genera(`rematore~${att}~p${d}`, { nome: `Rematore con il petto sulla panca a ${d}° (${att})`, inizia: 'conc',
      props: [...r.props, ...inMano(att)], keys: r.keys });
}
// Alzate laterali da seduto, viste di fronte: la coscia si accorcia perché viene verso di noi
for (const att of ['manubri', 'cavi']) for (const d of [75, 90])
  genera(`laterali~${att}~p${d}`, { nome: `Alzate laterali da seduto (${att})`, vista: 'fronte', inizia: 'conc', lenK: { th: 0.45 },
    props: [{ p: 'panca', x1: 18, x2: 42, y: 40.8 }, ...inMano(att, { fronte: true, cavo: [18, 54], cavo2: [42, 54] })],
    keys: [{ hip: [30, 38.8], t: 0, legs: { a: [20, 2] }, arms: { a: [14, 16] } }, { hip: [30, 38.8], t: 0, legs: { a: [20, 2] }, arms: { a: [86, 90] } }] });

// Gradi possibili per famiglia e attrezzo
const gradiDi = (fam, att) => fam === 'rematore' ? (att === 'cavi' ? [] : [15, 30, 45])
  : fam === 'laterali' ? (att === 'bilanciere' ? [] : [75, 90])
  : (SU_PANCA[fam]?.gradi || []).filter(d => POSE[`${fam}~${att}~p${d}`]);
for (const [base, fam] of Object.entries(FAMIGLIA)) {
  if (!fam || !POSE[base]) continue;
  const v = VARIANTI_OMINO[base] || (VARIANTI_OMINO[base] = { attrezzi: [...ATTREZZI], gradi: {} });
  for (const att of v.attrezzi) { const g = gradiDi(fam, att); if (g.length) v.gradi[att] = g; }
}

/* Rialzi del calisthenics */
// Corpo dritto dalla caviglia: trova l'inclinazione in cui la spalla sta a distanza r dalla mano
function inclinazione(cav, mano, r, da, a, passo) {
  for (let e = da; passo > 0 ? e <= a : e >= a; e += passo) {
    const u = [Math.cos(e * RAD), -Math.sin(e * RAD)];
    if (dist(add(cav, u, L.th + L.sh + L.tr - 1.3), mano) <= r) return Math.round(e * 10) / 10;
  }
  return a;
}
function sottoPiedi(h, cav, x1, x2) {
  if (!h) return [];
  const y = fx(cav[1] + 1.4);
  return h === RIALZI.piedi.panca ? [{ p: 'panca', x1, x2, y }] : [{ p: 'box', x1, x2, y }];
}
const PIEGAMENTI = ['push', 'push_rialzo', 'push_declinato'];
for (const [mani, hm] of [['', 0], ...Object.entries(RIALZI.mani)]) for (const [piedi, hp] of [['', 0], ...Object.entries(RIALZI.piedi)]) {
  if (!mani && !piedi) continue;
  const mano = [41.5, 53.2 - hm], cav = [8, 52.6 - hp];
  const alto = inclinazione(cav, mano, 17.2, 80, -45, -0.1), basso = inclinazione(cav, mano, 4.8, 80, -45, -0.1);
  const corpo = e => ({ ...linea(cav, e), hd: -6, legs: { ik: cav, toe: pp([cav[0] + 1.4, cav[1] + 1.8]) }, arms: { ik: mano, b: -1 } });
  genera(`push~m${SIGLA[mani] || 0}~p${SIGLA[piedi] || 0}`, { nome: 'Piegamento con rialzi', inizia: 'ecc',
    props: [...(hm ? [{ p: 'paralleline', x: mano[0], y: fx(mano[1] + 1.1) }] : []), ...sottoPiedi(hp, cav, 0, 16)],
    keys: [corpo(alto), corpo(basso)] });
}
for (const [piedi, h] of Object.entries(RIALZI.piedi)) {
  // Pike: tra la versione a terra e quella con i piedi su un box (15 unità)
  const u = h / 15, A = POSE.pike.keys, B = POSE.pike_rialzato.keys;
  const mix = (a, b) => { const cav = lerpP(a.legs.ik, b.legs.ik, u);
    return { hip: lerpP(a.hip, b.hip, u), t: lerp(a.t, b.t, u), hd: 0, legs: { ik: pp(cav), toe: pp([cav[0] + 1.4, cav[1] + 1.8]) }, arms: { ik: pp(lerpP(a.arms.ik, b.arms.ik, u)), b: -1 } }; };
  const cavP = lerpP(A[0].legs.ik, B[0].legs.ik, u);
  genera(`pike~p${SIGLA[piedi]}`, { nome: 'Pike push-up con i piedi rialzati', inizia: 'ecc', props: sottoPiedi(h, cavP, 4, 19), keys: [mix(A[0], B[0]), mix(A[1], B[1])] });
  // Trazione australiana: talloni sul rialzo
  // la caviglia resta a 33 dalla sbarra, così il petto arriva comunque alla sbarra
  const mano = [27, 24.7], cav = [fx(27 + Math.sqrt(33 ** 2 - (52.6 - h - 24.7) ** 2)), 52.6 - h];
  const giu = inclinazione(cav, mano, 16.8, 180, 95, -0.1), su = inclinazione(cav, mano, 4, 180, 95, -0.1);
  const aus = e => ({ ...linea(cav, e), hd: 4, legs: { ik: cav, toe: pp([cav[0] - 0.4, cav[1] - 3.4]) }, arms: { ik: mano } });
  genera(`trazione_aus~p${SIGLA[piedi]}`, { nome: 'Trazione australiana con i piedi rialzati', inizia: 'conc',
    props: [{ p: 'sbarra', x: 27, y: 24.5, basso: true }, { p: 'box', x1: fx(cav[0] - 5), x2: fx(Math.min(59.5, cav[0] + 6)), y: fx(cav[1] + 1.3) }], keys: [aus(giu), aus(su)] });
  // Dip alla panca: piedi su un secondo rialzo
  const D = POSE.dip_panca;
  const piede = [fx(31 + h * 0.45), fx(53 - h)];
  genera(`dip_panca~p${SIGLA[piedi]}`, { nome: 'Dip alla panca con i piedi rialzati', inizia: 'ecc',
    props: [...D.props, ...sottoPiedi(h, [piede[0], piede[1] - 0.2], piede[0] - 5, piede[0] + 8)],
    keys: D.keys.map(k => ({ ...k, legs: { ik: piede, b: 1 } })) });
}
for (const b of PIEGAMENTI) VARIANTI_OMINO[b] = { mani: Object.keys(RIALZI.mani), piedi: Object.keys(RIALZI.piedi) };
for (const b of ['pike', 'pike_rialzato', 'trazione_aus', 'dip_panca']) VARIANTI_OMINO[b] = { piedi: Object.keys(RIALZI.piedi) };

// Dall'animazione della libreria e dalla variante scelta nella scheda alla posa da disegnare
// v = { attrezzo, panca (gradi o null), mani, piedi }
export function animazioneVariante(anim, v = {}) {
  const base = animazione(anim);
  if (!v) return base;
  if (v.mani || v.piedi) {
    if (PIEGAMENTI.includes(base)) { const k = `push~m${SIGLA[v.mani] || 0}~p${SIGLA[v.piedi] || 0}`; return POSE[k] ? k : base; }
    const radice = base === 'pike_rialzato' ? 'pike' : base;
    const k = `${radice}~p${SIGLA[v.piedi]}`;
    return POSE[k] ? k : base;
  }
  const att = v.attrezzo;
  if (v.panca !== null && v.panca !== undefined && FAMIGLIA[base]) {
    const k = `${FAMIGLIA[base]}~${att || 'manubri'}~p${v.panca}`;
    if (POSE[k]) return k;
  }
  if (att && POSE[`${base}~${att}`]) return `${base}~${att}`;
  return base;
}
// Esercizi che si fanno sempre su panca: il coach sceglie solo i gradi
for (const b of ['panca', 'panca_man', 'panca_incl', 'french']) if (VARIANTI_OMINO[b]) VARIANTI_OMINO[b].pancaSempre = true;
