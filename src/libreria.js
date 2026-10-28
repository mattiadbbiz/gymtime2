// GymTime · libreria esercizi
// La libreria di base (creato_da vuoto) la modifica solo l'admin; gli esercizi di un coach li vede e modifica lui.
import { json, corpo, fallisci, testo, richiedi } from './util.js';
import { MODALITA } from '../public/js/regole.js';
import { POSE } from '../public/js/omino.js';

const CAMPI = ['nome', 'famiglia', 'variante', 'categoria', 'muscolo', 'attrezzo', 'animazione', 'inizia_con', 'modalita_default', 'altri_nomi', 'accorgimenti'];

export async function elencoLibreria(env, io) {
  richiedi(io, 'admin', 'coach', 'atleta');
  const { results } = await env.DB.prepare(
    `SELECT id, nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti, creato_da
       FROM libreria_esercizi
      WHERE creato_da IS NULL OR creato_da = ?1 OR ?2 = 'admin'
      ORDER BY nome COLLATE NOCASE`
  ).bind(io.ruolo === 'atleta' ? (io.coach_id ?? -1) : io.id, io.ruolo).all();
  return json({ esercizi: results });
}

function valori(d) {
  const v = {
    nome: testo(d.nome, 80),
    famiglia: testo(d.famiglia, 60) || null,
    variante: testo(d.variante, 60) || null,
    categoria: testo(d.categoria, 30) || null,
    muscolo: testo(d.muscolo, 160) || null,
    attrezzo: testo(d.attrezzo, 80) || null,
    animazione: POSE[d.animazione] ? d.animazione : 'free',
    inizia_con: d.inizia_con === 'ecc' ? 'ecc' : 'conc',
    modalita_default: MODALITA[d.modalita_default] ? d.modalita_default : 'setrep',
    altri_nomi: testo(d.altri_nomi, 300) || null,
    accorgimenti: testo(d.accorgimenti, 2000) || null,
  };
  if (!v.nome) fallisci(400, 'Scrivi il nome dell’esercizio');
  return v;
}

export async function creaEsercizio(request, env, io) {
  richiedi(io, 'admin', 'coach');
  const v = valori(await corpo(request));
  try {
    const r = await env.DB.prepare(
      `INSERT INTO libreria_esercizi (${CAMPI.join(', ')}, creato_da) VALUES (${CAMPI.map(() => '?').join(', ')}, ?)`
    ).bind(...CAMPI.map(c => v[c]), io.ruolo === 'admin' ? null : io.id).run();
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  } catch (e) {
    if (/UNIQUE/i.test(String(e.message))) fallisci(409, 'Esiste già un esercizio con questo nome');
    throw e;
  }
}

async function modificabile(env, io, id) {
  const e = await env.DB.prepare('SELECT id, creato_da FROM libreria_esercizi WHERE id = ?').bind(id).first();
  if (!e) fallisci(404, 'Esercizio non trovato');
  if (io.ruolo === 'admin' || (io.ruolo === 'coach' && e.creato_da === io.id)) return e;
  fallisci(403, 'Puoi modificare solo gli esercizi che hai creato tu');
}

export async function modificaEsercizio(request, env, io, id) {
  await modificabile(env, io, id);
  const v = valori(await corpo(request));
  try {
    await env.DB.prepare(`UPDATE libreria_esercizi SET ${CAMPI.map(c => `${c} = ?`).join(', ')} WHERE id = ?`).bind(...CAMPI.map(c => v[c]), id).run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e.message))) fallisci(409, 'Esiste già un esercizio con questo nome');
    throw e;
  }
  return json({ ok: true });
}

export async function eliminaEsercizio(env, io, id) {
  await modificabile(env, io, id);
  // Le schede che lo usano tengono nome e prescrizione: perdono solo il collegamento
  await env.DB.prepare('DELETE FROM libreria_esercizi WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
