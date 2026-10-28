// GymTime · mobilità e stretching: libreria, impostazioni e sessioni.
import { json, corpo, fallisci, testo, intero, parseJSON, richiedi, leggibile, gestibile, oggi } from './util.js';
import { ZONE, TIPI, ATTREZZI, AREE, DURATE_PREDEFINITE, DURATA_MIN, DURATA_MAX, pulisciDurate, secondiEsercizio, durataPiano, maxSerie, faseDi } from '../public/js/mobilita.js';
import { POSE } from '../public/js/omino.js';
const CAMPI = ['nome', 'zona', 'tipo', 'riscaldamento', 'misura', 'valore', 'serie', 'per_lato', 'livello', 'attrezzo', 'animazione', 'muscolo', 'accorgimenti'];
const proprietario = io => io.ruolo === 'atleta' ? io.coach_id : io.id;
async function impostazioniDi(env, id) {
  const r = id ? await env.DB.prepare('SELECT attiva,durate FROM impostazioni_mobilita WHERE coach_id=?').bind(id).first() : null;
  const durate = r ? pulisciDurate(parseJSON(r.durate, [])) : [];
  return { attiva: r ? !!r.attiva : true, durate: durate.length ? durate : [...DURATE_PREDEFINITE] };
}
async function sezioneAttiva(env, io) {
  const imp = await impostazioniDi(env, proprietario(io));
  if (!imp.attiva) fallisci(403, 'La sezione mobilità è spenta: parla con il tuo coach');
  return imp;
}
export async function elencoLibreria(env, io) {
  if (io.ruolo === 'atleta') await sezioneAttiva(env, io);
  const { results } = await env.DB.prepare(`SELECT id,${CAMPI.join(',')},creato_da FROM libreria_mobilita WHERE creato_da IS NULL OR creato_da=?1 OR ?2='admin' ORDER BY nome COLLATE NOCASE`).bind(proprietario(io) ?? -1, io.ruolo).all();
  return json({ esercizi: results });
}
function valori(d) {
  const tipo = TIPI[d.tipo] ? d.tipo : null, misura = d.misura === 'ripetizioni' ? 'ripetizioni' : 'secondi';
  const v = { nome: testo(d.nome, 80), zona: ZONE[d.zona] ? d.zona : null, tipo, riscaldamento: d.riscaldamento && ['mobilita', 'dinamico'].includes(tipo) ? 1 : 0, misura, valore: intero(d.valore), serie: Math.max(1, Math.min(10, intero(d.serie) || 1)), per_lato: d.per_lato ? 1 : 0, livello: [1, 2, 3].includes(intero(d.livello)) ? intero(d.livello) : 1, attrezzo: ATTREZZI[d.attrezzo] ? d.attrezzo : 'corpo_libero', animazione: POSE[d.animazione] ? d.animazione : 'free', muscolo: testo(d.muscolo, 160) || null, accorgimenti: testo(d.accorgimenti, 2000) || null };
  if (!v.nome) fallisci(400, 'Scrivi il nome dell’esercizio');
  if (!v.zona) fallisci(400, 'Scegli la zona del corpo');
  if (!v.tipo) fallisci(400, 'Scegli il tipo di esercizio');
  if (!v.valore || v.valore < 1 || v.valore > 600) fallisci(400, misura === 'ripetizioni' ? 'Ripetizioni tra 1 e 600' : 'Secondi tra 1 e 600');
  return v;
}
export async function creaEsercizio(request, env, io) {
  richiedi(io, 'admin');
  const v = valori(await corpo(request));
  try {
    const r = await env.DB.prepare(`INSERT INTO libreria_mobilita(${CAMPI.join(',')},creato_da) VALUES(${CAMPI.map(() => '?').join(',')},?)`).bind(...CAMPI.map(c => v[c]), null).run();
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  } catch (e) {
    if (/UNIQUE/i.test(String(e.message))) fallisci(409, 'Esiste già un esercizio con questo nome');
    throw e;
  }
}
async function modificabile(env, io, id) {
  const e = await env.DB.prepare('SELECT id,creato_da FROM libreria_mobilita WHERE id=?').bind(id).first();
  if (!e) fallisci(404, 'Esercizio non trovato');
  richiedi(io, 'admin');
  return e;
}
export async function modificaEsercizio(request, env, io, id) {
  await modificabile(env, io, id);
  const v = valori(await corpo(request));
  try {
    await env.DB.prepare(`UPDATE libreria_mobilita SET ${CAMPI.map(c => c + '=?').join(',')} WHERE id=?`).bind(...CAMPI.map(c => v[c]), id).run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e.message))) fallisci(409, 'Esiste già un esercizio con questo nome');
    throw e;
  }
  return json({ ok: true });
}
export async function eliminaEsercizio(env, io, id) {
  await modificabile(env, io, id);
  await env.DB.prepare('DELETE FROM libreria_mobilita WHERE id=?').bind(id).run();
  return json({ ok: true });
}
export async function leggiImpostazioni(env, io) {
  return json({ ...await impostazioniDi(env, proprietario(io)), modificabili: io.ruolo !== 'atleta' });
}
export async function salvaImpostazioni(request, env, io) {
  richiedi(io, 'admin', 'coach');
  const d = await corpo(request), durate = pulisciDurate(d.durate);
  if (!durate.length) fallisci(400, `Scegli almeno una durata tra ${DURATA_MIN} e ${DURATA_MAX} minuti`);
  await env.DB.prepare(`INSERT INTO impostazioni_mobilita(coach_id,attiva,durate,aggiornata_il) VALUES(?,?,?,datetime('now')) ON CONFLICT(coach_id) DO UPDATE SET attiva=excluded.attiva,durate=excluded.durate,aggiornata_il=excluded.aggiornata_il`).bind(io.id, d.attiva === false ? 0 : 1, JSON.stringify(durate)).run();
  return json({ ok: true, attiva: d.attiva !== false, durate });
}
export function sessioneJSON(s) {
  return { id: s.id, utente_id: s.utente_id, data: s.data, durata_scelta: s.durata_scelta, zona: s.zona, durata_stimata: s.durata_stimata, stato: s.stato, passo: s.passo_corrente, avviata_il: s.avviata_il, completata_il: s.completata_il, piano: parseJSON(s.piano_json, { esercizi: [] }), esiti: parseJSON(s.esiti_json, {}), tipo_sessione: s.tipo_sessione || 'mista' };
}
export async function statoMobilita(env, io, tipo = null) {
  if (tipo && !['mobilita', 'stretching'].includes(tipo)) fallisci(400, 'Tipo non valido');
  const imp = await impostazioniDi(env, proprietario(io)), data = oggi();
  const [aperta, ultime, fatte, ultima] = await env.DB.batch([env.DB.prepare(`SELECT * FROM sessioni_mobilita WHERE utente_id=? AND data=? AND stato='in_corso' ORDER BY id DESC LIMIT 1`).bind(io.id, data), env.DB.prepare(`SELECT id,data,durata_scelta,durata_stimata,zona,tipo_sessione FROM sessioni_mobilita WHERE utente_id=? AND stato='completata' AND (? IS NULL OR tipo_sessione=?) ORDER BY data DESC,id DESC LIMIT 5`).bind(io.id, tipo, tipo), env.DB.prepare('SELECT count(*) AS n FROM sessioni_mobilita WHERE utente_id=? AND data=?').bind(io.id, data), env.DB.prepare(`SELECT piano_json FROM sessioni_mobilita WHERE utente_id=? AND stato='completata' AND (? IS NULL OR tipo_sessione=?) ORDER BY id DESC LIMIT 1`).bind(io.id, tipo, tipo)]);
  const a = aperta.results[0];
  return json({ oggi: data, ...imp, aperta: a ? { id: a.id, durata_scelta: a.durata_scelta, durata_stimata: a.durata_stimata, passo: a.passo_corrente, esercizi: (parseJSON(a.piano_json, { esercizi: [] }).esercizi || []).length, tipo_sessione: a.tipo_sessione } : null, ultime: ultime.results, recenti: (parseJSON(ultima.results[0]?.piano_json, { esercizi: [] }).esercizi || []).map(e => e.id).filter(Boolean), rimaste_oggi: Math.max(0, 5 - (fatte.results[0]?.n || 0)) });
}
export async function avviaSessione(request, env, io) {
  const imp = await sezioneAttiva(env, io), d = await corpo(request), durata = intero(d.durata_scelta), tipo = d.tipo_sessione || 'mista';
  if (!['mista', 'mobilita', 'stretching'].includes(tipo)) fallisci(400, 'Tipo sessione non valido');
  if (!imp.durate.includes(durata)) fallisci(400, 'Durata non disponibile');
  const scelta = d.area ?? d.zona ?? null;
  if (scelta && !AREE[scelta]) fallisci(400, 'Area non valida');
  if (tipo !== 'mista' && scelta) fallisci(400, 'Le nuove sessioni sono full body');
  const voci = (Array.isArray(d.esercizi) ? d.esercizi : []).map(x => x && typeof x === 'object' ? x : { id: x }), ids = voci.map(x => intero(x.id)).filter(n => n > 0);
  if (ids.length !== voci.length || !ids.length || ids.length > 40 || new Set(ids).size !== ids.length) fallisci(400, 'Elenco esercizi non valido');
  const data = oggi();
  const [aperta, fatte, lib] = await env.DB.batch([env.DB.prepare(`SELECT id FROM sessioni_mobilita WHERE utente_id=? AND data=? AND stato='in_corso' LIMIT 1`).bind(io.id, data), env.DB.prepare('SELECT count(*) AS n FROM sessioni_mobilita WHERE utente_id=? AND data=?').bind(io.id, data), env.DB.prepare(`SELECT id,${CAMPI.join(',')} FROM libreria_mobilita WHERE id IN(SELECT value FROM json_each(?)) AND (creato_da IS NULL OR creato_da=?)`).bind(JSON.stringify(ids), proprietario(io) ?? -1)]);
  if (aperta.results.length) return json({ errore: 'Hai una sessione in corso: riprendila o chiudila', id: aperta.results[0].id }, 409);
  if ((fatte.results[0]?.n || 0) >= 5) fallisci(409, 'Oggi hai già fatto 5 sessioni');
  const perId = new Map(lib.results.map(e => [e.id, e]));
  const esercizi = ids.map((id, rif) => {
    const e = perId.get(id);
    if (!e) fallisci(400, 'Esercizio non disponibile');
    if (tipo === 'mobilita' && !['mobilita', 'respirazione'].includes(e.tipo) || tipo === 'stretching' && !['dinamico', 'statico', 'respirazione'].includes(e.tipo)) fallisci(400, 'Esercizio non valido per questa sessione');
    const serie = voci[rif].serie === undefined ? e.serie : intero(voci[rif].serie);
    if (!serie || serie < 1 || serie > (tipo === 'mista' ? Math.max(maxSerie(e), e.serie) : maxSerie(e))) fallisci(400, 'Numero di serie non valido');
    const x = { rif, id, nome: e.nome, zona: e.zona, tipo: e.tipo, fase: faseDi(e.tipo, voci[rif].fase), misura: e.misura, valore: e.valore, serie, per_lato: !!e.per_lato, attrezzo: e.attrezzo, animazione: e.animazione, muscolo: e.muscolo || '', accorgimenti: e.accorgimenti || '' };
    return { ...x, secondi: secondiEsercizio(x) };
  });
  if (tipo !== 'mista' && Object.values(AREE).some(a => !esercizi.some(e => a.zone.includes(e.zona)))) fallisci(400, 'La sessione non copre tutto il corpo');
  const r = await env.DB.prepare(`INSERT INTO sessioni_mobilita(utente_id,data,durata_scelta,zona,durata_stimata,piano_json,tipo_sessione) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM sessioni_mobilita WHERE utente_id=? AND data=? AND stato='in_corso') AND (SELECT count(*) FROM sessioni_mobilita WHERE utente_id=? AND data=?)<5`).bind(io.id, data, durata, scelta || null, durataPiano(esercizi), JSON.stringify({ esercizi }), tipo, io.id, data, io.id, data).run();
  if (!r.meta.changes) fallisci(409, 'Sessione già aperta o limite raggiunto: ricarica');
  return json({ id: r.meta.last_row_id }, 201);
}
async function caricaSessione(env, id) {
  const s = await env.DB.prepare('SELECT * FROM sessioni_mobilita WHERE id=?').bind(id).first();
  if (!s) fallisci(404, 'Sessione non trovata');
  return s;
}
async function miaInCorso(env, io, id) {
  const s = await caricaSessione(env, id);
  if (s.utente_id !== io.id) fallisci(403, 'Questa sessione non è tua');
  if (s.stato === 'completata') fallisci(409, 'Sessione già salvata');
  return s;
}
const numeroEsercizi = s => (parseJSON(s.piano_json, { esercizi: [] }).esercizi || []).length;
export async function leggiSessione(env, io, id) {
  const s = await caricaSessione(env, id);
  await leggibile(env, io, s.utente_id);
  return json({ sessione: sessioneJSON(s) });
}
export async function salvaEsito(request, env, io, id, rif) {
  const s = await miaInCorso(env, io, id), n = numeroEsercizi(s);
  if (!Number.isInteger(rif) || rif < 0 || rif >= n) fallisci(400, 'Esercizio non trovato');
  const d = await corpo(request), esito = d.esito === 'non_fatto' ? 'non_fatto' : 'fatto', passo = Math.max(0, Math.min(n, intero(d.passo) ?? rif + 1));
  await env.DB.prepare('UPDATE sessioni_mobilita SET esiti_json=json_set(esiti_json,?,?),passo_corrente=? WHERE id=?').bind(`$."${rif}"`, esito, passo, s.id).run();
  return json({ ok: true, fine: passo >= n });
}
export async function cambiaPasso(request, env, io, id) {
  const s = await miaInCorso(env, io, id), d = await corpo(request), passo = Math.max(0, Math.min(numeroEsercizi(s) - 1, intero(d.passo) ?? 0));
  await env.DB.prepare('UPDATE sessioni_mobilita SET passo_corrente=? WHERE id=?').bind(passo, s.id).run();
  return json({ ok: true });
}
export async function completaSessione(env, io, id) {
  const s = await miaInCorso(env, io, id);
  await env.DB.prepare(`UPDATE sessioni_mobilita SET stato='completata',completata_il=datetime('now'),passo_corrente=? WHERE id=?`).bind(numeroEsercizi(s), s.id).run();
  return json({ ok: true });
}
export async function eliminaSessione(env, io, id) {
  const s = await caricaSessione(env, id);
  if (s.utente_id === io.id) {
    if (s.stato === 'completata' && io.ruolo === 'atleta') fallisci(403, 'Una sessione salvata la può eliminare solo il coach');
  } else {
    richiedi(io, 'admin', 'coach');
    await gestibile(env, io, s.utente_id);
  }
  await env.DB.prepare('DELETE FROM sessioni_mobilita WHERE id=?').bind(s.id).run();
  return json({ ok: true });
}
export const querySessioniStorico = (env, id) => env.DB.prepare('SELECT * FROM sessioni_mobilita WHERE utente_id=? ORDER BY data DESC,id DESC LIMIT 400').bind(id);
