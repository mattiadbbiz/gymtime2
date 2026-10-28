// GymTime · mobilità e stretching: scelte e Genera giornata, anteprima, svolgimento guidato, fine
// Rigenerare e cambiare esercizi avviene nel telefono: il database scrive solo da Avvia in poi.
import { api, esc } from './api.js';
import { stato, app, rotta, pagina, attesa, toast, chiedi, finestra, vai } from './ui.js';
import { montaOmino, ominoSVG } from './omino.js';
import {poolSessione,generaFullBody} from './libere-generatore.js';
import { AREE, FASI, ZONE, TIPI, TEMPI, nomeArea, doseTesto, generaSessione, sostituisci, durataPiano, secondiEsercizio, secondiRip } from './mobilita.js';

const FRECCIA_SX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const GIRA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/></svg>';
const righe = t => String(t || '').split('\n').map(s => s.trim()).filter(Boolean);
export const durataTesto = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const minuti = s => Math.max(1, Math.round(s / 60));

// Il bastone si ricorda solo su questo telefono
const leggiBastone = () => { try { return localStorage.getItem('gt-bastone') === '1'; } catch { return false; } };
const salvaBastone = v => { try { localStorage.setItem('gt-bastone', v ? '1' : '0'); } catch {} };

const G = { tipo: 'mobilita', lib: null, libDi: null, minuti: null, area: '', bastone: leggiBastone(), recenti: [], piano: null, scelte: null };

async function libreria() {
  if (G.lib && G.libDi === stato.io.id) return G.lib;
  const { esercizi } = await api('/api/mobilita/libreria');
  Object.assign(G, { lib: esercizi, libDi: stato.io.id });
  return esercizi;
}

