// GymTime · schermate di coach e admin
import { api, esc, iniziale, dataCorta, RUOLI } from './api.js';
import { stato, app, rotta, pagina, attesa, toast, chiedi, finestra, vai } from './ui.js';
import { montaOmino, ominoSVG, ANIMAZIONI, animazione, animazioneVariante, VARIANTI_OMINO, POSE } from './omino.js';
import { montaOmino3D } from './omino3d.js';
import { MODALITA, CAMPI, CAMPI_PROG, etichetta, rxTesto, valoriSettimana, lunedi, norm, pulisciVariante, testoVariante } from './regole.js';
import { campoPeriodo, leggiPeriodo, controllaPeriodo, partiPeriodo, sceltePeriodo, fotoPerInvio } from './storico-schede.js';
import { sceltaLibreria } from './mobilita-libreria.js';

const PIU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const SU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
const GIU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const COPIA = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>';
const CESTINO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
const virgola = n => String(n).replace('.', ',');
const oggiISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
const clona = o => JSON.parse(JSON.stringify(o));
const numero = v => { const s = String(v ?? '').trim().replace(',', '.'); if (!s) return null; const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : null; };
const valoreCampo = (c, raw) => (c === 'rip' && /^\s*\d+\s*[-–]\s*\d+\s*$/.test(raw)) ? raw.replace(/\s/g, '').replace('–', '-') : (c === 'testo' ? raw : numero(raw));
const PREDEFINITI = { setrep: { serie: 3, rip: 10 }, emom: { minuti: 10, rip: 5 }, amrap: { minuti: 10 }, tempo: { serie: 3, secondi: 30 }, cardio: { serie: 1, secondi: 600 }, rt: { rip: 50 }, ladder: { da: 1, a: 5, passo: 1 }, free: { testo: '' } };

// Libreria in memoria per editor e scelte
let LIB = null;
async function libreria(forza = false) {
  if (!LIB || forza) LIB = (await api('/api/libreria')).esercizi;
  return LIB;
}
const libPerId = id => (LIB || []).find(x => x.id === id);

/* ======================= PERSONE ======================= */
let segPersone = 'atleti';
rotta(/^\/persone$/, async () => {
  const io = stato.io;
  attesa(io.ruolo === 'admin' ? 'Persone' : 'Atleti', '#/profilo');
  const { persone } = await api('/api/utenti');
  const disegna = () => {
    const coach = persone.filter(p => p.ruolo === 'coach');
    const lista = io.ruolo === 'admin' && segPersone === 'coach' ? coach
      : persone.filter(p => p.ruolo === 'atleta' || p.id === io.id);
    pagina({ titolo: io.ruolo === 'admin' ? 'Persone' : 'Atleti', indietro: '#/profilo', html: `
      ${io.ruolo === 'admin' ? `<div class="seg" role="tablist" style="margin-top:12px"><button type="button" data-seg="atleti" aria-current="${segPersone === 'atleti'}">Atleti</button>
        <button type="button" data-seg="coach" aria-current="${segPersone === 'coach'}">Coach (${coach.length})</button></div>` : '<div style="height:10px"></div>'}
      <input type="search" id="cerca" placeholder="Cerca per nome o username" aria-label="Cerca" autocomplete="off">
      <ul class="persone">${lista.map(p => rigaPersona(p, io)).join('') || '<li class="empty">Nessuno ancora: crea il primo con il tasto in basso.</li>'}</ul>`,
      barra: `<button class="btn primary big" type="button" id="nuovo">${PIU} ${io.ruolo === 'admin' && segPersone === 'coach' ? 'Nuovo coach' : 'Nuovo atleta'}</button>` });
    app.onclick = e => {
      const s = e.target.closest('[data-seg]');
      if (s) { segPersone = s.dataset.seg; disegna(); }
    };
    document.getElementById('cerca').oninput = e => {
      const q = norm(e.target.value);
      app.querySelectorAll('.persone > li[data-cerca]').forEach(li => { li.hidden = q && !li.dataset.cerca.includes(q); });
    };
    document.getElementById('nuovo').onclick = () => nuovaPersona(io.ruolo === 'admin' && segPersone === 'coach' ? 'coach' : 'atleta', coach);
  };
  disegna();
});

function rigaPersona(p, io) {
  const sub = p.ruolo === 'coach' ? `${p.n_atleti} ${p.n_atleti === 1 ? 'atleta' : 'atleti'}`
    : p.ultimo ? `Ultimo allenamento ${dataCorta(p.ultimo)} · ${p.allenamenti} in totale` : 'Nessun allenamento ancora';
  return `<li data-cerca="${esc(norm(p.nome + ' ' + p.username))}"><a class="persona" href="#/atleta/${p.id}">
    <span class="avatar sm">${esc(iniziale(p.nome))}</span>
    <span class="p-testo"><b>${esc(p.nome)}${p.id === io.id ? ' <span class="tag gold">Tu</span>' : ''}</b>
      <span class="small muted">@${esc(p.username)}${io.ruolo === 'admin' && p.ruolo === 'atleta' && p.coach_nome ? ` · coach ${esc(p.coach_nome)}` : ''}</span>
      <span class="small muted">${esc(sub)}</span></span>
    <span class="p-tag">${!p.attivo ? '<span class="tag">Disattivato</span>' : p.ruolo !== 'coach' && !p.ha_scheda ? '<span class="tag bordeaux">Senza scheda</span>' : ''}</span>
  </a></li>`;
}

