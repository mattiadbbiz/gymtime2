import { json, corpo, fallisci, parseJSON, oggi, leggibile, gestibile } from './util.js';
import { elencoLibreria } from './libreria.js';
export const cardioJSON = s => ({ id: s.id, utente_id: s.utente_id, data: s.data, stato: s.stato, avviata_il: s.avviata_il, completata_il: s.completata_il, piano: parseJSON(s.piano_json, { esercizi: [] }), esiti: parseJSON(s.esiti_json, {}) });
export const queryCardio = (env, id) => env.DB.prepare('SELECT * FROM sessioni_cardio WHERE utente_id=? ORDER BY data DESC,id DESC LIMIT 400').bind(id);
async function carica(env, id) {
  const s = await env.DB.prepare('SELECT * FROM sessioni_cardio WHERE id=?').bind(id).first();
  if (!s) fallisci(404, 'Sessione non trovata');
  return s;
}
export async function statoCardio(env, io) {
  const aperta = await env.DB.prepare("SELECT * FROM sessioni_cardio WHERE utente_id=? AND stato='in_corso' ORDER BY id DESC LIMIT 1").bind(io.id).first(), lib = await (await elencoLibreria(env, io)).json();
  return json({ aperta: aperta ? cardioJSON(aperta) : null, esercizi: lib.esercizi.filter(e => e.modalita_default === 'cardio') });
}
export async function avviaCardio(request, env, io) {
  const d = await corpo(request), ids = d.esercizi;
  if (!Array.isArray(ids) || !ids.length || ids.length > 12 || new Set(ids).size !== ids.length || ids.some(id => !Number.isInteger(id) || id < 1)) fallisci(400, 'Scegli da 1 a 12 esercizi diversi');
  const lib = await (await elencoLibreria(env, io)).json(), m = new Map(lib.esercizi.filter(e => e.modalita_default === 'cardio').map(e => [e.id, e]));
  const esercizi = ids.map((id, rif) => {
    const e = m.get(id);
    if (!e) fallisci(400, 'Esercizio cardio non disponibile');
    return { rif, id, nome: e.nome, animazione: e.animazione, muscolo: e.muscolo || '', accorgimenti: e.accorgimenti || '' };
  });
  const aperta = await env.DB.prepare("SELECT id FROM sessioni_cardio WHERE utente_id=? AND stato='in_corso'").bind(io.id).first();
  if (aperta) return json({ id: aperta.id, ripresa: true });
  try {
    const r = await env.DB.prepare('INSERT INTO sessioni_cardio(utente_id,data,piano_json) VALUES(?,?,?)').bind(io.id, oggi(), JSON.stringify({ esercizi })).run();
    return json({ id: r.meta.last_row_id }, 201);
  } catch (e) {
    if (/UNIQUE/i.test(String(e.message))) fallisci(409, 'Sessione già aperta: ricarica');
    throw e;
  }
}
export async function leggiCardio(env, io, id) {
  const s = await carica(env, id);
  await leggibile(env, io, s.utente_id);
  return json({ sessione: cardioJSON(s) });
}
export function pulisciEsiti(piano, d, fine) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) fallisci(400, 'Risultati non validi');
  const out = {};
  for (const e of piano.esercizi) {
    const r = d[e.rif];
    if (!r) {
      if (fine) fallisci(400, 'Completa tutti gli esercizi');
      continue;
    }
    if (!['fatto', 'non_fatto'].includes(r.esito)) fallisci(400, 'Esito non valido');
    if (r.esito === 'non_fatto') {
      out[e.rif] = { esito: 'non_fatto' };
      continue;
    }
    const x = { esito: 'fatto' };
    for (const [k, max] of [['secondi', 43200], ['metri', 500000], ['calorie', 10000]]) {
      if (r[k] === undefined || r[k] === null || r[k] === '') continue;
      if (typeof r[k] !== 'number' || !Number.isFinite(r[k]) || r[k] <= 0 || r[k] > max) fallisci(400, 'Inserisci valori positivi entro i limiti');
      x[k] = Math.round(r[k] * 100) / 100;
    }
    if (fine && !x.secondi) fallisci(400, 'Indica la durata di ogni esercizio fatto');
    out[e.rif] = x;
  }
  return out;
}
export async function salvaCardio(request, env, io, id, fine = false) {
  const s = await carica(env, id);
  if (s.utente_id !== io.id) fallisci(403, 'Sessione non tua');
  if (s.stato !== 'in_corso') fallisci(409, 'Sessione già completata');
  const d = await corpo(request), esiti = pulisciEsiti(parseJSON(s.piano_json, { esercizi: [] }), d.esiti, fine);
  const r = await env.DB.prepare(`UPDATE sessioni_cardio SET esiti_json=?,stato=?,completata_il=CASE WHEN ?=1 THEN datetime('now') ELSE NULL END WHERE id=? AND utente_id=? AND stato='in_corso'`).bind(JSON.stringify(esiti), fine ? 'completata' : 'in_corso', fine ? 1 : 0, id, io.id).run();
  if (!r.meta.changes) fallisci(409, 'Sessione modificata: ricarica');
  return json({ ok: true });
}
export async function eliminaCardio(env, io, id) {
  const s = await carica(env, id);
  if (s.utente_id === io.id) {
    if (s.stato === 'completata' && io.ruolo === 'atleta') fallisci(403, 'La sessione completata la elimina il coach');
  } else await gestibile(env, io, s.utente_id);
  await env.DB.prepare('DELETE FROM sessioni_cardio WHERE id=?').bind(id).run();
  return json({ ok: true });
}
export async function ultime(env, io, id) {
  const { results } = await env.DB.prepare(`SELECT g.data,e.value AS esercizio,sv.esito,sv.effettivo_json,sv.voto FROM giornate g JOIN json_each(g.piano_json,'$.esercizi') e JOIN esercizi_svolti sv ON sv.giornata_id=g.id AND sv.rif_esercizio=CAST(json_extract(e.value,'$.rif') AS INTEGER) WHERE g.atleta_id=? AND g.stato='completata' AND CAST(json_extract(e.value,'$.esercizio_id') AS INTEGER)=? ORDER BY g.data DESC,g.id DESC,CAST(e.key AS INTEGER) DESC LIMIT 5`).bind(io.id, id).all();
  const { results: cardio } = await env.DB.prepare(`SELECT s.data,e.value AS esercizio,json_extract(s.esiti_json,'$."'||json_extract(e.value,'$.rif')||'"') AS esito FROM sessioni_cardio s JOIN json_each(s.piano_json,'$.esercizi') e WHERE s.utente_id=? AND s.stato='completata' AND CAST(json_extract(e.value,'$.id') AS INTEGER)=? ORDER BY s.data DESC,s.id DESC,CAST(e.key AS INTEGER) DESC LIMIT 5`).bind(io.id, id).all();
  const pesi = results.map(r => ({ data: r.data, origine: 'allenamento', esercizio: parseJSON(r.esercizio, {}), esito: r.esito, effettivo: parseJSON(r.effettivo_json), voto: r.voto })), ca = cardio.map(r => ({ data: r.data, origine: 'cardio', esercizio: parseJSON(r.esercizio, {}), effettivo: parseJSON(r.esito, {}), esito: parseJSON(r.esito, {})?.esito || 'non_fatto' }));
  return json({ ultime: [...pesi, ...ca].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5) });
}