/* ---------- Mobilità: scelte e Genera giornata ---------- */
const nomeTipo=()=>G.tipo==='stretching'?'Stretching':G.tipo==='mista'?'Mobilità e stretching (mista)':'Mobilità';
const homeTipo=()=>G.tipo==='stretching'?'#/stretching':'#/mobilita';
rotta(/^\/(mobilita|stretching)$/, async tipo => {
  G.tipo=tipo;G.area='';G.piano=null;
  attesa(nomeTipo());
  const st = await api(`/api/mobilita?tipo=${G.tipo}`);
  if (!st.attiva) {
    return pagina({ titolo: nomeTipo(), html: `<div class="intro"><h1>${esc(nomeTipo())}</h1></div>
      <div class="empty">${stato.io.ruolo === 'atleta' ? 'La sezione è spenta: se ti serve, parlane con il tuo coach.' : 'La sezione è spenta. La riaccendi da Profilo → Libreria → Mobilità.'}</div>` });
  }
  await libreria();
  G.recenti = st.recenti || [];
  if (!st.durate.includes(G.minuti)) G.minuti = st.durate.includes(15) ? 15 : st.durate[0];
  const bloccata = st.aperta ? 'Prima riprendi o chiudi la sessione in corso' : !st.rimaste_oggi ? 'Per oggi hai fatto tutte le sessioni: riprendi domani' : '';
  pagina({ titolo: nomeTipo(), html: `
    <div class="intro"><h1>${esc(nomeTipo())}</h1>
      <p class="hint">Scegli quanto tempo hai: generiamo una proposta casuale su tutto il corpo. Controlla la durata stimata prima di avviare.</p></div>
    ${st.aperta ? `<div class="card riprendi"><b>Hai una sessione in corso</b>
      <p class="small muted">${st.aperta.esercizi} esercizi · circa ${minuti(st.aperta.durata_stimata)} min · sei all’esercizio ${Math.min(st.aperta.passo + 1, st.aperta.esercizi)}</p>
      <div class="azioni-riga"><a class="btn primary" href="#/mobilita/s/${st.aperta.id}">Riprendi</a><button class="btn" type="button" id="chiudi-aperta">Chiudila</button></div></div>` : ''}
    <p class="lbl scelta-et">Quanto tempo hai</p>
    <div class="chips" role="group" aria-label="Durata">${st.durate.map(m => `<button type="button" class="chip" data-min="${m}" aria-pressed="${m === G.minuti}">${m} min</button>`).join('')}</div>
    <p class="hint">Tutto il corpo: parte alta, schiena, anche e gambe.</p>
    <label class="check bastone"><input type="checkbox" id="bastone" ${G.bastone ? 'checked' : ''}> Ho un bastone (va bene anche un manico di scopa)</label>
    ${bloccata ? `<p class="small muted" style="margin-top:12px">${bloccata}.</p>` : st.rimaste_oggi <= 2 ? `<p class="small muted" style="margin-top:12px">Oggi puoi fare ancora ${st.rimaste_oggi} ${st.rimaste_oggi === 1 ? 'sessione' : 'sessioni'}.</p>` : ''}
    ${st.ultime?.length ? `<p class="lbl scelta-et">Ultime fatte</p><ul class="mob-ultime">${st.ultime.slice(0, 3).map(u => `<li><span>${esc(dataBreve(u.data))}</span><span class="muted">${u.durata_scelta} min · ${esc(nomeArea(u.zona))}</span></li>`).join('')}</ul>` : ''}`,
    barra: `<button class="btn primary big grow" type="button" id="genera" ${bloccata ? 'disabled' : ''}>Genera giornata</button>` });
  app.onclick = async e => {
    const m = e.target.closest('[data-min]'), a = e.target.closest('[data-area]');
    if (m) { G.minuti = Number(m.dataset.min); app.querySelectorAll('[data-min]').forEach(x => x.setAttribute('aria-pressed', String(x === m))); }
    if (a) { G.area = a.dataset.area; app.querySelectorAll('[data-area]').forEach(x => x.setAttribute('aria-pressed', String(x === a))); }
    if (e.target.id === 'chiudi-aperta') {
      if (!await chiedi({ titolo: 'Chiudere la sessione in corso?', testo: 'Si cancella, anche gli esercizi già segnati.', ok: 'Chiudi', pericolo: true })) return;
      try { await api(`/api/mobilita/sessioni/${st.aperta.id}`, { metodo: 'DELETE' }); toast('Sessione chiusa'); vai(homeTipo()); } catch (ex) { toast(ex.message); }
    }
  };
  app.onchange = e => { if (e.target.id === 'bastone') { G.bastone = e.target.checked; salvaBastone(G.bastone); } };
  document.getElementById('genera').onclick = () => {
    genera();
    if (!G.piano.esercizi.length) return toast(G.piano.errore || 'In libreria non ci sono esercizi per queste scelte');
    vai('#/mobilita/anteprima');
  };
});

const dataBreve = iso => new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });

function genera() {
  G.scelte = { minuti: G.minuti, area: G.area || null, bastone: G.bastone };
  G.piano = generaFullBody(G.lib, G.tipo, { ...G.scelte, recenti: G.recenti });
}

/* ---------- Anteprima: durata stimata, Cambia, Rigenera, Avvia ---------- */
rotta(/^\/mobilita\/anteprima$/, async () => {
  if (!G.piano || !G.lib || G.libDi !== stato.io.id) return vai(homeTipo());
  disegnaAnteprima();
});

