// GymTime · giornate singole: una giornata di allenamento fuori dalla scheda, creata da coach o admin
// per sé o per un proprio atleta. Chi la riceve la avvia da Allena; il coach può aggiungerla alla scheda attiva.
// Rifai: una giornata già salvata si ripete oggi con lo stesso piano.
import { json, corpo, fallisci, testo, intero, parseJSON, oggi, richiedi, gestibile, leggibile } from './util.js';
import { MODALITA, pulisciParametri, pulisciVariante } from '../public/js/regole.js';

const MAX_ESERCIZI = 40;
const MAX_SINGOLE = 60;     // per atleta
const MAX_GIORNI = 14;      // come in schede.js
const FUORI_SCHEDA = -1;    // giornate.giorno_posizione delle giornate avviate fuori dalla scheda

const SELECT_SINGOLA = `SELECT gs.*, u.nome AS atleta_nome FROM giornate_singole gs JOIN utenti u ON u.id = gs.atleta_id`;

// Stesse regole degli esercizi delle schede (valida in schede.js), senza progressione e superserie
function pulisciEsercizi(lista) {
  if (!Array.isArray(lista) || !lista.length) fallisci(400, 'Aggiungi almeno un esercizio');
  return lista.slice(0, MAX_ESERCIZI).map(e => {
    e = e && typeof e === 'object' ? e : {};
    const modalita = MODALITA[e.modalita] ? e.modalita : 'setrep';
    const tempo = e.tecnica && typeof e.tecnica.tempo === 'string' ? testo(e.tecnica.tempo, 12) : '';
    return {
      esercizio_id: intero(e.esercizio_id) || null,
      nome: testo(e.nome, 80) || 'Esercizio',
      modalita,
      parametri: pulisciParametri(modalita, e.parametri || {}),
      tecnica: tempo ? { tempo } : null,
      nota: testo(e.nota, 600) || null,
      variante: pulisciVariante(e.variante)
    };
  });
}

function valori(d) {
  const nome = testo(d.nome, 60);
  if (!nome) fallisci(400, 'Scrivi il nome della giornata');
  return { nome, esercizi: pulisciEsercizi(d.esercizi) };
}

// Omino, accorgimenti e muscoli dalla libreria, per gli esercizi collegati
async function datiLibreria(env, esercizi) {
  const ids = [...new Set(esercizi.map(e => intero(e.esercizio_id)).filter(Boolean))];
  if (!ids.length) return new Map();
  const { results } = await env.DB.prepare(
    'SELECT id, animazione, inizia_con, accorgimenti, muscolo FROM libreria_esercizi WHERE id IN (SELECT value FROM json_each(?))'
  ).bind(JSON.stringify(ids)).all();
  return new Map(results.map(r => [r.id, r]));
}
// Un esercizio tolto dalla libreria nel frattempo resta con il suo nome, senza collegamento
async function verificaLibreria(env, esercizi) {
  const lib = await datiLibreria(env, esercizi);
  for (const e of esercizi) if (e.esercizio_id && !lib.has(e.esercizio_id)) e.esercizio_id = null;
}

function singolaJSON(s, lib) {
  const esercizi = parseJSON(s.esercizi_json, []).map(e => {
    const l = lib.get(e.esercizio_id) || {};
    return { ...e, animazione: l.animazione || 'free', muscolo: l.muscolo || '' };
  });
  return { id: s.id, atleta_id: s.atleta_id, atleta_nome: s.atleta_nome, creata_da: s.creata_da, nome: s.nome, esercizi, creata_il: s.creata_il, aggiornata_il: s.aggiornata_il };
}
async function conLibreria(env, righe) {
  const lib = await datiLibreria(env, righe.flatMap(s => parseJSON(s.esercizi_json, [])));
  return righe.map(s => singolaJSON(s, lib));
}

async function carica(env, id) {
  const s = await env.DB.prepare(`${SELECT_SINGOLA} WHERE gs.id = ?`).bind(id).first();
  if (!s) fallisci(404, 'Giornata non trovata');
  return s;
}
async function puoGestire(env, io, atletaId) {
  if (io.ruolo === 'atleta') return false;
  try { await gestibile(env, io, atletaId); return true; } catch { return false; }
}
async function controllaLimite(env, atleta) {
  const r = await env.DB.prepare('SELECT count(*) AS n FROM giornate_singole WHERE atleta_id = ?').bind(atleta.id).first();
  if (r.n >= MAX_SINGOLE) fallisci(400, `${atleta.nome} ha già ${MAX_SINGOLE} giornate singole: eliminane qualcuna`);
}

/* ---------- Lettura ---------- */

