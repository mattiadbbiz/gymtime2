// GymTime · Worker: API + file statici
import { verificaPassword, HASH_FINTO, creaSessione, cookieScaduto, utenteDaRichiesta, chiudiSessione } from './auth.js';
import { json, corpo, fallisci, testo, Errore } from './util.js';
import * as U from './utenti.js';
import * as Lib from './libreria.js';
import * as S from './schede.js';
import * as A from './allenamento.js';
import * as D from './domande.js';
import * as I from './importa.js';
import * as M from './mobilita.js';
import * as L from './sessioni-libere.js';

async function limite(env, chiave) {
  if (!env.LIMITE_ACCESSI) return;
  const { success } = await env.LIMITE_ACCESSI.limit({ key: chiave });
  if (!success) fallisci(429, 'Troppi tentativi: aspetta un minuto e riprova');
}

async function login(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'ip';
  await limite(env, `login:${ip}`);
  const d = await corpo(request);
  const username = testo(d.username, 40);
  const password = String(d.password ?? '');
  if (!username || !password) fallisci(400, 'Scrivi username e password');
  const u = await env.DB.prepare('SELECT id, nome, username, ruolo, coach_id, password_hash, cambio_password, attivo FROM utenti WHERE username = ?').bind(username).first();
  const valida = await verificaPassword(password, u?.password_hash || HASH_FINTO);
  if (!u || !valida) fallisci(401, 'Username o password non corretti');
  if (!u.attivo) fallisci(403, 'Profilo disattivato: parla con il tuo coach');
  if (d.admin && u.ruolo !== 'admin') fallisci(403, 'Questo profilo non è l’admin');
  const cookie = await creaSessione(env, u.id);
  const { password_hash, attivo, ...utente } = u;
  return json({ utente }, 200, { 'Set-Cookie': cookie });
}