function disegnaAnteprima(evidenzia = null) {
  const y = window.scrollY;
  const es = G.piano.esercizi, sec = G.piano.secondi;
  const fasi = Object.keys(FASI).filter(f => es.some(e => e.fase === f));
  pagina({ titolo: 'Anteprima ' + nomeTipo(), indietro: homeTipo(), html: `
    <div class="mob-stima"><span class="small muted">Durata stimata</span><b>${durataTesto(sec)}</b>
      <span class="small muted">${G.scelte.minuti} min scelti · ${esc(nomeArea(G.scelte.area))} · ${es.length} esercizi</span></div>
    ${fasi.map(f => {
      const lista = es.map((e, i) => ({ e, i })).filter(x => x.e.fase === f);
      return `<h3 class="fase-et"><span class="rx sm">${FASI[f]}</span><span class="small muted">circa ${minuti(lista.reduce((s, x) => s + secondiEsercizio(x.e), 0))} min</span></h3>
        <ul class="anteprima mob-lista">${lista.map(({ e, i }) => `<li class="anteprima-es${i === evidenzia ? ' appena' : ''}">
          <button type="button" class="mob-vedi" data-vedi="${i}"><span class="mini">${ominoSVG(e.animazione)}</span>
            <span><b>${esc(e.nome)}</b><span class="small muted">${esc(ZONE[e.zona] || e.zona)} · ${esc(TIPI[e.tipo] || e.tipo)}</span><span class="rx sm">${esc(doseTesto(e))}</span></span></button>
          <button type="button" class="btn ghost sm cambia" data-cambia="${i}" aria-label="Cambia ${esc(e.nome)}">${GIRA}<span>Cambia</span></button></li>`).join('')}</ul>`;
    }).join('')}`,
    barra: `<button class="btn" type="button" id="rigenera">${GIRA}<span>Rigenera</span></button><button class="btn primary grow" type="button" id="avvia">Avvia</button>` });
  if (evidenzia !== null) window.scrollTo(0, y);
  app.onclick = e => {
    const c = e.target.closest('[data-cambia]'), v = e.target.closest('[data-vedi]');
    if (c) {
      const i = Number(c.dataset.cambia);
      const q = sostituisci(es, i, poolSessione(G.lib,G.tipo).filter(x=>Object.values(AREE).some(a=>a.zone.includes(x.zona)&&a.zone.includes(es[i].zona)) || x.tipo==='respirazione' && es[i].tipo==='respirazione'), { bastone: G.scelte.bastone, recenti: G.recenti });
      if (!q) return toast('Per questo esercizio non ci sono alternative');
      G.piano = { esercizi: q, secondi: durataPiano(q) };
      return disegnaAnteprima(i);
    }
    if (v) dettaglio(es[Number(v.dataset.vedi)]);
  };
  document.getElementById('rigenera').onclick = () => { genera(); disegnaAnteprima(); toast('Nuova sessione pronta'); };
  document.getElementById('avvia').onclick = async ev => {
    ev.currentTarget.disabled = true;
    try {
      const { id } = await api('/api/mobilita/sessioni', { metodo: 'POST', dati: {
        tipo_sessione: G.tipo, durata_scelta: G.scelte.minuti, area: G.scelte.area, esercizi: G.piano.esercizi.map(e => ({ id: e.id, serie: e.serie, fase: e.fase })) } });
      G.piano = null; S.id = null;
      vai(`#/mobilita/s/${id}`);
    } catch (ex) { toast(ex.message); ev.target.disabled = false; if (ex.status === 409) vai(homeTipo()); }
  };
}

