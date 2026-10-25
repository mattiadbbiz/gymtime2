// GymTime · omino animato
// Ogni animazione è una serie di pose chiave. Le ossa hanno lunghezza fissa:
// mani e piedi appoggiati restano fermi grazie alla cinematica inversa, quindi
// ginocchia e gomiti si piegano come nel corpo vero. Il ritmo segue il tempo
// esecutivo (eccentrica-fermo-concentrica-fermo) e la fase da cui si parte.

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
    st({ t: 4, arms: { ik: [-2.4, 2], f: 't', b: 1 } }),
    st({ hip: [20, 43], t: 44, arms: { ik: [-2.4, 2], f: 't', b: 1 } })] },
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
    st({ t: 4, arms: { ik: [-2.4, 2], f: 't', b: 1 } }),
    st({ hip: [20, 42.6], t: 38, arms: { ik: [-2.4, 2], f: 't', b: 1 } })] },
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
    { hip: [21, 41.5], t: -52, legs: { ik: [37, 24.8], toe: 'perp' }, arms: { a: [20, 60] } },
    { hip: [21, 41.5], t: -52, legs: { ik: [29.5, 32.5], toe: 'perp' }, arms: { a: [20, 60] } }] },
  leg_ext: { nome: 'Leg extension', inizia: 'conc', props: [{ p: 'panca', x1: 16, x2: 35, y: 42.4 }, { p: 'linea', a: [17, 42.4], b: [13, 24] }, { p: 'rullo', at: 'a1' }], keys: [
    { hip: [21, 40.2], t: -8, legs: { a: [92, 2] }, arms: { a: [10, 40] } },
    { hip: [21, 40.2], t: -8, legs: { a: [92, 86] }, arms: { a: [10, 40] } }] },
  leg_curl: { nome: 'Leg curl sdraiato', inizia: 'conc', props: [{ p: 'panca', x1: 10, x2: 46, y: 45.6 }, { p: 'rullo', at: 'a1' }], keys: [
    { hip: [26, 43.4], t: 90, hd: -8, legs: { a: [-89, -89] }, arms: { a: [20, -10] } },
    { hip: [26, 43.4], t: 90, hd: -8, legs: { a: [-89, -170] }, arms: { a: [20, -10] } }] },
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
    st({ hip: [23.5, 41.5], t: 40, hd: -12, legs: { ik: [31, 53] }, arms: { ik: [32.5, 49], b: -1 } }),
    st({ t: -3, legs: { ik: [31, 53] }, arms: { ik: [31.6, 34.4], b: -1 } })] },
  rdl: { nome: 'Stacco rumeno', inizia: 'ecc', props: [{ p: 'bil', at: 'w1' }], keys: [
    st({ arms: { a: [2, 4] } }),
    st({ hip: [23.5, 32.4], t: 74, hd: -14, legs: { ik: [30, 53] }, arms: { a: [-2, 0] } })] },
  rdl_man: { nome: 'Stacco rumeno con manubri', inizia: 'ecc', props: [{ p: 'man', at: 'w1' }, { p: 'man', at: 'w2' }], keys: [
    st({ arms: { a: [2, 4] } }),
    st({ hip: [23.5, 32.4], t: 74, hd: -14, legs: { ik: [30, 53] }, arms: { a: [-2, 0] } })] },
  good_morning: { nome: 'Good morning', inizia: 'ecc', props: [{ p: 'bil', at: 'w1', r: 4.6 }], keys: [
    st({ arms: { ik: [-2.4, 2], f: 't', b: 1 } }),
    st({ hip: [24, 32.2], t: 72, hd: -12, arms: { ik: [-2.4, 2], f: 't', b: 1 } })] },
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
    { hip: [27, 50.8], nk: [12, 50.8], hd: 8, legs: { ik: [36.5, 53], b: 1 }, arms: { a: [-88, -88] } },
    { hip: [28.6, 44.2], nk: [13.4, 50.4], hd: 14, legs: { ik: [36.5, 53], b: 1 }, arms: { a: [-88, -88] } }] },
  hyper: { nome: 'Hyperextension', inizia: 'conc', props: [{ p: 'linea', a: [24, 43], b: [33, 35] }, { p: 'linea', a: [12, 54.5], b: [29, 39] }, { p: 'rullo', at: 'a1' }], keys: [
    { hip: [30.5, 37.5], t: 160, hd: -10, legs: { ik: [15, 51.5], toe: 'perp' }, arms: { ik: [2, 3], f: 't', b: -1 } },
    { hip: [30.5, 37.5], t: 46, hd: 0, legs: { ik: [15, 51.5], toe: 'perp' }, arms: { ik: [2, 3], f: 't', b: -1 } }] },
  kickback_glutei: { nome: 'Kickback glutei ai cavi', inizia: 'conc', props: [{ p: 'cavo', at: 'a2', to: [4, 52] }], keys: [
    { hip: [30, 31.4], t: 12, legs: [{ ik: [30, 53] }, { a: [2, 4] }], arms: { a: [60, 40] } },
    { hip: [30, 31.4], t: 18, legs: [{ ik: [30, 53] }, { a: [-42, -40] }], arms: { a: [60, 40] } }] },

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
    { hip: [22.5, 41.5], t: 50, hd: -12, legs: { ik: [10, 52.6], b: -1, toe: 'perp' }, arms: { ik: [33, 52], b: -1 } },
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
    { hip: [28.5, 41.6], t: -55, hd: 8, legs: { ik: [40, 53], b: 1 }, arms: { ik: [21.5, 14.5], b: 1 } },
    { hip: [28.5, 41.6], t: -55, hd: 8, legs: { ik: [40, 53], b: 1 }, arms: { ik: [20.5, 28.5], b: 1 } }] },
  chest_press: { nome: 'Chest press', inizia: 'conc', props: [{ p: 'panca', x1: 14, x2: 30, y: 42.4 }, { p: 'linea', a: [15, 42.4], b: [12, 20] }, { p: 'cavo', at: 'w1', to: [52, 22] }], keys: [
    { hip: [19, 40.2], t: -6, legs: { ik: [33, 53], b: 1 }, arms: { ik: [26.5, 25.6], b: -1 } },
    { hip: [19, 40.2], t: -6, legs: { ik: [33, 53], b: 1 }, arms: { ik: [34.8, 25.6], b: -1 } }] },
  croci: { nome: 'Croci e pec deck', vista: 'fronte', inizia: 'conc', props: [{ p: 'man', at: 'w1' }, { p: 'man', at: 'w2' }], keys: [
    st({ legs: { a: [6, 4] }, arms: { a: [96, 102] } }),
    st({ legs: { a: [6, 4] }, arms: { a: [62, -88] } })] },
  pullover: { nome: 'Pullover', inizia: 'ecc', props: [{ p: 'panca', x1: 5, x2: 33, y: 44.2 }, { p: 'peso', at: 'w1', r: 2.6 }], keys: [
    { hip: [29, 41.8], t: -90, hd: 4, legs: { ik: [40, 53], b: 1 }, arms: { a: [192, 200] } },
    { hip: [29, 41.8], t: -90, hd: 4, legs: { ik: [40, 53], b: 1 }, arms: { a: [262, 272] } }] },

  /* --- Spinta verticale --- */
  press: { nome: 'Military press', inizia: 'conc', sc: [0.86, 30, G], props: [{ p: 'bil', at: 'w1', r: 4.2 }], keys: [
    st({ t: -3, hd: -6, arms: { ik: [3.4, 2.2], f: 't', b: -1 } }),
    st({ t: 0, arms: { a: [179, 179] } })] },
  press_man: { nome: 'Lento con manubri', inizia: 'conc', sc: [0.86, 30, G], props: [{ p: 'panca', x1: 16, x2: 34, y: 42.4 }, { p: 'man', at: 'w1' }], keys: [
    { hip: [26, 40.2], t: -4, legs: { ik: [38, 53], b: 1 }, arms: { a: [-60, 172] } },
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
    { hip: [41, 20.2], t: 181, hd: 0, legs: { a: [176, 178] }, arms: { ik: [38.5, 53.2], b: 1 } },
    { hip: [40, 28], t: 178, hd: 0, legs: { a: [174, 176] }, arms: { ik: [38.5, 53.2], b: 1 } }] },
  verticale: { nome: 'Verticale al muro', inizia: 'ecc', sc: [0.84, 30, G], tenuta: 0, props: [{ p: 'muro', x: 45.5 }], keys: [
    { hip: [41, 20.2], t: 181, hd: 0, legs: { a: [176, 178] }, arms: { ik: [38.5, 53.2], b: 1 } }] },

  /* --- Trazioni e tirate --- */
  trazione: { nome: 'Trazione alla sbarra', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'sbarra', x: 31.5, y: 4 }], keys: [
    { hip: [30, 37.4], t: 0, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [28.6, 22.4], t: -9, hd: 6, legs: { a: [12, -12] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  trazione_zav: { nome: 'Trazione zavorrata', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'sbarra', x: 31.5, y: 4 }, { p: 'peso', at: 'hip', r: 3, off: [1.5, 6] }], keys: [
    { hip: [30, 37.4], t: 0, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [28.6, 22.4], t: -9, hd: 6, legs: { a: [12, -12] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  dead_hang: { nome: 'Sospensione alla sbarra', inizia: 'conc', g: null, sc: [0.86, 30, 4], tenuta: 0, props: [{ p: 'sbarra', x: 31.5, y: 4 }], keys: [
    { hip: [30, 37.4], t: 0, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  scapolari: { nome: 'Trazioni scapolari', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'sbarra', x: 31.5, y: 4 }], keys: [
    { hip: [30, 37.4], t: 0, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [29.6, 34.6], t: -4, legs: { a: [6, -6] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  muscle_up: { nome: 'Muscle up', inizia: 'conc', g: null, sc: [0.72, 30, 30], props: [{ p: 'sbarra', x: 31, y: 18 }], keys: [
    { hip: [30, 51.6], t: 0, legs: { a: [6, -6] }, arms: { ik: [31, 18.2], b: 1 } },
    { hip: [26.5, 38], t: -18, hd: 8, legs: { a: [30, 10] }, arms: { ik: [31, 18.2], b: 1 } },
    { hip: [29.5, 28], t: 30, hd: -10, legs: { a: [-10, -20] }, arms: { ik: [31, 18.2], b: 1 } },
    { hip: [30.5, 19.5], t: 6, legs: { a: [10, -6] }, arms: { ik: [31, 18.2], b: -1 } }],
    seg: [0.7, 0.35, 0.6, 1.2] },
  trazione_aus: { nome: 'Trazione australiana', inizia: 'conc', props: [{ p: 'sbarra', x: 31, y: 24.5, basso: true }], keys: [
    { ...linea([2, 52.6], 19.5), hd: 4, legs: { ik: [2, 52.6], toe: [2.4, 49.2] }, arms: { ik: [31, 24.7], b: 1 } },
    { ...linea([2, 52.6], 44), hd: 4, legs: { ik: [2, 52.6], toe: [2.4, 49.2] }, arms: { ik: [31, 24.7], b: 1 } }] },
  lat: { nome: 'Lat machine', inizia: 'conc', props: [{ p: 'panca', x1: 18, x2: 34, y: 42.4 }, { p: 'cavo', at: 'w1', to: [30, 1] }, { p: 'maniglia', at: 'w1' }, { p: 'rullo', at: 'k1', off: [0, -2.4] }], keys: [
    { hip: [26, 40.2], t: -8, legs: { ik: [36, 53], b: 1 }, arms: { ik: [29.5, 7.2], b: 1 } },
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
  dip: { nome: 'Dip alle parallele', inizia: 'ecc', props: [{ p: 'parallele', x: 31.5, y: 32 }], keys: [
    { hip: [30, 30.4], t: 2, legs: { ik: [24, 48.5], b: 1, toe: 'perp' }, arms: { ik: [31.5, 32.2], b: -1 } },
    { hip: [28.5, 39.6], t: 20, legs: { ik: [21.6, 57.5], b: 1, toe: 'perp' }, arms: { ik: [31.5, 32.2], b: -1 } }] },
  dip_panca: { nome: 'Dip alla panca', inizia: 'ecc', props: [{ p: 'panca', x1: 3, x2: 16, y: 38.6 }], keys: [
    { hip: [18, 36.6], t: -2, legs: { ik: [31, 53], b: 1 }, arms: { ik: [15, 38.4], b: -1 } },
    { hip: [18.6, 45], t: 4, legs: { ik: [31, 53], b: 1 }, arms: { ik: [15, 38.4], b: -1 } }] },

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
    { hip: [30, 37.4], t: 0, legs: { a: [4, 2] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [28, 37], t: -10, legs: { a: [92, 92] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  knee_raise: { nome: 'Knee raise alla sbarra', inizia: 'conc', g: null, sc: [0.86, 30, 4], props: [{ p: 'sbarra', x: 31.5, y: 4 }], keys: [
    { hip: [30, 37.4], t: 0, legs: { a: [4, 2] }, arms: { ik: [31.5, 4.2], b: 1 } },
    { hip: [29, 36.6], t: -8, legs: { a: [110, 8] }, arms: { ik: [31.5, 4.2], b: 1 } }] },
  dead_bug: { nome: 'Dead bug', inizia: 'conc', keys: [
    { hip: [30, 50.8], t: -90, hd: 8, legs: { a: [180, 90] }, arms: { a: [180, 180] } },
    { hip: [30, 50.8], t: -90, hd: 8, legs: [{ a: [180, 90] }, { a: [100, 100] }], arms: [{ a: [256, 256] }, { a: [180, 180] }] }] },
  pallof: { nome: 'Pallof press', inizia: 'conc', props: [{ p: 'cavo', at: 'w1', to: [30, 24], lato: true }], keys: [
    st({ arms: { ik: [3, 7.4], f: 't', b: -1 } }),
    st({ arms: { ik: [46.5, 23.2], b: -1 } })] },

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

// Angoli assoluti di un arto già risolto (per interpolare specifiche miste)
const angoliDi = (root, mid, end) => [ang(mid[0] - root[0], mid[1] - root[1]), ang(end[0] - mid[0], end[1] - mid[1])];

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
    return ik(root, tg, l1, l2, b);
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
      } else {
        const ra = risolviArto(sA, root, ctx, l1, l2, i, specchio), rb = risolviArto(sB, root, ctx, l1, l2, i, specchio);
        const aa = angoliDi(root, ...ra), ab = angoliDi(root, ...rb);
        [mid, end] = fk(root, [lerpA(aa[0], ab[0], u), lerpA(aa[1], ab[1], u)], l1, l2);
      }
      J[chiave + (i + 1)] = mid;
      J[(gambe ? 'a' : 'w') + (i + 1)] = end;
      J[(gambe ? 'r' : 's') + (i + 1)] = root;
      if (gambe) {
        // Punta del piede: fissa a terra, a punta (salti) o perpendicolare alla tibia
        const toeA = sA.toe || kA.toe, toeB = sB.toe || kB.toe;
        const tibia = ang(end[0] - mid[0], end[1] - mid[1]);
        const verso = vista === 'fronte' ? (i === 0 ? 1 : -1) : 1;
        const calcola = toe => {
          if (Array.isArray(toe)) {
            const tg = [toe[0] + dx, toe[1]];
            const d = dist(end, tg) || 1;
            return [end[0] + (tg[0] - end[0]) / d * L.ft, end[1] + (tg[1] - end[1]) / d * L.ft];
          }
          if (vista === 'fronte') return add(end, dir(tibia + 90 * verso), L.ft * 0.7);
          if (toe === 'punta') return add(end, dir(tibia + 25), L.ft);
          if (toe === 'perp') return add(end, dir(tibia + 90), L.ft);
          return add(end, [0.98, 0.18], L.ft);
        };
        const pA = calcola(toeA), pB = calcola(toeB);
        J['f' + (i + 1)] = toeA === toeB ? pA : lerpP(pA, pB, u);
      }
    }
  }
  return J;
}

/* ---------- Disegno ---------- */
const OSSA_DIETRO = [['hip', 'k2'], ['k2', 'a2'], ['a2', 'f2'], ['s2', 'e2'], ['e2', 'w2']];
const OSSA_DAVANTI = [['hip', 'k1'], ['k1', 'a1'], ['a1', 'f1'], ['s1', 'e1'], ['e1', 'w1']];
const fx = n => Math.round(n * 100) / 100;

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
    default: return '';
  }
}
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
    if (pr.p === 'parallele') out.push(`<line class="eq" x1="${pr.x}" x2="${pr.x}" y1="${pr.y}" y2="${G}"/><circle class="eqf" cx="${pr.x}" cy="${pr.y}" r="1.5"/>`);
  }
  return out.join('');
}
const SCENA_DINAMICA = new Set(['bil', 'man', 'peso', 'palla', 'kb', 'ruota', 'rullo', 'maniglia', 'cavo', 'piatto']);

function corpoSVG(P, J) {
  const line = (a, b, cls) => `<line class="${cls}" x1="${fx(J[a][0])}" y1="${fx(J[a][1])}" x2="${fx(J[b][0])}" y2="${fx(J[b][1])}"/>`;
  const dietro = J.vista === 'fronte' ? 'fr' : 'bk';
  const props = (P.props || []).filter(p => SCENA_DINAMICA.has(p.p));
  const dietroProps = props.filter(p => p.at === 'w2').map(p => propSVG(p, J)).join('');
  const davantiProps = props.filter(p => p.at !== 'w2').map(p => propSVG(p, J)).join('');
  return dietroProps
    + OSSA_DIETRO.map(([a, b]) => line(a, b, dietro)).join('')
    + line('hip', 'neck', 'fr')
    + `<circle class="hd" cx="${fx(J.head[0])}" cy="${fx(J.head[1])}" r="${L.hr}"/>`
    + OSSA_DAVANTI.map(([a, b]) => line(a, b, 'fr')).join('')
    + davantiProps;
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

function svgCompleto(P, J, cls) {
  const g = P.g === undefined ? G : P.g;
  const suolo = g === null ? '' : `<line class="gr" x1="2" x2="58" y1="${g}" y2="${g}"/>`;
  return `<svg class="${cls}" viewBox="0 0 60 60" aria-hidden="true"><g${trasformazione(P)}>${suolo}${scenaSVG(P)}<g class="corpo">${corpoSVG(P, J)}</g></g></svg>`;
}

// Omino fermo nella posa più rappresentativa (fine della prima fase)
export function ominoSVG(anim, opz = {}) {
  const P = POSE[animazione(anim)];
  const k = P.keys[P.tenuta ?? Math.min(1, P.keys.length - 1)];
  const J = posa(P, k, k, 0);
  return svgCompleto(P, J, opz.cls || 'omino');
}

const vivi = new Set();
let loopAttivo = false;
function loop(ts) {
  for (const v of vivi) {
    if (!v.el.isConnected) { vivi.delete(v); continue; }
    const s = (ts - v.t0) / 1000;
    v.g.innerHTML = corpoSVG(v.P, frame(v.P, s, v.opz));
  }
  if (vivi.size) requestAnimationFrame(loop); else loopAttivo = false;
}

// Monta un omino animato dentro el. opz: { tempo:'3-1-1-0', inizia:'ecc'|'conc', tenuta:bool }
export function montaOmino(el, anim, opz = {}) {
  const P = POSE[animazione(anim)];
  if (!el) return;
  for (const v of vivi) if (v.el === el) vivi.delete(v);
  const J0 = frame(P, 0, opz);
  el.innerHTML = svgCompleto(P, J0, 'omino grande');
  if (reduceMotion && !opz.forza) { el.innerHTML = ominoSVG(anim, { cls: 'omino grande' }); return; }
  const g = el.querySelector('g.corpo');
  vivi.add({ el, g, P, opz, t0: performance.now() });
  if (!loopAttivo) { loopAttivo = true; requestAnimationFrame(loop); }
}

// Per i controlli: svg di una fase precisa (u da 0 a 1 lungo il ciclo)
export function ominoFase(anim, s, opz = {}) {
  const P = POSE[animazione(anim)];
  return svgCompleto(P, frame(P, s, opz), 'omino');
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
