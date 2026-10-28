// GymTime · utilità comuni del Worker
export class Errore extends Error {
  constructor(status, messaggio) { super(messaggio); this.status = status; }
}
export const fallisci = (status, messaggio) => { throw new Errore(status, messaggio); };

export const json = (dati, status = 200, headers = {}) => new Response(JSON.stringify(dati), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});

export async function corpo(request) {
  try { return await request.json(); } catch { throw new Errore(400, 'Dati non validi'); }
}

// Data di oggi in Italia (YYYY-MM-DD): la giornata di allenamento si lega a questa data
export const oggi = (quando = new Date()) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(quando).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};

export const testo = (v, max = 200) => String(v ?? '').trim().slice(0, max);
export const intero = v => { const n = Number(v); return Number.isInteger(n) ? n : null; };
export const parseJSON = (s, def = null) => { if (s === null || s === undefined || s === '') return def; try { return JSON.parse(s); } catch { return def; } };

export const richiedi = (io, ...ruoli) => { if (!ruoli.includes(io.ruolo)) fallisci(403, 'Non hai i permessi per questa operazione'); };

// Persona che l'utente può gestire: l'admin tutti, il coach sé stesso e i suoi atleti
export async function gestibile(env, io, id) {
  const u = await env.DB.prepare('SELECT id, nome, username, ruolo, coach_id, attivo, cambio_password FROM utenti WHERE id = ?').bind(id).first();
  if (!u) fallisci(404, 'Profilo non trovato');
  if (io.ruolo === 'admin') return u;
  if (io.ruolo === 'coach' && (u.id === io.id || (u.ruolo === 'atleta' && u.coach_id === io.id))) return u;
  fallisci(403, 'Questo profilo non è tra i tuoi');
}
// Lettura: ognuno vede i propri dati, coach e admin quelli che gestiscono
export async function leggibile(env, io, id) {
  if (Number(id) === io.id) return gestibile(env, { ...io, ruolo: 'admin' }, id);
  return gestibile(env, io, id);
}