function dettaglio(e) {
  const acc = righe(e.accorgimenti);
  const v = finestra(`<div class="es-dettaglio"><div class="stage" id="mob-stage"></div>
    <h3>${esc(e.nome)}</h3><p class="small muted">${esc(FASI[e.fase] || '')} · ${esc(ZONE[e.zona] || '')} · ${esc(TIPI[e.tipo] || '')}</p>
    <p class="mob-dose"><span class="rx">${esc(doseTesto(e))}</span></p>
    ${acc.length ? `<ul class="accorgimenti">${acc.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    <div class="azioni"><button type="button" class="btn primary" data-chiudi>Chiudi</button></div></div>`);
  v.querySelector('.dialogo').classList.add('grande');
  montaOmino(v.querySelector('#mob-stage'), e.animazione, { forza: true, muscoli: e.muscolo, tenuta: e.misura === 'secondi' });
  v.querySelector('[data-chiudi]').onclick = () => v.remove();
}

/* ---------- Svolgimento guidato ---------- */
const S = { id: null, s: null };
let blocco = null;
async function tieniSveglio() {
  try { if (!blocco && 'wakeLock' in navigator) { blocco = await navigator.wakeLock.request('screen'); blocco.addEventListener('release', () => { blocco = null; }); } } catch {}
}
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/mobilita/s/') && blocco) { blocco.release().catch(() => {}); blocco = null; } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && location.hash.startsWith('#/mobilita/s/') && S.s?.stato === 'in_corso') tieniSveglio(); });

rotta(/^\/mobilita\/s\/(\d+)$/, async id => {
  id = Number(id);
  if (S.id !== id || !S.s) {
    attesa('Mobilità', '#/mobilita');
    const { sessione } = await api(`/api/mobilita/sessioni/${id}`);
    if (sessione.utente_id !== stato.io.id) return location.replace('#/');
    Object.assign(S, { id, s: sessione });
    G.tipo=sessione.tipo_sessione||'mista';
  }
  disegnaSessione();
});

function disegnaSessione() {
  const n = S.s.piano.esercizi.length;
  if (S.s.stato === 'completata') return schermataSalvata();
  tieniSveglio();
  if (S.s.passo >= n) return schermataFine();
  schermataEsercizio();
}

function schermataEsercizio() {
  const es = S.s.piano.esercizi;
  const i = Math.max(0, Math.min(es.length - 1, S.s.passo || 0));
  const e = es[i];
  const acc = righe(e.accorgimenti);
  const prima = S.s.esiti[e.rif];
  pagina({ titolo: `${i + 1} di ${es.length}`, indietro: '#/mobilita', html: `
    <div class="progresso" aria-hidden="true">${es.map((x, k) => `<span class="${k < i ? 'fatto' : k === i ? 'ora' : ''}"></span>`).join('')}</div>
    <div class="esercizio">
      <div class="stage" id="stage"></div>
      <div class="es-info">
        <p class="muted small">${esc(FASI[e.fase] || '')}</p>
        <h2>${esc(e.nome)}</h2>
        <div class="rx-riga"><span class="rx${doseTesto(e).length > 8 ? '' : ' big'}">${esc(doseTesto(e))}</span></div>
        <p class="small muted">${esc(ZONE[e.zona] || '')} · ${esc(TIPI[e.tipo] || '')}</p>
        ${prima ? `<p class="small">${prima === 'fatto' ? '<span class="tag">Segnato come fatto</span>' : '<span class="tag bordeaux">Segnato come non fatto</span>'}</p>` : ''}
      </div>
    </div>
    <div id="timer"></div>
    ${acc.length ? `<h3 class="sotto">Accorgimenti di sicurezza</h3><ul class="accorgimenti">${acc.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`,
    barra: `<button class="btn ghost quad" type="button" id="indietro" aria-label="Esercizio precedente" ${i === 0 ? 'disabled' : ''}>${FRECCIA_SX}</button>
      <button class="btn ghost" type="button" id="nonfatto">Non l’ho fatto</button>
      <button class="btn primary grow" type="button" id="fatto">Fatto ›</button>` });
  const stage = document.getElementById('stage');
  const omino = () => montaOmino(stage, e.animazione, { tenuta: e.misura === 'secondi', muscoli: e.muscolo });
  omino();
  montaGuida(document.getElementById('timer'), e, omino);

  const blocca = v => app.querySelectorAll('.bottombar button').forEach(b => { b.disabled = v || (b.id === 'indietro' && i === 0); });
  const registra = async esito => {
    blocca(true);
    try {
      const r = await api(`/api/mobilita/sessioni/${S.id}/esercizi/${e.rif}`, { metodo: 'PUT', dati: { esito, passo: i + 1 } });
      S.s.esiti[e.rif] = esito;
      S.s.passo = r.fine ? es.length : i + 1;
      disegnaSessione();
    } catch (ex) { toast(ex.message); blocca(false); }
  };
  document.getElementById('fatto').onclick = () => registra('fatto');
  document.getElementById('nonfatto').onclick = () => registra('non_fatto');
  document.getElementById('indietro').onclick = async () => {
    blocca(true);
    try { await api(`/api/mobilita/sessioni/${S.id}/passo`, { metodo: 'PUT', dati: { passo: i - 1 } }); S.s.passo = i - 1; disegnaSessione(); }
    catch (ex) { toast(ex.message); blocca(false); }
  };
}

/* ---------- Guida: conto alla rovescia o ripetizioni al ritmo dell'omino, lati e serie ---------- */
let audio = null;
function bip(lungo = false) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = lungo ? 660 : 990; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (lungo ? 0.6 : 0.15));
    o.start(); o.stop(audio.currentTime + (lungo ? 0.65 : 0.2));
  } catch {}
  if (lungo && navigator.vibrate) navigator.vibrate([200, 80, 200]);
}

