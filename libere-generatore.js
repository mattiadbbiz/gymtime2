import { AREE, generaSessione, durataPiano, utilizzabili, posizioneDi } from './mobilita.js';
export const poolSessione = (lib, tipo) => lib.filter(e => tipo === 'stretching' ? ['dinamico', 'statico', 'respirazione'].includes(e.tipo) : ['mobilita', 'respirazione'].includes(e.tipo));
export function generaFullBody(lib, tipo, opz) {
  const pool = utilizzabili(poolSessione(lib, tipo), opz), p = generaSessione(pool, { ...opz, area: null });
  for (const a of Object.values(AREE)) {
    if (p.esercizi.some(e => a.zone.includes(e.zona))) continue;
    const c = pool.filter(e => a.zone.includes(e.zona) && !p.esercizi.some(x => x.id === e.id));
    if (!c.length) return { esercizi: [], secondi: 0, errore: 'Mancano esercizi per ' + a.nome + ': contatta il coach' };
    const e = c[Math.floor(Math.random() * c.length)], x = { ...e, serie: 1, fase: e.tipo === 'statico' ? 'statico' : 'mobilita', posizione: posizioneDi(e.animazione) }, i = p.esercizi.findIndex(e => e.tipo === 'respirazione');
    p.esercizi.splice(i < 0 ? p.esercizi.length : i, 0, x);
  }
  const ordine = { riscaldamento: 0, mobilita: 1, statico: 2, respirazione: 3 };
  p.esercizi.sort((a, b) => ordine[a.fase] - ordine[b.fase]);
  return { ...p, secondi: durataPiano(p.esercizi) };
}
