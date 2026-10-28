// GymTime · allenamento dell'atleta e storico
import { json, corpo, fallisci, testo, intero, parseJSON, oggi, gestibile, leggibile, richiedi } from './util.js';
import { caricaScheda, queryStoricoSchede } from './schede.js';
import {queryCardio,cardioJSON} from './sessioni-libere.js';
import { querySessioniStorico, sessioneJSON } from './mobilita.js';
import { valoriSettimana, variazioni, settimanaDi, pulisciParametri, CAMPI_FATTI } from '../public/js/regole.js';

const ESITI = ['fatto', 'modificato', 'non_fatto'];

function giornataJSON(g, svolti = [], sensazioni = []) {
  return {
    id: g.id, atleta_id: g.atleta_id, data: g.data, scheda_id: g.scheda_id, giorno_posizione: g.giorno_posizione,
    nome_giorno: g.nome_giorno, settimana: g.settimana || 1, stato: g.stato, passo: g.passo_corrente,
    avviata_il: g.avviata_il, completata_il: g.completata_il,
    piano: parseJSON(g.piano_json, { esercizi: [] }),
    svolti: Object.fromEntries(svolti.map(s => [s.rif_esercizio, { esito: s.esito, effettivo: parseJSON(s.effettivo_json), voto: s.voto }])),
    sensazioni: Object.fromEntries(sensazioni.map(s => [s.fase, { modalita: s.modalita, testo: s.testo, risposte: parseJSON(s.risposte_json, []) }]))
  };
}

// Prescrizione del giorno per la settimana in corso, come la vedrà l'atleta
function pianoGiorno(giorno, w) {
  return giorno.esercizi.map((e, i) => {
    const { parametri, tecnica } = valoriSettimana(e, w);
    return {
      rif: i, nome: e.nome, esercizio_id: e.esercizio_id, modalita: e.modalita, gruppo: e.gruppo,
      parametri, tecnica, nota: e.nota || '', animazione: e.animazione, variante: e.variante || null, inizia_con: e.inizia_con,
      accorgimenti: e.acc_libreria || '', muscolo: e.muscolo || '', variazione: variazioni(e, w)
    };
  });
}

export async function statoAllenamento(env, io) {
  const data = oggi();
  const [g, scheda, ultima] = await Promise.all([
    env.DB.prepare('SELECT id, stato, giorno_posizione, nome_giorno FROM giornate WHERE atleta_id = ? AND data = ?').bind(io.id, data).first(),
    caricaScheda(env, 'atleta_id = ? AND archiviata = 0', io.id),
    env.DB.prepare(`SELECT giorno_posizione FROM giornate WHERE atleta_id = ? AND data < ? ORDER BY data DESC LIMIT 1`).bind(io.id, data).first(),
  ]);
  if (!scheda) return json({ oggi: data, giornata: g || null, scheda: null });
  const { settimana, concluso } = settimanaDi(scheda, data);
  const n = scheda.giorni.length || 1;
  return json({
    oggi: data,
    giornata: g || null,
    suggerito: ultima ? (ultima.giorno_posizione + 1) % n : 0,
    scheda: {
      id: scheda.id, nome: scheda.nome, settimane: scheda.settimane, settimana, concluso,
      scarico: scheda.scarico.includes(settimana),
      giorni: scheda.giorni.map(gg => ({ id: gg.id, posizione: gg.posizione, nome: gg.nome, esercizi: pianoGiorno(gg, settimana) }))
    }
  });
}

export async function avviaGiornata(request, env, io) {
  const d = await corpo(request);
  const data = oggi();
  const esiste = await env.DB.prepare('SELECT id, stato FROM giornate WHERE atleta_id = ? AND data = ?').bind(io.id, data).first();
  if (esiste) {
    if (esiste.stato === 'completata') fallisci(409, 'Hai già salvato l’allenamento di oggi');
    return json({ id: esiste.id });
  }
  const scheda = await caricaScheda(env, 'atleta_id = ? AND archiviata = 0', io.id);
  if (!scheda) fallisci(404, 'Non hai ancora una scheda: chiedila al tuo coach');
  const giorno = scheda.giorni.find(g => g.id === intero(d.giorno_id));
  if (!giorno) fallisci(400, 'Giorno non trovato: ricarica la pagina');
  if (!giorno.esercizi.length) fallisci(400, 'Questo giorno non ha esercizi');
  const { settimana } = settimanaDi(scheda, data);
  const piano = { scheda: scheda.nome, settimane: scheda.settimane, scarico: scheda.scarico.includes(settimana), esercizi: pianoGiorno(giorno, settimana) };
  await env.DB.prepare(
    `INSERT INTO giornate (atleta_id, data, scheda_id, giorno_posizione, nome_giorno, piano_json, stato, settimana)
     VALUES (?, ?, ?, ?, ?, ?, 'pre', ?) ON CONFLICT (atleta_id, data) DO NOTHING`
  ).bind(io.id, data, scheda.id, giorno.posizione, giorno.nome, JSON.stringify(piano), settimana).run();
  const g = await env.DB.prepare('SELECT id FROM giornate WHERE atleta_id = ? AND data = ?').bind(io.id, data).first();
  return json({ id: g.id }, 201);
}

