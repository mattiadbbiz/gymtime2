// GymTime · giornate singole: schermata Allena (scheda, giornate singole, rifai), anteprime ed editor del coach.
// Si importa in app.js PRIMA di atleta.js: la sua rotta #/allena prende il posto di quella di atleta.js.
// Restano in atleta.js l'anteprima dei giorni della scheda (#/allena/giorno/N) e il flusso (#/allena/g/ID).
import { api, esc, dataCorta } from './api.js';
import { stato, app, rotta, pagina, attesa, toast, chiedi, finestra, vai } from './ui.js';
import { ominoSVG, animazioneVariante } from './omino.js';
import { MODALITA, CAMPI, etichetta, rxTesto, testoVariante, durata, norm } from './regole.js';

const PREDEFINITI = { setrep: { serie: 3, rip: 10 }, emom: { minuti: 10, rip: 5 }, amrap: { minuti: 10 }, tempo: { serie: 3, secondi: 30 }, cardio: { serie: 1, secondi: 600 }, rt: { rip: 50 }, ladder: { da: 1, a: 5, passo: 1 }, free: { testo: '' } };
const gestisce = () => stato.io.ruolo !== 'atleta';
const posa = e => animazioneVariante(e.animazione || 'free', e.variante || null);
const mini = e => `<span class="mini">${ominoSVG(posa(e))}</span>`;
const numero = v => { const s = String(v ?? '').trim().replace(',', '.'); if (!s) return null; const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : null; };
const valoreCampo = (c, raw) => c === 'testo' ? raw
  : (c === 'rip' && /^\s*\d+\s*[-–]\s*\d+\s*$/.test(raw)) ? raw.replace(/\s/g, '').replace('–', '-') : numero(raw);
const nomi = es => `${es.length} esercizi: ${es.map(e => e.nome).join(', ')}`;

const carta = (href, titolo, esercizi, sotto, tag = '') => `
  <a class="giorno-card" href="${href}">
    <div class="gc-testa"><h3>${esc(titolo)}</h3>${tag}</div>
    <div class="gc-omini">${esercizi.slice(0, 5).map(mini).join('')}</div>
    <p class="small muted">${esc(sotto)}</p>
  </a>`;

const anteprima = es => `<ol class="anteprima">${es.map(e => `
  <li class="anteprima-es">${mini(e)}
    <div><h3>${esc(e.nome)}</h3><span class="rx sm">${esc(rxTesto(e.modalita, e.parametri || {}))}</span>
      ${testoVariante(e.variante) ? `<p class="var-t small">${esc(testoVariante(e.variante))}</p>` : ''}
      ${e.parametri?.rec ? `<p class="small muted">Recupero tra serie: ${esc(durata(e.parametri.rec))}</p>` : ''}
      ${e.nota ? `<p class="small">${esc(e.nota)}</p>` : ''}</div></li>`).join('')}</ol>`;

async function avvia(bottone, titolo, chiamata) {
  const ok = await chiedi({ titolo: `Avvii ${titolo}?`, testo: 'Da adesso la data di oggi resta legata a questa giornata e non si può cambiare.', ok: 'Avvia' });
  if (!ok) return;
  bottone.disabled = true;
  try { const r = await api(chiamata, { metodo: 'POST' }); location.replace(`#/allena/g/${r.id}`); }
  catch (e) { toast(e.message); bottone.disabled = false; }
}

