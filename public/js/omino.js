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

/* ---------- Libreria delle animazioni ---------- */
// Chiavi della posa: hip, t (busto: 0 dritto, + in avanti) oppure nk (punto del collo),
// hd (testa rispetto al busto), legs/arms: {ik:[x,y], f:'w'|'n'|'t'|'h', b:±1} oppure {a:[sup, inf]},
// toe (punta del piede), sy (spalle sollevate). Una lista [davanti, dietro] separa i due arti.
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
    st({ hip: [21.5, 43.5], t: 30, arms: { a: [178, 178] } })] },
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
    { hip: [26, 43.4], t: 90, hd: -8, legs: { a: [-89, -89] }, arms: { a: [8, 40] } },
    { hip: [26, 43.4], t: 90, hd: -8, legs: { a: [-89, -170] }, arms: { a: [8, 40] } }] },
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
  adduttori: { nome: 'Adductor e abductor', vista: 'fronte', inizia: 'conc', props: [{ p: 'panca', x1: 18, x2: 42, y: 42 }], lenK: { th: 0.45 }, keys: [
    { hip: [30, 40], t: 0, legs: { a: [62, 2] }, arms: { a: [12, 4] } },
    { hip: [30, 40], t: 0, legs: { a: [20, 2] }, arms: { a: [12, 4] } }] },
  nordic: { nome: 'Nordic curl', inizia: 'ecc', props: [{ p: 'rullo', at: 'a1' }], keys: [
    { hip: [29, 40.6], t: 0, legs: { ik: [18, 52.6], b: -1, toe: 'perp' }, arms: { a: [20, 60] } },
    { hip: [37.4, 46], t: 52, legs: { ik: [18, 52.6], b: -1, toe: 'perp' }, arms: { a: [70, 100] } }] },

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
    { hip: [30.5, 37.5], t: 160, hd: -10, legs: { ik: [15, 51.5], toe: 'perp' }, arms: { ik: [2, 3], f: 't', b: -1 } },
    { hip: [30.5, 37.5], t: 46, hd: 0, legs: { ik: [15, 51.5], toe: 'perp' }, arms: { ik: [2, 3], f: 't', b: -1 } }] },
  kickback_glutei: { nome: 'Kickback glutei ai cavi', inizia: 'conc', props: [{ p: 'cavo', at: 'a2', to: [4, 52] }], keys: [
    { hip: [30, 31.4], t: 12, legs: [{ ik: [30, 53] }, { a: [2, 4] }], arms: { a: [48, 78] } },
    { hip: [30, 31.4], t: 18, legs: [{ ik: [30, 53] }, { a: [-42, -40] }], arms: { a: [48, 78] } }] },

  /* --- Spinta orizzontale --- */
  push: { nome: 'Piegamento', inizia: 'ecc', keys: [
    { ...linea([8, 52.6], 27.5), hd: -6, legs: { ik: [8, 52.6], toe: [9.4, 54.4] }, arms: { ik: [41.5, 53.2], b: -1 } },
    { ...linea([8, 52.6], 6), hd: -6, legs: { ik: [8, 52.6], toe: [9.4, 54.4] }, arms: { ik: [41.5, 53.2], b: -1 } }] },
  push_rialzo: { nome: 'Piegamento su rialzo', inizia: 'ecc', props: [{ p: 'box', x1: 38, x2: 52, y: 42 }], keys: [
    { ...linea([8.5, 52.6], 40.5), hd: -6, legs: { ik: [8.5, 52.6], toe: [9.9, 54.4] }, arms: { ik: [42, 41.8], b: -1 } },
    { ...linea([8.5, 52.6], 21.5), hd: -6, legs: { ik: [8.5, 52.6], toe: [9.9, 54.4] }, arms: { ik: [42, 41.8], b: -1 } }] },
  push_declinato: { nome: 'Piegamento declinato', inizia: 'ecc', props: [{ p: 'box', x1: 3, x2: 17, y: 43.6 }], keys: [
    { ...linea([11, 42.2], 10.5), hd: -6, legs: { ik: [11, 42.2], toe: [12.4, 44] }, arms: { ik: [44.5, 53.2], b: -1 } },
    { ...linea([11, 42.2], -6.5), hd: -6, legs: { ik: [11, 42.2], toe: [12.4, 44] }, arms: { ik: [44.5, 53.2], b: -1 } }] },
  plank: { nome: 'Plank', inizia: 'ecc', tenuta: 0, keys: [
    { ...linea([7, 52.6], 13.2), hd: -6, legs: { ik: [7, 52.6], toe: [8.4, 54.4] }, arms: { ik: [50.4, 53.3], b: -1 } }] },
  plank_lat: { nome: 'Plank laterale', vista: 'fronte', inizia: 'ecc', tenuta: 0, keys: [
    { hip: [27, 45.2], t: 72, hd: 0, legs: { a: [-7, 0] }, arms: [{ a: [100, 120] }, { ik: [44.5, 54], f: 'w', b: 1 }] }] },
  mountain: { nome: 'Mountain climber', inizia: 'conc', keys: [
    { ...linea([8, 52.6], 26), hd: -6, legs: [{ ik: [8, 52.6], toe: [9.4, 54.4] }, { ik: [30, 49.5], toe: 'perp' }], arms: { ik: [41.5, 53.2], b: -1 } },
    { ...linea([8, 52.6], 26), hd: -6, legs: [{ ik: [30, 49.5], toe: 'perp' }, { ik: [8, 52.6], toe: [9.4, 54.4] }], arms: { ik: [41.5, 53.2], b: -1 } }], tempo: '0.35-0-0.35-0' },
  ab_wheel: { nome: 'Ab wheel', inizia: 'ecc', props: [{ p: 'ruota', at: 'w1' }], keys: [
    { hip: [22.5, 43.5], t: 50, hd: -12, legs: { ik: [10, 52.6], b: -1, toe: 'perp' }, arms: { ik: [33, 52], b: -1 } },
    { hip: [28.5, 46.6], t: 82, hd: -12, legs: { ik: [10, 52.6], b: -1, toe: 'perp' }, arms: { ik: [51.5, 52], b: -1 } }] },
  burpee: { nome: 'Burpee', inizia: 'conc', sc: [0.9, 30, G], keys: [
    st({ arms: { a: [5, 10] } }),
    { hip: [24, 44.5], t: 58, hd: -10, legs: { ik: [30, 53] }, arms: { ik: [40, 53.2], b: -1 } },
    { ...linea([8, 52.6], 6), hd: -6, legs: { ik: [8, 52.6], toe: [9.4, 54.4] }, arms: { ik: [40, 53.2], b: -1 } },
    { hip: [24, 44.5], t: 58, hd: -10, legs: { ik: [30, 53] }, arms: { ik: [40, 53.2], b: -1 } },
    { hip: [30, 25], t: 0, legs: { ik: [30, 46.5] }, arms: { a: [176, 178] }, toe: 'punta' }],
    seg: [0.45, 0.4, 0.4, 0.4, 0.5] },

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
    st({ legs: { a: [6, 4] }, arms: { a: [62, 272] } })] },
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
    { hip: [26.6, 25.4], t: 32, hd: -10, legs: { a: [-4, -24] }, arms: { ik: [31, 18.2] } },
    { hip: [30.4, 14.9], t: 4, legs: { a: [8, -6] }, arms: { ik: [31, 18.2] } }],
    seg: [0.7, 0.35, 0.6, 1.2] },
  trazione_aus: { nome: 'Trazione australiana', inizia: 'conc', props: [{ p: 'sbarra', x: 27, y: 24.5, basso: true }], keys: [
    { ...linea([48.5, 52.6], 155), hd: 4, legs: { ik: [48.5, 52.6], toe: [48.1, 49.2] }, arms: { ik: [27, 24.7] } },
    { ...linea([48.5, 52.6], 131.4), hd: 4, legs: { ik: [48.5, 52.6], toe: [48.1, 49.2] }, arms: { ik: [27, 24.7] } }] },
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
    { hip: [18.6, 45], t: 4, legs: { ik: [31, 53], b: 1 }, arms: { ik: [15, 38.4], b: -1 } }] },

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
    { ...linea([48.5, 52.6], 131.4), hd: 4, legs: { ik: [48.5, 52.6], toe: [48.1, 49.2] }, arms: { ik: [27, 24.7] } }] },
  muscle_up_anelli: { nome: 'Muscle up agli anelli', inizia: 'conc', g: null, sc: [0.72, 30, 30], props: [{ p: 'anelli', at: 'w2', ay: -40 }, { p: 'anelli', at: 'w1', ay: -40 }], keys: [
    { hip: [30, 49.4], t: 0, legs: { a: [6, -6] }, arms: { ik: [31, 18.2] } },
    { hip: [26.5, 38], t: -18, hd: 8, legs: { a: [30, 10] }, arms: { ik: [31, 18.2] } },
    { hip: [26.6, 25.4], t: 32, hd: -10, legs: { a: [-4, -24] }, arms: { ik: [31, 18.2] } },
    { hip: [30.4, 14.9], t: 4, legs: { a: [8, -6] }, arms: { ik: [31, 18.2] } }],
    seg: [0.7, 0.35, 0.6, 1.2] },

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
    { hip: [28, 50.8], t: -90, hd: 8, legs: { ik: [39, 53], b: 1 }, arms: { ik: [2.6, 3.4], f: 't', b: -1 } },
    { hip: [28, 50.8], t: -58, hd: 16, legs: { ik: [39, 53], b: 1 }, arms: { ik: [2.6, 3.4], f: 't', b: -1 } }] },
  situp: { nome: 'Sit-up', inizia: 'conc', keys: [
    { hip: [28, 50.8], t: -90, hd: 8, legs: { ik: [39, 53], b: 1 }, arms: { ik: [2.6, 3.4], f: 't', b: -1 } },
    { hip: [28, 50.8], t: -6, hd: 8, legs: { ik: [39, 53], b: 1 }, arms: { ik: [2.6, 3.4], f: 't', b: -1 } }] },
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
        const ra = risolviArto(sA, root, ctx, l1, l2, i, specchio), rb = risolviArto(sB, root, ctx, l1, l2, i, specchio);
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
        J['f' + (i + 1)] = toeA === toeB && !sA.ik === !sB.ik ? pA : lerpP(pA, pB, u);
      }
    }
  }
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
    case 'peso': case 'palla': { const c = at(pr.at); return `<circle class="ld" cx="${fx(c[0])}" cy="${fx(c[1])}" r="${pr.r || 3.2}"/>`; }
    case 'kb': { const w = J.w1, e = J.e1; const d = dist(e, w) || 1; const c = [w[0] + (w[0] - e[0]) / d * 3.2, w[1] + (w[1] - e[1]) / d * 3.2];
      return `<circle class="ld" cx="${fx(c[0])}" cy="${fx(c[1])}" r="3"/>`; }
    case 'ruota': { const c = at(pr.at); return `<circle class="eq" cx="${fx(c[0])}" cy="${fx(c[1])}" r="2.3"/>`; }
    case 'rullo': { const c = at(pr.at); return `<circle class="eqf" cx="${fx(c[0])}" cy="${fx(c[1])}" r="1.7"/>`; }
    case 'maniglia': { const c = at(pr.at); return `<line class="eq" x1="${fx(c[0] - 2)}" x2="${fx(c[0] + 2)}" y1="${fx(c[1])}" y2="${fx(c[1])}"/>`; }
    case 'cavo': { const c = at(pr.at); const to = pr.to; return `<line class="cv" x1="${fx(c[0])}" y1="${fx(c[1])}" x2="${to[0]}" y2="${to[1]}"/><circle class="eqf" cx="${to[0]}" cy="${to[1]}" r="1.4"/>`; }
    case 'piatto': { const c = J.a1; const v = dir(pr.ang + 90); return `<line class="eqs" x1="${fx(c[0] - v[0] * 6 + 1.2)}" y1="${fx(c[1] - v[1] * 6 + 1.2)}" x2="${fx(c[0] + v[0] * 6 + 1.2)}" y2="${fx(c[1] + v[1] * 6 + 1.2)}"/>`; }
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
function scenaSVG(P) {
  const out = [];
  for (const pr of P.props || []) {
    if (pr.p === 'panca') out.push(`<line class="eqs" x1="${pr.x1}" x2="${pr.x2}" y1="${pr.y}" y2="${pr.y}"/><line class="eq" x1="${pr.x1 + 2}" x2="${pr.x1 + 2}" y1="${pr.y}" y2="${G}"/><line class="eq" x1="${pr.x2 - 2}" x2="${pr.x2 - 2}" y1="${pr.y}" y2="${G}"/>`);
    if (pr.p === 'box') out.push(`<rect class="box" x="${pr.x1}" y="${pr.y}" width="${pr.x2 - pr.x1}" height="${G - pr.y}" rx="1"/>`);
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
const SCENA_DINAMICA = new Set(['bil', 'man', 'peso', 'palla', 'kb', 'ruota', 'rullo', 'maniglia', 'cavo', 'piatto', 'anelli', 'bastone']);

function corpoSVG(P, J, ev = new Set()) {
  const vf = J.vista === 'fronte';
  const props = (P.props || []).filter(p => SCENA_DINAMICA.has(p.p));
  const dietroProps = props.filter(p => p.at === 'w2').map(p => propSVG(p, J)).join('');
  const davantiProps = props.filter(p => p.at !== 'w2').map(p => propSVG(p, J)).join('');
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
    if (x < seg[i]) return [i, (i + 1) % K, easing(x / seg[i])];
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

function svgCompleto(P, J, cls, ev) {
  const g = P.g === undefined ? G : P.g;
  const suolo = g === null ? '' : `<line class="gr" x1="2" x2="58" y1="${g}" y2="${g}"/>`;
  return `<svg class="${cls}" viewBox="0 0 60 60" aria-hidden="true"><g${trasformazione(P)}>${suolo}${scenaSVG(P)}<g class="corpo">${corpoSVG(P, J, ev)}</g></g></svg>`;
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
  for (const v of vivi) if (v.el === el) vivi.delete(v);
  const ev = accesi(opz);
  const J0 = frame(P, 0, opz);
  el.innerHTML = svgCompleto(P, J0, 'omino grande', ev);
  if (reduceMotion && !opz.forza) { el.innerHTML = ominoSVG(anim, { ...opz, cls: 'omino grande' }); return; }
  const g = el.querySelector('g.corpo');
  vivi.add({ el, g, P, opz, ev, t0: performance.now() });
  if (!loopAttivo) { loopAttivo = true; requestAnimationFrame(loop); }
}

// Per i controlli: svg di una fase precisa (u da 0 a 1 lungo il ciclo)
export function ominoFase(anim, s, opz = {}) {
  const P = POSE[animazione(anim)];
  return svgCompleto(P, frame(P, s, opz), 'omino', accesi(opz));
}
export const durataCiclo = (anim, opz = {}) => {
  const P = POSE[animazione(anim)];
  if (P.keys.length === 1) return 3.2;
  if (P.keys.length === 2) {
    const t = leggiTempo(opz.tempo) || leggiTempo(P.tempo) || [1.3, 0.2, 1.0, 0.35];
    return Math.max(t[0], .25) + t[1] + Math.max(t[2], .25) + t[3];
  }
  return (P.seg || P.keys.map(() => 0.7)).reduce((a, b) => a + b, 0);
};
