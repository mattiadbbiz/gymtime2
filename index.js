// GymTime · Worker: API (accesso, password, profili, libreria) + file statici
import { hashPassword, verificaPassword, creaSessione, cookieScaduto, utenteDaRichiesta } from './auth.js';
import { elencoLibreria, creaEsercizio, modificaEsercizio, eliminaEsercizio } from './libreria.js';

const json = (dati, status = 200, headers = {}) => Response.json(dati, { status, headers });
const errore = (messaggio, status = 400, extra = {}) => json({ errore: messaggio, ...extra }, status);
const leggi = async request => { try { return await request.json(); } catch { return {}; } };
const pubblico = u => ({ id: u.id, nome: u.nome, username: u.username, ruolo: u.ruolo, cambio_password: !!u.cambio_password });

// Con la password iniziale si può solo cambiarla o uscire
const LIBERE_CON_CAMBIO = new Set(['/api/io', '/api/password', '/api/logout']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await api(request, env, url);
    } catch (e) {
      console.error(e);
      return errore('Errore del server, riprova tra poco.', 500);
    }
  },
};

async function troppiTentativi(env, chiave) {
  if (!env.LIMITE_ACCESSI) return false;
  const { success } = await env.LIMITE_ACCESSI.limit({ key: chiave });
  return !success;
}

async function api(request, env, url) {
  const p = url.pathname, m = request.method;

  if (m !== 'GET') {
    const origine = request.headers.get('Origin');
    if (origine && origine !== url.origin) return errore('Richiesta non consentita.', 403);
  }

  if (p === '/api/salute' && m === 'GET') {
    const r = await env.DB.prepare("SELECT COUNT(*) AS tabelle FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations'").first();
    return json({ ok: true, tabelle: r.tabelle });
  }

  if (p === '/api/login' && m === 'POST') return login(request, env);

  const io = await utenteDaRichiesta(request, env);
  if (!io) return errore('Accesso richiesto.', 401);
  if (io.cambio_password && !LIBERE_CON_CAMBIO.has(p)) return errore('Prima scegli una nuova password.', 403, { cambio_password: true });

  if (p === '/api/io' && m === 'GET') return json({ utente: pubblico(io) });
  if (p === '/api/logout' && m === 'POST') {
    await env.DB.prepare('DELETE FROM sessioni_login WHERE token_hash = ?').bind(io.tokenHash).run();
    return json({ ok: true }, 200, { 'Set-Cookie': cookieScaduto });
  }
  if (p === '/api/password' && m === 'POST') return cambiaPassword(request, env, io);

  if (p === '/api/utenti' && m === 'GET') return elencoUtenti(env, io);
  if (p === '/api/utenti' && m === 'POST') return creaUtente(request, env, io);
  const r = p.match(/^\/api\/utenti\/(\d+)(\/password)?$/);
  if (r && r[2] && m === 'POST') return reimpostaPassword(request, env, io, Number(r[1]));
  if (r && !r[2] && m === 'DELETE') return eliminaUtente(env, io, Number(r[1]));

  if (p === '/api/libreria' && m === 'GET') return elencoLibreria(env, io);
  if (p === '/api/libreria' && m === 'POST') return creaEsercizio(request, env, io);
  const l = p.match(/^\/api\/libreria\/(\d+)$/);
  if (l && m === 'PUT') return modificaEsercizio(request, env, io, Number(l[1]));
  if (l && m === 'DELETE') return eliminaEsercizio(env, io, Number(l[1]));

  return errore('Percorso non trovato.', 404);
}

async function login(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'sconosciuto';
  if (await troppiTentativi(env, `login:${ip}`)) return errore('Troppi tentativi: riprova tra un minuto.', 429);

  const { username, password, area } = await leggi(request);
  if (!username || !password) return errore('Inserisci username e password.');

  const u = await env.DB.prepare(
    'SELECT id, nome, username, ruolo, coach_id, cambio_password, password_hash, attivo FROM utenti WHERE username = ?'
  ).bind(String(username).trim()).first();

  let ok = false;
  if (u && u.attivo) ok = await verificaPassword(String(password), u.password_hash);
  else await hashPassword(String(password)); // stessi tempi anche se l'utente non esiste
  if (!ok) return errore('Username o password non corretti.', 401);
  if (area === 'admin' && u.ruolo !== 'admin') return errore('Questo accesso è riservato all’admin.', 403);

  return json({ utente: pubblico(u) }, 200, { 'Set-Cookie': await creaSessione(env, u.id) });
}

