// GymTime · controllo dei pezzi 3D senza three.js
// Uso: node strumenti/controllo-3d.mjs            (tutte le pose)
//      node strumenti/controllo-3d.mjs slam_ball  (solo alcune)
// Per ogni posa campiona 12 istanti del ciclo e verifica che ogni attrezzo e ogni macchina produca pezzi 3D
// con numeri validi (niente NaN o infiniti) e senza errori. Non disegna: l'aspetto si guarda in prova-omini.html.
import { POSE, durataCiclo } from '../public/js/omino.js';
import { pezziAlTempo } from '../public/js/omino3d.js';

const num = v => Array.isArray(v) ? v.every(num) : (typeof v !== 'number' || Number.isFinite(v));
const CAMPI = ['a', 'b', 'c', 'r', 's', 'w', 'z', 'rx', 'ry', 'rz', 'lati', 'pts'];
const nomi = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(POSE);
let ko = 0, pezzi = 0;
for (const k of nomi) {
  if (!POSE[k]) { console.log(`?    ${k}: posa inesistente`); ko++; continue; }
  const d = durataCiclo(k), errori = new Set();
  for (let i = 0; i < 12; i++) {
    try {
      const r = pezziAlTempo(k, d * i / 12); pezzi += r.pezzi.length;
      for (const q of r.pezzi) if (!CAMPI.every(f => q[f] === undefined || num(q[f]))) errori.add(`numeri non validi in un pezzo "${q.t}"`);
    } catch (e) { errori.add(`errore: ${e.message}`); }
  }
  if (errori.size) { ko++; console.log(`NO   ${k}: ${[...errori].join('; ')}`); }
}
console.log(`\n${nomi.length - ko}/${nomi.length} pose hanno pezzi 3D validi (${pezzi} pezzi controllati)`);
process.exit(ko ? 1 : 0);