function nuovaPersona(ruolo, coach) {
  const io = stato.io;
  const v = finestra(`<h3>${ruolo === 'coach' ? 'Nuovo coach' : 'Nuovo atleta'}</h3>
    <form class="stack" novalidate style="margin-top:10px">
      <label>Nome<input name="nome" autocomplete="off" placeholder="Es. Diego"></label>
      <label>Username<input name="username" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Es. diego"></label>
      <label>Password<span class="campo-pw"><input name="password" autocomplete="off" autocapitalize="none" spellcheck="false">
        <button type="button" data-genera>Genera</button></span></label>
      ${io.ruolo === 'admin' && ruolo === 'atleta' ? `<label>Coach<select name="coach_id"><option value="${io.id}">${esc(io.nome)} (tu)</option>
        ${coach.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select></label>` : ''}
      <label class="check"><input type="checkbox" name="cambio" checked> Chiedi di cambiarla al primo accesso</label>
      <p class="err" role="alert"></p>
      <div class="azioni"><button class="btn" type="button" data-chiudi>Annulla</button><button class="btn primary" type="submit">Crea</button></div>
    </form>`);
  const f = v.querySelector('form');
  f.nome.focus();
  f.nome.oninput = () => { if (!f.username.dataset.toccato) f.username.value = norm(f.nome.value).replace(/\s+/g, '.'); };
  f.username.oninput = () => { f.username.dataset.toccato = '1'; };
  v.querySelector('[data-genera]').onclick = () => { f.password.value = 'gym' + String(Math.floor(1000 + Math.random() * 9000)); };
  v.querySelector('[data-chiudi]').onclick = () => v.remove();
  f.onsubmit = async e => {
    e.preventDefault();
    const err = f.querySelector('.err'); err.textContent = '';
    const dati = { nome: f.nome.value.trim(), username: f.username.value.trim(), password: f.password.value, ruolo, cambio: f.cambio.checked };
    if (f.coach_id) dati.coach_id = Number(f.coach_id.value);
    try {
      const r = await api('/api/utenti', { metodo: 'POST', dati });
      v.remove();
      const cred = `GymTime\nUsername: ${dati.username}\nPassword: ${dati.password}`;
      const w = finestra(`<h3>Profilo creato: ${esc(dati.nome)}</h3><p class="muted">Dagli queste credenziali per entrare${dati.cambio ? ': al primo accesso sceglierà la sua password' : ''}.</p>
        <div class="credenziali"><div><span class="muted small">Username</span><b>${esc(dati.username)}</b></div><div><span class="muted small">Password</span><b>${esc(dati.password)}</b></div></div>
        <div class="azioni"><button class="btn" type="button" data-copia>${COPIA} Copia</button><a class="btn primary" href="#/atleta/${r.id}">${ruolo === 'atleta' ? 'Crea scheda' : 'Apri'}</a></div>`);
      w.querySelector('[data-copia]').onclick = async () => { try { await navigator.clipboard.writeText(cred); toast('Credenziali copiate'); } catch { toast('Copia non riuscita'); } };
      w.querySelector('a').addEventListener('click', () => w.remove());
      if (ruolo === 'atleta') segPersone = 'atleti';
      w.addEventListener('click', ev => { if (ev.target === w) vai('#/persone'); });
    } catch (ex) { err.textContent = ex.message; }
  };
}

/* ======================= PAGINA DI UNA PERSONA ======================= */
rotta(/^\/atleta\/(\d+)$/, async id => {
  const io = stato.io;
  id = Number(id);
  attesa('Profilo', '#/persone');
  const [{ persone }, sch] = await Promise.all([api('/api/utenti'), api(`/api/schede/${id}`)]);
  const p = persone.find(x => x.id === id);
  if (!p) return vai('#/persone');
  const coach = persone.filter(x => x.ruolo === 'coach');
  const s = sch.scheda;
  const io_ = p.id === io.id;
  pagina({ titolo: p.nome, indietro: '#/persone', html: `
    <div class="profilo-testa"><span class="avatar">${esc(iniziale(p.nome))}</span>
      <div><h2 style="margin:0">${esc(p.nome)}${io_ ? ' <span class="tag gold">Tu</span>' : ''}</h2><p class="muted">@${esc(p.username)} · ${RUOLI[p.ruolo]}${!p.attivo ? ' · disattivato' : ''}</p></div></div>

    <section class="card">
      <div class="card-testa"><h3>Scheda</h3>${s && s.settimane > 1 ? `<span class="tag gold">Settimana ${sch.settimana.settimana} di ${s.settimane}</span>` : ''}</div>
      ${s ? `<p class="scheda-nome">${esc(s.nome)}</p>
        <p class="small muted">${s.giorni.length} ${s.giorni.length === 1 ? 'giorno' : 'giorni'} · ${s.giorni.reduce((a, g) => a + g.esercizi.length, 0)} esercizi · aggiornata ${dataCorta(String(s.aggiornata_il).slice(0, 10))}</p>
        <div class="gc-omini">${s.giorni.flatMap(g => g.esercizi).slice(0, 6).map(e => `<span class="mini">${ominoSVG(e.animazione)}</span>`).join('')}</div>
        <div class="azioni-riga"><a class="btn primary" href="#/scheda/${id}">Modifica</a><a class="btn" href="#/importa/${id}">Importa</a><button class="btn" type="button" id="duplica">Duplica su…</button></div>`
      : `<p class="hint">${io_ ? 'Non hai ancora una scheda tua.' : 'Nessuna scheda attiva.'} Creala a mano o importala da testo, voce o file.</p>
        <div class="azioni-riga"><a class="btn primary" href="#/scheda/${id}">Crea scheda</a><a class="btn" href="#/importa/${id}">Importa</a></div>`}
      ${sch.archivio.length ? `<details class="archivio"><summary>Archivio (${sch.archivio.length})</summary><ul>${sch.archivio.map(a => `
        <li><span><b>${esc(a.nome)}</b><span class="small muted">fino al ${dataCorta(String(a.aggiornata_il).slice(0, 10))}</span></span>
        <span class="azioni-mini"><button type="button" class="link" data-vedi="${a.id}">Vedi</button><button type="button" class="link" data-ripristina="${a.id}">Ripristina</button></span></li>`).join('')}</ul></details>` : ''}
    </section>

    <section class="card">
      <div class="card-testa"><h3>Storico</h3></div>
      <p class="small muted">${p.ultimo ? `Ultimo allenamento ${dataCorta(p.ultimo)} · ${p.allenamenti} in totale` : 'Nessun allenamento salvato'}</p>
      <div class="azioni-riga"><a class="btn" href="#/storico/${id}">Apri storico</a><a class="btn" href="#/storico/${id}/schede">Schede</a><a class="btn" href="#/importa/${id}/storico">Aggiungi scheda vecchia</a></div>
    </section>

    ${io_ ? '' : `<section class="card">
      <div class="card-testa"><h3>Profilo</h3></div>
      <form id="f-profilo" class="stack" novalidate>
        <div class="two"><label>Nome<input name="nome" value="${esc(p.nome)}"></label><label>Username<input name="username" value="${esc(p.username)}" autocapitalize="none" spellcheck="false"></label></div>
        ${io.ruolo === 'admin' && p.ruolo === 'atleta' ? `<label>Coach<select name="coach_id"><option value="${io.id}" ${p.coach_id === io.id ? 'selected' : ''}>${esc(io.nome)} (tu)</option>
          ${coach.map(c => `<option value="${c.id}" ${p.coach_id === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></label>` : ''}
        <button class="btn" type="submit">Salva profilo</button>
      </form>
      <hr>
      <div class="azioni-riga"><button class="btn" type="button" id="reset-pw">Nuova password</button>
        <button class="btn" type="button" id="attivo">${p.attivo ? 'Disattiva' : 'Riattiva'}</button>
        <button class="btn danger" type="button" id="elimina">Elimina</button></div>
    </section>`}` });

  app.onclick = async e => {
    const vedi = e.target.closest('[data-vedi]');
    if (vedi) {
      const { scheda } = await api(`/api/archivio/${vedi.dataset.vedi}`);
      const w = finestra(`<h3>${esc(scheda.nome)}</h3><div class="riepilogo">${scheda.giorni.map(g => `<p><b>${esc(g.nome)}</b></p><ul>${g.esercizi.map(x => `<li>${esc(x.nome)}: ${esc(rxTesto(x.modalita, x.parametri))}</li>`).join('')}</ul>`).join('')}</div>
        <div class="azioni"><button class="btn primary" type="button" data-chiudi>Chiudi</button></div>`);
      w.querySelector('[data-chiudi]').onclick = () => w.remove();
      return;
    }
    const rip = e.target.closest('[data-ripristina]');
    if (rip) {
      if (!await chiedi({ titolo: 'Ripristinare questa scheda?', testo: s ? 'La scheda attuale va in archivio e questa torna attiva.' : 'Torna a essere la scheda attiva.', ok: 'Ripristina' })) return;
      try { await api(`/api/archivio/${rip.dataset.ripristina}/ripristina`, { metodo: 'POST' }); toast('Scheda ripristinata'); vai(`#/atleta/${id}`); } catch (ex) { toast(ex.message); }
    }
  };
  document.getElementById('duplica')?.addEventListener('click', () => duplica(id, persone.filter(x => x.id !== id && (x.ruolo === 'atleta' || x.id === io.id))));
  const f = document.getElementById('f-profilo');
  if (f) f.onsubmit = async e => {
    e.preventDefault();
    const dati = { nome: f.nome.value.trim(), username: f.username.value.trim() };
    if (f.coach_id) dati.coach_id = Number(f.coach_id.value);
    try { await api(`/api/utenti/${id}`, { metodo: 'PUT', dati }); toast('Profilo salvato'); vai(`#/atleta/${id}`); } catch (ex) { toast(ex.message); }
  };
  document.getElementById('reset-pw')?.addEventListener('click', () => {
    const w = finestra(`<h3>Nuova password per ${esc(p.nome)}</h3><form class="stack" novalidate style="margin-top:10px">
      <label>Password<span class="campo-pw"><input name="password" autocomplete="off" autocapitalize="none" spellcheck="false"><button type="button" data-genera>Genera</button></span></label>
      <label class="check"><input type="checkbox" name="cambio" checked> Chiedi di cambiarla al primo accesso</label><p class="err" role="alert"></p>
      <div class="azioni"><button class="btn" type="button" data-chiudi>Annulla</button><button class="btn primary" type="submit">Salva</button></div></form>`);
    const ff = w.querySelector('form'); ff.password.focus();
    w.querySelector('[data-genera]').onclick = () => { ff.password.value = 'gym' + String(Math.floor(1000 + Math.random() * 9000)); };
    w.querySelector('[data-chiudi]').onclick = () => w.remove();
    ff.onsubmit = async e => {
      e.preventDefault();
      try { await api(`/api/utenti/${id}/password`, { metodo: 'POST', dati: { password: ff.password.value, cambio: ff.cambio.checked } }); w.remove(); toast(`Password aggiornata: ${ff.password.value}`); }
      catch (ex) { ff.querySelector('.err').textContent = ex.message; }
    };
  });
  document.getElementById('attivo')?.addEventListener('click', async () => {
    if (p.attivo && !await chiedi({ titolo: `Disattivare ${p.nome}?`, testo: 'Non potrà più entrare finché non lo riattivi. I dati restano.', ok: 'Disattiva', pericolo: true })) return;
    try { await api(`/api/utenti/${id}`, { metodo: 'PUT', dati: { attivo: !p.attivo } }); vai(`#/atleta/${id}`); } catch (ex) { toast(ex.message); }
  });
  document.getElementById('elimina')?.addEventListener('click', async () => {
    const testo = p.ruolo === 'coach' ? 'I suoi atleti passano a te, con schede e storico.' : 'Si cancellano per sempre scheda, storico, voti e sensazioni.';
    if (!await chiedi({ titolo: `Eliminare ${p.nome}?`, testo, ok: 'Elimina', pericolo: true })) return;
    try { await api(`/api/utenti/${id}`, { metodo: 'DELETE' }); toast('Eliminato'); vai('#/persone'); } catch (ex) { toast(ex.message); }
  });
});

function duplica(daId, verso) {
  if (!verso.length) return toast('Non ci sono altri atleti');
  const w = finestra(`<h3>Duplica la scheda</h3><p class="muted small">La copia parte dalla settimana 1 con la progressione. Se l’atleta ha già una scheda, quella va in archivio.</p>
    <form class="stack" novalidate style="margin-top:10px"><label>Su quale atleta?<select name="verso">${verso.map(x => `<option value="${x.id}">${esc(x.nome)}${x.ha_scheda ? ' (ha già una scheda)' : ''}</option>`).join('')}</select></label>
    <label>Inizio (settimana 1)<input type="date" name="inizio" value="${oggiISO()}"></label>
    <div class="azioni"><button class="btn" type="button" data-chiudi>Annulla</button><button class="btn primary" type="submit">Duplica</button></div></form>`);
  const f = w.querySelector('form');
  w.querySelector('[data-chiudi]').onclick = () => w.remove();
  f.onsubmit = async e => {
    e.preventDefault();
    try { await api(`/api/schede/${daId}/duplica`, { metodo: 'POST', dati: { verso: Number(f.verso.value), inizio: f.inizio.value } }); w.remove(); toast('Scheda duplicata'); vai(`#/atleta/${f.verso.value}`); }
    catch (ex) { toast(ex.message); }
  };
}

/* ======================= EDITOR DELLA SCHEDA ======================= */
const bozze = {};          // schede importate in attesa di controllo, per atleta
const E = { atleta: null };
const nuovoEsercizio = (x, modalita) => {
  const m = modalita || (x && MODALITA[x.modalita_default] ? x.modalita_default : 'setrep');
  return { esercizio_id: x ? x.id : null, nome: x ? x.nome : 'Esercizio', modalita: m, parametri: clona(PREDEFINITI[m]), tecnica: null, nota: '', gruppo: null, progressione: null,
    animazione: x ? x.animazione : 'free', variante: variantePredefinita(x), aperto: true };
};

/* Varianti dell'omino: attrezzo, gradi della panca, rialzi di mani e piedi */
const variantiDi = e => VARIANTI_OMINO[animazione(e.animazione)] || null;
const posaDi = e => animazioneVariante(e.animazione, e.variante);
const maiuscola = t => t[0].toUpperCase() + t.slice(1);
// Dal campo attrezzo della libreria: "Manubri, panca" → manubri
function variantePredefinita(x) {
  const v = x && VARIANTI_OMINO[animazione(x.animazione)];
  if (!v?.attrezzi) return null;
  const a = norm(x.attrezzo);
  const att = /cav/.test(a) ? 'cavi' : /bilanc|\bez\b|t bar|multipower/.test(a) ? 'bilanciere' : /manub|kettlebell/.test(a) ? 'manubri' : null;
  return att && v.attrezzi.includes(att) ? { attrezzo: att } : null;
}

/* Superserie: esercizi vicini con lo stesso gruppo.
   Giri = serie (uguali per tutti), recupero dopo il giro = rec dell'ultimo, pausa prima del successivo = parametri.pausa */
const SS_MODALITA = ['setrep', 'tempo', 'cardio'];
function blocchi(es) {
  const out = [];
  es.forEach((e, i) => {
    if (e.gruppo && i > 0 && es[i - 1].gruppo === e.gruppo) out[out.length - 1].fine = i;
    else out.push({ inizio: i, fine: i, gruppo: e.gruppo || null });
  });
  return out;
}
const bloccoDi = (es, i) => blocchi(es).find(b => i >= b.inizio && i <= b.fine);
function inSuperserie(e) {
  if (SS_MODALITA.includes(e.modalita)) return;
  const p = clona(PREDEFINITI.setrep);
  for (const c of ['rip', 'carico']) if (e.parametri[c] !== undefined) p[c] = e.parametri[c];
  Object.assign(e, { modalita: 'setrep', parametri: p, progressione: null });
}
// Lettere A, B, C… in ordine, gruppi da un solo esercizio sciolti, giri e recupero allineati
function normalizzaGruppi(g) {
  let n = 0;
  for (const b of blocchi(g.esercizi)) {
    if (!b.gruppo) { delete g.esercizi[b.inizio].parametri.pausa; continue; }
    const membri = g.esercizi.slice(b.inizio, b.fine + 1);
    if (membri.length < 2) { membri[0].gruppo = null; delete membri[0].parametri.pausa; continue; }
    const lettera = String.fromCharCode(65 + n++);
    membri.forEach(inSuperserie);
    const giri = membri[0].parametri.serie ?? 3;
    const rec = membri.map(e => e.parametri.rec).filter(v => v !== undefined).pop();
    membri.forEach((e, k) => {
      e.gruppo = lettera;
      e.parametri.serie = giri;
      if (k < membri.length - 1) delete e.parametri.rec;
      else { delete e.parametri.pausa; if (rec !== undefined) e.parametri.rec = rec; }
    });
  }
}
function sciogliGruppo(g, b) {
  const membri = g.esercizi.slice(b.inizio, b.fine + 1);
  const rec = membri[membri.length - 1].parametri.rec;
  membri.forEach(e => { e.gruppo = null; delete e.parametri.pausa; if (rec !== undefined) e.parametri.rec = rec; });
}
// Esercizio da aggiungere in una superserie, subito dopo la posizione dopo
function aggiungiInGruppo(g, dopo, x) {
  const e = nuovoEsercizio(x);
  inSuperserie(e);
  e.gruppo = g.esercizi[dopo].gruppo;
  g.esercizi.forEach(y => { y.aperto = false; });
  g.esercizi.splice(dopo + 1, 0, e);
  normalizzaGruppi(g);
}

window.addEventListener('beforeunload', ev => { if (E.sporco && (location.hash.startsWith('#/scheda/') || location.hash.startsWith('#/storico-scheda/'))) { ev.preventDefault(); ev.returnValue = ''; } });

rotta(/^\/scheda\/(\d+)$/, async id => {
  id = Number(id);
  attesa('Scheda', `#/atleta/${id}`);
  const [sch] = await Promise.all([api(`/api/schede/${id}`), libreria()]);
  const bozza = bozze[id];
  let s;
  if (bozza) {
    s = { nome: 'Scheda importata', settimane: 1, inizio: lunedi(oggiISO()), scarico: [],
      giorni: bozza.giorni.map(g => ({ nome: g.nome, esercizi: g.esercizi.map(x => ({ ...x, nota: x.nota || '', animazione: libPerId(x.esercizio_id)?.animazione || 'free', aperto: false })) })) };
  } else if (sch.scheda) {
    s = { nome: sch.scheda.nome, settimane: sch.scheda.settimane, inizio: sch.scheda.inizio || lunedi(String(sch.scheda.creata_il).slice(0, 10)), scarico: sch.scheda.scarico || [],
      giorni: sch.scheda.giorni.map(g => ({ nome: g.nome, esercizi: g.esercizi.map(x => ({ esercizio_id: x.esercizio_id, nome: x.nome, modalita: x.modalita, parametri: x.parametri, tecnica: x.tecnica,
        nota: x.nota || '', gruppo: x.gruppo, progressione: x.progressione, animazione: x.animazione, variante: x.variante || null, aperto: false })) })) };
  } else {
    s = { nome: 'Scheda', settimane: 1, inizio: lunedi(oggiISO()), scarico: [], giorni: [{ nome: 'Giorno 1', esercizi: [] }] };
  }
  s.giorni.forEach(normalizzaGruppi);
  Object.assign(E, { atleta: id, nomeAtleta: sch.atleta.nome, esiste: !!sch.scheda, scheda: s, giorno: 0, sporco: !!bozza, bozza: bozza || null, storico: false, storicoId: null });
  delete bozze[id];
  disegnaEditor();
});

// Editor di una scheda vecchia per lo storico: nuova (da un'importazione) o importata da correggere.
// Non diventa mai la scheda attiva.
const esercizioEditor = x => ({ esercizio_id: x.esercizio_id, nome: x.nome, modalita: x.modalita, parametri: x.parametri, tecnica: x.tecnica,
  nota: x.nota || '', gruppo: x.gruppo, progressione: x.progressione, animazione: x.animazione || libPerId(x.esercizio_id)?.animazione || 'free', variante: x.variante || null, aperto: false });
rotta(/^\/storico-scheda\/(\d+)\/(nuova|\d+)$/, async (id, sid) => {
  id = Number(id);
  const indietro = `#/storico/${id}/schede`;
  attesa('Scheda vecchia', indietro);
  const [sch] = await Promise.all([api(`/api/schede/${id}`), libreria()]);
  let s, bozza = null, storicoId = null;
  if (sid === 'nuova') {
    bozza = bozze[`s${id}`];
    if (!bozza) return vai(`#/importa/${id}/storico`);
    s = { nome: 'Scheda vecchia', settimane: 1, inizio: null, scarico: [], periodo_dal: null, periodo_al: null, nota: '',
      giorni: bozza.giorni.map(g => ({ nome: g.nome, esercizi: g.esercizi.map(esercizioEditor) })) };
  } else {
    storicoId = Number(sid);
    const { scheda } = await api(`/api/archivio/${storicoId}`);
    if (scheda.origine !== 'importata') return vai(indietro);
    s = { nome: scheda.nome, settimane: scheda.settimane, inizio: null, scarico: scheda.scarico || [], periodo_dal: scheda.periodo_dal, periodo_al: scheda.periodo_al, nota: scheda.nota || '',
      giorni: scheda.giorni.map(g => ({ nome: g.nome, esercizi: g.esercizi.map(esercizioEditor) })) };
  }
  s.pp = { dal: partiPeriodo(s.periodo_dal), al: partiPeriodo(s.periodo_al) };
  s.giorni.forEach(normalizzaGruppi);
  Object.assign(E, { atleta: id, nomeAtleta: sch.atleta.nome, esiste: false, scheda: s, giorno: 0, sporco: !!bozza, bozza, storico: true, storicoId });
  delete bozze[`s${id}`];
  disegnaEditor();
});

function disegnaEditor() {
  const s = E.scheda;
  const mia = E.atleta === stato.io.id;
  const titolo = E.storico ? (mia ? 'La tua scheda vecchia' : `Scheda vecchia di ${E.nomeAtleta}`) : (mia ? 'La tua scheda' : `Scheda di ${E.nomeAtleta}`);
  const nonTrovati = E.bozza?.non_trovati?.length ? ` Non trovati in libreria: ${esc(E.bozza.non_trovati.join(', '))}. Puoi lasciarli così o sceglierli con “Cambia”.` : '';
  pagina({ titolo, indietro: E.storico ? `#/storico/${E.atleta}/schede` : `#/atleta/${E.atleta}`, largo: true, html: `
    ${E.storico ? `<div class="avviso"><b>${E.bozza ? `Anteprima importata${E.bozza.metodo === 'ai' ? ' con Workers AI' : ''}` : 'Scheda dello storico'}</b>
      <p>Resta nello storico e non diventa la scheda attiva. Controlla esercizi, numeri e periodo, poi salva.${nonTrovati}</p></div>`
    : E.bozza ? `<div class="avviso"><b>Anteprima importata${E.bozza.metodo === 'ai' ? ' con Workers AI' : ''}</b>
      <p>Controlla esercizi e numeri, poi salva.${nonTrovati}</p></div>` : ''}
    <section class="card">
      <div class="two"><label>Nome della scheda<input data-s="nome" value="${esc(s.nome)}"></label>
        <label>Settimane<select data-s="settimane">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${s.settimane === i + 1 ? 'selected' : ''}>${i + 1 === 1 ? '1 (sempre uguale)' : i + 1}</option>`).join('')}</select></label></div>
      ${E.storico ? `<div class="two periodi" style="margin-top:10px">${campoPeriodo('dal', 'Dal', s.pp.dal)}${campoPeriodo('al', 'Al (facoltativo)', s.pp.al)}</div>
        <p class="small muted" style="margin-top:6px">Basta mese e anno. Il giorno è facoltativo.</p>
        <label style="margin-top:10px">Nota (facoltativa)<input data-s="nota" value="${esc(s.nota)}" maxlength="300" placeholder="Es. preparazione estiva, dal quaderno"></label>` : ''}
      ${s.settimane > 1 ? `<div class="two" style="margin-top:10px">${E.storico ? '' : `<label>Inizio settimana 1<input type="date" data-s="inizio" value="${esc(s.inizio)}"></label>`}
        <div><span class="lbl">Settimane di scarico</span><div class="chips">${Array.from({ length: s.settimane }, (_, i) => `<button type="button" class="chip sm" data-scarico="${i + 1}" aria-pressed="${s.scarico.includes(i + 1)}">${i + 1}</button>`).join('')}</div></div></div>
        <p class="small muted" style="margin-top:8px">${E.storico ? '' : 'La settimana 1 parte dal lunedì scelto. '}Nelle progressioni ogni valore resta valido anche per le settimane dopo, finché non lo cambi.</p>` : ''}
    </section>
    <div class="tabs-giorni" role="tablist">${s.giorni.map((g, i) => `<button type="button" role="tab" data-giorno="${i}" aria-selected="${i === E.giorno}">${esc(g.nome || `Giorno ${i + 1}`)}<span class="n">${g.esercizi.length}</span></button>`).join('')}
      <button type="button" class="tab-piu" data-act="giorno-nuovo" aria-label="Aggiungi giorno">${PIU}</button></div>
    <div id="giorno">${htmlGiorno()}</div>`,
    barra: E.storico
      ? `${E.storicoId ? '<button class="btn" type="button" id="altro">Altro</button>' : ''}<button class="btn primary grow" type="button" id="salva">Salva nello storico</button>`
      : `<button class="btn" type="button" id="altro">Altro</button><button class="btn primary grow" type="button" id="salva">${E.bozza && E.esiste ? 'Salva come nuova' : 'Salva scheda'}</button>` });
  collegaEditor();
}

function htmlGiorno() {
  const g = E.scheda.giorni[E.giorno];
  if (!g) return '';
  return `<div class="giorno-testa"><label class="grow">Nome del giorno<input data-g="nome" value="${esc(g.nome)}"></label>
      <div class="azioni-mini"><button type="button" class="btn sm" data-act="giorno-sx" ${E.giorno === 0 ? 'disabled' : ''} aria-label="Sposta a sinistra">‹</button>
      <button type="button" class="btn sm" data-act="giorno-dx" ${E.giorno === E.scheda.giorni.length - 1 ? 'disabled' : ''} aria-label="Sposta a destra">›</button>
      <button type="button" class="btn sm" data-act="giorno-copia" aria-label="Duplica giorno">${COPIA}</button>
      <button type="button" class="btn sm danger" data-act="giorno-elimina" aria-label="Elimina giorno" ${E.scheda.giorni.length === 1 ? 'disabled' : ''}>${CESTINO}</button></div></div>
    <ol class="es-lista">${blocchi(g.esercizi).map(b => b.gruppo ? htmlSuperserie(g, b) : htmlEsercizio(g.esercizi[b.inizio], b.inizio)).join('')}</ol>
    ${g.esercizi.length ? '' : '<div class="empty">Nessun esercizio in questo giorno. Aggiungine uno dalla libreria.</div>'}
    <button type="button" class="btn big aggiungi" data-act="aggiungi">${PIU} Aggiungi esercizio</button>`;
}

function riassuntoProg(e) {
  if (!e.progressione || E.scheda.settimane < 2) return '';
  let ultima = E.scheda.settimane;
  while (ultima > 1 && E.scheda.scarico.includes(ultima)) ultima--;
  const a = valoriSettimana(e, 1).parametri, b = valoriSettimana(e, ultima).parametri;
  const diff = CAMPI_PROG(e.modalita).filter(c => String(a[c] ?? '') !== String(b[c] ?? '')).map(c => `${etichetta(c, e.modalita).replace(' (kg)', '').toLowerCase()} ${virgola(a[c] ?? '–')} → ${virgola(b[c] ?? '–')}`);
  return diff.length ? `<p class="small prog-r">Progressione: ${esc(diff.join(', '))}</p>` : '';
}

// Blocco superserie: giri e recupero in comune, pause tra un esercizio e il successivo
function htmlSuperserie(g, b) {
  const membri = g.esercizi.slice(b.inizio, b.fine + 1), ultimo = membri[membri.length - 1];
  const tutti = blocchi(g.esercizi), k = tutti.indexOf(tutti.find(x => x.inizio === b.inizio));
  return `<li class="ss-blocco" data-blocco="${b.inizio}">
    <div class="ss-testa"><b>Superserie ${esc(b.gruppo)}</b><span class="small muted">${membri.length} esercizi di fila</span><span class="grow"></span>
      <button type="button" class="btn sm" data-act="ss-su" data-i="${b.inizio}" ${k === 0 ? 'disabled' : ''} aria-label="Sposta la superserie su">${SU}</button>
      <button type="button" class="btn sm" data-act="ss-giu" data-i="${b.inizio}" ${k === tutti.length - 1 ? 'disabled' : ''} aria-label="Sposta la superserie giù">${GIU}</button>
      <button type="button" class="btn sm" data-act="ss-sciogli" data-i="${b.inizio}">Sciogli</button></div>
    <div class="two ss-campi"><label>Giri<input data-ss="serie" data-i="${b.inizio}" inputmode="decimal" value="${esc(membri[0].parametri.serie ?? '')}"></label>
      <label>Recupero dopo il giro (s)<input data-ss="rec" data-i="${b.inizio}" inputmode="decimal" value="${esc(ultimo.parametri.rec ?? '')}" placeholder="0"></label></div>
    <ol class="es-lista ss-lista">${membri.map((e, k) => {
      const i = b.inizio + k, dopo = membri[k + 1];
      return htmlEsercizio(e, i, { ss: b, n: k + 1 }) + (dopo ? `<li class="ss-pausa"><label>Pausa prima di ${esc(dopo.nome)}
        <span class="ss-pausa-in"><input data-f="pausa" data-i="${i}" inputmode="decimal" value="${esc(e.parametri.pausa ?? '')}" placeholder="0"> s</span></label></li>` : '');
    }).join('')}</ol>
    <button type="button" class="btn sm ss-piu" data-act="ss-aggiungi" data-i="${b.fine}">${PIU} Aggiungi esercizio alla superserie</button>
  </li>`;
}

// Scelte dell'omino per l'esercizio, solo se la posa ha varianti
function htmlVariante(e, i) {
  const v = variantiDi(e);
  if (!v) return '';
  const cur = e.variante || {};
  const chip = (campo, val, testo) => `<button type="button" class="chip sm" data-var="${campo}" data-val="${esc(val ?? '')}" data-i="${i}" aria-pressed="${String(cur[campo] ?? '') === String(val ?? '')}">${esc(testo)}</button>`;
  const riga = (titolo, chips) => `<div class="var-riga"><span class="lbl">${titolo}</span><div class="chips">${chips.join('')}</div></div>`;
  const gradi = v.gradi?.[cur.attrezzo || v.attrezzi?.[0]] || [];
  return `<div class="var-box"><div class="var-anteprima stage" data-anteprima="${i}"></div><div class="var-scelte">
    ${v.attrezzi ? riga('Attrezzo', [chip('attrezzo', null, 'Come in libreria'), ...v.attrezzi.map(a => chip('attrezzo', a, maiuscola(a)))]) : ''}
    ${gradi.length ? riga('Panca', [chip('panca', null, v.pancaSempre ? 'Come in libreria' : 'Senza panca'), ...gradi.map(d => chip('panca', d, `${d}°`))]) : ''}
    ${v.mani ? riga('Mani', [chip('mani', null, 'A terra'), ...v.mani.map(m => chip('mani', m, maiuscola(m)))]) : ''}
    ${v.piedi ? riga('Piedi', [chip('piedi', null, 'A terra'), ...v.piedi.map(m => chip('piedi', m, maiuscola(m)))]) : ''}
  </div></div>`;
}
function montaAnteprime() {
  app.querySelectorAll('[data-anteprima]').forEach(el => { const e = giornoCorrente().esercizi[Number(el.dataset.anteprima)]; if (e) montaOmino(el, posaDi(e), { forza: true }); });
}

function htmlEsercizio(e, i, opz = {}) {
  const g = E.scheda.giorni[E.giorno];
  const nonInLib = !e.esercizio_id;
  const ss = opz.ss;
  const primo = ss ? i === ss.inizio : i === 0, ultimo = ss ? i === ss.fine : i === g.esercizi.length - 1;
  const modalita = ss ? Object.entries(MODALITA).filter(([k]) => SS_MODALITA.includes(k)) : Object.entries(MODALITA);
  const campi = CAMPI[e.modalita].filter(c => !ss || (c !== 'serie' && c !== 'rec'));
  const vt = testoVariante(e.variante);
  return `<li class="es-card${e.aperto ? ' aperto' : ''}${e.gruppo ? ' in-gruppo' : ''}" data-i="${i}">
    <button type="button" class="es-testa" data-act="apri" data-i="${i}" aria-expanded="${!!e.aperto}">
      <span class="mini">${ominoSVG(posaDi(e))}</span>
      <span class="es-t"><b>${ss ? `<span class="tag gold">${esc(e.gruppo)}${opz.n}</span> ` : ''}${esc(e.nome)}${nonInLib ? ' <span class="tag">non in libreria</span>' : ''}</b>
        <span class="rx sm">${esc(rxTesto(e.modalita, e.parametri))}</span>${vt ? `<span class="small var-t">${esc(vt)}</span>` : ''}${riassuntoProg(e)}</span>
      <span class="freccia">${e.aperto ? SU : GIU}</span>
    </button>
    ${e.aperto ? `<div class="es-corpo">
      <div class="riga-btn"><button type="button" class="btn sm" data-act="cambia" data-i="${i}">Cambia</button>
        <span class="grow"></span>
        <button type="button" class="btn sm" data-act="su" data-i="${i}" ${primo ? 'disabled' : ''} aria-label="Sposta su">${SU}</button>
        <button type="button" class="btn sm" data-act="giu" data-i="${i}" ${ultimo ? 'disabled' : ''} aria-label="Sposta giù">${GIU}</button>
        <button type="button" class="btn sm" data-act="copia" data-i="${i}" aria-label="Duplica">${COPIA}</button>
        <button type="button" class="btn sm danger" data-act="elimina" data-i="${i}" aria-label="Elimina">${CESTINO}</button></div>
      ${nonInLib ? `<label>Nome<input data-k="nome" data-i="${i}" value="${esc(e.nome)}"></label>` : ''}
      <label>Modalità<select data-k="modalita" data-i="${i}">${modalita.map(([k, v]) => `<option value="${k}" ${e.modalita === k ? 'selected' : ''}>${v}</option>`).join('')}
        ${ss ? '' : '<option value="superserie">Superserie (con l’esercizio successivo)</option>'}</select></label>
      ${htmlVariante(e, i)}
      <div class="campi">${campi.map(c => c === 'testo'
        ? `<label class="full">Descrizione<textarea data-f="testo" data-i="${i}" rows="2">${esc(e.parametri.testo || '')}</textarea></label>`
        : `<label>${esc(etichetta(c, e.modalita))}<input data-f="${c}" data-i="${i}" inputmode="${c === 'rip' ? 'text' : 'decimal'}" value="${esc(e.parametri[c] ?? '')}" ${c === 'rip' ? 'placeholder="8 o 8-10"' : ''}></label>`).join('')}
        <label>Tempo esecutivo<input data-k="tempo" data-i="${i}" value="${esc(e.tecnica?.tempo || '')}" placeholder="es. 3-1-1-0" autocapitalize="characters"></label></div>
      <label>Note e accorgimenti per l’atleta<textarea data-k="nota" data-i="${i}" rows="2" placeholder="Es. elastico se serve, presa stretta…">${esc(e.nota || '')}</textarea></label>
      ${E.scheda.settimane > 1 ? htmlProgressione(e, i) : ''}
    </div>` : ''}
  </li>`;
}

function htmlProgressione(e, i) {
  const s = E.scheda, campi = [...CAMPI_PROG(e.modalita), 'tempo'];
  const prog = e.progressione || {};
  const lbl = c => c === 'tempo' ? 'Tempo' : etichetta(c, e.modalita).replace(' (kg)', ' kg').replace('Ripetizioni', 'Rip.').replace('Recupero (s)', 'Rec. s').replace('Rip. al minuto', 'Rip./min').replace('Ripetizioni totali', 'Rip. tot.');
  const righe = Array.from({ length: s.settimane }, (_, k) => {
    const w = k + 1, val = valoriSettimana(e, w);
    const cella = c => {
      const corrente = c === 'tempo' ? (val.tecnica?.tempo || '') : (val.parametri[c] ?? '');
      if (w === 1) return `<td class="base">${esc(virgola(corrente) || '–')}</td>`;
      const esplicito = prog[w]?.[c];
      return `<td><input data-p="${w}:${c}" data-i="${i}" value="${esc(esplicito === undefined ? '' : virgola(esplicito))}" placeholder="${esc(virgola(corrente))}" inputmode="${c === 'rip' || c === 'tempo' ? 'text' : 'decimal'}" aria-label="Settimana ${w}, ${lbl(c)}"></td>`;
    };
    return `<tr class="${s.scarico.includes(w) ? 'scarico' : ''}"><th>${w}${s.scarico.includes(w) ? '<span>scarico</span>' : ''}</th>${campi.map(cella).join('')}</tr>`;
  }).join('');
  const numerici = CAMPI_PROG(e.modalita).filter(c => c !== 'rec');
  return `<details class="prog" ${e.progressione ? 'open' : ''}><summary>Progressione settimanale</summary>
    <p class="small muted">Riga 1 = valori sopra. Scrivi solo quello che cambia: vale anche per le settimane dopo.</p>
    <div class="prog-scroll"><table class="prog-tab"><thead><tr><th>Sett.</th>${campi.map(c => `<th>${esc(lbl(c))}</th>`).join('')}</tr></thead><tbody>${righe}</tbody></table></div>
    <div class="scorciatoie">
      <span class="small">Ogni settimana aggiungi</span>
      <input class="inc" data-inc="${i}" inputmode="decimal" placeholder="2,5" aria-label="Quanto aggiungere">
      <select class="inc-c" data-incc="${i}" aria-label="A quale campo">${numerici.map(c => `<option value="${c}" ${c === 'carico' ? 'selected' : ''}>${esc(lbl(c))}</option>`).join('')}</select>
      <button type="button" class="btn sm" data-act="prog-inc" data-i="${i}">Applica</button>
    </div>
    <div class="riga-btn">${s.scarico.length && e.parametri.serie ? `<button type="button" class="btn sm" data-act="prog-scarico" data-i="${i}">Scarico: serie −40%</button>` : ''}
      ${e.progressione ? `<button type="button" class="btn sm" data-act="prog-azzera" data-i="${i}">Azzera progressione</button>` : ''}</div>
  </details>`;
}

const giornoCorrente = () => E.scheda.giorni[E.giorno];
const esercizioDi = el => giornoCorrente().esercizi[Number(el.dataset.i)];
function ridisegnaGiorno() {
  const y = window.scrollY;
  document.getElementById('giorno').innerHTML = htmlGiorno();
  app.querySelectorAll('[data-giorno]').forEach((b, i) => { b.querySelector('.n').textContent = E.scheda.giorni[i].esercizi.length; });
  montaAnteprime();
  window.scrollTo(0, y);
}
const segnaSporco = () => { E.sporco = true; };
function ridisegnaCarta(i) {
  const li = app.querySelector(`.es-card[data-i="${i}"]`);
  if (!li) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = htmlEsercizio(giornoCorrente().esercizi[i], i);
  const nuovo = tmp.firstElementChild;
  // aggiorna solo l'intestazione per non perdere il campo che si sta scrivendo
  li.querySelector('.es-testa').replaceWith(nuovo.querySelector('.es-testa'));
}

function collegaEditor() {
  montaAnteprime();
  app.onclick = async ev => {
    const back = ev.target.closest('.top .back');
    if (back && E.sporco) {
      ev.preventDefault();
      if (await chiedi({ titolo: 'Uscire senza salvare?', testo: 'Le modifiche alla scheda andranno perse.', ok: 'Esci senza salvare', pericolo: true })) { E.sporco = false; vai(back.getAttribute('href')); }
      return;
    }
    const g = ev.target.closest('[data-giorno]');
    if (g) { E.giorno = Number(g.dataset.giorno); app.querySelectorAll('[data-giorno]').forEach(x => x.setAttribute('aria-selected', String(x === g))); return ridisegnaGiorno(); }
    const sc = ev.target.closest('[data-scarico]');
    if (sc) {
      const w = Number(sc.dataset.scarico), s = E.scheda;
      s.scarico = s.scarico.includes(w) ? s.scarico.filter(x => x !== w) : [...s.scarico, w].sort((a, b) => a - b);
      segnaSporco(); return disegnaEditor();
    }
    const vb = ev.target.closest('[data-var]');
    if (vb) {
      const e = esercizioDi(vb), campo = vb.dataset.var, raw = vb.dataset.val;
      const v = { ...(e.variante || {}), [campo]: raw === '' ? undefined : (campo === 'panca' ? Number(raw) : raw) };
      const gradi = variantiDi(e)?.gradi?.[v.attrezzo || variantiDi(e).attrezzi?.[0]] || [];
      if (!gradi.includes(v.panca)) delete v.panca;
      e.variante = pulisciVariante(v);
      segnaSporco(); return ridisegnaGiorno();
    }
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act, s = E.scheda, gc = giornoCorrente();
    const i = Number(b.dataset.i);
    switch (act) {
      case 'apri': gc.esercizi[i].aperto = !gc.esercizi[i].aperto; return ridisegnaGiorno();
      case 'aggiungi': return sceltaEsercizio(x => { gc.esercizi.forEach(e => { e.aperto = false; }); gc.esercizi.push(nuovoEsercizio(x)); segnaSporco(); ridisegnaGiorno(); app.querySelector('.es-card:last-child')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      case 'cambia': return sceltaEsercizio(x => { const e = gc.esercizi[i]; Object.assign(e, { esercizio_id: x?.id ?? null, nome: x ? x.nome : e.nome, animazione: x ? x.animazione : 'free', variante: variantePredefinita(x) }); segnaSporco(); ridisegnaGiorno(); }, true);
      case 'su': case 'giu': {
        const es = gc.esercizi, e = es[i];
        if (e.gruppo) { const j = act === 'su' ? i - 1 : i + 1; [es[i], es[j]] = [es[j], es[i]]; }   // dentro la superserie
        else {   // fuori: salta un'intera superserie vicina
          const vicino = bloccoDi(es, act === 'su' ? i - 1 : i + 1);
          es.splice(i, 1); es.splice(act === 'su' ? vicino.inizio : vicino.fine, 0, e);
        }
        normalizzaGruppi(gc); segnaSporco(); return ridisegnaGiorno();
      }
      case 'copia': gc.esercizi.splice(i + 1, 0, { ...clona(gc.esercizi[i]), aperto: true }); gc.esercizi[i].aperto = false; normalizzaGruppi(gc); segnaSporco(); return ridisegnaGiorno();
      case 'elimina': if (await chiedi({ titolo: `Togliere ${gc.esercizi[i].nome}?`, ok: 'Togli', pericolo: true })) { gc.esercizi.splice(i, 1); normalizzaGruppi(gc); segnaSporco(); ridisegnaGiorno(); } return;
      case 'ss-aggiungi': return sceltaEsercizio(x => { aggiungiInGruppo(gc, i, x); segnaSporco(); ridisegnaGiorno(); }, false, 'Aggiungi alla superserie');
      case 'ss-sciogli': if (await chiedi({ titolo: 'Sciogliere la superserie?', testo: 'Gli esercizi restano, ognuno con le sue serie.', ok: 'Sciogli' })) { sciogliGruppo(gc, bloccoDi(gc.esercizi, i)); normalizzaGruppi(gc); segnaSporco(); ridisegnaGiorno(); } return;
      case 'ss-su': case 'ss-giu': {
        const es = gc.esercizi, b0 = bloccoDi(es, i);
        const vicino = bloccoDi(es, act === 'ss-su' ? b0.inizio - 1 : b0.fine + 1);
        const pezzo = es.splice(b0.inizio, b0.fine - b0.inizio + 1);
        const dove = act === 'ss-su' ? vicino.inizio : vicino.fine - pezzo.length + 1;
        es.splice(dove, 0, ...pezzo);
        normalizzaGruppi(gc); segnaSporco(); return ridisegnaGiorno();
      }
      case 'giorno-nuovo': s.giorni.push({ nome: `Giorno ${s.giorni.length + 1}`, esercizi: [] }); E.giorno = s.giorni.length - 1; segnaSporco(); return disegnaEditor();
      case 'giorno-copia': s.giorni.splice(E.giorno + 1, 0, { ...clona(gc), nome: `${gc.nome} (copia)` }); E.giorno++; segnaSporco(); return disegnaEditor();
      case 'giorno-sx': case 'giorno-dx': { const j = act === 'giorno-sx' ? E.giorno - 1 : E.giorno + 1; [s.giorni[E.giorno], s.giorni[j]] = [s.giorni[j], s.giorni[E.giorno]]; E.giorno = j; segnaSporco(); return disegnaEditor(); }
      case 'giorno-elimina':
        if (!await chiedi({ titolo: `Eliminare ${gc.nome}?`, testo: gc.esercizi.length ? `Contiene ${gc.esercizi.length} esercizi.` : '', ok: 'Elimina', pericolo: true })) return;
        s.giorni.splice(E.giorno, 1); E.giorno = Math.max(0, E.giorno - 1); segnaSporco(); return disegnaEditor();
      case 'prog-inc': {
        const e = gc.esercizi[i];
        const inc = numero(app.querySelector(`[data-inc="${i}"]`).value), c = app.querySelector(`[data-incc="${i}"]`).value;
        const base = numero(e.parametri[c]);
        if (inc === null || base === null) return toast(base === null ? 'Scrivi prima il valore della settimana 1' : 'Scrivi quanto aggiungere');
        e.progressione = e.progressione || {};
        for (let w = 2; w <= s.settimane; w++) { e.progressione[w] = { ...(e.progressione[w] || {}), [c]: Math.round((base + inc * (w - 1)) * 100) / 100 }; }
        segnaSporco(); ridisegnaGiorno(); return toast('Progressione applicata');
      }
      case 'prog-scarico': {
        const e = gc.esercizi[i];
        e.progressione = e.progressione || {};
        for (const w of s.scarico) {
          if (w < 1) continue;
          const prima = numero(valoriSettimana(e, w).parametri.serie);
          if (prima === null) continue;
          const dopo = w < s.settimane && !s.scarico.includes(w + 1) ? (e.progressione[w + 1]?.serie ?? prima) : null;
          if (w === 1) e.parametri.serie = Math.max(1, Math.round(prima * 0.6));
          else e.progressione[w] = { ...(e.progressione[w] || {}), serie: Math.max(1, Math.round(prima * 0.6)) };
          if (dopo !== null) e.progressione[w + 1] = { ...(e.progressione[w + 1] || {}), serie: dopo };
        }
        segnaSporco(); return ridisegnaGiorno();
      }
      case 'prog-azzera': gc.esercizi[i].progressione = null; segnaSporco(); return ridisegnaGiorno();
    }
  };

  app.oninput = ev => {
    const t = ev.target;
    if (t.dataset.s === 'nome') { E.scheda.nome = t.value; return segnaSporco(); }
    if (t.dataset.s === 'nota') { E.scheda.nota = t.value; return segnaSporco(); }
    if (t.dataset.g === 'nome') {
      giornoCorrente().nome = t.value; segnaSporco();
      const tab = app.querySelector(`[data-giorno="${E.giorno}"]`); if (tab) tab.firstChild.textContent = t.value || `Giorno ${E.giorno + 1}`;
      return;
    }
    if (t.dataset.f) { const e = esercizioDi(t); const v = valoreCampo(t.dataset.f, t.value); if (v === null || v === '') delete e.parametri[t.dataset.f]; else e.parametri[t.dataset.f] = v; segnaSporco(); return; }
    if (t.dataset.ss) {
      const gc = giornoCorrente(), b = bloccoDi(gc.esercizi, Number(t.dataset.i)), v = numero(t.value);
      const membri = gc.esercizi.slice(b.inizio, b.fine + 1);
      if (t.dataset.ss === 'serie') membri.forEach(e => { if (v === null) delete e.parametri.serie; else e.parametri.serie = v; });
      else { const u = membri[membri.length - 1]; if (v === null) delete u.parametri.rec; else u.parametri.rec = v; }
      membri.forEach((_, k) => ridisegnaCarta(b.inizio + k));
      return segnaSporco();
    }
    if (t.dataset.k === 'nome') { esercizioDi(t).nome = t.value; return segnaSporco(); }
    if (t.dataset.k === 'nota') { esercizioDi(t).nota = t.value; return segnaSporco(); }
    if (t.dataset.k === 'tempo') { const e = esercizioDi(t); const v = t.value.trim().toUpperCase(); e.tecnica = v ? { tempo: v } : null; return segnaSporco(); }
    if (t.dataset.p) {
      const e = esercizioDi(t); const [w, c] = t.dataset.p.split(':');
      const raw = t.value.trim();
      const v = c === 'tempo' ? raw.toUpperCase() : valoreCampo(c, raw);
      e.progressione = e.progressione || {};
      e.progressione[w] = { ...(e.progressione[w] || {}) };
      if (v === null || v === '') delete e.progressione[w][c]; else e.progressione[w][c] = v;
      if (!Object.keys(e.progressione[w]).length) delete e.progressione[w];
      if (!Object.keys(e.progressione).length) e.progressione = null;
      segnaSporco();
    }
  };

  app.onchange = ev => {
    const t = ev.target;
    if (t.dataset.s === 'settimane') { E.scheda.settimane = Number(t.value); E.scheda.scarico = E.scheda.scarico.filter(w => w <= E.scheda.settimane); segnaSporco(); return disegnaEditor(); }
    if (t.dataset.s === 'inizio') { E.scheda.inizio = t.value; return segnaSporco(); }
    if (t.dataset.pp) { const n = t.closest('[data-periodo]').dataset.periodo; E.scheda.pp[n] = sceltePeriodo(app, n); return segnaSporco(); }
    if (t.dataset.k === 'modalita' && t.value === 'superserie') {
      const gc = giornoCorrente(), i = Number(t.dataset.i), e = gc.esercizi[i];
      t.value = e.modalita;
      return sceltaEsercizio(x => { inSuperserie(e); e.gruppo = '*'; aggiungiInGruppo(gc, i, x); segnaSporco(); ridisegnaGiorno(); }, false, 'Esercizio successivo della superserie');
    }
    if (t.dataset.k === 'modalita') {
      const e = esercizioDi(t), m = t.value;
      const p = {}; for (const c of CAMPI[m]) if (e.parametri[c] !== undefined) p[c] = e.parametri[c];
      if (e.gruppo) for (const c of ['serie', 'rec', 'pausa']) if (e.parametri[c] !== undefined) p[c] = e.parametri[c];
      e.modalita = m; e.parametri = Object.keys(p).length ? p : clona(PREDEFINITI[m]); e.progressione = null;
      normalizzaGruppi(giornoCorrente()); segnaSporco(); return ridisegnaGiorno();
    }
    if (t.dataset.f || t.dataset.p || t.dataset.k === 'tempo' || t.dataset.k === 'nome') {
      const i = Number(t.dataset.i); ridisegnaCarta(i);
      if (t.dataset.p || t.dataset.f) {
        // aggiorna i suggerimenti grigi della griglia senza perdere il punto in cui si scrive
        const e = giornoCorrente().esercizi[i];
        app.querySelectorAll(`.es-card[data-i="${i}"] [data-p]`).forEach(inp => {
          const [w, c] = inp.dataset.p.split(':'); const v = valoriSettimana(e, Number(w));
          inp.placeholder = virgola(c === 'tempo' ? (v.tecnica?.tempo || '') : (v.parametri[c] ?? ''));
        });
        app.querySelectorAll(`.es-card[data-i="${i}"] td.base`).forEach((td, k) => {
          const c = [...CAMPI_PROG(e.modalita), 'tempo'][k]; td.textContent = virgola(c === 'tempo' ? (e.tecnica?.tempo || '–') : (e.parametri[c] ?? '–'));
        });
      }
    }
  };

  if (E.storico) return collegaBarraStorico();
  document.getElementById('salva').onclick = () => salvaScheda(!!(E.bozza && E.esiste));
  document.getElementById('altro').onclick = () => {
    const w = finestra(`<h3>Altre azioni</h3><div class="menu">
      ${E.esiste ? '<button type="button" class="btn" data-m="nuova">Salva come nuova scheda<span class="small muted">La scheda attuale va in archivio</span></button>' : ''}
      ${E.bozza && E.esiste ? '<button type="button" class="btn" data-m="sovrascrivi">Salva sostituendo quella attuale<span class="small muted">Senza archiviarla</span></button>' : ''}
      <a class="btn" href="#/importa/${E.atleta}" data-m="importa">Importa da testo, voce, file o foto<span class="small muted">Crea un’anteprima da controllare</span></a>
      ${E.esiste ? '<button type="button" class="btn danger" data-m="archivia">Archivia la scheda<span class="small muted">L’atleta resta senza scheda attiva</span></button>' : ''}
      </div><div class="azioni"><button type="button" class="btn" data-chiudi>Chiudi</button></div>`);
    w.onclick = async e => {
      if (e.target === w || e.target.closest('[data-chiudi]')) return w.remove();
      const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return;
      w.remove();
      if (m === 'importa') { E.sporco = false; return; }
      if (m === 'nuova') return salvaScheda(true);
      if (m === 'sovrascrivi') return salvaScheda(false);
      if (m === 'archivia') {
        if (!await chiedi({ titolo: 'Archiviare la scheda?', testo: 'Resta nell’archivio e puoi ripristinarla quando vuoi.', ok: 'Archivia' })) return;
        try { await api(`/api/schede/${E.atleta}/archivia`, { metodo: 'POST' }); E.sporco = false; toast('Scheda archiviata'); vai(`#/atleta/${E.atleta}`); } catch (ex) { toast(ex.message); }
      }
    };
  };
}