// Allena: le giornate singole di chi è collegato e le ultime giornate salvate, da rifare
export async function elenco(env, io) {
  const [singole, recenti] = await env.DB.batch([
    env.DB.prepare(`${SELECT_SINGOLA} WHERE gs.atleta_id = ? ORDER BY gs.aggiornata_il DESC LIMIT ?`).bind(io.id, MAX_SINGOLE),
    env.DB.prepare(`SELECT id, data, nome_giorno, piano_json FROM giornate WHERE atleta_id = ? AND stato = 'completata' ORDER BY data DESC LIMIT 5`).bind(io.id),
  ]);
  return json({
    singole: await conLibreria(env, singole.results),
    recenti: recenti.results.map(g => ({
      id: g.id, data: g.data, nome: g.nome_giorno || 'Allenamento',
      esercizi: (parseJSON(g.piano_json, { esercizi: [] }).esercizi || []).map(e => ({ nome: e.nome, animazione: e.animazione, variante: e.variante || null }))
    }))
  });
}

// Coach e admin: le giornate create per sé e per i propri atleti (l'admin le vede tutte)
export async function gestione(env, io) {
  richiedi(io, 'admin', 'coach');
  const { results } = await env.DB.prepare(
    `${SELECT_SINGOLA}
      WHERE ?2 = 'admin' OR gs.atleta_id = ?1 OR (u.ruolo = 'atleta' AND u.coach_id = ?1)
      ORDER BY u.nome COLLATE NOCASE, gs.aggiornata_il DESC LIMIT 300`
  ).bind(io.id, io.ruolo).all();
  return json({ singole: await conLibreria(env, results) });
}

export async function leggi(env, io, id) {
  const s = await carica(env, id);
  await leggibile(env, io, s.atleta_id);
  const [singola] = await conLibreria(env, [s]);
  return json({ singola, puo_gestire: await puoGestire(env, io, s.atleta_id) });
}

/* ---------- Coach e admin ---------- */

export async function crea(request, env, io) {
  richiedi(io, 'admin', 'coach');
  const d = await corpo(request);
  const atleta = await gestibile(env, io, intero(d.atleta_id) ?? io.id);
  const v = valori(d);
  await verificaLibreria(env, v.esercizi);
  await controllaLimite(env, atleta);
  const r = await env.DB.prepare('INSERT INTO giornate_singole (atleta_id, creata_da, nome, esercizi_json) VALUES (?, ?, ?, ?)')
    .bind(atleta.id, io.id, v.nome, JSON.stringify(v.esercizi)).run();
  return json({ id: r.meta.last_row_id }, 201);
}

export async function modifica(request, env, io, id) {
  richiedi(io, 'admin', 'coach');
  const s = await carica(env, id);
  await gestibile(env, io, s.atleta_id);
  const d = await corpo(request);
  const atleta = await gestibile(env, io, intero(d.atleta_id) ?? s.atleta_id);
  const v = valori(d);
  await verificaLibreria(env, v.esercizi);
  if (atleta.id !== s.atleta_id) await controllaLimite(env, atleta);
  await env.DB.prepare(`UPDATE giornate_singole SET atleta_id = ?, nome = ?, esercizi_json = ?, aggiornata_il = datetime('now') WHERE id = ?`)
    .bind(atleta.id, v.nome, JSON.stringify(v.esercizi), s.id).run();
  return json({ ok: true });
}

export async function elimina(env, io, id) {
  richiedi(io, 'admin', 'coach');
  const s = await carica(env, id);
  await gestibile(env, io, s.atleta_id);
  await env.DB.prepare('DELETE FROM giornate_singole WHERE id = ?').bind(s.id).run();
  return json({ ok: true });
}