// Sequenza: lavoro di ogni serie e di ogni lato, cambio lato e pause tra le serie
export function segmenti(e) {
  const lati = e.per_lato ? ['Lato destro', 'Lato sinistro'] : [null];
  const serie = Math.max(1, e.serie || 1), rip = e.misura === 'ripetizioni';
  const out = [];
  for (let s = 1; s <= serie; s++) lati.forEach((lato, k) => {
    if (out.length) out.push(k ? { tipo: 'cambio', nome: 'Cambia lato', durata: TEMPI.cambioLato } : { tipo: 'pausa', nome: 'Pausa', durata: TEMPI.pausaSerie });
    out.push({ tipo: 'lavoro', nome: lato || (rip ? 'Ripetizioni' : 'Tenuta'), serie: s, durata: rip ? e.valore * secondiRip(e) : e.valore, rip: rip ? e.valore : 0 });
  });
  return out;
}

function montaGuida(el, e, riparti) {
  const seg = segmenti(e), serie = Math.max(1, e.serie || 1);
  const passo = e.misura === 'ripetizioni' ? secondiRip(e) : 0;
  const G2 = { k: 0, corre: false, inizio: 0, passati: 0, ultimo: null, finito: false };
  el.innerHTML = `<div class="timer guida"><div class="t-testa"><b id="t-nome"></b><span id="t-info" class="muted small"></span></div>
    <div class="t-cifre" id="t-cifre"></div>
    <div class="t-azioni"><button class="btn primary sm" type="button" id="t-via">Avvia</button>
    <button class="btn sm" type="button" id="t-zero">Ricomincia</button></div></div>`;
  const $ = id => el.querySelector('#' + id);
  const trascorso = () => G2.passati + (G2.corre ? (Date.now() - G2.inizio) / 1000 : 0);
  const disegna = () => {
    if (G2.finito) {
      $('t-nome').textContent = 'Finito'; $('t-info').textContent = 'Premi Fatto per andare avanti';
      $('t-cifre').textContent = '✓'; $('t-cifre').classList.remove('rec'); $('t-via').hidden = true;
      document.getElementById('fatto')?.classList.add('pulsa');
      return;
    }
    const s = seg[G2.k], t = trascorso();
    $('t-nome').textContent = s.nome;
    $('t-info').textContent = s.tipo === 'lavoro' && serie > 1 ? `serie ${s.serie} di ${serie}` : s.tipo === 'lavoro' ? '' : 'riparti tra poco';
    $('t-cifre').classList.toggle('rec', s.tipo !== 'lavoro');
    $('t-cifre').textContent = s.rip ? `${Math.min(s.rip, Math.floor(t / passo) + (G2.corre || t > 0 ? 1 : 0))} / ${s.rip}` : durataTesto(Math.ceil(s.durata - t));
    $('t-via').hidden = false;
    $('t-via').textContent = G2.corre ? 'Pausa' : (t > 0 || G2.k > 0 ? 'Riprendi' : 'Avvia');
  };
  const prossimo = () => {
    G2.k++; G2.passati = 0; G2.ultimo = null; G2.inizio = Date.now();
    if (G2.k >= seg.length) { G2.corre = false; G2.finito = true; bip(true); }
    else if (seg[G2.k].tipo === 'lavoro') { bip(true); riparti(); }
  };
  const tick = setInterval(() => {
    if (!el.isConnected) return clearInterval(tick);
    if (!G2.corre) return;
    const s = seg[G2.k], resta = s.durata - trascorso(), sec = Math.ceil(resta);
    if (!s.rip && sec <= 3 && sec > 0 && G2.ultimo !== sec) { G2.ultimo = sec; bip(); }
    if (resta <= 0) prossimo();
    disegna();
  }, 200);
  $('t-via').onclick = () => {
    if (G2.corre) { G2.passati = trascorso(); G2.corre = false; }
    else { if (!G2.passati && G2.k === 0) riparti(); G2.corre = true; G2.inizio = Date.now(); bip(); if (audio?.state === 'suspended') audio.resume(); }
    disegna();
  };
  $('t-zero').onclick = () => {
    Object.assign(G2, { k: 0, corre: false, passati: 0, ultimo: null, finito: false });
    document.getElementById('fatto')?.classList.remove('pulsa');
    riparti(); disegna();
  };
  disegna();
}