// Barra dell'editor dello storico: salva, e per un'importata già salvata copia o elimina
function collegaBarraStorico() {
  document.getElementById('salva').onclick = salvaStorico;
  const altro = document.getElementById('altro');
  if (!altro) return;
  altro.onclick = () => {
    const w = finestra(`<h3>Altre azioni</h3><div class="menu">
      <button type="button" class="btn" data-m="copia">Copia come scheda attiva<span class="small muted">Questa resta nello storico</span></button>
      <button type="button" class="btn danger" data-m="elimina">Elimina dallo storico<span class="small muted">Le giornate di allenamento non vengono toccate</span></button>
      </div><div class="azioni"><button type="button" class="btn" data-chiudi>Chiudi</button></div>`);
    w.onclick = async e => {
      if (e.target === w || e.target.closest('[data-chiudi]')) return w.remove();
      const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return;
      w.remove();
      if (m === 'copia') {
        if (E.sporco) return toast('Prima salva le modifiche');
        if (!await chiedi({ titolo: 'Copiarla come scheda attiva?', testo: 'Parte da oggi. Se l’atleta ha già una scheda, quella va in archivio.', ok: 'Copia' })) return;
        try { await api(`/api/storico-schede/scheda/${E.storicoId}/attiva`, { metodo: 'POST', dati: { inizio: oggiISO() } }); toast('Ora è la scheda attiva'); vai(`#/atleta/${E.atleta}`); } catch (ex) { toast(ex.message); }
      }
      if (m === 'elimina') {
        if (!await chiedi({ titolo: 'Eliminare questa scheda vecchia?', testo: 'Sparisce dallo storico.', ok: 'Elimina', pericolo: true })) return;
        try { await api(`/api/storico-schede/scheda/${E.storicoId}`, { metodo: 'DELETE' }); E.sporco = false; toast('Scheda eliminata'); vai(`#/storico/${E.atleta}/schede`); } catch (ex) { toast(ex.message); }
      }
    };
  };
}

