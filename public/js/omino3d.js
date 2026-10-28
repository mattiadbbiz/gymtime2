// GymTime · omino in 3D con three.js (r128)
// Usa gli stessi keyframe, la stessa cinematica e gli stessi attrezzi dell'omino SVG (omino.js), quindi
// ogni posa che passa strumenti/controllo-pose.mjs vale anche qui. Il piano della vista diventa il piano x-y,
// la profondità è z: di lato gli arti vicini stanno a z positiva e quelli lontani a z negativa; le pose viste
// di fronte ruotano di 90°, così ogni omino guarda verso +x. I muscoli sono ellissoidi sugli stessi ventri del
// profilo SVG e quelli che lavorano sono in oro. Macchine e attrezzi mobili usano le stesse misure e geometrie dell'SVG.
// Se mancano three.js o WebGL, o se l'utente chiede meno movimento, resta l'omino SVG.
import { POSE, animazione, montaOmino, smontaOmino, giuntiAlTempo, DISEGNO } from './omino.js';

const { L, G, GROSSO, SEGMENTI, accesi, curvaY, geoBraccioEll, geoCordaSalto, geoOnda, geoLeva, geoPendolo } = DISEGNO;
// Prima la copia nel sito (public/js/vendor/three.min.js), poi la CDN con la versione fissata
const SORGENTI = ['/js/vendor/three.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
const pocoMoto = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const Z_GAMBA = 2.4, Z_BRACCIO = 3.9, SPOSTA = 1.1;     // SPOSTA: nella vista di lato gli arti lontani sono spostati di 1,1
const RAD = Math.PI / 180;

/* ---------- Caricamento ---------- */
let caricamento = null;
export function caricaThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (!caricamento) {
    const prova = src => new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => (window.THREE ? ok(window.THREE) : ko(new Error('three.js vuoto')));
      s.onerror = () => { s.remove(); ko(new Error('three.js non caricato')); };
      document.head.appendChild(s);
    });
    caricamento = SORGENTI.reduce((p, src) => p.catch(() => prova(src)), Promise.reject(new Error('inizio')))
      .catch(e => { caricamento = null; throw e; });
  }
  return caricamento;
}
let webgl = null;
export function puo3D() {
  if (webgl === null) {
    try { const c = document.createElement('canvas'); webgl = !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch { webgl = false; }
  }
  return webgl;
}

/* ---------- Vettori (array [x, y, z] nelle coordinate di three: y in alto) ---------- */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const som = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const per = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const lun = a => Math.hypot(a[0], a[1], a[2]);
const uni = a => { const l = lun(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const vet = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const ZZ = [0, 0, 1];
// Dal piano della vista (x, y come nelle pose, y verso il basso) a three
const P3 = (p, z = 0) => [p[0] - 30, G - p[1], z];

/* ---------- Pezzi riutilizzati a ogni fotogramma ---------- */
class Banco {
  constructor(T, gruppo) {
    this.T = T; this.g = gruppo;
    this.geo = { sfera: new T.SphereGeometry(1, 20, 14), cil: new T.CylinderGeometry(1, 1, 1, 18), box: new T.BoxGeometry(1, 1, 1), toro: new T.TorusGeometry(1, 0.13, 8, 28) };
    this.liste = { sfera: [], cil: [], box: [], toro: [] }; this.n = {};
    this.unici = new Map();
    this.X = new T.Vector3(); this.Y = new T.Vector3(); this.Z = new T.Vector3(); this.O = new T.Vector3();
  }
  inizio() { for (const k in this.liste) this.n[k] = 0; this.usati = new Set(); }
  prendi(tipo, mat) {
    const l = this.liste[tipo];
    let m = l[this.n[tipo]++];
    if (!m) { m = new this.T.Mesh(this.geo[tipo], mat); m.matrixAutoUpdate = false; m.castShadow = true; this.g.add(m); l.push(m); }
    m.material = mat; m.visible = true;
    return m;
  }
  // Mette la geometria unitaria nello spazio: X, Y, Z sono gli assi già scalati, o il centro
  metti(m, o, X, Y, Z) {
    this.X.set(X[0], X[1], X[2]); this.Y.set(Y[0], Y[1], Y[2]); this.Z.set(Z[0], Z[1], Z[2]); this.O.set(o[0], o[1], o[2]);
    m.matrix.makeBasis(this.X, this.Y, this.Z); m.matrix.setPosition(this.O); m.matrixWorldNeedsUpdate = true;
  }
  fine() {
    for (const k in this.liste) for (let i = this.n[k]; i < this.liste[k].length; i++) this.liste[k][i].visible = false;
    for (const [chiave, m] of this.unici) m.visible = this.usati.has(chiave);
  }
  // Ellissoide: centro e semiassi (vettori)
  ell(c, a, b, d, mat) { this.metti(this.prendi('sfera', mat), c, a, b, d); }
  sfera(c, r, mat) { this.metti(this.prendi('sfera', mat), c, [r, 0, 0], [0, r, 0], [0, 0, r]); }
  // Cilindro da A a B; n e k sono le direzioni dei due raggi (k di default: profondità)
  cil(A, B, r1, r2, mat, n, k) {
    const d = sub(B, A), l = lun(d) || 1e-4, du = per(d, 1 / l);
    if (!n) { n = vet(du, ZZ); if (lun(n) < 0.2) n = vet(du, [1, 0, 0]); n = uni(n); }
    if (!k) k = vet(n, du);
    this.metti(this.prendi('cil', mat), per(som(A, B), 0.5), per(n, r1), d, per(uni(k), r2));
  }
  // Scatola da A a B: s spessore nel piano della vista, w larghezza in profondità
  box(A, B, s, w, mat) {
    const d = sub(B, A); let y = vet(ZZ, d);
    if (lun(y) < 1e-6) y = [0, 1, 0];
    this.metti(this.prendi('box', mat), per(som(A, B), 0.5), d, per(uni(y), s), [0, 0, w]);
  }
  // Disco o cilindro lungo la profondità
  disco(c, r, w, mat) { this.metti(this.prendi('cil', mat), c, [r, 0, 0], [0, 0, w], [0, -r, 0]); }
  toro(c, r, mat) { this.metti(this.prendi('toro', mat), c, [r, 0, 0], [0, r, 0], [0, 0, r]); }
  poli(pts, z, w, mat) {
    const chiave = JSON.stringify([pts, z, w]);
    let m = this.unici.get(chiave);
    if (!m) {
      const T = this.T, forma = new T.Shape(pts.map(p => new T.Vector2(p[0] - 30, G - p[1])));
      m = new T.Mesh(new T.ExtrudeGeometry(forma, { depth: w, bevelEnabled: false }), mat);
      m.position.z = z - w / 2; m.castShadow = true; this.g.add(m); this.unici.set(chiave, m);
    }
    this.usati.add(chiave);
  }
  libera() {
    for (const g of Object.values(this.geo)) g.dispose();
    for (const m of this.unici.values()) m.geometry.dispose();
  }
}

/* ---------- Giunti in 3D ---------- */
// Di lato: x e y dalla posa, z fissa per arto (gli arti lontani tornano al loro posto, +1,1).
// Di fronte: x è il lato; la profondità nasce dagli arti accorciati (lenK), cosce e braccia in avanti, tibie indietro.
const GAMBA = ['r', 'k', 'a', 'f'], BRACCIO = ['s', 'e', 'w'];
function giunti3D(J, P) {
  const Jc = { ...J, d3: true }, Z = { hip: 0, neck: 0, head: 0 };
  if ((P.vista || 'lato') === 'lato') {
    const zg = P.z3d?.gambe ?? Z_GAMBA, zb = P.z3d?.braccia ?? Z_BRACCIO;
    for (const i of [1, 2]) {
      const dx = i === 2 ? SPOSTA : 0, s = i === 1 ? 1 : -1;
      for (const k of GAMBA) { Jc[k + i] = [J[k + i][0] + dx, J[k + i][1]]; Z[k + i] = s * zg; }
      for (const k of BRACCIO) { Jc[k + i] = [J[k + i][0] + dx, J[k + i][1]]; Z[k + i] = s * zb; }
    }
  } else {
    const lk = P.lenK || {};
    const fondo = (a, b, lr) => { const q = lr * lr - ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2); return q > 0.04 ? Math.sqrt(q) : 0; };
    Z.neck = lk.tr ? fondo(J.hip, J.neck, L.tr) : 0; Z.head = Z.neck;
    for (const i of [1, 2]) {
      Z['r' + i] = 0; Z['k' + i] = fondo(J['r' + i], J['k' + i], L.th);
      Z['a' + i] = Z['k' + i] - fondo(J['k' + i], J['a' + i], L.sh); Z['f' + i] = Z['a' + i];
      Z['s' + i] = Z.neck * 0.92; Z['e' + i] = Z['s' + i] + fondo(J['s' + i], J['e' + i], L.ua); Z['w' + i] = Z['e' + i] + fondo(J['e' + i], J['w' + i], L.fa);
    }
  }
  const p = k => P3(Jc[k], Z[k] || 0);
  return { Jc, Z, p };
}

/* ---------- Corpo muscoloso ---------- */
function segmento(B, A, Bp, nome, M, ev, lz = 1) {
  const S = SEGMENTI[nome], d = sub(Bp, A), Lg = lun(d) || 1e-4, du = per(d, 1 / Lg);
  let n = vet(du, ZZ); if (lun(n) < 0.2) n = vet(du, [1, 0, 0]);
  n = per(uni(n), -(S.segno || 1));                       // verso il lato anteriore, come nel profilo SVG
  const k = uni(vet(du, n));
  B.cil(A, Bp, S.core, S.core * lz, M.pelle, n, per(k, -1));
  for (const mu of S.m) {
    const t = mu.t * GROSSO, uc = (mu.u[0] + mu.u[1]) / 2;
    const c = som(som(A, per(du, uc * Lg)), per(n, mu.lato * (S.core * 0.42 + t * 0.4)));
    B.ell(c, per(du, (mu.u[1] - mu.u[0]) * Lg * 0.5), per(n, S.core * 0.3 + t * 0.5), per(k, (S.core * 0.8 + t * 0.3) * lz), ev.has(mu.id) ? M.oro : M.pelle);
  }
  return { du, n, k };
}
function corpo(B, g, M, ev) {
  const p = g.p;
  const hip = p('hip'), neck = p('neck'), head = p('head');
  const tb = segmento(B, hip, neck, 'busto', M, ev, 1.45);
  B.ell(som(hip, per(tb.du, 0.6)), per(tb.du, 2.4), per(tb.n, 2.1), per(tb.k, 2.9), ev.has('gluteo') ? M.oro : M.pelle);  // bacino
  for (const i of [2, 1]) {
    const r = p('r' + i), kn = p('k' + i), a = p('a' + i), f = p('f' + i);
    segmento(B, r, kn, 'coscia', M, ev); segmento(B, kn, a, 'tibia', M, ev);
    B.sfera(kn, 1.05, M.pelle); B.sfera(a, 0.85, M.pelle);
    const dp = sub(f, a), lp = lun(dp) || 1e-4;
    B.box(som(a, per(dp, -0.25 / lp)), som(f, per(dp, 0.6 / lp)), 1.3, 1.7, M.pelle);
    const s = p('s' + i), e = p('e' + i), w = p('w' + i);
    segmento(B, s, e, 'braccio', M, ev); segmento(B, e, w, 'avambraccio', M, ev);
    B.sfera(s, 2.05, ev.has('deltoide') ? M.oro : M.pelle); B.sfera(e, 0.92, M.pelle); B.sfera(w, 1.15, M.pelle);
    B.cil(s, som(neck, per(tb.du, -1.2)), 1.1, 1.1, ev.has('trapezio') ? M.oro : M.pelle);    // spalla verso il collo
  }
  B.cil(neck, som(neck, per(sub(head, neck), 0.6)), 1.5, 1.5, M.pelle);
  B.sfera(head, L.hr, M.pelle);
}

/* ---------- Attrezzi ---------- */
const Bq = (a, b, s, o = {}) => ({ t: 'barra', a, b, s, ...o });
const Aq = (c, r, w, o = {}) => ({ t: 'asse', c, r, w, ...o });
const dirA = a => [Math.sin(a * RAD), Math.cos(a * RAD)];
// Ogni attrezzo dell'omino SVG diventa un elenco di pezzi (come le macchine): piano della vista + profondità
function pezziProp(pr, g, P) {
  const J = g.Jc, fronte = P.vista === 'fronte';
  const zDi = k => (typeof k === 'string' ? (g.Z[k] || 0) : 0);
  const at = k => { const b = typeof k === 'string' ? (J[k] || J.hip) : k, o = pr.off || [0, 0]; return [b[0] + o[0], b[1] + o[1]]; };
  switch (pr.p) {
    case 'panca': return [Bq([pr.x1, pr.y], [pr.x2, pr.y], 2.2, { w: 7, k: 'mqf' }), Bq([pr.x1 + 2, pr.y], [pr.x1 + 2, G], 1.1, { lati: 2.6 }), Bq([pr.x2 - 2, pr.y], [pr.x2 - 2, G], 1.1, { lati: 2.6 })];
    case 'box': return [{ t: 'rett', x1: pr.x1, y1: pr.y, x2: pr.x2, y2: G, w: 12, k: 'mqf' }];
    case 'muro': return [{ t: 'rett', x1: pr.x, y1: -14, x2: pr.x + 2, y2: G, w: 40, k: 'mqf' }];
    case 'linea': return [Bq(pr.a, pr.b, 1.6, { w: 6, k: 'mqf' })];
    case 'paralleline': return [Bq([pr.x - 3.4, pr.y], [pr.x + 3.4, pr.y], 1.2, { lati: Z_BRACCIO }), Bq([pr.x - 2.6, pr.y], [pr.x - 3.6, G], 1, { lati: Z_BRACCIO }), Bq([pr.x + 2.6, pr.y], [pr.x + 3.6, G], 1, { lati: Z_BRACCIO })];
    case 'sbarra': return [Aq([pr.x, pr.y], 0.6, 15), Bq([pr.x, pr.y], [pr.x, pr.basso ? G : -14], 1.2, { lati: 7.5 })];
    case 'parallele': return [Bq([pr.x1, pr.y], [pr.x2, pr.y], 1.6, { lati: Z_BRACCIO }), Bq([pr.x1 + 2, pr.y], [pr.x1 + 2, G], 1.2, { lati: Z_BRACCIO }), Bq([pr.x2 - 2, pr.y], [pr.x2 - 2, G], 1.2, { lati: Z_BRACCIO })];
    case 'bil': { const c = at(pr.at), r = pr.r || 5.5; return [Aq(c, 0.4, 24), Aq(c, r, 1.6, { k: 'ld', lati: 8.8 }), Aq(c, r * 0.3, 0.8, { lati: 7.6 })]; }
    case 'bilf': {
      const a = J.w1, b = J.w2, d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, v = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
      const lungo = (p, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
      return [Bq(lungo(a, -6.5), lungo(b, 6.5), 0.8), Bq(lungo(a, -5.4), lungo(a, -3.8), 7.2, { w: 7.2, k: 'ld' }), Bq(lungo(b, 3.8), lungo(b, 5.4), 7.2, { w: 7.2, k: 'ld' })];
    }
    case 'man': {
      const c = at(pr.at), z = zDi(pr.at);
      if (fronte) return [Bq([c[0] - 1.8, c[1]], [c[0] + 1.8, c[1]], 0.8, { z }), Bq([c[0] - 2.9, c[1]], [c[0] - 1.6, c[1]], 2.7, { w: 2.7, k: 'ld', z }), Bq([c[0] + 1.6, c[1]], [c[0] + 2.9, c[1]], 2.7, { w: 2.7, k: 'ld', z })];
      return [Aq(c, 0.4, 3.8, { z }), Aq(c, 1.35, 1.4, { k: 'ld', z: z + 2.3 }), Aq(c, 1.35, 1.4, { k: 'ld', z: z - 2.3 })];
    }
    case 'peso': case 'palla': {
      if (pr.at !== 'og') return [{ t: 'sfera', c: at(pr.at), r: pr.r || 3.2, k: pr.p === 'peso' ? 'ld' : 'mqf' }];
      const r = (pr.r || 3.2) * J.ogs, c = [J.og[0], Math.min(J.og[1], G - r)];   // oggetto libero: non va sotto il pavimento
      return r < 0.05 ? [] : [{ t: 'sfera', c, r, z: J.ogz || 0, k: pr.scura ? 'mqp' : 'ld' }];
    }
    case 'sacco': { const k = J.ogs, ry = pr.ry * k; return k < 0.02 ? [] : [{ t: 'ell', c: [J.og[0], Math.min(J.og[1], G - ry)], rx: pr.rx * k, ry, rz: 5.5 * k, z: J.ogz || 0, k: 'ld' }]; }
    case 'kb': { const w = J.w1, e = J.e1, d = Math.hypot(w[0] - e[0], w[1] - e[1]) || 1; return [{ t: 'sfera', c: [w[0] + (w[0] - e[0]) / d * 3.2, w[1] + (w[1] - e[1]) / d * 3.2], r: 3, k: 'ld', z: zDi('w1') }]; }
    case 'ruota': { const c = at(pr.at); return [Aq(c, 2.3, 1.4, { k: 'mqf' }), Aq(c, 0.4, 8)]; }
    case 'rullo': return [Aq(at(pr.at), 1.7, 6, { k: 'mqf' })];
    case 'maniglia': return [Aq(at(pr.at), 0.45, 9)];
    case 'cavo': { const c = at(pr.at), z = pr.z ?? zDi(pr.at);
      if (pr.cinghia) return [Bq(c, pr.to, 0.25, { z, w: 1.3, k: 'mqp' }), Aq(pr.to, 0.9, 1.6, { z })];   // cinghia piatta con il moschettone
      return [Bq(c, pr.to, 0.3, { z, k: 'mqc' }), Aq(pr.to, 1.4, 1.2, { k: 'mqp', z })]; }
    case 'piatto': { const c = J.a1, v = dirA(pr.ang + 90); return [Bq([c[0] - v[0] * 6 + 1.2, c[1] - v[1] * 6 + 1.2], [c[0] + v[0] * 6 + 1.2, c[1] + v[1] * 6 + 1.2], 1.2, { w: 9, k: 'mqf' })]; }
    case 'bastone': {
      if (fronte) { const a = J.w1, b = J.w2, d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, v = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
        return [Bq([a[0] - v[0] * 3.5, a[1] - v[1] * 3.5], [b[0] + v[0] * 3.5, b[1] + v[1] * 3.5], 0.9, { z: zDi('w1') })]; }
      if (pr.corto) return [Aq(J.w1, 0.55, 2.6, { z: zDi('w1') }), Aq(J.w2, 0.55, 2.6, { z: zDi('w2') })];   // due maniglie separate
      return [Aq(at(pr.at || 'w1'), 0.5, 18)];
    }
    case 'anelli': {
      const w = at(pr.at), r = 2.6, c = [w[0], w[1] - r + 0.55], z = zDi(pr.at);
      return [{ t: 'anello', c, r, z, k: 'mq' }, Bq([c[0], c[1] - r], [pr.ax ?? c[0], pr.ay ?? -30], 0.5, { z, k: 'mqc' })];
    }
    default: return pezziMacchina(pr, g, P);
  }
}

/* ---------- Macchine cardio, corde e attrezzi mobili: stesse misure delle scene SVG ---------- */
// g.s è il tempo: nastri, gradini, ventole e treccia della corda si muovono come nelle animazioni SMIL dell'SVG
const giro = (s, dur) => ((s % dur) + dur) % dur / dur;
const spezzata = (pts, s, o) => pts.slice(1).map((q, i) => Bq(pts[i], q, s, o));
const quadratica = (a, c, b, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n, v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; });
const raggi = (c, r, n, gradi, o) => Array.from({ length: n }, (_, i) => { const v = dirA(gradi + i * 360 / n); return Bq(c, [c[0] + v[0] * r, c[1] + v[1] * r], 0.5, o); });
function pezziMacchina(pr, g, P) {
  const J = g.Jc, s = g.s || 0, zDi = k => (typeof k === 'string' ? (g.Z[k] || 0) : 0);
  const sg = pr.dietro || pr.at === 'w2' || pr.at === 'a2' || pr.lato === 2 ? -1 : 1;
  const ventola = (P.giri ? s * 360 * P.giri / 60 * 2.2 : 0);
  switch (pr.p) {
    case 'tapis': {
      const { x1, x2, y } = pr, v = pr.v ?? P.nastro ?? 10, off = (s * v) % 4, out = [
        Bq([x1, y + 1.2], [x2, y + 1.2], 2.4, { w: 11, k: 'mqf' }), Bq([x1, y + 0.15], [x2, y + 0.15], 0.3, { w: 9.6, k: 'mqp' }),
        Aq([x1, y + 1.2], 1.3, 10.4), Aq([x2, y + 1.2], 1.3, 10.4),
        Bq([x1 + 3, y + 2.4], [x1 + 3, G], 1.2, { lati: 4.5 }), Bq([x2 - 3, y + 2.4], [x2 - 3, G], 1.2, { lati: 4.5 }),
        Bq([x2 - 1, y + 1], [x2 + 3, y - 26], 1.3, { lati: 5.2 }), Bq([x2 - 1.5, y - 28.5], [x2 + 5, y - 25], 1.6, { w: 10, k: 'mqf' }),
        Bq([x2 + 1.6, y - 18], [x2 - 6, y - 18], 0.9, { lati: 5.2 })];
      for (let x = x2 - 0.5 - off; x > x1 + 0.6; x -= 4) out.push(Bq([x - 0.6, y - 0.02], [x, y - 0.02], 0.14, { w: 9.6, k: 'mqc' }));
      return out;
    }
    case 'ghd': {
      const { x1, x2, y, piede: [ax, ay] } = pr, cx = (x1 + x2) / 2, px = ax + 1.6, yb = 46;
      return [Bq([x1 - 4, G - 0.6], [ax + 5, G - 0.6], 1.2, { w: 9 }), Bq([cx, y + 2.6], [cx + 1, G], 1.6, { w: 3 }),
        Bq([cx + 0.6, yb], [px, yb], 1.4, { w: 3 }), Bq([px, G], [px, ay - 4.6], 1.4, { w: 3 }),
        Bq([px - 0.4, ay - 4.6], [px - 0.4, ay + 1.6], 0.8, { w: 8, k: 'mqf' }),
        Bq([px, ay - 2.3], [ax - 1.5, ay - 2.3], 0.8, { lati: 4.4 }), Bq([px, ay + 2.4], [ax - 4.5, ay + 2.4], 0.8, { lati: 4.4 }),
        Aq([ax - 1.5, ay - 2.3], 1.3, 9, { k: 'mqf' }), Aq([ax - 4.5, ay + 2.4], 1.3, 9, { k: 'mqf' }),
        Bq([x1 + 1.3, y + 1.3], [x2 - 1.3, y + 1.3], 2.6, { w: 10, k: 'mqf' })];
    }
    case 'reverseHyper': {
      const { x1, x2, y, mani: [mx, my], perno: [qx, qy] } = pr, xm = x1 + 11;
      return [Bq([xm - 4, G - 0.6], [x2 + 2, G - 0.6], 1.2, { w: 10 }), Bq([xm, y + 2.4], [xm, G], 1.6, { w: 4 }),
        Bq([x2 - 3, y + 2.4], [x2 - 1, G], 1.4, { lati: 3.5 }), Bq([qx, y + 2.4], [qx, qy], 1, { lati: 1.6 }),
        Bq([qx, qy + 1.6], [xm, qy + 5], 1, { w: 3 }), Bq([x2 - 0.6, y + 2.4], [mx, my + 0.4], 1.2, { lati: Z_BRACCIO }),
        Bq([x1 + 1.1, y + 1.2], [x2 - 1.1, y + 1.2], 2.4, { w: 11, k: 'mqf' })];
    }
    case 'pendolo': {
      // Leva al centro tra le gambe, barra della cinghia sulle caviglie, dischi sul perno laterale
      const a = J[pr.at], d = geoPendolo(pr, J);
      return [Aq(pr.perno, 0.6, 4), Bq(pr.perno, a, 1), Aq(a, 0.45, 7, { k: 'mqp' }), Aq(d, 0.5, 6), Aq(d, 2.6, 1.4, { k: 'ld', lati: 1.8 })];
    }
    case 'pista': {
      // Segni a terra che scorrono come nell'SVG: uno ogni 6, indietro alla velocità del piede (in avanti se P.nastro < 0)
      const v = P.nastro || 0, off = (((s * v) % 6) + 6) % 6, out = [];
      for (let x = 58 - off; x > 2; x -= 6) out.push(Bq([x - 0.7, G - 0.03], [x, G - 0.03], 0.06, { w: 18, k: 'mqc' }));
      return out;
    }
    case 'slitta': {
      // Pattini ai due lati con la punta rialzata, pianale, perno con due dischi impilati (gli stessi dell'SVG), pali fino alle mani
      const { x1, x2 } = pr, sv = pr.verso || 1, punta = sv > 0 ? x2 : x1, cx = (x1 + x2) / 2, y = G - 0.7;
      const out = [Bq([x1, y], [x2, y], 1, { lati: 3.8 }), Bq([punta, y], [punta + sv * 1.6, y - 2.2], 1, { lati: 3.8 }),
        Bq([x1 + 1, G - 2.5], [x2 - 1, G - 2.5], 1.8, { w: 9, k: 'mqf' }), Bq([cx, G - 3.4], [cx, G - 11], 1),
        Bq([cx, G - 5.4], [cx, G - 3.6], 9.2, { k: 'ld' }), Bq([cx, G - 7.3], [cx, G - 5.5], 9.2, { k: 'ld' })];
      if (pr.mani) {
        const [hx, hy] = pr.mani, px = x1 + 1.6;
        out.push(Bq([px, G - 3.4], [hx, hy - 1], 1.3, { lati: Z_BRACCIO }));
      }
      return out;
    }
    case 'curvo': {
      const pts = Array.from({ length: 17 }, (_, i) => { const x = pr.x1 + (pr.x2 - pr.x1) * i / 16; return [x, curvaY(pr, x)]; });
      const y2 = curvaY(pr, pr.x2), out = [...spezzata(pts, 0.4, { w: 9.6, k: 'mqp' }), ...spezzata(pts.map(q => [q[0], q[1] + 2.4]), 1, { lati: 5 }),
        Bq([pr.x1 + 2, curvaY(pr, pr.x1 + 2) + 2.4], [pr.x1 + 1, G], 1.1, { lati: 4.5 }), Bq([pr.xc, curvaY(pr, pr.xc) + 2.4], [pr.xc, G], 1.1, { lati: 4.5 }),
        Bq([pr.x2 - 2, curvaY(pr, pr.x2 - 2) + 2.4], [pr.x2 - 1, G], 1.1, { lati: 4.5 }),
        Bq([pr.x2 - 1, y2 + 1], [pr.x2 + 2.5, y2 - 21], 1.3, { lati: 5.2 }), Bq([pr.x2 - 1, y2 - 23], [pr.x2 + 4.5, y2 - 20], 1.6, { w: 10, k: 'mqf' }),
        Bq([pr.x2 + 1.2, y2 - 13], [pr.x2 - 7, y2 - 13], 0.9, { lati: 5.2 })];
      let o = 0;
      if (P.passi) {   // stesso scorrimento a strappi dell'SVG: veloce negli appoggi, più lento nei voli
        const { corsa, appoggio, ciclo } = P.passi, volo = (corsa / appoggio) * (0.5 - appoggio) * 0.65;
        const tot = Math.max(1, Math.round((2 * corsa + 2 * volo) / 6)) * 6, v1 = (tot - 2 * corsa) / 2;
        const kt = [0, appoggio, 0.5, 0.5 + appoggio, 1], vv = [0, corsa, corsa + v1, 2 * corsa + v1, tot], f = giro(s, ciclo);
        for (let i = 0; i < 4; i++) if (f <= kt[i + 1]) { o = vv[i] + (vv[i + 1] - vv[i]) * (f - kt[i]) / (kt[i + 1] - kt[i]); break; }
      }
      for (let x = pr.x2 - 1 - (o % 6); x > pr.x1 + 1; x -= 6) out.push(Bq([x - 0.7, curvaY(pr, x - 0.7) - 0.25], [x, curvaY(pr, x) - 0.25], 0.15, { w: 9.6, k: 'mqc' }));
      return out;
    }
    case 'cyclette': {
      const [sx, sy] = pr.sella, [mx, my] = pr.manubrio, [vx, vy, vr] = pr.volano, c = pr.c;
      const out = [Bq([sx - 9, G - 0.6], [sx + 1, G - 0.6], 1.2, { w: 9 }), Bq([vx - 4, G - 0.6], [vx + 8, G - 0.6], 1.2, { w: 9 }),
        Bq([sx - 4, G], [sx + 0.6, sy + 2], 1.6), Bq([sx - 3.6, sy], [sx + 3.4, sy - 0.4], 1.2, { w: 4.5, k: 'mqp' }),
        Bq([sx - 0.8, sy + 7], c, 1.6), Bq(c, [vx + 3, G], 1.6), Bq([vx + 3, G], [mx - 2.5, my + 2], 1.6),
        Bq([mx - 3.5, my + 1.4], [mx + 1.8, my - 0.8], 1.2), Aq([mx, my], 0.5, 9.4), Aq(c, 2.4, 3, { k: 'mqf' })];
      if (pr.ventola) out.push(Aq([vx, vy], vr, 3.6, { k: 'mqg' }), Aq([vx, vy], 1.4, 4), ...raggi([vx, vy], vr - 0.6, 6, ventola, { w: 2.4 }),
        Bq([mx - 2, my + 1], [mx - 3, my - 6], 0.6), Bq([mx - 5.5, my - 8], [mx - 0.5, my - 8], 4, { w: 1, k: 'mqp' }));
      else if (pr.pesante) out.push(Aq([vx, vy], vr, 1.8), Aq([vx, vy], vr - 2.4, 2.2, { k: 'mqf' }), Aq([vx, vy], 1.4, 3));
      else out.push(Aq([vx, vy], vr, 1.6, { k: 'mqf' }), Aq([vx, vy], 1, 2.4));
      return out;
    }
    case 'pedivella': {
      const z = sg * (Z_GAMBA + 0.9), a = J[pr.at], q = [a[0] + 0.5, a[1] + 1.6];
      const out = [Bq(pr.c, q, 1, { z }), Bq([q[0] - 1.6, q[1]], [q[0] + 1.6, q[1]], 0.5, { w: 2.6, z })];
      if (sg > 0) out.push(Aq(pr.c, 0.6, 2 * (Z_GAMBA + 0.9)));
      return out;
    }
    case 'ellittica': {
      const [cx, cy] = pr.c, [px, py] = pr.perno;
      return [Aq(pr.c, pr.r + 2.6, 5, { k: 'mqf' }), Aq(pr.c, 1.3, 6.4), Bq([2, G - 0.6], [px + 9, G - 0.6], 1.2, { w: 10 }), Bq([cx, cy + pr.r + 2.6], [cx, G], 1.2),
        Bq([px + 7, G], [px + 1, py - 15], 2.2, { w: 3 }), Bq([px - 2.5, py - 16], [px + 3.5, py - 17.5], 1.6, { w: 8, k: 'mqf' }), Aq(pr.perno, 0.7, 9)];
    }
    case 'braccioEll': {
      const { r, cima, q, p1, p2 } = geoBraccioEll(pr, J), zb = sg * Z_BRACCIO, zp = sg * (Z_GAMBA + 0.6);
      return [Bq(r, cima, 1.2, { z: zb }), Bq(q, r, 1.4, { z: zp }), Bq(pr.c, q, 0.9, { z: zp }), Aq(r, 0.5, Math.abs(zb - zp) + 0.6, { z: (zb + zp) / 2 }),
        Bq(p1, p2, 0.6, { w: 2.6, z: sg * Z_GAMBA })];
    }
    case 'scala': {
      const { passo: dp, alzata: dh, mani } = pr, x0 = pr.x - 2.5, y0 = pr.y + 1.3, xa = 9, xb = 41, yb = y0 - (xb - x0) * dh / dp;
      const u = P.passi ? giro(s, P.passi.ciclo / 2) : 0, out = [
        Bq([xa, G], [xb, Math.min(G, yb + 5)], 1.4, { lati: 5.2 }), Bq([xa - 1, G - 0.6], [xb + 9, G - 0.6], 1.2, { w: 12 }),
        Bq([xb + 6, G], [xb + 3, 13], 2.4, { w: 4 }), Bq([xb, 12], [xb + 6.5, 14.5], 1.6, { w: 9, k: 'mqf' }),
        Bq([mani[0] - 9, mani[1] + 0.6], [xb + 4, mani[1] + 0.6], 1, { lati: Z_BRACCIO })];
      for (let k = -3; k <= 4; k++) {   // gradini che scendono verso dietro alla velocità dei piedi
        const nx = x0 + (k - u) * dp, ny = y0 - (k - u) * dh, a = Math.max(nx, xa), b = Math.min(nx + dp, xb);
        if (ny > G - 0.5 || b <= a) continue;
        out.push(Bq([a, ny + 0.4], [b, ny + 0.4], 0.8, { w: 9, k: 'mqf' }));
        if (nx + dp < xb && ny - dh > 0) out.push(Bq([nx + dp, ny], [nx + dp, ny - dh + 0.4], 0.5, { w: 9, k: 'mqf' }));
      }
      return out;
    }
    case 'airbike': {
      const [sx, sy] = pr.sella, c = pr.c, [vx, vy, vr] = pr.ventola;
      return [Bq([sx - 9, G - 0.6], [sx + 1, G - 0.6], 1.2, { w: 9 }), Bq([vx - 6, G - 0.6], [vx + 7, G - 0.6], 1.2, { w: 10 }),
        Bq([sx - 4, G], [sx + 0.6, sy + 2], 1.6), Bq([sx - 3.6, sy], [sx + 3.4, sy - 0.4], 1.2, { w: 5, k: 'mqp' }),
        Bq([sx - 0.8, sy + 7], c, 1.6), Bq(c, [vx, vy], 1.6), Bq([vx, vy], [vx + 1, G], 1.6), Aq(c, 2.4, 3, { k: 'mqf' }),
        Aq([vx, vy], vr, 4.4, { k: 'mqg' }), Aq([vx, vy], 1.4, 5), ...raggi([vx, vy], vr - 0.6, 8, ventola, { w: 3 })];
    }
    case 'leva': {
      const z = zDi(pr.at), out = [Bq(pr.perno, geoLeva(pr, J), 1.2, { z })];
      if (sg > 0) out.push(Aq(pr.perno, 0.6, 2 * Z_BRACCIO + 0.6));
      return out;
    }
    case 'vogatore': {
      const [ux, uy] = pr.uscita, [px, py] = pr.piedi, vx = ux + 4.6, vy = uy + 0.8, ry = py + 3.6;
      return [Bq([3, ry], [px + 6, ry], 1.4, { w: 3 }), Bq([px + 6, ry], [vx - 1, vy + 4.6], 1.4, { w: 3 }),
        Bq([5, ry], [5, G], 1.2), Bq([2.5, G - 0.5], [8, G - 0.5], 1, { w: 9 }),
        Bq([px - 0.8, py + 1.4], [px + 4, py - 3.6], 0.6, { w: 2.8, lati: Z_GAMBA, k: 'mqf' }), Bq([px + 1, py + 1], [px + 1, ry], 1, { w: 6 }),
        Aq([vx, vy], 4.8, 5, { k: 'mqf' }), Aq([vx, vy], 1, 5.6), Bq([vx, vy + 4.8], [vx, G], 1.2), Bq([vx - 3, G - 0.5], [vx + 3, G - 0.5], 1, { w: 9 }),
        Bq([vx - 1.2, vy - 4.6], [vx - 6, vy - 12], 0.6), Bq([vx - 9.4, vy - 14.1], [vx - 4.8, vy - 14.1], 3.8, { w: 1, k: 'mqp' })];
    }
    case 'sella': { const c = J.hip; return [Bq([c[0] - 3.4, c[1] + 1.6], [c[0] + 2.4, c[1] + 1.6], 1, { w: 6, k: 'mqp' })]; }
    case 'skierg': {
      const { x, puleggia: [qx, qy] } = pr;
      return [Bq([16, G - 0.5], [x + 5, G - 0.5], 1, { w: 12, k: 'mqf' }), Bq([x + 2, G], [x, -6], 2.4, { w: 4 }),
        Bq([qx - 1, qy - 5.5], [x + 2, qy - 5.5], 7, { w: 10, k: 'mqf' }), Bq([x + 0.6, 17.5], [x + 4, 17.5], 3, { w: 1, k: 'mqp' })];
    }
    case 'corda': {
      const { x } = pr, C = P.corda, out = [Bq([x, -14], [x, G - 0.8], 1.5, { k: 'mqc' }), { t: 'sfera', c: [x + 3, G - 0.6], r: 1.6, k: 'mqc' }];
      let c = 0;
      if (C) { const f = giro(s, C.ciclo); c = f < 0.4 ? C.d1 * f / 0.4 : f < 0.8 ? C.d1 + C.d2 * (f - 0.4) / 0.4 : C.d1 + C.d2; }
      for (let y = -14 + (c % 2.2); y < G - 1.6; y += 2.2) out.push(Bq([x, y], [x, y + 0.8], 1.7, { k: 'mqp' }));   // treccia che scende
      return out;
    }
    case 'cordaSalto': {
      if (pr.dietro) return [];   // in 3D la corda si vede intera: basta una copia
      const { cima, ctl } = geoCordaSalto(J), out = [];
      for (const [w, z] of [[J.w1, zDi('w1')], [J.w2, zDi('w2')]]) {
        const pts = quadratica(w, ctl, cima);
        pts.slice(1).forEach((q, i) => { const z0 = z * (1 - i / 8 * 0.3), z1 = z * (1 - (i + 1) / 8 * 0.3); out.push({ t: 'barra', a: pts[i], b: q, s: 0.5, k: 'mqp', z: (z0 + z1) / 2 }); });
      }
      out.push({ t: 'barra', a: cima, b: [cima[0] + 0.01, cima[1]], s: 0.5, w: 5.6, k: 'mqp' });     // tratto di corda che passa da un lato all'altro
      return out;
    }
    case 'onda': {
      const z = zDi(pr.at);
      return [...spezzata(geoOnda(pr, J), 1.4, { z, k: 'mqp' }), Aq(pr.ancora, 1, 2, { z })];
    }
    default: return [];
  }
}
function pezzo(B, q, M) {
  const mat = M[q.k] || M.mq, z0 = q.z || 0;
  for (const z of q.lati ? [z0 + q.lati, z0 - q.lati] : [z0]) {
    if (q.t === 'barra') {
      const A = P3(q.a, z), Bp = P3(q.b, z);
      if (q.w) B.box(A, Bp, q.s, q.w, mat); else B.cil(A, Bp, q.s / 2, q.s / 2, mat);
    } else if (q.t === 'rett') B.box(P3([q.x1, (q.y1 + q.y2) / 2], z), P3([q.x2, (q.y1 + q.y2) / 2], z), q.y2 - q.y1, q.w || 10, mat);
    else if (q.t === 'ruota' || q.t === 'asse') B.disco(P3(q.c, z), q.r, q.w || 1, mat);
    else if (q.t === 'sfera') B.sfera(P3(q.c, z), q.r, mat);
    else if (q.t === 'anello') B.toro(P3(q.c, z), q.r, mat);
    else if (q.t === 'poli') B.poli(q.pts, z, q.w || 10, mat);
    else if (q.t === 'ell') B.ell(P3(q.c, z), [q.rx, 0, 0], [0, q.ry, 0], [0, 0, q.rz], mat);
  }
}
// Punti per inquadrare: giunti e pezzi
function puntiPezzo(q) {
  const z = (q.z || 0) + (q.lati || 0) + (q.w || 0) / 2;
  if (q.t === 'barra') return [P3(q.a, z), P3(q.b, z)];
  if (q.t === 'rett') return [P3([q.x1, q.y1], z), P3([q.x2, q.y2], z)];
  if (q.t === 'poli') return q.pts.map(p => P3(p, z));
  const r = q.r ?? Math.max(q.rx, q.ry);
  return [P3([q.c[0] - r, q.c[1] - r], z), P3([q.c[0] + r, q.c[1] + r], z)];
}

/* ---------- Materiali dal tema (chiaro o scuro) ---------- */
function materiali(T, el) {
  const cs = getComputedStyle(el);
  const col = (n, d) => { const x = cs.getPropertyValue(n).trim(); return new T.Color(x || d); };
  const fig = col('--fig', '#161012'), oro = col('--gold', '#C9A24B'), ink2 = col('--ink-2', '#6B5D60'), sup2 = col('--surface-2', '#F6F1F1'), fig2 = col('--fig-2', '#BCAEB0');
  const hsl = {}; fig.getHSL(hsl);
  const pelle = fig.clone().lerp(new T.Color(hsl.l < 0.5 ? '#ffffff' : '#000000'), hsl.l < 0.5 ? 0.14 : 0.06);
  const S = (c, r, m, x = {}) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...x });
  const M = {
    pelle: S(pelle, 0.55, 0.05), oro: S(oro, 0.32, 0.55, { emissive: oro.clone().multiplyScalar(0.12) }),
    mq: S(ink2, 0.35, 0.65), mqc: S(fig2, 0.4, 0.5), mqf: S(sup2.clone().lerp(ink2, 0.18), 0.6, 0.05),
    mqp: S(ink2.clone().lerp(new T.Color('#000000'), 0.55), 0.7, 0.1),
    mqg: S(ink2, 0.5, 0.3, { transparent: true, opacity: 0.3, depthWrite: false })
  };
  M.eq = M.mq; M.eqs = M.mq; M.mqn = M.mqp; M.box = M.mqf; M.mqo = M.oro; M.ld = M.oro;
  return M;
}

