// GymTime · controllo anatomico automatico delle pose dell'omino
// Uso: node strumenti/controllo-pose.mjs            (tutte le pose)
//      node strumenti/controllo-pose.mjs gatto_mucca (solo alcune)
// Ogni posa viene campionata lungo tutto il movimento (e nel respiro delle tenute). Per ogni fotogramma:
// - gomito e ginocchio: flessione mai negativa (niente iperestensione) e mai oltre il possibile;
// - spalla e anca: angolo rispetto al busto entro i gradi possibili;
// - mani e piedi con un appoggio lo raggiungono davvero;
// - nessuna parte del corpo sotto il pavimento.
import { POSE, giuntiPerControllo, MISURE } from '../public/js/omino.js';
const { G, L, flessione, giunti, angoliDi } = MISURE;

export const LIMITI = {
  gomito: [-3, 160],      // gradi di flessione (negativo = iperestensione)
  ginocchio: [-3, 162],
  spalla: [-75, 195],     // braccio rispetto al busto: 0 lungo il fianco, + in avanti e in alto, − indietro
  anca: [-38, 158],       // coscia rispetto al busto: 0 in linea, + flessione, − estensione
  appoggio: 0.3,          // distanza massima tra mano o piede e il punto d'appoggio
  pavimento: 0.6          // tolleranza sotto la linea del suolo
};

function fotogrammi(P) {
  const K = P.keys;
  if (K.length === 1) {
    // tenuta: respiro di ±0.22 sul bacino, come in frame()
    return [-0.22, 0, 0.22].map(r => { const k = { ...K[0], hip: [K[0].hip[0], K[0].hip[1] + r] }; if (K[0].nk) k.nk = [K[0].nk[0], K[0].nk[1] + r * 0.6]; return [k, k, 0]; });
  }
  const out = [];
  const coppie = K.length === 2 ? [[0, 1]] : K.map((_, i) => [i, (i + 1) % K.length]);
  for (const [a, b] of coppie) for (let u = 0; u <= 1.0001; u += 0.05) out.push([K[a], K[b], Math.min(1, u)]);
  return out;
}

export function controlla(nome) {
  const P = POSE[nome];
  const lato = (P.vista || 'lato') === 'lato';
  const problemi = new Set();
  const peggio = { gomito: [Infinity, -Infinity], ginocchio: [Infinity, -Infinity], spalla: [Infinity, -Infinity], anca: [Infinity, -Infinity], appoggio: 0 };
  const segna = (k, v) => { peggio[k][0] = Math.min(peggio[k][0], v); peggio[k][1] = Math.max(peggio[k][1], v); };
  for (const [kA, kB, u] of fotogrammi(P)) {
    const chiave = u === 0 || u === 1;   // nelle pose chiave gli appoggi sono quelli scritti
    const J = giuntiPerControllo(nome, kA, kB, u);
    const deg = x => x * 180 / Math.PI;
    for (const i of [1, 2]) {
      const gin = deg(flessione(J['r' + i], [J['k' + i], J['a' + i]], true));
      const gom = deg(flessione(J['s' + i], [J['e' + i], J['w' + i]], false));
      // Braccio "libero" (gomiti larghi sotto il bilanciere): esce dal piano del profilo, di lato gomito e spalla non si misurano
      const libero = [kA, kB].some(k => (Array.isArray(k.arms) ? k.arms[i - 1] : k.arms)?.libero);
      if (lato) {
        segna('ginocchio', gin); if (!libero) segna('gomito', gom);
        const an = giunti(angoliDi(J['r' + i], J['k' + i], J['a' + i]), J.t, true)[0];
        const sp = giunti(angoliDi(J['s' + i], J['e' + i], J['w' + i]), J.t, false)[0];
        segna('anca', an); if (!libero) segna('spalla', sp);
        if (gin < LIMITI.ginocchio[0]) problemi.add(`ginocchio ${i} in iperestensione (${gin.toFixed(0)}°)`);
        if (gin > LIMITI.ginocchio[1]) problemi.add(`ginocchio ${i} piegato oltre il possibile (${gin.toFixed(0)}°)`);
        if (!libero && gom < LIMITI.gomito[0]) problemi.add(`gomito ${i} in iperestensione (${gom.toFixed(0)}°)`);
        if (!libero && gom > LIMITI.gomito[1]) problemi.add(`gomito ${i} piegato oltre il possibile (${gom.toFixed(0)}°)`);
        if (an < LIMITI.anca[0] || an > LIMITI.anca[1]) problemi.add(`anca ${i} fuori dai gradi possibili (${an.toFixed(0)}°)`);
        if (!libero && (sp < LIMITI.spalla[0] || sp > LIMITI.spalla[1])) problemi.add(`spalla ${i} fuori dai gradi possibili (${sp.toFixed(0)}°)`);
      } else {
        if (Math.abs(gin) > LIMITI.ginocchio[1]) problemi.add(`ginocchio ${i} piegato oltre il possibile`);
        if (Math.abs(gom) > LIMITI.gomito[1]) problemi.add(`gomito ${i} piegato oltre il possibile`);
      }
    }
    if (chiave) {
      peggio.appoggio = Math.max(peggio.appoggio, J.manca);
      if (J.manca > LIMITI.appoggio) problemi.add(`mano o piede non arriva all'appoggio (manca ${J.manca.toFixed(1)})`);
    }
    const suolo = P.g === undefined ? G : P.g;
    if (suolo !== null) {
      // Le punte dei piedi hanno un margine in più: il piede è disegnato dalla caviglia verso il punto d'appoggio
      const punti = ['hip', 'neck', 'k1', 'k2', 'a1', 'a2', 'e1', 'e2', 'w1', 'w2'].map(k => J[k][1]);
      const punte = Math.max(J.f1[1], J.f2[1]);
      if (Math.max(...punti) > suolo + LIMITI.pavimento || punte > suolo + 1 || J.head[1] > suolo - L.hr * 0.6) problemi.add('una parte del corpo va sotto il pavimento');
    }
  }
  const unici = [...new Set([...problemi].map(x => x.replace(/ \(.*\)$/, '').replace(/ [12] /, ' ')))];
  return { nome, problemi: unici, peggio };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const nomi = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(POSE);
  let ko = 0;
  for (const n of nomi) {
    if (!POSE[n]) { console.log(`?    ${n}: posa inesistente`); ko++; continue; }
    const r = controlla(n);
    if (r.problemi.length) { ko++; console.log(`NO   ${n}: ${r.problemi.join('; ')}`); }
    else if (process.env.DETTAGLI) { const p = r.peggio; console.log(`OK   ${n} gin ${p.ginocchio.map(x => x.toFixed(0))} gom ${p.gomito.map(x => x.toFixed(0))} anca ${p.anca.map(x => x.toFixed(0))} spalla ${p.spalla.map(x => x.toFixed(0))}`); }
  }
  console.log(`\n${nomi.length - ko}/${nomi.length} pose superano il controllo anatomico`);
  process.exit(ko ? 1 : 0);
}