async function salvaStorico() {
  const s = E.scheda;
  const vuoti = s.giorni.filter(g => !g.esercizi.length);
  if (vuoti.length) { E.giorno = s.giorni.indexOf(vuoti[0]); disegnaEditor(); return toast(`${vuoti[0].nome || 'Un giorno'} non ha esercizi`); }
  const dal = leggiPeriodo(app, 'dal'), al = leggiPeriodo(app, 'al');
  const problema = dal.errore || al.errore || (!dal.valore ? 'Scegli almeno mese e anno di inizio' : '') || controllaPeriodo(dal.valore, al.valore);
  if (problema) { app.querySelector('.periodi')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return toast(problema); }
  const dati = {
    nome: s.nome, settimane: s.settimane, scarico: s.scarico, periodo_dal: dal.valore, periodo_al: al.valore, nota: s.nota,
    giorni: s.giorni.map(g => ({ nome: g.nome, esercizi: g.esercizi.map(({ aperto, animazione, ...e }) => e) }))
  };
  const b = document.getElementById('salva'); if (b) b.disabled = true;
  try {
    if (E.storicoId) await api(`/api/storico-schede/scheda/${E.storicoId}`, { metodo: 'PUT', dati });
    else await api(`/api/storico-schede/${E.atleta}`, { metodo: 'POST', dati });
    E.sporco = false; E.bozza = null;
    toast('Scheda salvata nello storico');
    vai(`#/storico/${E.atleta}/schede`);
  } catch (ex) { toast(ex.message); if (b) b.disabled = false; }
}