/* ---------- Palco ---------- */
let renderer = null;   // uno solo per tutta l'app: i browser ne permettono pochi
let attivo = null;     // il palco che lo sta usando

function nuovoRenderer(T) {
  const r = new T.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.setClearColor(0x000000, 0);
  r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
  const c = r.domElement;
  c.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab';
  c.setAttribute('aria-hidden', 'true');
  return r;
}

// Monta un omino 3D dentro el. Stesse opzioni di montaOmino: { tempo, inizia, tenuta, muscoli, forza }.
// Subito compare l'omino SVG; il 3D lo sostituisce appena three.js è pronto.
export async function montaOmino3D(el, anim, opz = {}) {
  if (!el) return;
  const k = animazione(anim);
  if (attivo && attivo.el === el && attivo.k === k && el.isConnected) { attivo.opz = opz; attivo.ev = accesi(opz); return; }
  montaOmino(el, anim, opz);
  if ((pocoMoto && !opz.forza) || !puo3D()) return;
  const segno = {}; el._omino3d = segno;
  let T;
  try { T = await caricaThree(); } catch { return; }
  if (!el.isConnected || el._omino3d !== segno) return;
  try { avvia(T, el, k, opz); }
  catch (e) { console.warn('Omino 3D non disponibile:', e); if (attivo && attivo.el === el) attivo.ferma(); montaOmino(el, anim, opz); }
}

