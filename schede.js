// GymTime · schede per atleta, con giorni, esercizi, progressione settimanale e archivio
// Storico: alle schede archiviate dall'app si aggiungono quelle fatte prima di GymTime (origine 'importata'),
// che restano sempre archiviate. Il materiale usato per importarle non si salva.
import { json, corpo, fallisci, testo, intero, parseJSON, richiedi, gestibile, leggibile, oggi } from './util.js';
import { MODALITA, pulisciParametri, pulisciVariante, lunedi, settimanaDi } from '../public/js/regole.js';

// Periodo da mostrare. Per le schede dell'app create prima della migrazione 0004, o con il periodo
// mancante, si ricava da inizio, creazione e archiviazione. Le importate mostrano solo quello scritto dal coach.
const PERIODO_SQL = `
  CASE WHEN origine = 'app' THEN COALESCE(periodo_dal, inizio, date(creata_il)) ELSE periodo_dal END AS periodo_dal,
  CASE WHEN origine = 'app' AND archiviata = 1 THEN COALESCE(periodo_al, date(aggiornata_il)) ELSE periodo_al END AS periodo_al`;

export async function caricaScheda(env, filtro, valore) {
  const s = await env.DB.prepare(`SELECT * FROM schede WHERE ${filtro} LIMIT 1`).bind(valore).first();
  if (!s) return null;
  const [giorni, esercizi] = await env.DB.batch([
    env.DB.prepare('SELECT id, posizione, nome FROM giorni_scheda WHERE scheda_id = ? ORDER BY posizione').bind(s.id),
    env.DB.prepare(
      `SELECT es.*, l.animazione, l.inizia_con, l.accorgimenti AS acc_libreria, l.muscolo, l.attrezzo
         FROM esercizi_scheda es
         JOIN giorni_scheda g ON g.id = es.giorno_id
         LEFT JOIN libreria_esercizi l ON l.id = es.esercizio_id
        WHERE g.scheda_id = ? ORDER BY g.posizione, es.posizione`).bind(s.id),
  ]);
  const perGiorno = new Map(giorni.results.map(g => [g.id, { ...g, esercizi: [] }]));
  for (const e of esercizi.results) {
    perGiorno.get(e.giorno_id)?.esercizi.push({
      id: e.id, esercizio_id: e.esercizio_id, nome: e.nome, modalita: e.modalita, gruppo: e.gruppo,
      parametri: parseJSON(e.parametri, {}), tecnica: parseJSON(e.tecnica), nota: e.nota, variante: parseJSON(e.variante),
      progressione: parseJSON(e.progressione), animazione: e.animazione || 'free', inizia_con: e.inizia_con || 'conc',
      acc_libreria: e.acc_libreria || '', muscolo: e.muscolo || '', attrezzo: e.attrezzo || ''
    });
  }
  return {
    id: s.id, nome: s.nome, atleta_id: s.atleta_id, coach_id: s.coach_id, archiviata: s.archiviata,
    settimane: s.settimane || 1, inizio: s.inizio, scarico: parseJSON(s.scarico, []),
    origine: s.origine || 'app', periodo_dal: s.periodo_dal ?? null, periodo_al: s.periodo_al ?? null, nota: s.nota ?? null,
    creata_il: s.creata_il, aggiornata_il: s.aggiornata_il,
    giorni: [...perGiorno.values()]
  };
}

export async function leggiScheda(env, io, atletaId) {
  const atleta = await leggibile(env, io, atletaId);
  const scheda = await caricaScheda(env, 'atleta_id = ? AND archiviata = 0', atleta.id);
  const { results: archivio } = await env.DB.prepare(
    `SELECT id, nome, settimane, creata_il, aggiornata_il, ${PERIODO_SQL}
       FROM schede WHERE atleta_id = ? AND archiviata = 1 AND origine = 'app' ORDER BY aggiornata_il DESC LIMIT 50`
  ).bind(atleta.id).all();
  const sett = scheda ? settimanaDi(scheda, oggi()) : null;
  return json({ atleta: { id: atleta.id, nome: atleta.nome, ruolo: atleta.ruolo }, scheda, settimana: sett, archivio, oggi: oggi() });
}

export async function leggiArchiviata(env, io, schedaId) {
  const s = await env.DB.prepare('SELECT atleta_id FROM schede WHERE id = ?').bind(schedaId).first();
  if (!s) fallisci(404, 'Scheda non trovata');
  await leggibile(env, io, s.atleta_id);
  return json({ scheda: await caricaScheda(env, 'id = ?', schedaId) });
}