async function salvaScheda(nuova) {
  const s = E.scheda;
  const vuoti = s.giorni.filter(g => !g.esercizi.length);
  if (vuoti.length) { E.giorno = s.giorni.indexOf(vuoti[0]); disegnaEditor(); return toast(`${vuoti[0].nome || 'Un giorno'} non ha esercizi`); }
  const dati = {
    nome: s.nome, settimane: s.settimane, inizio: s.inizio, scarico: s.scarico, nuova,
    giorni: s.giorni.map(g => ({ nome: g.nome, esercizi: g.esercizi.map(({ aperto, animazione, ...e }) => e) }))
  };
  const b = document.getElementById('salva'); if (b) b.disabled = true;
  try {
    await api(`/api/schede/${E.atleta}`, { metodo: 'PUT', dati });
    E.sporco = false; E.bozza = null;
    toast(nuova ? 'Scheda nuova salvata, la vecchia è in archivio' : 'Scheda salvata');
    vai(`#/atleta/${E.atleta}`);
  } catch (ex) { toast(ex.message); if (b) b.disabled = false; }
}

// Scelta dalla libreria (con ricerca e filtro per categoria)
function sceltaEsercizio(scegli, cambio = false, titolo = '') {
  const lib = LIB || [];
  const categorie = [...new Set(lib.map(x => x.categoria).filter(Boolean))].sort();
  let cat = '';
  const v = finestra(`<div class="scelta"><div class="scelta-testa"><h3>${esc(titolo || (cambio ? 'Cambia esercizio' : 'Aggiungi esercizio'))}</h3>
      <input type="search" placeholder="Cerca: trazioni, panca, plank…" aria-label="Cerca esercizio" autocomplete="off">
      <div class="chips scroll"><button type="button" class="chip sm" data-cat="" aria-pressed="true">Tutti</button>${categorie.map(c => `<button type="button" class="chip sm" data-cat="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div></div>
    <ul class="scelta-lista"></ul>
    <div class="azioni"><button type="button" class="btn" data-libero>Non in libreria</button><button type="button" class="btn" data-chiudi>Chiudi</button></div></div>`);
  v.querySelector('.dialogo').classList.add('grande');
  const input = v.querySelector('input'), ul = v.querySelector('.scelta-lista');
  const filtra = () => {
    const q = norm(input.value);
    const trovati = lib.filter(x => (!cat || x.categoria === cat) && (!q || norm(`${x.nome} ${x.altri_nomi || ''} ${x.muscolo || ''} ${x.famiglia || ''}`).includes(q))).slice(0, 80);
    ul.innerHTML = trovati.map(x => `<li><button type="button" data-id="${x.id}"><span class="mini">${ominoSVG(x.animazione)}</span>
      <span><b>${esc(x.nome)}</b><span class="small muted">${esc((x.muscolo || '').split(':')[0])}${x.attrezzo ? ' · ' + esc(x.attrezzo) : ''}</span></span></button></li>`).join('')
      || `<li class="empty">Nessun esercizio trovato${q ? `: puoi usare “Esercizio non in libreria”` : ''}.</li>`;
  };
  filtra();
  setTimeout(() => input.focus(), 50);
  input.oninput = filtra;
  v.addEventListener('click', e => {
    const c = e.target.closest('[data-cat]');
    if (c) { cat = c.dataset.cat; v.querySelectorAll('[data-cat]').forEach(x => x.setAttribute('aria-pressed', String(x === c))); return filtra(); }
    const b = e.target.closest('[data-id]');
    if (b) { v.remove(); return scegli(lib.find(x => x.id === Number(b.dataset.id))); }
    if (e.target.closest('[data-libero]')) {
      const nome = input.value.trim() || 'Esercizio';
      v.remove(); return scegli({ id: null, nome, animazione: 'free', modalita_default: 'setrep' });
    }
    if (e.target.closest('[data-chiudi]')) v.remove();
  });
}

/* ======================= IMPORTAZIONE ======================= */
const IMP = { testo: '', modo: 'scrivi' };
const CAMERA = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
// /importa/12 crea la scheda attiva; /importa/12/storico una scheda vecchia per lo storico
rotta(/^\/importa\/(\d+)(\/storico)?$/, async (id, storico) => {
  id = Number(id);
  storico = !!storico;
  const indietro = storico ? `#/storico/${id}/schede` : `#/atleta/${id}`;
  attesa('Importa', indietro);
  const { atleta } = await api(`/api/schede/${id}`);
  const ESEMPIO = 'Giorno 1\nTrazioni prone 4x6 (elastico se serve) rec 90\nBack squat 4x8 @ 40kg tempo 3-1-1-0\nPlank 3x30s\n\nGiorno 2\nEMOM 10 min trazioni 3\nAMRAP 12 min: 5 piegamenti, 10 squat';
  const disegna = () => {
    pagina({ titolo: storico ? 'Scheda vecchia' : 'Importa scheda', indietro, html: `
      <div class="intro"><p class="muted small">Per ${esc(atleta.nome)}</p><h1>${storico ? 'Carica una scheda vecchia' : 'Importa una scheda'}</h1>
      <p class="hint">${storico
        ? 'Scrivila, dettala, carica un file o fotografa il foglio. Nell’anteprima scegli il periodo e salvi: resta nello storico e non diventa la scheda attiva.'
        : 'Scrivila, dettala, carica un file o fotografa il foglio: diventa un’anteprima che controlli nell’editor prima di salvare.'}</p></div>
      <div class="seg" role="tablist"><button type="button" data-modo="scrivi" aria-current="${IMP.modo === 'scrivi'}">Scrivi</button>
        <button type="button" data-modo="voce" aria-current="${IMP.modo === 'voce'}">Voce</button><button type="button" data-modo="file" aria-current="${IMP.modo === 'file'}">File</button>
        <button type="button" data-modo="foto" aria-current="${IMP.modo === 'foto'}">Foto</button></div>
      <div id="imp-corpo"></div>
      <label class="full">Testo della scheda<textarea id="testo" rows="10" placeholder="${esc(ESEMPIO)}">${esc(IMP.testo)}</textarea></label>
      <p class="small muted">Una riga per esercizio. Va bene anche scritto come ti viene: “Giorno 2”, “4x8 con 40 kg”, “rec 90”, “EMOM 10 min”, “3x30s”.</p>`,
      barra: '<button class="btn primary big" type="button" id="analizza">Crea anteprima</button>' });
    const corpo = document.getElementById('imp-corpo');
    if (IMP.modo === 'voce') {
      corpo.innerHTML = `<div class="card registra"><button type="button" class="btn-mic" id="mic" aria-label="Registra">${'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>'}</button>
        <div><b id="mic-stato">Tocca e detta la scheda</b><p class="small muted" id="mic-info">Parla con calma: “Giorno uno, trazioni quattro per sei, recupero novanta secondi…”. Il testo compare sotto e puoi correggerlo.</p></div></div>`;
      collegaMicrofono();
    } else if (IMP.modo === 'file') {
      corpo.innerHTML = `<label class="card carica"><input type="file" id="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.odt,.ods,image/*">
        <b>Scegli un file</b><span class="small muted">PDF, Word, Excel, testo o una foto nitida della scheda (massimo 10 MB)</span></label>`;
      document.getElementById('file').onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        const lbl = corpo.querySelector('b'); lbl.textContent = `Leggo ${f.name}…`;
        const fd = new FormData(); fd.append('file', f, f.name);
        try { const r = await api('/api/importa/file', { metodo: 'POST', form: fd }); IMP.testo = r.testo; document.getElementById('testo').value = r.testo; lbl.textContent = `${f.name}: testo estratto, controllalo sotto`; }
        catch (ex) { lbl.textContent = 'Scegli un file'; toast(ex.message); }
      };
    } else if (IMP.modo === 'foto') {
      corpo.innerHTML = `<div class="card foto-imp">
        <div class="foto-tasti"><label class="btn primary">${CAMERA}<span>Scatta foto</span><input type="file" accept="image/*" capture="environment" data-foto></label>
          <label class="btn"><span>Dalla galleria</span><input type="file" accept="image/*" data-foto></label></div>
        <div class="foto-anteprima" id="foto-ant" hidden><img alt=""><span class="small">Leggo la foto…</span></div>
        <p class="small muted" id="foto-info">Foglio dritto, buona luce, tutta la scheda nell’inquadratura. Se è su più pagine, una foto per pagina: il testo si aggiunge sotto. La foto non viene salvata.</p></div>`;
      collegaFoto(corpo);
    }
    app.onclick = e => { const m = e.target.closest('[data-modo]'); if (m) { IMP.testo = document.getElementById('testo').value; IMP.modo = m.dataset.modo; disegna(); } };
    document.getElementById('testo').oninput = e => { IMP.testo = e.target.value; };
    document.getElementById('analizza').onclick = async ev => {
      const testo = document.getElementById('testo').value.trim();
      if (!testo) return toast('Scrivi, detta o carica la scheda');
      ev.target.disabled = true; ev.target.textContent = 'Leggo la scheda…';
      try {
        const r = await api('/api/importa/analizza', { metodo: 'POST', dati: { testo } });
        IMP.testo = '';
        if (storico) { bozze[`s${id}`] = r; vai(`#/storico-scheda/${id}/nuova`); }
        else { bozze[id] = r; vai(`#/scheda/${id}`); }
      } catch (ex) { toast(ex.message); ev.target.disabled = false; ev.target.textContent = 'Crea anteprima'; }
    };
  };
  disegna();
});

