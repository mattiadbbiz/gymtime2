// GymTime · domande guidate prima e dopo l'allenamento
// Quelle predefinite (coach_id vuoto) le gestisce l'admin. Un coach può avere le sue: per ogni fase,
// se il coach ne ha almeno una valgono le sue, altrimenti le predefinite.
import { json, corpo, fallisci, testo, parseJSON, richiedi } from './util.js';

const FASI = ['pre', 'post'];
const forma = r => ({ id: r.id, fase: r.fase, testo: r.testo, tipo: r.tipo, opzioni: parseJSON(r.opzioni, []), etichetta_min: r.etichetta_min || '', etichetta_max: r.etichetta_max || '' });

async function insieme(env, coachId, soloAttive = true) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM domande WHERE (coach_id IS NULL OR coach_id = ?) ${soloAttive ? 'AND attiva = 1' : ''} ORDER BY fase, posizione, id`
  ).bind(coachId ?? -1).all();
  const out = {}, proprie = {};
  for (const f of FASI) {
    const mie = results.filter(r => r.fase === f && coachId && r.coach_id === coachId);
    proprie[f] = mie.length > 0;
    out[f] = (mie.length ? mie : results.filter(r => r.fase === f && r.coach_id === null)).map(forma);
  }
  return { domande: out, proprie };
}

// Domande per chi si allena: quelle del suo coach (o le predefinite)
export async function domandePerMe(env, io) {
  let coachId = null;
  if (io.ruolo === 'coach') coachId = io.id;
  else if (io.ruolo === 'atleta' && io.coach_id) {
    const c = await env.DB.prepare('SELECT ruolo FROM utenti WHERE id = ?').bind(io.coach_id).first();
    if (c && c.ruolo === 'coach') coachId = io.coach_id;
  }
  const { domande } = await insieme(env, coachId);
  return json({ domande });
}

export async function domandeGestione(env, io) {
  richiedi(io, 'admin', 'coach');
  const { domande, proprie } = await insieme(env, io.ruolo === 'coach' ? io.id : null);
  return json({ domande, proprie, predefinite: io.ruolo === 'admin' });
}

export async function salvaDomande(request, env, io) {
  richiedi(io, 'admin', 'coach');
  const d = await corpo(request);
  if (!FASI.includes(d.fase)) fallisci(400, 'Fase non valida');
  const coachId = io.ruolo === 'coach' ? io.id : null;
  const lista = (Array.isArray(d.domande) ? d.domande : []).slice(0, 20).map(q => {
    const tipo = ['scala', 'scelta', 'testo'].includes(q.tipo) ? q.tipo : 'testo';
    const opzioni = tipo === 'scelta' ? (Array.isArray(q.opzioni) ? q.opzioni : String(q.opzioni || '').split(',')).map(o => testo(o, 60)).filter(Boolean).slice(0, 8) : null;
    return { testo: testo(q.testo, 200), tipo, opzioni, min: testo(q.etichetta_min, 40) || null, max: testo(q.etichetta_max, 40) || null };
  }).filter(q => q.testo && (q.tipo !== 'scelta' || (q.opzioni && q.opzioni.length >= 2)));
  const st = [coachId === null
    ? env.DB.prepare('DELETE FROM domande WHERE coach_id IS NULL AND fase = ?').bind(d.fase)
    : env.DB.prepare('DELETE FROM domande WHERE coach_id = ? AND fase = ?').bind(coachId, d.fase)];
  lista.forEach((q, i) => st.push(env.DB.prepare(
    'INSERT INTO domande (coach_id, fase, posizione, testo, tipo, opzioni, etichetta_min, etichetta_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(coachId, d.fase, i, q.testo, q.tipo, q.opzioni ? JSON.stringify(q.opzioni) : null, q.min, q.max)));
  await env.DB.batch(st);
  return json({ ok: true });
}

// Il coach torna alle domande predefinite
export async function usaPredefinite(request, env, io) {
  richiedi(io, 'coach');
  const d = await corpo(request);
  if (!FASI.includes(d.fase)) fallisci(400, 'Fase non valida');
  await env.DB.prepare('DELETE FROM domande WHERE coach_id = ? AND fase = ?').bind(io.id, d.fase).run();
  return json({ ok: true });
}