async function cambiaPassword(request, env, io) {
  if (await troppiTentativi(env, `password:${io.id}`)) return errore('Troppi tentativi: riprova tra un minuto.', 429);
  const { attuale, nuova } = await leggi(request);
  if (typeof nuova !== 'string' || nuova.length < 8) return errore('La nuova password deve avere almeno 8 caratteri.');
  if (nuova === attuale) return errore('Scegli una password diversa da quella attuale.');

  const riga = await env.DB.prepare('SELECT password_hash FROM utenti WHERE id = ?').bind(io.id).first();
  if (!(await verificaPassword(String(attuale || ''), riga.password_hash))) return errore('La password attuale non è corretta.', 401);

  await env.DB.batch([
    env.DB.prepare('UPDATE utenti SET password_hash = ?, cambio_password = 0 WHERE id = ?').bind(await hashPassword(nuova), io.id),
    env.DB.prepare('DELETE FROM sessioni_login WHERE utente_id = ? AND token_hash <> ?').bind(io.id, io.tokenHash),
  ]);
  return json({ ok: true });
}

// L'admin gestisce tutti tranne sé stesso; il coach solo i propri atleti
const puoGestire = (io, u) =>
  io.ruolo === 'admin' ? u.ruolo !== 'admin' : io.ruolo === 'coach' && u.ruolo === 'atleta' && u.coach_id === io.id;

async function elencoUtenti(env, io) {
  if (io.ruolo === 'atleta') return errore('Non hai accesso a questa sezione.', 403);
  const base = `SELECT u.id, u.nome, u.username, u.ruolo, u.coach_id, u.attivo, u.cambio_password, c.nome AS coach_nome
                  FROM utenti u LEFT JOIN utenti c ON c.id = u.coach_id`;
  const q = io.ruolo === 'admin'
    ? env.DB.prepare(`${base} WHERE u.ruolo <> 'admin' ORDER BY u.ruolo DESC, u.nome COLLATE NOCASE`)
    : env.DB.prepare(`${base} WHERE u.ruolo = 'atleta' AND u.coach_id = ? ORDER BY u.nome COLLATE NOCASE`).bind(io.id);
  const { results } = await q.all();
  return json({ utenti: results });
}

async function creaUtente(request, env, io) {
  if (io.ruolo === 'atleta') return errore('Non puoi creare profili.', 403);
  const b = await leggi(request);
  const nome = String(b.nome || '').trim();
  const username = String(b.username || '').trim();
  const password = String(b.password || '');
  const ruolo = io.ruolo === 'admin' ? b.ruolo : 'atleta';

  if (!['coach', 'atleta'].includes(ruolo)) return errore('Ruolo non valido.');
  if (!nome || nome.length > 60) return errore('Inserisci un nome o soprannome (massimo 60 caratteri).');
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) return errore('Username: da 3 a 30 caratteri tra lettere, numeri, punto, trattino e trattino basso.');
  if (password.length < 8) return errore('La password iniziale deve avere almeno 8 caratteri.');

  let coachId = io.id; // i coach dipendono dall'admin, gli atleti da chi li crea
  if (ruolo === 'atleta' && io.ruolo === 'admin' && b.coach_id && Number(b.coach_id) !== io.id) {
    const c = await env.DB.prepare("SELECT id FROM utenti WHERE id = ? AND ruolo = 'coach'").bind(Number(b.coach_id)).first();
    if (!c) return errore('Coach non trovato.');
    coachId = c.id;
  }

  try {
    const r = await env.DB.prepare(
      'INSERT INTO utenti (nome, username, password_hash, ruolo, coach_id, cambio_password) VALUES (?, ?, ?, ?, ?, 1)'
    ).bind(nome, username, await hashPassword(password), ruolo, coachId).run();
    return json({ id: r.meta.last_row_id }, 201);
  } catch (e) {
    if (String(e.message || e).includes('UNIQUE')) return errore('Questo username è già usato.', 409);
    throw e;
  }
}

async function reimpostaPassword(request, env, io, id) {
  const u = await env.DB.prepare('SELECT id, ruolo, coach_id FROM utenti WHERE id = ?').bind(id).first();
  if (!u || !puoGestire(io, u)) return errore('Profilo non trovato.', 404);
  const { password } = await leggi(request);
  if (typeof password !== 'string' || password.length < 8) return errore('La password iniziale deve avere almeno 8 caratteri.');
  await env.DB.batch([
    env.DB.prepare('UPDATE utenti SET password_hash = ?, cambio_password = 1 WHERE id = ?').bind(await hashPassword(password), id),
    env.DB.prepare('DELETE FROM sessioni_login WHERE utente_id = ?').bind(id),
  ]);
  return json({ ok: true });
}

async function eliminaUtente(env, io, id) {
  const u = await env.DB.prepare('SELECT id, ruolo, coach_id FROM utenti WHERE id = ?').bind(id).first();
  if (!u || !puoGestire(io, u)) return errore('Profilo non trovato.', 404);
  if (u.ruolo === 'coach') {
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM utenti WHERE coach_id = ? AND ruolo = 'atleta'").bind(id).first();
    if (n.n > 0) return errore('Questo coach ha ancora atleti: spostali o eliminali prima.', 409);
  }
  await env.DB.prepare('DELETE FROM utenti WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