// Foto del foglio: rimpicciolita nel telefono, letta da Workers AI, il testo si aggiunge sotto
function collegaFoto(corpo) {
  const ant = corpo.querySelector('#foto-ant'), info = corpo.querySelector('#foto-info');
  corpo.querySelectorAll('[data-foto]').forEach(inp => inp.onchange = async () => {
    const f = inp.files[0]; inp.value = '';
    if (!f) return;
    const url = URL.createObjectURL(f);
    ant.querySelector('img').src = url; ant.hidden = false;
    corpo.querySelectorAll('[data-foto]').forEach(x => { x.disabled = true; });
    try {
      const fd = new FormData(); fd.append('foto', await fotoPerInvio(f), 'scheda.jpg');
      const r = await api('/api/importa/foto', { metodo: 'POST', form: fd });
      const area = document.getElementById('testo');
      IMP.testo = (area.value.trim() ? area.value.trim() + '\n\n' : '') + r.testo;
      area.value = IMP.testo;
      info.textContent = /\[\?\]/.test(r.testo) ? 'Fatto. Dove vedi [?] una parola non si leggeva: correggila nel testo sotto.' : 'Fatto: controlla il testo sotto. Puoi aggiungere un’altra foto.';
    } catch (ex) { toast(ex.message); }
    finally { ant.hidden = true; URL.revokeObjectURL(url); corpo.querySelectorAll('[data-foto]').forEach(x => { x.disabled = false; }); }
  });
}