function avvia(T, el, k, opz) {
  const P = POSE[k];
  if (attivo) { const prima = attivo; prima.ferma(); if (prima.el !== el && prima.el.isConnected) montaOmino(prima.el, prima.k, prima.opz); }
  renderer = renderer || nuovoRenderer(T);
  smontaOmino(el);

  const scena = new T.Scene();
  scena.add(new T.HemisphereLight(0xffffff, 0x3a3034, 0.8));
  const sole = new T.DirectionalLight(0xffffff, 0.75);
  sole.position.set(26, 70, 44); sole.castShadow = true;
  sole.shadow.mapSize.set(1024, 1024);
  Object.assign(sole.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 10, far: 200 });
  sole.target.position.set(0, 18, 0);
  scena.add(sole, sole.target);
  const dietro = new T.DirectionalLight(0xffffff, 0.28); dietro.position.set(-40, 30, -30); scena.add(dietro);
  if (P.g !== null) {
    const pavimento = new T.Mesh(new T.PlaneGeometry(240, 240), new T.ShadowMaterial({ opacity: 0.16 }));
    pavimento.rotation.x = -Math.PI / 2; pavimento.receiveShadow = true; scena.add(pavimento);
  }
  const radice = new T.Group();
  if (P.vista === 'fronte') radice.rotation.y = Math.PI / 2;     // anche le pose di fronte guardano verso +x
  scena.add(radice);
  const M = materiali(T, el), B = new Banco(T, radice);
  const camera = new T.PerspectiveCamera(30, 1, 1, 600);

  const stato = { el, k, opz, ev: accesi(opz), raf: 0, az: 34, el_: 8, fermo: false };
  const disegna = s => {
    const J = giuntiAlTempo(k, s, stato.opz), g = giunti3D(J, P);
    g.s = s;
    B.inizio();
    corpo(B, g, M, stato.ev);
    for (const pr of P.props || []) for (const q of pezziProp(pr, g, P)) pezzo(B, q, M);
    B.fine();
    return g;
  };

  // Inquadratura: tutto il movimento e gli attrezzi dentro il riquadro
  const punti = [];
  for (let i = 0; i < 6; i++) {
    const g = giunti3D(giuntiAlTempo(k, i * 0.37, opz), P);
    g.s = i * 0.37;
    for (const n of ['hip', 'a1', 'a2', 'w1', 'w2', 'k1', 'k2', 'e1', 'e2']) punti.push(g.p(n));
    const t = g.p('head'), r = L.hr + 0.6;                 // la testa con il suo raggio
    punti.push(som(t, [r, r, r]), som(t, [-r, -r, -r]));
    for (const pr of P.props || []) for (const q of pezziProp(pr, g, P)) punti.push(...puntiPezzo(q));
  }
  punti.push(P3([30, G - 1]));
  const ruota = p => (P.vista === 'fronte' ? [p[2], p[1], -p[0]] : p);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of punti.map(ruota)) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]); }
  const centro = per(som(min, max), 0.5), dim = sub(max, min);
  const inquadra = () => {
    const w = el.clientWidth || 300, h = el.clientHeight || 300, asp = w / h;
    // sfera che contiene tutto; con lo schermo stretto conta il campo orizzontale
    const raggio = lun(dim) / 2, mezzo = Math.min(15 * RAD, Math.atan(Math.tan(15 * RAD) * asp));
    stato.dist = raggio / Math.sin(mezzo) * 0.94 + 4;
    renderer.setSize(w, h, false); camera.aspect = asp; camera.updateProjectionMatrix();
    posizionaCamera();
  };
  const posizionaCamera = () => {
    const a = stato.az * RAD, e = stato.el_ * RAD, d = stato.dist;
    camera.position.set(centro[0] + d * Math.sin(a) * Math.cos(e), centro[1] + d * Math.sin(e), centro[2] + d * Math.cos(a) * Math.cos(e));
    camera.lookAt(centro[0], centro[1], centro[2]);
  };

  // Trascina per girare, doppio tocco per tornare alla vista iniziale
  const tela = renderer.domElement;
  let presa = null;
  tela.onpointerdown = ev => { presa = [ev.clientX, ev.clientY, stato.az, stato.el_]; tela.setPointerCapture?.(ev.pointerId); tela.style.cursor = 'grabbing'; nascondiAiuto(); };
  tela.onpointermove = ev => {
    if (!presa) return;
    stato.az = presa[2] - (ev.clientX - presa[0]) * 0.45;
    stato.el_ = Math.max(-4, Math.min(65, presa[3] + (ev.clientY - presa[1]) * 0.3));
    posizionaCamera();
  };
  tela.onpointerup = tela.onpointercancel = () => { presa = null; tela.style.cursor = 'grab'; };
  tela.ondblclick = () => { stato.az = 34; stato.el_ = 8; posizionaCamera(); };

  el.innerHTML = '';
  el.classList.add('stage-3d');
  el.appendChild(tela);
  const aiuto = document.createElement('span');
  aiuto.className = 'aiuto-3d'; aiuto.textContent = 'Trascina per girare';
  el.appendChild(aiuto);
  const nascondiAiuto = () => aiuto.classList.add('via');
  setTimeout(nascondiAiuto, 3500);

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(inquadra) : null;
  ro?.observe(el);
  inquadra();

  const t0 = performance.now();
  const giro = ts => {
    if (stato.fermo) return;
    if (!el.isConnected) { stato.ferma(); return; }
    disegna((ts - t0) / 1000);
    renderer.render(scena, camera);
    stato.raf = requestAnimationFrame(giro);
  };
  stato.ferma = () => {
    if (stato.fermo) return;
    stato.fermo = true; cancelAnimationFrame(stato.raf); ro?.disconnect();
    B.libera(); for (const m of new Set(Object.values(M))) m.dispose();
    tela.onpointerdown = tela.onpointermove = tela.onpointerup = tela.onpointercancel = tela.ondblclick = null;
    el.classList.remove('stage-3d');
    if (el._ferma3d === stato.ferma) delete el._ferma3d;
    if (attivo === stato) attivo = null;
  };
  el._ferma3d = stato.ferma;
  attivo = stato;
  disegna(0); renderer.render(scena, camera);
  stato.raf = requestAnimationFrame(giro);
}

// Per i controlli automatici: giunti 3D e pezzi degli attrezzi di una posa al tempo s, senza three.js
export function pezziAlTempo(anim, s) {
  const k = animazione(anim), P = POSE[k], g = giunti3D(giuntiAlTempo(k, s, {}), P);
  g.s = s;
  return { g, pezzi: (P.props || []).flatMap(pr => pezziProp(pr, g, P)) };
}