/* ======================= ALLENA ======================= */
rotta(/^\/allena$/, async () => {
  attesa('Allena');
  const [a, gs] = await Promise.all([api('/api/allena'), api('/api/giornate-singole').catch(() => ({ singole: [], recenti: [] }))]);
  if (a.giornata && a.giornata.stato !== 'completata') return location.replace(`#/allena/g/${a.giornata.id}`);
  if (a.giornata) {
    return pagina({ titolo: 'Allena', html: `
      <div class="fatto-oggi"><span class="spunta" aria-hidden="true">✓</span><h1>Fatto per oggi</h1>
      <p class="muted">Hai salvato ${esc(a.giornata.nome_giorno || 'l’allenamento')}. Domani potrai scegliere il prossimo.</p></div>
      <a class="btn primary big" href="#/storico">Vedi lo storico</a>` });
  }
  const s = a.scheda;
  const blocchi = [];
  if (s) {
    const sugg = s.giorni[a.suggerito]?.posizione;
    blocchi.push(`
      <div class="gs-sezione"><h2>La tua scheda</h2><p class="muted small">${esc(s.nome)}</p></div>
      <div class="chips">${s.settimane > 1 ? `<span class="tag gold">Settimana ${s.settimana} di ${s.settimane}</span>` : ''}
        ${s.scarico ? '<span class="tag bordeaux">Settimana di scarico</span>' : ''}</div>
      ${s.concluso ? '<p class="hint">Le settimane della scheda sono finite: continui con i valori dell’ultima settimana finché il coach non la aggiorna.</p>' : ''}
      <div class="giorni">${s.giorni.map(g => carta(`#/allena/giorno/${g.posizione}`, g.nome, g.esercizi, nomi(g.esercizi),
        g.posizione === sugg ? '<span class="tag bordeaux">Tocca a te</span>' : '')).join('')}</div>`);
  }
  if (gs.singole.length) {
    blocchi.push(`
      <div class="gs-sezione"><h2>Giornate singole</h2><p class="muted small">Fuori dalla scheda, da fare quando vuoi</p></div>
      <div class="giorni">${gs.singole.map(g => carta(`#/allena/singola/${g.id}`, g.nome, g.esercizi, nomi(g.esercizi))).join('')}</div>`);
  }
  if (gs.recenti.length) {
    blocchi.push(`
      <div class="gs-sezione"><h2>Rifai</h2><p class="muted small">Le ultime giornate che hai salvato</p></div>
      <div class="giorni">${gs.recenti.map(g => carta(`#/allena/rifai/${g.id}`, g.nome, g.esercizi, `${dataCorta(g.data)}, ${g.esercizi.length} esercizi`)).join('')}</div>`);
  }
  const crea = gestisce() ? `<div class="gs-crea"><a class="btn primary big" href="#/giornata/nuova">Crea giornata</a>
    <a class="btn" href="#/giornate">Giornate dei tuoi atleti</a></div>` : '';
  const vuoto = blocchi.length ? '' : `<div class="empty" style="margin-top:18px"><h3>Ancora niente da fare</h3>
    <p class="hint">${gestisce() ? 'Crea una giornata qui sopra, oppure una scheda dal Profilo.' : 'Il tuo coach non ti ha ancora dato una scheda o una giornata. Appena lo fa, la trovi qui.'}</p></div>`;
  pagina({ titolo: 'Allena', html: `<div class="intro"><h1>Cosa fai oggi?</h1></div>${crea}${vuoto}${blocchi.join('')}` });
});

/* ---------- Anteprima di una giornata singola ---------- */
rotta(/^\/allena\/singola\/(\d+)$/, async id => {
  attesa('Anteprima', '#/allena');
  const [{ singola: g, puo_gestire }, a] = await Promise.all([api(`/api/giornate-singole/${id}`), api('/api/allena')]);
  const mia = g.atleta_id === stato.io.id;
  const indietro = mia ? '#/allena' : '#/giornate';
  pagina({ titolo: g.nome, indietro, html: `
    <div class="intro"><p class="muted small">Giornata singola${mia ? '' : ` di ${esc(g.atleta_nome)}`}</p><h1>${esc(g.nome)}</h1></div>
    ${anteprima(g.esercizi)}
    ${mia && a.giornata ? '<p class="hint">Oggi hai già un allenamento: questa giornata la puoi fare un altro giorno.</p>' : ''}
    ${puo_gestire ? `<div class="gs-azioni">
      <button class="btn" type="button" data-az="scheda">Aggiungi alla scheda</button>
      <a class="btn" href="#/giornata/${g.id}">Modifica</a>
      <button class="link danger" type="button" data-az="elimina">Elimina giornata</button></div>` : ''}`,
    barra: mia && !a.giornata ? '<button class="btn primary big" type="button" id="avvia">Avvia giornata</button>' : '' });
  const b = document.getElementById('avvia');
  if (b) b.onclick = () => avvia(b, g.nome, `/api/giornate-singole/${g.id}/avvia`);
  app.onclick = async ev => {
    const az = ev.target.closest('[data-az]')?.dataset.az;
    if (az === 'scheda') {
      const ok = await chiedi({ titolo: 'Aggiungerla alla scheda attiva?', ok: 'Aggiungi',
        testo: `Diventa l’ultimo giorno della ${mia ? 'tua scheda' : `scheda di ${g.atleta_nome}`} e sparisce dalle giornate singole.` });
      if (!ok) return;
      try { const r = await api(`/api/giornate-singole/${g.id}/scheda`, { metodo: 'POST' }); toast(`Aggiunta a ${r.scheda} come giorno ${r.giorno}`); vai(indietro); }
      catch (e) { toast(e.message); }
    }
    if (az === 'elimina') {
      if (!await chiedi({ titolo: 'Eliminare questa giornata?', testo: 'Sparisce dalle giornate singole. Gli allenamenti già fatti restano nello storico.', ok: 'Elimina', pericolo: true })) return;
      try { await api(`/api/giornate-singole/${g.id}`, { metodo: 'DELETE' }); toast('Giornata eliminata'); vai(indietro); }
      catch (e) { toast(e.message); }
    }
  };
});

/* ---------- Rifai una giornata già salvata ---------- */
let BOZZA = null;   // giornata da cui parte l'editor ("Salva come giornata singola")
rotta(/^\/allena\/rifai\/(\d+)$/, async id => {
  attesa('Anteprima', '#/allena');
  const [{ giornata: g }, a] = await Promise.all([api(`/api/giornate/${id}`), api('/api/allena')]);
  if (g.atleta_id !== stato.io.id || g.stato !== 'completata') return location.replace('#/allena');
  const es = g.piano.esercizi || [];
  const nome = g.nome_giorno || 'Allenamento';
  pagina({ titolo: nome, indietro: '#/allena', html: `
    <div class="intro"><p class="muted small">Fatta ${esc(dataCorta(g.data))}</p><h1>${esc(nome)}</h1></div>
    ${anteprima(es)}
    ${a.giornata ? '<p class="hint">Oggi hai già un allenamento: questa giornata la puoi rifare un altro giorno.</p>' : ''}
    ${gestisce() ? '<div class="gs-azioni"><button class="btn" type="button" id="copia">Salva come giornata singola</button></div>' : ''}`,
    barra: a.giornata ? '' : '<button class="btn primary big" type="button" id="avvia">Rifalla oggi</button>' });
  const b = document.getElementById('avvia');
  if (b) b.onclick = () => avvia(b, nome, `/api/giornate/${g.id}/rifai`);
  const c = document.getElementById('copia');
  if (c) c.onclick = () => { BOZZA = { nome, atleta_id: stato.io.id, esercizi: es }; vai('#/giornata/nuova'); };
});

/* ======================= COACH E ADMIN ======================= */
rotta(/^\/giornate$/, async () => {
  if (!gestisce()) return location.replace('#/allena');
  attesa('Giornate singole', '#/allena');
  const { singole } = await api('/api/giornate-singole/gestione');
  const gruppi = new Map();
  for (const g of singole) {
    const chi = g.atleta_id === stato.io.id ? 'Le tue' : g.atleta_nome;
    if (!gruppi.has(chi)) gruppi.set(chi, []);
    gruppi.get(chi).push(g);
  }
  const ordine = [...gruppi.keys()].sort((x, y) => (x === 'Le tue' ? -1 : y === 'Le tue' ? 1 : x.localeCompare(y, 'it')));
  pagina({ titolo: 'Giornate singole', indietro: '#/allena', html: `
    <div class="intro"><h1>Giornate singole</h1><p class="muted small">Quelle create per te e per i tuoi atleti.</p></div>
    ${singole.length ? ordine.map(chi => `
      <div class="gs-sezione"><h2>${esc(chi)}</h2></div>
      <div class="giorni">${gruppi.get(chi).map(g => carta(`#/allena/singola/${g.id}`, g.nome, g.esercizi, nomi(g.esercizi))).join('')}</div>`).join('')
    : '<div class="empty" style="margin-top:18px"><h3>Nessuna giornata</h3><p class="hint">Creane una: la ritrovi qui e, per chi la riceve, in Allena.</p></div>'}`,
    barra: '<a class="btn primary big" href="#/giornata/nuova">Crea giornata</a>' });
});

/* ---------- Editor ---------- */
let LIB = null;
const libPerId = id => (LIB || []).find(x => x.id === id);
const E = { g: null, persone: [], sporco: false };
const copiaEs = e => ({
  esercizio_id: e.esercizio_id || null, nome: e.nome, modalita: MODALITA[e.modalita] ? e.modalita : 'setrep',
  parametri: { ...(e.parametri || {}) }, tecnica: e.tecnica || null, nota: e.nota || '', variante: e.variante || null,
  animazione: e.animazione || libPerId(e.esercizio_id)?.animazione || 'free'
});
window.addEventListener('beforeunload', ev => { if (E.sporco && location.hash.startsWith('#/giornata/')) { ev.preventDefault(); ev.returnValue = ''; } });

rotta(/^\/giornata\/(nuova|\d+)$/, async id => {
  if (!gestisce()) return location.replace('#/allena');
  attesa('Giornata', '#/allena');
  const [lib, { persone }, dett] = await Promise.all([
    LIB || api('/api/libreria').then(r => r.esercizi),
    api('/api/utenti'),
    id === 'nuova' ? null : api(`/api/giornate-singole/${id}`),
  ]);
  LIB = lib;
  const io = stato.io;
  E.persone = [io, ...persone.filter(p => p.ruolo === 'atleta' && p.id !== io.id).sort((x, y) => x.nome.localeCompare(y.nome, 'it'))];
  if (dett) {
    const s = dett.singola;
    E.g = { id: s.id, nome: s.nome, atleta_id: s.atleta_id, esercizi: s.esercizi.map(copiaEs) };
    if (!E.persone.some(p => p.id === s.atleta_id)) E.persone.push({ id: s.atleta_id, nome: s.atleta_nome });
    E.sporco = false;
  } else if (BOZZA) {
    E.g = { id: null, nome: BOZZA.nome, atleta_id: BOZZA.atleta_id, esercizi: BOZZA.esercizi.map(copiaEs) };
    BOZZA = null; E.sporco = true;
  } else {
    E.g = { id: null, nome: '', atleta_id: io.id, esercizi: [] };
    E.sporco = false;
  }
  disegnaEditor();
});

function cartaEsercizio(e, i, n) {
  const campi = CAMPI[e.modalita] || [];
  return `<article class="gs-es" data-i="${i}">
    <div class="gs-es-testa">${mini(e)}
      <div class="gs-es-nome"><b>${i + 1}. ${esc(e.nome)}</b><span class="rx sm">${esc(rxTesto(e.modalita, e.parametri))}</span></div>
      <div class="gs-es-tasti">
        <button type="button" class="btn ghost sm" data-az="su" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Sposta su">↑</button>
        <button type="button" class="btn ghost sm" data-az="giu" data-i="${i}" ${i === n - 1 ? 'disabled' : ''} aria-label="Sposta giù">↓</button>
        <button type="button" class="btn ghost sm" data-az="togli" data-i="${i}" aria-label="Togli ${esc(e.nome)}">✕</button>
      </div></div>
    <label>Modalità<select data-m="${i}">${Object.entries(MODALITA).map(([k, v]) => `<option value="${k}" ${k === e.modalita ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
    <div class="gs-campi">${campi.map(c => c === 'testo'
      ? `<label class="gs-largo">${esc(etichetta(c, e.modalita))}<input data-i="${i}" data-c="testo" value="${esc(e.parametri.testo || '')}" maxlength="300" placeholder="Es. 2 km di corsa leggera"></label>`
      : `<label>${esc(etichetta(c, e.modalita))}<input data-i="${i}" data-c="${c}" inputmode="${c === 'rip' ? 'text' : 'decimal'}" value="${esc(e.parametri[c] ?? '')}"></label>`).join('')}</div>
    <label>Accorgimenti per chi si allena<textarea data-i="${i}" data-c="nota" rows="2" maxlength="600" placeholder="Es. schiena dritta, scendi in 3 secondi">${esc(e.nota || '')}</textarea></label>
  </article>`;
}

function disegnaEditor(scorriA = null) {
  const g = E.g;
  pagina({ titolo: g.id ? 'Modifica giornata' : 'Nuova giornata', indietro: g.id ? `#/allena/singola/${g.id}` : '#/allena', html: `
    <section class="card gs-dati">
      <label>Nome della giornata<input data-g="nome" value="${esc(g.nome)}" maxlength="60" placeholder="Es. Gambe esplosive"></label>
      <label>Per chi<select data-g="atleta_id">${E.persone.map(p => `<option value="${p.id}" ${p.id === g.atleta_id ? 'selected' : ''}>${p.id === stato.io.id ? 'Me stesso' : esc(p.nome)}</option>`).join('')}</select></label>
    </section>
    <div class="gs-sezione"><h2>Esercizi</h2><p class="muted small">${g.esercizi.length ? 'In ordine di esecuzione' : 'Cercali nella libreria'}</p></div>
    ${g.esercizi.map((e, i) => cartaEsercizio(e, i, g.esercizi.length)).join('')}
    <button class="btn gs-aggiungi" type="button" data-az="aggiungi">Aggiungi esercizio</button>`,
    barra: '<button class="btn primary big grow" type="button" id="salva">Salva giornata</button>' });
  document.getElementById('salva').onclick = salva;
  if (scorriA !== null) app.querySelector(`.gs-es[data-i="${scorriA}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  app.oninput = ev => {
    const t = ev.target;
    if (t.dataset.g === 'nome') { g.nome = t.value; E.sporco = true; return; }
    if (t.dataset.i === undefined || !t.dataset.c) return;
    const e = g.esercizi[Number(t.dataset.i)], c = t.dataset.c;
    if (c === 'nota') e.nota = t.value;
    else {
      const v = valoreCampo(c, t.value);
      if (v === null || v === '') delete e.parametri[c]; else e.parametri[c] = v;
      const rx = t.closest('.gs-es')?.querySelector('.rx');
      if (rx) rx.textContent = rxTesto(e.modalita, e.parametri);
    }
    E.sporco = true;
  };
  app.onchange = ev => {
    const t = ev.target;
    if (t.dataset.g === 'atleta_id') { g.atleta_id = Number(t.value); E.sporco = true; return; }
    if (t.dataset.m !== undefined) {
      const i = Number(t.dataset.m), e = g.esercizi[i];
      const carico = e.parametri.carico;
      e.modalita = t.value;
      e.parametri = { ...PREDEFINITI[t.value], ...(carico && (CAMPI[t.value] || []).includes('carico') ? { carico } : {}) };
      E.sporco = true;
      disegnaEditor(i);
    }
  };
  app.onclick = ev => {
    const b = ev.target.closest('[data-az]');
    if (!b) return;
    const az = b.dataset.az, i = Number(b.dataset.i);
    if (az === 'aggiungi') return sceltaEsercizio();
    if (az === 'togli') g.esercizi.splice(i, 1);
    if (az === 'su' && i > 0) [g.esercizi[i - 1], g.esercizi[i]] = [g.esercizi[i], g.esercizi[i - 1]];
    if (az === 'giu' && i < g.esercizi.length - 1) [g.esercizi[i + 1], g.esercizi[i]] = [g.esercizi[i], g.esercizi[i + 1]];
    E.sporco = true;
    disegnaEditor(az === 'su' ? i - 1 : az === 'giu' ? i + 1 : null);
  };
}

// Ricerca nella libreria: un esercizio per volta, poi la finestra si chiude
function sceltaEsercizio() {
  const w = finestra(`<div class="gs-scelta"><h3>Aggiungi esercizio</h3>
    <input type="search" id="gs-cerca" placeholder="Cerca per nome, muscolo o attrezzo" autocomplete="off" aria-label="Cerca nella libreria">
    <ul class="gt-catalogo gs-risultati" id="gs-risultati"></ul>
    <div class="azioni"><button class="btn" type="button" data-chiudi>Chiudi</button></div></div>`);
  const input = w.querySelector('#gs-cerca'), lista = w.querySelector('#gs-risultati');
  const mostra = () => {
    const q = norm(input.value);
    const trovati = (q ? LIB.filter(x => norm([x.nome, x.altri_nomi, x.muscolo, x.categoria, x.attrezzo].filter(Boolean).join(' ')).includes(q)) : LIB).slice(0, 30);
    lista.innerHTML = trovati.length ? trovati.map(x => `<li>
      <span class="mini">${ominoSVG(animazioneVariante(x.animazione || 'free', null))}</span>
      <div><h3>${esc(x.nome)}</h3><p class="muted">${esc([x.categoria, x.muscolo].filter(Boolean).join(', '))}</p></div>
      <button class="btn primary" type="button" data-scegli="${x.id}">Aggiungi</button></li>`).join('')
      : '<li class="muted">Nessun esercizio con questo nome in libreria.</li>';
  };
  input.oninput = mostra;
  w.onclick = ev => {
    if (ev.target === w || ev.target.closest('[data-chiudi]')) return w.remove();
    const id = ev.target.closest('[data-scegli]')?.dataset.scegli;
    if (!id) return;
    const x = libPerId(Number(id));
    const modalita = MODALITA[x.modalita_default] ? x.modalita_default : 'setrep';
    E.g.esercizi.push({ esercizio_id: x.id, nome: x.nome, modalita, parametri: { ...PREDEFINITI[modalita] }, tecnica: null, nota: '', variante: null, animazione: x.animazione || 'free' });
    E.sporco = true;
    w.remove();
    disegnaEditor(E.g.esercizi.length - 1);
  };
  mostra();
  input.focus();
}

async function salva() {
  const g = E.g;
  if (!g.nome.trim()) { app.querySelector('[data-g="nome"]')?.focus(); return toast('Scrivi il nome della giornata'); }
  if (!g.esercizi.length) return toast('Aggiungi almeno un esercizio');
  const dati = { nome: g.nome.trim(), atleta_id: g.atleta_id, esercizi: g.esercizi.map(({ animazione, ...e }) => e) };
  const b = document.getElementById('salva');
  b.disabled = true;
  try {
    const r = g.id ? await api(`/api/giornate-singole/${g.id}`, { metodo: 'PUT', dati }) : await api('/api/giornate-singole', { metodo: 'POST', dati });
    E.sporco = false;
    toast('Giornata salvata');
    vai(`#/allena/singola/${g.id || r.id}`);
  } catch (ex) { toast(ex.message); b.disabled = false; }
}