function collegaMicrofono() {
  const btn = document.getElementById('mic'), st = document.getElementById('mic-stato'), info = document.getElementById('mic-info');
  let rec = null, pezzi = [], t0 = 0, giro = null;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    st.textContent = 'Registrazione non disponibile su questo browser';
    info.textContent = 'Usa il microfono della tastiera nel campo di testo: funziona allo stesso modo.';
    btn.disabled = true; return;
  }
  btn.onclick = async () => {
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    try {
      const flusso = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported?.(t)) || '';
      rec = new MediaRecorder(flusso, tipo ? { mimeType: tipo } : undefined);
      pezzi = [];
      rec.ondataavailable = e => { if (e.data.size) pezzi.push(e.data); };
      rec.onstop = async () => {
        clearInterval(giro); flusso.getTracks().forEach(t => t.stop());
        btn.classList.remove('rec'); st.textContent = 'Trascrivo…';
        const blob = new Blob(pezzi, { type: rec.mimeType || 'audio/webm' });
        const est = (rec.mimeType || '').includes('mp4') ? 'm4a' : (rec.mimeType || '').includes('ogg') ? 'ogg' : 'webm';
        const fd = new FormData(); fd.append('audio', blob, `voce.${est}`);
        try {
          const r = await api('/api/importa/audio', { metodo: 'POST', form: fd });
          const area = document.getElementById('testo');
          IMP.testo = (area.value.trim() ? area.value.trim() + '\n' : '') + r.testo;
          area.value = IMP.testo;
          st.textContent = 'Fatto: controlla il testo sotto'; info.textContent = 'Puoi registrare ancora per aggiungere altri esercizi.';
        } catch (ex) { st.textContent = 'Tocca e detta la scheda'; toast(ex.message); }
      };
      rec.start(); t0 = Date.now();
      btn.classList.add('rec'); st.textContent = 'Sto registrando: tocca di nuovo per finire';
      giro = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); info.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (s >= 600) rec.stop(); }, 500);
    } catch { toast('Permesso del microfono negato'); }
  };
}

/* ======================= LIBRERIA ======================= */
let filtroLib = { q: '', cat: '' };
rotta(/^\/libreria$/, async () => {
  attesa('Libreria', '#/profilo');
  const lib = await libreria(true);
  const io = stato.io;
  const categorie = [...new Set(lib.map(x => x.categoria).filter(Boolean))].sort();
  pagina({ titolo: 'Libreria', indietro: '#/profilo', html: `
    ${sceltaLibreria('esercizi')}
    <div class="intro"><h1>Libreria</h1><p class="hint">${lib.length} esercizi. Tocca un esercizio per vedere l’omino e gli accorgimenti.</p></div>
    <input type="search" id="cerca" placeholder="Cerca per nome, muscolo, attrezzo" value="${esc(filtroLib.q)}" aria-label="Cerca" autocomplete="off">
    <div class="chips scroll" style="margin:10px 0 4px"><button type="button" class="chip sm" data-cat="" aria-pressed="${!filtroLib.cat}">Tutti</button>
      ${categorie.map(c => `<button type="button" class="chip sm" data-cat="${esc(c)}" aria-pressed="${filtroLib.cat === c}">${esc(c)}</button>`).join('')}
      ${io.ruolo === 'coach' ? `<button type="button" class="chip sm" data-cat="__miei" aria-pressed="${filtroLib.cat === '__miei'}">Creati da me</button>` : ''}</div>
    <ul class="lib-lista" id="lista"></ul>`,
    barra: `<button class="btn primary big" type="button" id="nuovo">${PIU} Nuovo esercizio</button>` });
  const lista = document.getElementById('lista');
  const filtra = () => {
    const q = norm(filtroLib.q);
    const v = lib.filter(x => (!filtroLib.cat || (filtroLib.cat === '__miei' ? x.creato_da === io.id : x.categoria === filtroLib.cat))
      && (!q || norm(`${x.nome} ${x.altri_nomi || ''} ${x.muscolo || ''} ${x.attrezzo || ''} ${x.famiglia || ''}`).includes(q)));
    lista.innerHTML = v.map(x => `<li><button type="button" class="lib-riga" data-id="${x.id}"><span class="mini">${ominoSVG(x.animazione)}</span>
      <span><b>${esc(x.nome)}</b><span class="small muted">${esc(x.categoria || '')}${x.muscolo ? ' · ' + esc(x.muscolo.split(':')[0]) : ''}${x.creato_da ? ' · tuo' : ''}</span></span></button></li>`).join('')
      || '<li class="empty">Nessun esercizio trovato.</li>';
  };
  filtra();
  document.getElementById('cerca').oninput = e => { filtroLib.q = e.target.value; filtra(); };
  app.onclick = e => {
    const c = e.target.closest('[data-cat]');
    if (c) { filtroLib.cat = c.dataset.cat; app.querySelectorAll('[data-cat]').forEach(x => x.setAttribute('aria-pressed', String(x === c))); return filtra(); }
    const r = e.target.closest('[data-id]');
    if (r) schedaEsercizio(lib.find(x => x.id === Number(r.dataset.id)));
  };
  document.getElementById('nuovo').onclick = () => formEsercizio(null);
});