// Diventa l'ultimo giorno della scheda attiva dell'atleta e sparisce dalle giornate singole
export async function inScheda(env, io, id) {
  richiedi(io, 'admin', 'coach');
  const s = await carica(env, id);
  const atleta = await gestibile(env, io, s.atleta_id);
  const sc = await env.DB.prepare(
    `SELECT s.id, s.nome, COALESCE((SELECT max(posizione) FROM giorni_scheda WHERE scheda_id = s.id), -1) + 1 AS posizione
       FROM schede s WHERE s.atleta_id = ? AND s.archiviata = 0`
  ).bind(atleta.id).first();
  if (!sc) fallisci(404, `${atleta.nome} non ha una scheda attiva: creala prima dal Profilo`);
  if (sc.posizione >= MAX_GIORNI) fallisci(400, `La scheda ha già ${MAX_GIORNI} giorni, il massimo`);
  const esercizi = parseJSON(s.esercizi_json, []);
  await verificaLibreria(env, esercizi);
  const GIORNO = '(SELECT id FROM giorni_scheda WHERE scheda_id = ? AND posizione = ?)';
  await env.DB.batch([
    env.DB.prepare('INSERT INTO giorni_scheda (scheda_id, posizione, nome) VALUES (?, ?, ?)').bind(sc.id, sc.posizione, s.nome),
    ...esercizi.map((e, j) => env.DB.prepare(
      `INSERT INTO esercizi_scheda (giorno_id, posizione, gruppo, esercizio_id, nome, modalita, parametri, tecnica, nota, progressione, variante)
       VALUES (${GIORNO}, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, ?)`
    ).bind(sc.id, sc.posizione, j, e.esercizio_id || null, e.nome, e.modalita, JSON.stringify(e.parametri || {}),
      e.tecnica ? JSON.stringify(e.tecnica) : null, e.nota || null, e.variante ? JSON.stringify(e.variante) : null)),
    env.DB.prepare(`UPDATE schede SET aggiornata_il = datetime('now') WHERE id = ?`).bind(sc.id),
    env.DB.prepare('DELETE FROM giornate_singole WHERE id = ?').bind(s.id),
  ]);
  return json({ ok: true, scheda: sc.nome, giorno: sc.posizione + 1 });
}

/* ---------- Avvio: giornata singola o rifai ---------- */

// Piano come lo vede chi si allena: stesso formato delle giornate avviate dalla scheda (pianoGiorno)
function piano(esercizi, lib) {
  return esercizi.map((e, i) => {
    const l = lib.get(intero(e.esercizio_id)) || {};
    return {
      rif: i, nome: e.nome, esercizio_id: intero(e.esercizio_id) || null, modalita: e.modalita, gruppo: e.gruppo || null,
      parametri: e.parametri || {}, tecnica: e.tecnica || null, nota: e.nota || '',
      animazione: l.animazione || e.animazione || 'free', variante: e.variante || null, inizia_con: l.inizia_con || e.inizia_con || 'conc',
      accorgimenti: l.accorgimenti || e.accorgimenti || '', muscolo: l.muscolo || e.muscolo || '', variazione: ''
    };
  });
}

// Una giornata per atleta per data, come avviaGiornata in allenamento.js
async function avviaOggi(env, io, nome, esercizi) {
  const data = oggi();
  const esiste = await env.DB.prepare('SELECT id, stato FROM giornate WHERE atleta_id = ? AND data = ?').bind(io.id, data).first();
  if (esiste) {
    if (esiste.stato === 'completata') fallisci(409, 'Hai già salvato l’allenamento di oggi');
    return json({ id: esiste.id });
  }
  if (!esercizi.length) fallisci(400, 'Questa giornata non ha esercizi');
  const p = { scheda: null, singola: true, settimane: 1, scarico: false, esercizi };
  await env.DB.prepare(
    `INSERT INTO giornate (atleta_id, data, scheda_id, giorno_posizione, nome_giorno, piano_json, stato, settimana)
     VALUES (?, ?, NULL, ?, ?, ?, 'pre', 1) ON CONFLICT (atleta_id, data) DO NOTHING`
  ).bind(io.id, data, FUORI_SCHEDA, nome, JSON.stringify(p)).run();
  const g = await env.DB.prepare('SELECT id FROM giornate WHERE atleta_id = ? AND data = ?').bind(io.id, data).first();
  return json({ id: g.id }, 201);
}

export async function avvia(env, io, id) {
  const s = await carica(env, id);
  if (s.atleta_id !== io.id) fallisci(403, 'Questa giornata è di un altro atleta');
  const esercizi = parseJSON(s.esercizi_json, []);
  return avviaOggi(env, io, s.nome, piano(esercizi, await datiLibreria(env, esercizi)));
}

// Le variazioni della settimana si tolgono: oggi è una giornata a sé
export async function rifai(env, io, giornataId) {
  const g = await env.DB.prepare('SELECT atleta_id, nome_giorno, piano_json, stato FROM giornate WHERE id = ?').bind(giornataId).first();
  if (!g) fallisci(404, 'Allenamento non trovato');
  if (g.atleta_id !== io.id) fallisci(403, 'Questo allenamento non è tuo');
  if (g.stato !== 'completata') fallisci(400, 'Si rifanno solo gli allenamenti già salvati');
  const esercizi = parseJSON(g.piano_json, { esercizi: [] }).esercizi || [];
  return avviaOggi(env, io, g.nome_giorno || 'Allenamento', piano(esercizi, await datiLibreria(env, esercizi)));
}