// Controlla e normalizza la scheda inviata dall'editor
function valida(d) {
  const nome = testo(d.nome, 80) || 'Scheda';
  const settimane = Math.max(1, Math.min(12, intero(d.settimane) || 1));
  const inizio = /^\d{4}-\d{2}-\d{2}$/.test(d.inizio || '') ? lunedi(d.inizio) : lunedi(oggi());
  const scarico = Array.isArray(d.scarico) ? [...new Set(d.scarico.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= settimane))].sort((a, b) => a - b) : [];
  if (!Array.isArray(d.giorni) || !d.giorni.length) fallisci(400, 'Aggiungi almeno un giorno');
  if (d.giorni.length > 14) fallisci(400, 'Massimo 14 giorni per scheda');
  const giorni = d.giorni.map((g, i) => {
    const esercizi = (Array.isArray(g.esercizi) ? g.esercizi : []).slice(0, 40).map(e => {
      const modalita = MODALITA[e.modalita] ? e.modalita : 'setrep';
      let progressione = null;
      if (settimane > 1 && e.progressione && typeof e.progressione === 'object') {
        progressione = {};
        for (const [w, v] of Object.entries(e.progressione)) {
          const n = Number(w);
          if (!Number.isInteger(n) || n < 2 || n > settimane || !v || typeof v !== 'object') continue;
          const p = pulisciParametri(modalita, v);
          if (typeof v.tempo === 'string' && v.tempo.trim()) p.tempo = testo(v.tempo, 12);
          if (Object.keys(p).length) progressione[n] = p;
        }
        if (!Object.keys(progressione).length) progressione = null;
      }
      const tempo = e.tecnica && typeof e.tecnica.tempo === 'string' ? testo(e.tecnica.tempo, 12) : '';
      return {
        esercizio_id: intero(e.esercizio_id) || null,
        nome: testo(e.nome, 80) || 'Esercizio',
        modalita,
        parametri: pulisciParametri(modalita, e.parametri || {}),
        tecnica: tempo ? { tempo } : null,
        nota: testo(e.nota, 600) || null,
        gruppo: testo(e.gruppo, 4).toUpperCase() || null,
        variante: pulisciVariante(e.variante),
        progressione
      };
    });
    return { nome: testo(g.nome, 60) || `Giorno ${i + 1}`, esercizi };
  });
  return { nome, settimane, inizio, scarico, giorni };
}

// Un esercizio della libreria eliminato nel frattempo non blocca il salvataggio
async function verificaLibreria(env, s) {
  const ids = [...new Set(s.giorni.flatMap(g => g.esercizi.map(e => e.esercizio_id)).filter(Boolean))];
  if (!ids.length) return;
  const { results } = await env.DB.prepare(`SELECT id FROM libreria_esercizi WHERE id IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(ids)).all();
  const ok = new Set(results.map(r => r.id));
  for (const g of s.giorni) for (const e of g.esercizi) if (e.esercizio_id && !ok.has(e.esercizio_id)) e.esercizio_id = null;
}

// Giorni ed esercizi di una scheda. SCHEDA è l'espressione SQL che trova la scheda dentro la stessa transazione.
function righeGiorni(env, s, SCHEDA, arg) {
  const st = [];
  s.giorni.forEach((g, i) => {
    st.push(env.DB.prepare(`INSERT INTO giorni_scheda (scheda_id, posizione, nome) VALUES (${SCHEDA}, ?, ?)`).bind(arg, i, g.nome));
    g.esercizi.forEach((e, j) => {
      st.push(env.DB.prepare(
        `INSERT INTO esercizi_scheda (giorno_id, posizione, gruppo, esercizio_id, nome, modalita, parametri, tecnica, nota, progressione, variante)
         VALUES ((SELECT id FROM giorni_scheda WHERE scheda_id = ${SCHEDA} AND posizione = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(arg, i, j, e.gruppo, e.esercizio_id, e.nome, e.modalita, JSON.stringify(e.parametri),
        e.tecnica ? JSON.stringify(e.tecnica) : null, e.nota, e.progressione ? JSON.stringify(e.progressione) : null,
        e.variante ? JSON.stringify(e.variante) : null));
    });
  });
  return st;
}

// Fine del periodo quando una scheda va in archivio: oggi, ma mai prima del suo inizio
const CHIUDI_PERIODO = `periodo_al = max(?1, COALESCE(periodo_dal, ?1))`;

