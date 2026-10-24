// GymTime · libreria esercizi: base (creato_da NULL, gestita dall'admin) + esercizi propri di ogni coach
const json = (dati, status = 200) => Response.json(dati, { status });
const errore = (messaggio, status = 400) => json({ errore: messaggio }, status);
const leggi = async request => { try { return await request.json(); } catch { return {}; } };

export const CATEGORIE = ['cal', 'str', 'pl', 'bb', 'fn', 'kb'];
export const ANIMAZIONI = ['squat', 'lunge', 'hinge', 'push', 'bench', 'press', 'pull', 'row', 'dip', 'curl', 'raise', 'core', 'jump', 'free'];
export const MODALITA = ['setrep', 'emom', 'amrap', 'tempo', 'free', 'rt', 'ladder'];

const CAMPI = 'id, nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti, creato_da';

// L'admin modifica tutto; il coach solo gli esercizi che ha creato lui
const puoModificare = (io, e) => io.ruolo === 'admin' || (io.ruolo === 'coach' && e.creato_da === io.id);
const conPermesso = (io, e) => ({ ...e, modificabile: puoModificare(io, e) });

function pulisci(b) {
  const testo = (v, max) => String(v ?? '').trim().slice(0, max);
  const e = {
    nome: testo(b.nome, 80),
    famiglia: testo(b.famiglia, 40) || null,
    variante: testo(b.variante, 60) || null,
    categoria: CATEGORIE.includes(b.categoria) ? b.categoria : null,
    muscolo: testo(b.muscolo, 120) || null,
    attrezzo: testo(b.attrezzo, 80) || null,
    animazione: ANIMAZIONI.includes(b.animazione) ? b.animazione : 'free',
    inizia_con: b.inizia_con === 'ecc' ? 'ecc' : 'conc',
    modalita_default: MODALITA.includes(b.modalita_default) ? b.modalita_default : 'setrep',
    altri_nomi: testo(b.altri_nomi, 200) || null,
    accorgimenti: String(b.accorgimenti ?? '').split('\n').map(r => r.trim().slice(0, 180)).filter(Boolean).slice(0, 10).join('\n') || null,
  };
  if (e.nome.length < 2) return { errore: 'Il nome deve avere almeno 2 caratteri.' };
  return { e };
}

const noAtleti = io => io.ruolo === 'atleta' ? errore('Non hai accesso alla libreria.', 403) : null;

export async function elencoLibreria(env, io) {
  const no = noAtleti(io); if (no) return no;
  const q = io.ruolo === 'admin'
    ? env.DB.prepare(`SELECT ${CAMPI} FROM libreria_esercizi ORDER BY muscolo COLLATE NOCASE, nome COLLATE NOCASE`)
    : env.DB.prepare(`SELECT ${CAMPI} FROM libreria_esercizi WHERE creato_da IS NULL OR creato_da = ? ORDER BY muscolo COLLATE NOCASE, nome COLLATE NOCASE`).bind(io.id);
  const { results } = await q.all();
  return json({ esercizi: results.map(e => conPermesso(io, e)) });
}

async function salva(env, sql, valori) {
  try { return { r: await env.DB.prepare(sql).bind(...valori).run() }; }
  catch (err) {
    if (String(err.message || err).includes('UNIQUE')) return { errore: errore('Esiste già un esercizio con questo nome.', 409) };
    throw err;
  }
}

export async function creaEsercizio(request, env, io) {
  const no = noAtleti(io); if (no) return no;
  const { e, errore: msg } = pulisci(await leggi(request));
  if (msg) return errore(msg);
  const creatoDa = io.ruolo === 'admin' ? null : io.id; // quelli dell'admin entrano nella libreria di base
  const { r, errore: err } = await salva(env,
    `INSERT INTO libreria_esercizi (nome, famiglia, variante, categoria, muscolo, attrezzo, animazione, inizia_con, modalita_default, altri_nomi, accorgimenti, creato_da)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [e.nome, e.famiglia, e.variante, e.categoria, e.muscolo, e.attrezzo, e.animazione, e.inizia_con, e.modalita_default, e.altri_nomi, e.accorgimenti, creatoDa]);
  if (err) return err;
  return json({ id: r.meta.last_row_id }, 201);
}

async function trova(env, io, id) {
  const e = await env.DB.prepare(`SELECT ${CAMPI} FROM libreria_esercizi WHERE id = ?`).bind(id).first();
  if (!e || (io.ruolo === 'coach' && e.creato_da !== null && e.creato_da !== io.id)) return { errore: errore('Esercizio non trovato.', 404) };
  if (!puoModificare(io, e)) return { errore: errore('Gli esercizi della libreria di base li modifica solo l’admin.', 403) };
  return { e };
}

export async function modificaEsercizio(request, env, io, id) {
  const no = noAtleti(io); if (no) return no;
  const t = await trova(env, io, id); if (t.errore) return t.errore;
  const { e, errore: msg } = pulisci(await leggi(request));
  if (msg) return errore(msg);
  const { errore: err } = await salva(env,
    `UPDATE libreria_esercizi SET nome = ?, famiglia = ?, variante = ?, categoria = ?, muscolo = ?, attrezzo = ?, animazione = ?, inizia_con = ?, modalita_default = ?, altri_nomi = ?, accorgimenti = ? WHERE id = ?`,
    [e.nome, e.famiglia, e.variante, e.categoria, e.muscolo, e.attrezzo, e.animazione, e.inizia_con, e.modalita_default, e.altri_nomi, e.accorgimenti, id]);
  if (err) return err;
  return json({ ok: true });
}

export async function eliminaEsercizio(env, io, id) {
  const no = noAtleti(io); if (no) return no;
  const t = await trova(env, io, id); if (t.errore) return t.errore;
  // Le schede tengono nome e parametri: esercizio_id diventa NULL (ON DELETE SET NULL)
  await env.DB.prepare('DELETE FROM libreria_esercizi WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