async function caricaGiornata(env, id) {
  const g = await env.DB.prepare('SELECT * FROM giornate WHERE id = ?').bind(id).first();
  if (!g) fallisci(404, 'Allenamento non trovato');
  return g;
}
async function mia(env, io, id) {
  const g = await caricaGiornata(env, id);
  if (g.atleta_id !== io.id) fallisci(403, 'Questo allenamento non è tuo');
  if (g.stato === 'completata') fallisci(409, 'Allenamento già salvato');
  return g;
}

export async function leggiGiornata(env, io, id) {
  const g = await caricaGiornata(env, id);
  await leggibile(env, io, g.atleta_id);
  const [sv, se] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM esercizi_svolti WHERE giornata_id = ?').bind(id),
    env.DB.prepare('SELECT * FROM sensazioni WHERE giornata_id = ?').bind(id),
  ]);
  return json({ giornata: giornataJSON(g, sv.results, se.results) });
}

function sensazioniValide(s) {
  if (!s || !['guidato', 'libero'].includes(s.modalita)) return null;
  const risposte = Array.isArray(s.risposte) ? s.risposte.slice(0, 30).map(r => ({
    q: testo(r.q, 200), tipo: ['scala', 'scelta', 'testo'].includes(r.tipo) ? r.tipo : 'testo',
    v: r.tipo === 'scala' ? Math.max(1, Math.min(10, intero(r.v) || 1)) : testo(r.v, 600)
  })).filter(r => r.q && r.v !== '') : [];
  const t = testo(s.testo, 3000);
  if (s.modalita === 'libero' && !t) return null;
  if (s.modalita === 'guidato' && !risposte.length) return null;
  return { modalita: s.modalita, testo: s.modalita === 'libero' ? t : null, risposte: s.modalita === 'guidato' ? risposte : null };
}
const scriviSensazioni = (env, id, fase, s) => s
  ? env.DB.prepare(
    `INSERT INTO sensazioni (giornata_id, fase, modalita, testo, risposte_json) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (giornata_id, fase) DO UPDATE SET modalita = excluded.modalita, testo = excluded.testo, risposte_json = excluded.risposte_json`
  ).bind(id, fase, s.modalita, s.testo, s.risposte ? JSON.stringify(s.risposte) : null)
  : env.DB.prepare('DELETE FROM sensazioni WHERE giornata_id = ? AND fase = ?').bind(id, fase);

// Sensazioni pre (o salto) e passaggio agli esercizi
export async function salvaPre(request, env, io, id) {
  const g = await mia(env, io, id);
  const d = await corpo(request);
  await env.DB.batch([
    scriviSensazioni(env, g.id, 'pre', sensazioniValide(d)),
    env.DB.prepare(`UPDATE giornate SET stato = 'in_corso', passo_corrente = 0 WHERE id = ?`).bind(g.id),
  ]);
  return json({ ok: true });
}