/* ---------- Fine e salvataggio ---------- */
const avviataMs = s => Date.parse(String(s.avviata_il || '').replace(' ', 'T') + 'Z');
function tempoImpiegato(s, fine = Date.now()) {
  const m = Math.round((fine - avviataMs(s)) / 60000);
  return Number.isFinite(m) && m >= 0 && m <= 180 ? `${Math.max(1, m)}` : '–';
}
const esitoTesto = v => v === 'fatto' ? '<span class="ok">Fatto</span>' : v === 'non_fatto' ? '<span class="danger-t">Non fatto</span>' : '<span class="muted">Non registrato</span>';

function schermataFine() {
  const es = S.s.piano.esercizi;
  const fatti = es.filter(e => S.s.esiti[e.rif] === 'fatto').length;
  pagina({ titolo: 'Fine', indietro: '#/mobilita', html: `
    <div class="fine"><div class="fine-fig" id="fine-fig"></div><h1>Sessione finita</h1><span class="gold-line"></span>
      <p class="muted">${esc(nomeArea(S.s.zona))} · ${S.s.durata_scelta} min scelti</p>
      <div class="numeri-riga"><div><b>${fatti}/${es.length}</b><span>esercizi fatti</span></div><div><b>${tempoImpiegato(S.s)}</b><span>minuti impiegati</span></div></div></div>
    <ol class="g-esercizi mob-esiti">${es.map(e => `<li><div class="ge-testa"><b>${esc(e.nome)}</b></div>
      <div class="small"><span class="muted">${esc(doseTesto(e))} ·</span> ${esitoTesto(S.s.esiti[e.rif])}</div></li>`).join('')}</ol>`,
    barra: `<button class="btn ghost quad" type="button" id="indietro" aria-label="Torna all’ultimo esercizio">${FRECCIA_SX}</button>
      <button class="btn primary grow" type="button" id="salva">Salva</button>` });
  montaOmino(document.getElementById('fine-fig'), 'mob_resp_supina', {});
  document.getElementById('indietro').onclick = async () => {
    try { await api(`/api/mobilita/sessioni/${S.id}/passo`, { metodo: 'PUT', dati: { passo: es.length - 1 } }); S.s.passo = es.length - 1; disegnaSessione(); }
    catch (ex) { toast(ex.message); }
  };
  document.getElementById('salva').onclick = async ev => {
    ev.currentTarget.disabled = true;
    try {
      await api(`/api/mobilita/sessioni/${S.id}/completa`, { metodo: 'POST' });
      Object.assign(S.s, { stato: 'completata', completata_il: new Date().toISOString().slice(0, 19).replace('T', ' ') });
      if (blocco) { blocco.release().catch(() => {}); blocco = null; }
      schermataSalvata();
    } catch (ex) { toast(ex.message); ev.target.disabled = false; }
  };
}

function schermataSalvata() {
  const es = S.s.piano.esercizi;
  const fatti = es.filter(e => S.s.esiti[e.rif] === 'fatto').length;
  const fine = Date.parse(String(S.s.completata_il || '').replace(' ', 'T') + 'Z');
  pagina({ titolo: 'Sessione salvata', indietro: '', html: `
    <div class="fine"><div class="fine-fig" id="fine-fig"></div><h1>Ben fatto!</h1><span class="gold-line"></span>
      <p class="muted">${esc(nomeTipo())} · ${esc(nomeArea(S.s.zona))}</p>
      <div class="numeri-riga"><div><b>${fatti}/${es.length}</b><span>esercizi fatti</span></div><div><b>${tempoImpiegato(S.s, fine)}</b><span>minuti</span></div></div></div>`,
    barra: '<a class="btn" href="#/">Home</a><a class="btn primary grow" href="#/storico">Vedi lo storico</a>' });
  montaOmino(document.getElementById('fine-fig'), 'free', { tempo: '0.5-0.1-0.5-0.1' });
  S.id = null; S.s = null;
}
