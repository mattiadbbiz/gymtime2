// GymTime · schede per atleta, con giorni, esercizi, progressione settimanale e archivio
import { json, corpo, fallisci, testo, intero, parseJSON, richiedi, gestibile, leggibile, oggi } from './util.js';
import { MODALITA, pulisciParametri, lunedi, settimanaDi } from '../public/js/regole.js';

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
      parametri: parseJSON(e.parametri, {}), tecnica: parseJSON(e.tecnica), nota: e.nota,
      progressione: parseJSON(e.progressione), animazione: e.animazione || 'free', inizia_con: e.inizia_con || 'conc',
      acc_libreria: e.acc_libreria || '', muscolo: e.muscolo || '', attrezzo: e.attrezzo || ''
    });
  }
  return {
    id: s.id, nome: s.nome, atleta_id: s.atleta_id, coach_id: s.coach_id, archiviata: s.archiviata,
    settimane: s.settimane || 1, inizio: s.inizio, scarico: parseJSON(s.scarico, []),
    creata_il: s.creata_il, aggiornata_il: s.aggiornata_il,
    giorni: [...perGiorno.values()]
  };
}

export async function leggiScheda(env, io, atletaId) {
  const atleta = await leggibile(env, io, atletaId);
  const scheda = await caricaScheda(env, 'atleta_id = ? AND archiviata = 0', atleta.id);
  const { results: archivio } = await env.DB.prepare(
    'SELECT id, nome, settimane, creata_il, aggiornata_il FROM schede WHERE atleta_id = ? AND archiviata = 1 ORDER BY aggiornata_il DESC LIMIT 50'
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
        progressione
      };
    });
    return { nome: testo(g.nome, 60) || `Giorno ${i + 1}`, esercizi };
  });
  return { nome, settimane, inizio, scarico, giorni };
}

// Scrive la scheda attiva dell'atleta in un'unica transazione
async function scrivi(env, io, atletaId, s, nuova) {
  // Un esercizio della libreria eliminato nel frattempo non blocca il salvataggio
  const ids = [...new Set(s.giorni.flatMap(g => g.esercizi.map(e => e.esercizio_id)).filter(Boolean))];
  if (ids.length) {
    const { results } = await env.DB.prepare(`SELECT id FROM libreria_esercizi WHERE id IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(ids)).all();
    const ok = new Set(results.map(r => r.id));
    for (const g of s.giorni) for (const e of g.esercizi) if (e.esercizio_id && !ok.has(e.esercizio_id)) e.esercizio_id = null;
  }
  const attiva = await env.DB.prepare('SELECT id FROM schede WHERE atleta_id = ? AND archiviata = 0').bind(atletaId).first();
  const st = [];
  const SCHEDA = '(SELECT id FROM schede WHERE atleta_id = ? AND archiviata = 0)';
  if (attiva && nuova) st.push(env.DB.prepare(`UPDATE schede SET archiviata = 1, aggiornata_il = datetime('now') WHERE id = ?`).bind(attiva.id));
  if (attiva && !nuova) {
    st.push(env.DB.prepare(`UPDATE schede SET nome = ?, settimane = ?, inizio = ?, scarico = ?, coach_id = ?, aggiornata_il = datetime('now') WHERE id = ?`)
      .bind(s.nome, s.settimane, s.inizio, JSON.stringify(s.scarico), io.id, attiva.id));
    st.push(env.DB.prepare('DELETE FROM giorni_scheda WHERE scheda_id = ?').bind(attiva.id));
  } else {
    st.push(env.DB.prepare('INSERT INTO schede (nome, atleta_id, coach_id, settimane, inizio, scarico) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(s.nome, atletaId, io.id, s.settimane, s.inizio, JSON.stringify(s.scarico)));
  }
  s.giorni.forEach((g, i) => {
    st.push(env.DB.prepare(`INSERT INTO giorni_scheda (scheda_id, posizione, nome) VALUES (${SCHEDA}, ?, ?)`).bind(atletaId, i, g.nome));
    g.esercizi.forEach((e, j) => {
      st.push(env.DB.prepare(
        `INSERT INTO esercizi_scheda (giorno_id, posizione, gruppo, esercizio_id, nome, modalita, parametri, tecnica, nota, progressione)
         VALUES ((SELECT id FROM giorni_scheda WHERE scheda_id = ${SCHEDA} AND posizione = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(atletaId, i, j, e.gruppo, e.esercizio_id, e.nome, e.modalita, JSON.stringify(e.parametri),
        e.tecnica ? JSON.stringify(e.tecnica) : null, e.nota, e.progressione ? JSON.stringify(e.progressione) : null));
    });
  });
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
  await env.DB.prepare(`UPDATE schede SET archiviata = 1, aggiornata_il = datetime('now') WHERE atleta_id = ? AND archiviata = 0`).bind(atleta.id).run();
  return json({ ok: true });
}

export async function ripristinaScheda(env, io, schedaId) {
  richiedi(io, 'admin', 'coach');
  const s = await env.DB.prepare('SELECT id, atleta_id, archiviata FROM schede WHERE id = ?').bind(schedaId).first();
  if (!s) fallisci(404, 'Scheda non trovata');
  await gestibile(env, io, s.atleta_id);
  if (!s.archiviata) return json({ ok: true });
  await env.DB.batch([
    env.DB.prepare(`UPDATE schede SET archiviata = 1, aggiornata_il = datetime('now') WHERE atleta_id = ? AND archiviata = 0`).bind(s.atleta_id),
    env.DB.prepare(`UPDATE schede SET archiviata = 0, aggiornata_il = datetime('now') WHERE id = ?`).bind(s.id),
  ]);
  return json({ ok: true });
}