// Esito di un esercizio e passo successivo
export async function salvaEsercizio(request, env, io, id, rif) {
  const g = await mia(env, io, id);
  const piano = parseJSON(g.piano_json, { esercizi: [] });
  const es = piano.esercizi.find(e => e.rif === rif);
  if (!es) fallisci(400, 'Esercizio non trovato');
  const d = await corpo(request);
  const esito = ESITI.includes(d.esito) ? d.esito : 'fatto';
  let effettivo = null;
  if (esito === 'modificato') {
    effettivo = pulisciParametri(es.modalita, d.effettivo || {});
    for (const c of Object.keys(effettivo)) if (!CAMPI_FATTI[es.modalita].includes(c)) delete effettivo[c];
    if (d.effettivo?.nota) effettivo.nota = testo(d.effettivo.nota, 300);
  }
  const passo = Math.max(0, Math.min(piano.esercizi.length, intero(d.passo) ?? rif + 1));
  const fine = passo >= piano.esercizi.length;
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO esercizi_svolti (giornata_id, rif_esercizio, esito, effettivo_json) VALUES (?, ?, ?, ?)
       ON CONFLICT (giornata_id, rif_esercizio) DO UPDATE SET esito = excluded.esito, effettivo_json = excluded.effettivo_json`
    ).bind(g.id, rif, esito, effettivo ? JSON.stringify(effettivo) : null),
    env.DB.prepare('UPDATE giornate SET passo_corrente = ?, stato = ? WHERE id = ?').bind(passo, fine ? 'post' : 'in_corso', g.id),
  ]);
  return json({ ok: true, fine });
}

// Torna indietro di un esercizio (o dalla fase finale all'ultimo esercizio)
export async function cambiaPasso(request, env, io, id) {
  const g = await mia(env, io, id);
  const piano = parseJSON(g.piano_json, { esercizi: [] });
  const d = await corpo(request);
  const passo = Math.max(0, Math.min(piano.esercizi.length - 1, intero(d.passo) ?? 0));
  await env.DB.prepare(`UPDATE giornate SET passo_corrente = ?, stato = 'in_corso' WHERE id = ?`).bind(passo, g.id).run();
  return json({ ok: true });
}

// Voti, sensazioni finali e chiusura della giornata
export async function completaGiornata(request, env, io, id) {
  const g = await mia(env, io, id);
  const piano = parseJSON(g.piano_json, { esercizi: [] });
  const d = await corpo(request);
  const st = [];
  for (const e of piano.esercizi) {
    const voto = intero(d.voti?.[e.rif]);
    const v = voto >= 1 && voto <= 10 ? voto : null;
    st.push(env.DB.prepare(
      `INSERT INTO esercizi_svolti (giornata_id, rif_esercizio, esito, voto) VALUES (?, ?, 'fatto', ?)
       ON CONFLICT (giornata_id, rif_esercizio) DO UPDATE SET voto = CASE WHEN esercizi_svolti.esito = 'non_fatto' THEN NULL ELSE excluded.voto END`
    ).bind(g.id, e.rif, v));
  }
  st.push(scriviSensazioni(env, g.id, 'post', sensazioniValide(d.post)));
  st.push(env.DB.prepare(`UPDATE giornate SET stato = 'completata', completata_il = datetime('now'), passo_corrente = ? WHERE id = ?`).bind(piano.esercizi.length, g.id));
  await env.DB.batch(st);
  return json({ ok: true });
}

// Il coach elimina una giornata per sbloccarla (l'atleta potrà rifarla oggi)
export async function eliminaGiornata(env, io, id) {
  richiedi(io, 'admin', 'coach');
  const g = await caricaGiornata(env, id);
  await gestibile(env, io, g.atleta_id);
  await env.DB.prepare('DELETE FROM giornate WHERE id = ?').bind(g.id).run();
  return json({ ok: true });
}

export async function storico(env, io, atletaId) {
  const atleta = await leggibile(env, io, atletaId);
  const { results: giornate } = await env.DB.prepare(
    'SELECT * FROM giornate WHERE atleta_id = ? ORDER BY data DESC LIMIT 400'
  ).bind(atleta.id).all();
  const ids = JSON.stringify(giornate.map(g => g.id));
  const [sv, se, sc, mo, ca] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM esercizi_svolti WHERE giornata_id IN (SELECT value FROM json_each(?))').bind(ids),
    env.DB.prepare('SELECT * FROM sensazioni WHERE giornata_id IN (SELECT value FROM json_each(?))').bind(ids),
    queryStoricoSchede(env, atleta.id),
    querySessioniStorico(env, atleta.id),
    queryCardio(env, atleta.id),
  ]);
  const per = (rows) => { const m = new Map(); for (const r of rows) { if (!m.has(r.giornata_id)) m.set(r.giornata_id, []); m.get(r.giornata_id).push(r); } return m; };
  const s1 = per(sv.results), s2 = per(se.results);
  return json({
    atleta: { id: atleta.id, nome: atleta.nome },
    oggi: oggi(),
    giornate: giornate.map(g => giornataJSON(g, s1.get(g.id) || [], s2.get(g.id) || [])),
    // Storico delle schede (attiva, archiviate, importate) e sessioni di mobilità
    schede: sc.results.map(x => ({ ...x, archiviata: !!x.archiviata, attiva: !x.archiviata })),
    mobilita: mo.results.map(sessioneJSON),
    cardio: ca.results.map(cardioJSON)
  });
}