// Scrive la scheda attiva dell'atleta in un'unica transazione
async function scrivi(env, io, atletaId, s, nuova) {
  await verificaLibreria(env, s);
  const attiva = await env.DB.prepare('SELECT id FROM schede WHERE atleta_id = ? AND archiviata = 0').bind(atletaId).first();
  const st = [];
  const SCHEDA = '(SELECT id FROM schede WHERE atleta_id = ? AND archiviata = 0)';
  if (attiva && nuova) st.push(env.DB.prepare(`UPDATE schede SET archiviata = 1, ${CHIUDI_PERIODO}, aggiornata_il = datetime('now') WHERE id = ?2`).bind(oggi(), attiva.id));
  if (attiva && !nuova) {
    st.push(env.DB.prepare(`UPDATE schede SET nome = ?, settimane = ?, inizio = ?, periodo_dal = ?, scarico = ?, coach_id = ?, aggiornata_il = datetime('now') WHERE id = ?`)
      .bind(s.nome, s.settimane, s.inizio, s.inizio, JSON.stringify(s.scarico), io.id, attiva.id));
    st.push(env.DB.prepare('DELETE FROM giorni_scheda WHERE scheda_id = ?').bind(attiva.id));
  } else {
    st.push(env.DB.prepare('INSERT INTO schede (nome, atleta_id, coach_id, settimane, inizio, periodo_dal, scarico) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(s.nome, atletaId, io.id, s.settimane, s.inizio, s.inizio, JSON.stringify(s.scarico)));
  }
  st.push(...righeGiorni(env, s, SCHEDA, atletaId));
  await env.DB.batch(st);
}

export async function salvaScheda(request, env, io, atletaId) {
  richiedi(io, 'admin', 'coach');
  const atleta = await gestibile(env, io, atletaId);
  const d = await corpo(request);
  const s = valida(d);
  await scrivi(env, io, atleta.id, s, !!d.nuova);
  return json({ ok: true });
}

export async function duplicaScheda(request, env, io, daAtletaId) {
  richiedi(io, 'admin', 'coach');
  const da = await gestibile(env, io, daAtletaId);
  const d = await corpo(request);
  const verso = await gestibile(env, io, intero(d.verso));
  if (verso.id === da.id) fallisci(400, 'Scegli un atleta diverso');
  const scheda = await caricaScheda(env, 'atleta_id = ? AND archiviata = 0', da.id);
  if (!scheda) fallisci(404, 'Questo atleta non ha una scheda attiva');
  const s = valida({ ...scheda, inizio: d.inizio || oggi() });
  await scrivi(env, io, verso.id, s, true);
  return json({ ok: true });
}

export async function archiviaScheda(env, io, atletaId) {
  richiedi(io, 'admin', 'coach');
  const atleta = await gestibile(env, io, atletaId);
  await env.DB.prepare(`UPDATE schede SET archiviata = 1, ${CHIUDI_PERIODO}, aggiornata_il = datetime('now') WHERE atleta_id = ?2 AND archiviata = 0`).bind(oggi(), atleta.id).run();
  return json({ ok: true });
}

export async function ripristinaScheda(env, io, schedaId) {
  richiedi(io, 'admin', 'coach');
  const s = await env.DB.prepare('SELECT id, atleta_id, archiviata, origine FROM schede WHERE id = ?').bind(schedaId).first();
  if (!s) fallisci(404, 'Scheda non trovata');
  await gestibile(env, io, s.atleta_id);
  if (s.origine === 'importata') fallisci(400, 'Una scheda importata resta nello storico: usa “Copia come scheda attiva”');
  if (!s.archiviata) return json({ ok: true });
  await env.DB.batch([
    env.DB.prepare(`UPDATE schede SET archiviata = 1, ${CHIUDI_PERIODO}, aggiornata_il = datetime('now') WHERE atleta_id = ?2 AND archiviata = 0`).bind(oggi(), s.atleta_id),
    env.DB.prepare(`UPDATE schede SET archiviata = 0, periodo_al = NULL, aggiornata_il = datetime('now') WHERE id = ?`).bind(s.id),
  ]);
  return json({ ok: true });
}

/* ---------- Storico delle schede ---------- */

// Tutte le schede dell'atleta per lo storico: prima l'attiva, poi le archiviate dalla più recente
export const queryStoricoSchede = (env, atletaId) => env.DB.prepare(
  `SELECT id, nome, origine, archiviata, settimane, nota, creata_il, aggiornata_il, ${PERIODO_SQL},
          (SELECT count(*) FROM giorni_scheda g WHERE g.scheda_id = schede.id) AS n_giorni
     FROM schede WHERE atleta_id = ?
    ORDER BY archiviata, COALESCE(periodo_al, periodo_dal, '0000') DESC, id DESC LIMIT 200`
).bind(atletaId);

// Periodo scritto dal coach: 'AAAA-MM' oppure 'AAAA-MM-GG'. Un mese vale dal primo all'ultimo giorno.
const FORMATO_PERIODO = /^(19|20)\d{2}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;
function periodo(d) {
  const dal = testo(d.periodo_dal, 10), al = testo(d.periodo_al, 10);
  if (dal && !FORMATO_PERIODO.test(dal)) fallisci(400, 'Inizio non valido: scegli mese e anno, o una data');
  if (al && !FORMATO_PERIODO.test(al)) fallisci(400, 'Fine non valida: scegli mese e anno, o una data');
  if (dal && al && `${al}-31`.slice(0, 10) < `${dal}-01`.slice(0, 10)) fallisci(400, 'La fine del periodo è prima dell’inizio');
  return { dal: dal || null, al: al || null };
}

async function schedaDelloStorico(env, io, schedaId) {
  const s = await env.DB.prepare('SELECT id, atleta_id, archiviata, origine FROM schede WHERE id = ?').bind(schedaId).first();
  if (!s) fallisci(404, 'Scheda non trovata');
  await gestibile(env, io, s.atleta_id);
  return s;
}

// Il coach salva una scheda vecchia (scritta, dettata, da file o da foto) già controllata nell'editor
export async function salvaImportata(request, env, io, atletaId) {
  richiedi(io, 'admin', 'coach');
  const atleta = await gestibile(env, io, atletaId);
  const d = await corpo(request);
  const s = valida(d);
  const per = periodo(d);
  await verificaLibreria(env, s);
  const SCHEDA = `(SELECT max(id) FROM schede WHERE atleta_id = ? AND origine = 'importata')`;
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO schede (nome, atleta_id, coach_id, archiviata, origine, settimane, inizio, scarico, periodo_dal, periodo_al, nota)
       VALUES (?, ?, ?, 1, 'importata', ?, NULL, ?, ?, ?, ?)`
    ).bind(s.nome, atleta.id, io.id, s.settimane, JSON.stringify(s.scarico), per.dal, per.al, testo(d.nota, 300) || null),
    ...righeGiorni(env, s, SCHEDA, atleta.id),
  ]);
  const r = await env.DB.prepare(`SELECT max(id) AS id FROM schede WHERE atleta_id = ? AND origine = 'importata'`).bind(atleta.id).first();
  return json({ ok: true, id: r.id }, 201);
}

// Scheda dello storico: di un'importata si corregge tutto, di una archiviata dall'app nome, periodo e nota
export async function modificaArchiviata(request, env, io, schedaId) {
  richiedi(io, 'admin', 'coach');
  const s0 = await schedaDelloStorico(env, io, schedaId);
  if (!s0.archiviata) fallisci(400, 'La scheda attiva si modifica dall’editor');
  const d = await corpo(request);
  const per = periodo(d);
  const nota = testo(d.nota, 300) || null;
  if (s0.origine === 'app') {
    const nome = testo(d.nome, 80);
    if (!nome) fallisci(400, 'Scrivi il nome della scheda');
    await env.DB.prepare('UPDATE schede SET nome = ?, periodo_dal = ?, periodo_al = ?, nota = ? WHERE id = ?').bind(nome, per.dal, per.al, nota, s0.id).run();
    return json({ ok: true });
  }
  const s = valida(d);
  await verificaLibreria(env, s);
  await env.DB.batch([
    env.DB.prepare(`UPDATE schede SET nome = ?, settimane = ?, scarico = ?, periodo_dal = ?, periodo_al = ?, nota = ?, coach_id = ?, aggiornata_il = datetime('now') WHERE id = ?`)
      .bind(s.nome, s.settimane, JSON.stringify(s.scarico), per.dal, per.al, nota, io.id, s0.id),
    env.DB.prepare('DELETE FROM giorni_scheda WHERE scheda_id = ?').bind(s0.id),
    ...righeGiorni(env, s, '?', s0.id),
  ]);
  return json({ ok: true });
}

// Si eliminano solo le importate: le schede dell'app restano legate alle giornate già svolte
export async function eliminaImportata(env, io, schedaId) {
  richiedi(io, 'admin', 'coach');
  const s = await schedaDelloStorico(env, io, schedaId);
  if (s.origine !== 'importata') fallisci(400, 'Si possono eliminare solo le schede importate');
  await env.DB.prepare('DELETE FROM schede WHERE id = ?').bind(s.id).run();
  return json({ ok: true });
}

// Una scheda dello storico diventa la base di una nuova scheda attiva (la vecchia resta nello storico)
export async function copiaComeAttiva(request, env, io, schedaId) {
  richiedi(io, 'admin', 'coach');
  const s0 = await schedaDelloStorico(env, io, schedaId);
  if (!s0.archiviata) fallisci(400, 'Questa è già la scheda attiva');
  const d = await corpo(request);
  const scheda = await caricaScheda(env, 'id = ?', s0.id);
  const s = valida({ ...scheda, inizio: d.inizio || oggi() });
  await scrivi(env, io, s0.atleta_id, s, true);
  return json({ ok: true });
}
