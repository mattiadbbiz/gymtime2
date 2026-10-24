// GymTime · password cifrate (PBKDF2) e sessioni con cookie
const ITERAZIONI = 100000;
const COOKIE = 'gt_sess';
const DURATA_GIORNI = 30;
const enc = new TextEncoder();

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const daB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64url = buf => b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function deriva(password, salt, iterazioni) {
  const chiave = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iterazioni }, chiave, 256);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriva(password, salt, ITERAZIONI);
  return `pbkdf2$${ITERAZIONI}$${b64(salt)}$${b64(bits)}`;
}

export async function verificaPassword(password, salvato) {
  const [tipo, iterazioni, salt, hash] = String(salvato || '').split('$');
  if (tipo !== 'pbkdf2' || !salt || !hash) return false;
  const calcolato = new Uint8Array(await deriva(password, daB64(salt), Number(iterazioni)));
  const atteso = daB64(hash);
  if (calcolato.length !== atteso.length) return false;
  let diff = 0;
  for (let i = 0; i < atteso.length; i++) diff |= calcolato[i] ^ atteso[i];
  return diff === 0;
}

const sha256 = async testo => b64(await crypto.subtle.digest('SHA-256', enc.encode(testo)));
const adesso = () => new Date().toISOString();

export async function creaSessione(env, utenteId) {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const scade = new Date(Date.now() + DURATA_GIORNI * 86400000).toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessioni_login WHERE scade_il < ?').bind(adesso()),
    env.DB.prepare('INSERT INTO sessioni_login (token_hash, utente_id, scade_il) VALUES (?, ?, ?)').bind(await sha256(token), utenteId, scade),
  ]);
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DURATA_GIORNI * 86400}`;
}

export const cookieScaduto = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export async function utenteDaRichiesta(request, env) {
  const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)gt_sess=([^;]+)/);
  if (!m) return null;
  const tokenHash = await sha256(m[1]);
  const u = await env.DB.prepare(
    `SELECT u.id, u.nome, u.username, u.ruolo, u.coach_id, u.cambio_password
       FROM sessioni_login s JOIN utenti u ON u.id = s.utente_id
      WHERE s.token_hash = ? AND s.scade_il > ? AND u.attivo = 1`
  ).bind(tokenHash, adesso()).first();
  return u ? { ...u, tokenHash } : null;
}
