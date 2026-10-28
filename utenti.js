// GymTime · profili: l'admin crea coach e atleti, il coach crea i suoi atleti
import { hashPassword, verificaPassword, chiudiAltreSessioni } from './auth.js';
import { json, corpo, fallisci, testo, intero, richiedi, gestibile } from './util.js';

const pulisciUsername = v => testo(v, 40);
// Password libere: basta che non sia vuota
const controllaPassword = p => { if (typeof p !== 'string' || p.length < 1) fallisci(400, 'Scrivi una password'); if (p.length > 200) fallisci(400, 'Password troppo lunga'); };

export async function elenco(env, io) {
  richiedi(io, 'admin', 'coach');
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.nome, u.username, u.ruolo, u.coach_id, u.attivo, u.cambio_password, c.nome AS coach_nome,
            (SELECT max(data) FROM giornate g WHERE g.atleta_id = u.id AND g.stato = 'completata') AS ultimo,
            (SELECT count(*) FROM giornate g WHERE g.atleta_id = u.id AND g.stato = 'completata') AS allenamenti,
            (SELECT count(*) FROM schede s WHERE s.atleta_id = u.id AND s.archiviata = 0) AS ha_scheda,
            (SELECT count(*) FROM utenti a WHERE a.coach_id = u.id AND a.ruolo = 'atleta') AS n_atleti
       FROM utenti u LEFT JOIN utenti c ON c.id = u.coach_id
      WHERE ?1 = 'admin' OR u.id = ?2 OR (u.coach_id = ?2 AND u.ruolo = 'atleta')
      ORDER BY CASE u.ruolo WHEN 'admin' THEN 0 WHEN 'coach' THEN 1 ELSE 2 END, u.nome COLLATE NOCASE`
  ).bind(io.ruolo, io.id).all();
  return json({ persone: results });
}

export async function crea(request, env, io) {
  richiedi(io, 'admin', 'coach');
  const d = await corpo(request);
  const nome = testo(d.nome, 40), username = pulisciUsername(d.username);
  if (!nome) fallisci(400, 'Scrivi il nome');
  if (!username) fallisci(400, 'Scrivi lo username');
  controllaPassword(d.password);
  let ruolo = d.ruolo === 'coach' ? 'coach' : 'atleta';
  let coachId = io.id;
  if (io.ruolo === 'admin') {
    if (ruolo === 'coach') coachId = null;
    else if (d.coach_id) {
      const c = await env.DB.prepare(`SELECT id FROM utenti WHERE id = ? AND ruolo IN ('coach','admin')`).bind(intero(d.coach_id)).first();
      if (!c) fallisci(400, 'Coach non valido');
      coachId = c.id;
    }
  } else if (ruolo === 'coach') fallisci(403, 'Solo l’admin può creare un coach');
  const cambio = d.cambio === false ? 0 : 1;
  try {
    const r = await env.DB.prepare(
      'INSERT INTO utenti (nome, username, password_hash, ruolo, coach_id, cambio_password) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(nome, username, await hashPassword(d.password), ruolo, coachId, cambio).run();
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  } catch (e) {
    if (/UNIQUE/i.test(String(e.message))) fallisci(409, 'Questo username è già usato');
    throw e;
  }
}

export async function modifica(request, env, io, id) {
  const u = await gestibile(env, io, id);
  const d = await corpo(request);
  const set = [], val = [];
  if (d.nome !== undefined) { const n = testo(d.nome, 40); if (!n) fallisci(400, 'Scrivi il nome'); set.push('nome = ?'); val.push(n); }
  if (d.username !== undefined) { const n = pulisciUsername(d.username); if (!n) fallisci(400, 'Scrivi lo username'); set.push('username = ?'); val.push(n); }
  if (d.coach_id !== undefined) {
    richiedi(io, 'admin');
    if (u.ruolo !== 'atleta') fallisci(400, 'Si può assegnare un coach solo a un atleta');
    const c = await env.DB.prepare(`SELECT id FROM utenti WHERE id = ? AND ruolo IN ('coach','admin')`).bind(intero(d.coach_id)).first();
    if (!c) fallisci(400, 'Coach non valido');
    set.push('coach_id = ?'); val.push(c.id);
  }
  if (d.attivo !== undefined) {
    if (u.id === io.id) fallisci(400, 'Non puoi disattivare il tuo profilo');
    set.push('attivo = ?'); val.push(d.attivo ? 1 : 0);
  }
  if (!set.length) return json({ ok: true });
  try {
    await env.DB.prepare(`UPDATE utenti SET ${set.join(', ')} WHERE id = ?`).bind(...val, u.id).run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e.message))) fallisci(409, 'Questo username è già usato');
    throw e;
  }
  if (d.attivo === false) await env.DB.prepare('DELETE FROM sessioni_login WHERE utente_id = ?').bind(u.id).run();
  return json({ ok: true });
}

// Il coach o l'admin impostano una nuova password (dimenticata o iniziale)
export async function reimpostaPassword(request, env, io, id) {
  const u = await gestibile(env, io, id);
  if (u.id === io.id) fallisci(400, 'Per la tua password usa Profilo → Cambia password');
  const d = await corpo(request);
  controllaPassword(d.password);
  await env.DB.batch([
    env.DB.prepare('UPDATE utenti SET password_hash = ?, cambio_password = ? WHERE id = ?').bind(await hashPassword(d.password), d.cambio === false ? 0 : 1, u.id),
    env.DB.prepare('DELETE FROM sessioni_login WHERE utente_id = ?').bind(u.id),
  ]);
  return json({ ok: true });
}

export async function elimina(env, io, id) {
  const u = await gestibile(env, io, id);
  if (u.id === io.id) fallisci(400, 'Non puoi eliminare il tuo profilo');
  if (u.ruolo === 'admin') fallisci(400, 'L’admin non si può eliminare');
  const stmt = [];
  if (u.ruolo === 'coach') {
    const admin = await env.DB.prepare(`SELECT id FROM utenti WHERE ruolo = 'admin'`).first();
    // Gli atleti del coach passano all'admin, così non restano senza riferimento
    stmt.push(env.DB.prepare('UPDATE utenti SET coach_id = ? WHERE coach_id = ?').bind(admin?.id ?? null, u.id));
  }
  stmt.push(env.DB.prepare('DELETE FROM utenti WHERE id = ?').bind(u.id));
  await env.DB.batch(stmt);
  return json({ ok: true });
}

// Cambio della propria password
export async function cambiaPassword(request, env, io) {
  const d = await corpo(request);
  controllaPassword(d.nuova);
  const u = await env.DB.prepare('SELECT password_hash, cambio_password FROM utenti WHERE id = ?').bind(io.id).first();
  if (!u.cambio_password && !(await verificaPassword(String(d.attuale ?? ''), u.password_hash))) fallisci(400, 'La password attuale non è corretta');
  await env.DB.prepare('UPDATE utenti SET password_hash = ?, cambio_password = 0 WHERE id = ?').bind(await hashPassword(d.nuova), io.id).run();
  await chiudiAltreSessioni(request, env, io.id);
  return json({ ok: true });
}