async function api(request, env, url) {
  const p = url.pathname, m = request.method;

  if (p === '/api/salute') {
    const r = await env.DB.prepare(`SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations'`).first();
    return json({ ok: true, tabelle: r.n, ai: !!env.AI });
  }
  if (p === '/api/login' && m === 'POST') return login(request, env);
  if (p === '/api/logout' && m === 'POST') { await chiudiSessione(request, env); return json({ ok: true }, 200, { 'Set-Cookie': cookieScaduto }); }

  const io = await utenteDaRichiesta(request, env);
  if (!io) fallisci(401, 'Accedi per continuare');

  if (p === '/api/io' && m === 'GET') return json({ utente: io });
  if (p === '/api/password' && m === 'POST') { await limite(env, `pw:${io.id}`); return U.cambiaPassword(request, env, io); }
  // Con la password iniziale si può solo cambiarla
  if (io.cambio_password) fallisci(403, 'Prima scegli la tua password');

  let r;
  // Profili
  if (p === '/api/utenti' && m === 'GET') return U.elenco(env, io);
  if (p === '/api/utenti' && m === 'POST') return U.crea(request, env, io);
  if ((r = p.match(/^\/api\/utenti\/(\d+)$/))) {
    if (m === 'PUT') return U.modifica(request, env, io, +r[1]);
    if (m === 'DELETE') return U.elimina(env, io, +r[1]);
  }
  if ((r = p.match(/^\/api\/utenti\/(\d+)\/password$/)) && m === 'POST') return U.reimpostaPassword(request, env, io, +r[1]);

  // Libreria
  if (p === '/api/libreria' && m === 'GET') return Lib.elencoLibreria(env, io);
  if (p === '/api/libreria' && m === 'POST') return Lib.creaEsercizio(request, env, io);
  if ((r = p.match(/^\/api\/libreria\/(\d+)$/))) {
    if (m === 'PUT') return Lib.modificaEsercizio(request, env, io, +r[1]);
    if (m === 'DELETE') return Lib.eliminaEsercizio(env, io, +r[1]);
  }

  // Schede
  if ((r = p.match(/^\/api\/schede\/(\d+)$/))) {
    if (m === 'GET') return S.leggiScheda(env, io, +r[1]);
    if (m === 'PUT') return S.salvaScheda(request, env, io, +r[1]);
  }
  if ((r = p.match(/^\/api\/schede\/(\d+)\/duplica$/)) && m === 'POST') return S.duplicaScheda(request, env, io, +r[1]);
  if ((r = p.match(/^\/api\/schede\/(\d+)\/archivia$/)) && m === 'POST') return S.archiviaScheda(env, io, +r[1]);
  if ((r = p.match(/^\/api\/archivio\/(\d+)$/)) && m === 'GET') return S.leggiArchiviata(env, io, +r[1]);
  if ((r = p.match(/^\/api\/archivio\/(\d+)\/ripristina$/)) && m === 'POST') return S.ripristinaScheda(env, io, +r[1]);

  // Storico delle schede: schede vecchie importate e schede archiviate
  if ((r = p.match(/^\/api\/storico-schede\/(\d+)$/)) && m === 'POST') return S.salvaImportata(request, env, io, +r[1]);
  if ((r = p.match(/^\/api\/storico-schede\/scheda\/(\d+)$/))) {
    if (m === 'PUT') return S.modificaArchiviata(request, env, io, +r[1]);
    if (m === 'DELETE') return S.eliminaImportata(env, io, +r[1]);
  }
  if ((r = p.match(/^\/api\/storico-schede\/scheda\/(\d+)\/attiva$/)) && m === 'POST') return S.copiaComeAttiva(request, env, io, +r[1]);

  // Allenamento
  if (p === '/api/allena' && m === 'GET') return A.statoAllenamento(env, io);
  if (p === '/api/giornate' && m === 'POST') return A.avviaGiornata(request, env, io);
  if ((r = p.match(/^\/api\/giornate\/(\d+)$/))) {
    if (m === 'GET') return A.leggiGiornata(env, io, +r[1]);
    if (m === 'DELETE') return A.eliminaGiornata(env, io, +r[1]);
  }
  if ((r = p.match(/^\/api\/giornate\/(\d+)\/pre$/)) && m === 'PUT') return A.salvaPre(request, env, io, +r[1]);
  if ((r = p.match(/^\/api\/giornate\/(\d+)\/esercizi\/(\d+)$/)) && m === 'PUT') return A.salvaEsercizio(request, env, io, +r[1], +r[2]);
  if ((r = p.match(/^\/api\/giornate\/(\d+)\/passo$/)) && m === 'PUT') return A.cambiaPasso(request, env, io, +r[1]);
  if ((r = p.match(/^\/api\/giornate\/(\d+)\/completa$/)) && m === 'POST') return A.completaGiornata(request, env, io, +r[1]);
  if ((r = p.match(/^\/api\/storico\/(\d+)$/)) && m === 'GET') return A.storico(env, io, +r[1]);

  // Domande
  if (p === '/api/domande' && m === 'GET') return D.domandePerMe(env, io);
  if (p === '/api/domande/gestione' && m === 'GET') return D.domandeGestione(env, io);
  if (p === '/api/domande' && m === 'PUT') return D.salvaDomande(request, env, io);
  if (p === '/api/domande/predefinite' && m === 'POST') return D.usaPredefinite(request, env, io);

  // Importazione
  if (p === '/api/importa/file' && m === 'POST') return I.daFile(request, env, io);
  if (p === '/api/importa/audio' && m === 'POST') return I.daAudio(request, env, io);
  if (p === '/api/importa/foto' && m === 'POST') return I.daFoto(request, env, io);
  if (p === '/api/importa/analizza' && m === 'POST') return I.analizza(request, env, io);

  // Cardio e ultime esecuzioni di un esercizio
  if (p === '/api/cardio' && m === 'GET') return L.statoCardio(env, io);
  if (p === '/api/cardio/sessioni' && m === 'POST') return L.avviaCardio(request, env, io);
  if ((r = p.match(/^\/api\/cardio\/sessioni\/(\d+)$/))) {
    if (m === 'GET') return L.leggiCardio(env, io, +r[1]);
    if (m === 'PUT') return L.salvaCardio(request, env, io, +r[1]);
    if (m === 'DELETE') return L.eliminaCardio(env, io, +r[1]);
  }
  if ((r = p.match(/^\/api\/cardio\/sessioni\/(\d+)\/completa$/)) && m === 'POST') return L.salvaCardio(request, env, io, +r[1], true);
  if ((r = p.match(/^\/api\/esercizi\/(\d+)\/ultime$/)) && m === 'GET') return L.ultime(env, io, +r[1]);

  // Mobilità e stretching
  if (p === '/api/mobilita' && m === 'GET') return M.statoMobilita(env, io, url.searchParams.get('tipo'));
  if (p === '/api/mobilita/impostazioni' && m === 'GET') return M.leggiImpostazioni(env, io);
  if (p === '/api/mobilita/impostazioni' && m === 'PUT') return M.salvaImpostazioni(request, env, io);
  if (p === '/api/mobilita/libreria' && m === 'GET') return M.elencoLibreria(env, io);
  if (p === '/api/mobilita/libreria' && m === 'POST') return M.creaEsercizio(request, env, io);
  if ((r = p.match(/^\/api\/mobilita\/libreria\/(\d+)$/))) {
    if (m === 'PUT') return M.modificaEsercizio(request, env, io, +r[1]);
    if (m === 'DELETE') return M.eliminaEsercizio(env, io, +r[1]);
  }
  if (p === '/api/mobilita/sessioni' && m === 'POST') return M.avviaSessione(request, env, io);
  if ((r = p.match(/^\/api\/mobilita\/sessioni\/(\d+)$/))) {
    if (m === 'GET') return M.leggiSessione(env, io, +r[1]);
    if (m === 'DELETE') return M.eliminaSessione(env, io, +r[1]);
  }
  if ((r = p.match(/^\/api\/mobilita\/sessioni\/(\d+)\/esercizi\/(\d+)$/)) && m === 'PUT') return M.salvaEsito(request, env, io, +r[1], +r[2]);
  if ((r = p.match(/^\/api\/mobilita\/sessioni\/(\d+)\/passo$/)) && m === 'PUT') return M.cambiaPasso(request, env, io, +r[1]);
  if ((r = p.match(/^\/api\/mobilita\/sessioni\/(\d+)\/completa$/)) && m === 'POST') return M.completaSessione(env, io, +r[1]);

  fallisci(404, 'Indirizzo non trovato');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await api(request, env, url);
    } catch (e) {
      if (e instanceof Errore) return json({ errore: e.message }, e.status);
      console.error(e);
      return json({ errore: 'Errore del server, riprova tra poco' }, 500);
    }
  }
};
