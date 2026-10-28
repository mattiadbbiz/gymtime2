// GymTime · chiamate al Worker e piccole utilità condivise

export class ErroreApi extends Error {
  constructor(status, messaggio) { super(messaggio); this.status = status; }
}

let suNonAutorizzato = () => {};
export const quandoNonAutorizzato = fn => { suNonAutorizzato = fn; };

// api('/api/io') · api('/api/utenti', { metodo: 'POST', dati: {...} }) · api('/api/importa/file', { metodo: 'POST', form })
export async function api(path, { metodo = 'GET', dati, form } = {}) {
  const opz = { method: metodo, headers: {}, credentials: 'same-origin' };
  if (form) opz.body = form;
  else if (dati !== undefined) { opz.headers['content-type'] = 'application/json'; opz.body = JSON.stringify(dati); }
  let res;
  try { res = await fetch(path, opz); }
  catch { throw new ErroreApi(0, 'Connessione assente: controlla internet e riprova'); }
  let corpo = null;
  try { corpo = await res.json(); } catch {}
  if (res.status === 401 && path !== '/api/login') suNonAutorizzato();
  if (!res.ok) throw new ErroreApi(res.status, corpo?.errore || `Errore ${res.status}`);
  return corpo;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const iniziale = nome => (String(nome || '?').trim()[0] || '?').toUpperCase();
const maiusc = s => s.charAt(0).toUpperCase() + s.slice(1);
const giorno = iso => new Date(iso + 'T12:00:00');
export const dataCorta = iso => giorno(iso).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
export const dataLunga = iso => maiusc(giorno(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
export const dataMese = iso => maiusc(giorno(iso).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }));
export const RUOLI = { admin: 'Admin', coach: 'Coach', atleta: 'Atleta' };