const modificabile = x => stato.io.ruolo === 'admin' || (x.creato_da && x.creato_da === stato.io.id);
function schedaEsercizio(x) {
  const acc = String(x.accorgimenti || '').split('\n').filter(Boolean);
  const v = finestra(`<div class="es-dettaglio">
    <div class="stage" id="lib-stage"></div>
    <h3>${esc(x.nome)}</h3>
    <p class="small muted">${[x.categoria, x.attrezzo].filter(Boolean).map(esc).join(' · ')}</p>
    ${x.muscolo ? `<p class="small"><b>Muscoli:</b> ${esc(x.muscolo)}</p>` : ''}
    <label class="tempo-prova">Prova un tempo esecutivo<input id="lib-tempo" placeholder="es. 3-1-1-0"></label>
    ${acc.length ? `<ul class="accorgimenti">${acc.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    ${x.altri_nomi ? `<p class="small muted" style="margin-top:8px">Anche: ${esc(x.altri_nomi)}</p>` : ''}
    <div class="azioni">${modificabile(x) ? '<button type="button" class="btn" data-modifica>Modifica</button>' : ''}<button type="button" class="btn primary" data-chiudi>Chiudi</button></div></div>`);
  v.querySelector('.dialogo').classList.add('grande');
  const stage = v.querySelector('#lib-stage');
  montaOmino3D(stage, x.animazione, { forza: true, muscoli: x.muscolo });
  v.querySelector('#lib-tempo').oninput = e => montaOmino3D(stage, x.animazione, { tempo: e.target.value, forza: true, muscoli: x.muscolo });
  v.querySelector('[data-chiudi]').onclick = () => v.remove();
  v.querySelector('[data-modifica]')?.addEventListener('click', () => { v.remove(); formEsercizio(x); });
}

function formEsercizio(x) {
  const lib = LIB || [];
  const categorie = [...new Set(['Calisthenics', 'Streetlifting', 'Powerlifting', 'Bodybuilding', 'Kettlebell', 'CrossFit', 'Cardio', 'Pesistica olimpica', ...lib.map(y => y.categoria).filter(Boolean)])];
  const d = x || { nome: '', categoria: 'Calisthenics', famiglia: '', muscolo: '', attrezzo: '', animazione: 'free', modalita_default: 'setrep', altri_nomi: '', accorgimenti: '' };
  const v = finestra(`<h3>${x ? 'Modifica esercizio' : 'Nuovo esercizio'}</h3>
    <form class="stack" novalidate style="margin-top:10px">
      <label>Nome<input name="nome" value="${esc(d.nome)}" placeholder="Es. Trazione arciere"></label>
      <div class="two"><label>Categoria<select name="categoria">${categorie.map(c => `<option ${d.categoria === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label>Famiglia<input name="famiglia" value="${esc(d.famiglia || '')}" placeholder="Es. Trazione"></label></div>
      <label>Muscoli<input name="muscolo" value="${esc(d.muscolo || '')}" placeholder="Es. Schiena: gran dorsale, bicipiti"></label>
      <div class="two"><label>Attrezzo<input name="attrezzo" value="${esc(d.attrezzo || '')}" placeholder="Es. Sbarra"></label>
        <label>Modalità di base<select name="modalita_default">${Object.entries(MODALITA).map(([k, l]) => `<option value="${k}" ${d.modalita_default === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <div class="anim-scelta"><div class="stage" id="form-stage"></div>
        <label>Omino<select name="animazione">${Object.entries(ANIMAZIONI).sort((a, b) => a[1].localeCompare(b[1], 'it')).map(([k, l]) => `<option value="${k}" ${animazione(d.animazione) === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div>
      <label>Accorgimenti (uno per riga)<textarea name="accorgimenti" rows="5">${esc(d.accorgimenti || '')}</textarea></label>
      <label>Altri nomi (separati da virgola)<input name="altri_nomi" value="${esc(d.altri_nomi || '')}" placeholder="Per riconoscerlo negli import"></label>
      <p class="err" role="alert"></p>
      <div class="azioni">${x ? '<button class="btn danger" type="button" data-elimina>Elimina</button>' : '<button class="btn" type="button" data-chiudi>Annulla</button>'}<button class="btn primary" type="submit">Salva</button></div>
    </form>`);
  v.querySelector('.dialogo').classList.add('grande');
  const f = v.querySelector('form'), stage = v.querySelector('#form-stage');
  const prova = () => montaOmino(stage, f.animazione.value, { forza: true, muscoli: f.muscolo.value });
  prova();
  f.animazione.onchange = prova;
  f.muscolo.addEventListener('change', prova);
  v.querySelector('[data-chiudi]')?.addEventListener('click', () => v.remove());
  v.querySelector('[data-elimina]')?.addEventListener('click', async () => {
    if (!await chiedi({ titolo: `Eliminare ${x.nome}?`, testo: 'Le schede che lo usano tengono nome e numeri.', ok: 'Elimina', pericolo: true })) return;
    try { await api(`/api/libreria/${x.id}`, { metodo: 'DELETE' }); v.remove(); toast('Esercizio eliminato'); vai('#/libreria'); } catch (ex) { toast(ex.message); }
  });
  f.onsubmit = async e => {
    e.preventDefault();
    const dati = Object.fromEntries(['nome', 'categoria', 'famiglia', 'muscolo', 'attrezzo', 'modalita_default', 'animazione', 'accorgimenti', 'altri_nomi'].map(k => [k, f.elements[k].value.trim()]));
    dati.inizia_con = POSE[dati.animazione]?.inizia || 'conc';
    try {
      await api(x ? `/api/libreria/${x.id}` : '/api/libreria', { metodo: x ? 'PUT' : 'POST', dati });
      v.remove(); toast('Esercizio salvato'); vai('#/libreria');
    } catch (ex) { f.querySelector('.err').textContent = ex.message; }
  };
}

/* ======================= DOMANDE ======================= */
let faseDomande = 'pre';
rotta(/^\/domande$/, async () => {
  attesa('Domande', '#/profilo');
  const d = await api('/api/domande/gestione');
  const io = stato.io;
  const lista = { pre: clona(d.domande.pre), post: clona(d.domande.post) };
  const proprie = { ...d.proprie };
  let modifiche = false;
  const disegna = () => {
    const usaPredef = io.ruolo === 'coach' && !proprie[faseDomande];
    const qs = lista[faseDomande];
    pagina({ titolo: 'Domande', indietro: '#/profilo', html: `
      <div class="intro"><h1>Domande guidate</h1><p class="hint">L’atleta le trova in modalità Guidato ${faseDomande === 'pre' ? 'prima' : 'dopo'} l’allenamento. Può sempre scegliere “Scrivo io”.</p></div>
      <div class="seg" role="tablist"><button type="button" data-fase="pre" aria-current="${faseDomande === 'pre'}">Prima</button><button type="button" data-fase="post" aria-current="${faseDomande === 'post'}">Dopo</button></div>
      ${d.predefinite ? '<p class="small muted">Sono le domande predefinite: le vedono i tuoi atleti e quelli dei coach che non hanno domande proprie.</p>' : ''}
      ${usaPredef ? `<div class="avviso"><b>Stai usando le domande predefinite</b><p>Modificale qui sotto e salva: da quel momento i tuoi atleti vedranno le tue.</p></div>`
        : io.ruolo === 'coach' ? '<p class="small muted">Queste sono le tue domande. <button type="button" class="link" id="predef">Torna alle predefinite</button></p>' : ''}
      <ol class="domande-ed">${qs.map((q, i) => `<li class="card" data-i="${i}">
        <label>Domanda<input data-q="testo" value="${esc(q.testo)}" placeholder="Es. Come hai dormito?"></label>
        <div class="two"><label>Tipo<select data-q="tipo"><option value="scala" ${q.tipo === 'scala' ? 'selected' : ''}>Scala 1-10</option><option value="scelta" ${q.tipo === 'scelta' ? 'selected' : ''}>Scelta</option><option value="testo" ${q.tipo === 'testo' ? 'selected' : ''}>Testo libero</option></select></label>
          <div class="azioni-mini fine"><button type="button" class="btn sm" data-d="su" ${i === 0 ? 'disabled' : ''} aria-label="Su">${SU}</button><button type="button" class="btn sm" data-d="giu" ${i === qs.length - 1 ? 'disabled' : ''} aria-label="Giù">${GIU}</button><button type="button" class="btn sm danger" data-d="via" aria-label="Elimina">${CESTINO}</button></div></div>
        ${q.tipo === 'scala' ? `<div class="two"><label>Etichetta di 1<input data-q="etichetta_min" value="${esc(q.etichetta_min || '')}" placeholder="malissimo"></label><label>Etichetta di 10<input data-q="etichetta_max" value="${esc(q.etichetta_max || '')}" placeholder="benissimo"></label></div>` : ''}
        ${q.tipo === 'scelta' ? `<label>Risposte (separate da virgola)<input data-q="opzioni" value="${esc((q.opzioni || []).join(', '))}" placeholder="Sì, No, Un po’"></label>` : ''}
      </li>`).join('')}</ol>
      <button type="button" class="btn big aggiungi" id="aggiungi">${PIU} Aggiungi domanda</button>`,
      barra: '<button class="btn primary big" type="button" id="salva">Salva domande</button>' });
    app.onclick = async e => {
      const f = e.target.closest('[data-fase]');
      if (f) { if (modifiche && !await chiedi({ titolo: 'Cambiare fase senza salvare?', ok: 'Cambia' })) return; faseDomande = f.dataset.fase; modifiche = false; return disegna(); }
      const b = e.target.closest('[data-d]');
      if (b) {
        const i = Number(b.closest('[data-i]').dataset.i), arr = lista[faseDomande];
        if (b.dataset.d === 'via') arr.splice(i, 1);
        else { const j = b.dataset.d === 'su' ? i - 1 : i + 1; [arr[i], arr[j]] = [arr[j], arr[i]]; }
        modifiche = true; return disegna();
      }
    };
    app.oninput = e => {
      const k = e.target.dataset.q; if (!k) return;
      const q = lista[faseDomande][Number(e.target.closest('[data-i]').dataset.i)];
      q[k] = k === 'opzioni' ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : e.target.value;
      modifiche = true;
    };
    app.onchange = e => { if (e.target.dataset.q === 'tipo') disegna(); };
    document.getElementById('aggiungi').onclick = () => { lista[faseDomande].push({ testo: '', tipo: 'scala', opzioni: [], etichetta_min: '', etichetta_max: '' }); modifiche = true; disegna(); app.querySelector('.domande-ed li:last-child input')?.focus(); };
    document.getElementById('predef')?.addEventListener('click', async () => {
      if (!await chiedi({ titolo: 'Tornare alle predefinite?', testo: 'Le tue domande di questa fase vengono cancellate.', ok: 'Torna alle predefinite', pericolo: true })) return;
      await api('/api/domande/predefinite', { metodo: 'POST', dati: { fase: faseDomande } });
      toast('Ora usi le predefinite'); vai('#/domande');
    });
    document.getElementById('salva').onclick = async () => {
      const qs = lista[faseDomande];
      const male = qs.find(q => !q.testo.trim() || (q.tipo === 'scelta' && (q.opzioni || []).length < 2));
      if (male) return toast(!male.testo.trim() ? 'C’è una domanda senza testo' : 'Una domanda a scelta ha bisogno di almeno 2 risposte');
      try {
        await api('/api/domande', { metodo: 'PUT', dati: { fase: faseDomande, domande: qs } });
        proprie[faseDomande] = io.ruolo === 'coach' && qs.length > 0; modifiche = false;
        toast('Domande salvate'); disegna();
      } catch (ex) { toast(ex.message); }
    };
  };
  disegna();
});
