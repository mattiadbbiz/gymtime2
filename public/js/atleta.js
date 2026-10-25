// GymTime · schermate dell'atleta: Allena e Storico
import { api, esc, dataCorta, dataLunga, dataMese } from './api.js';
import { stato, app, rotta, pagina, attesa, toast, chiedi, finestra } from './ui.js';
import { montaOmino, ominoSVG } from './omino.js';
import { rxTesto, tempoTesto, CAMPI_FATTI, etichetta, durata } from './regole.js';

const PENNA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
const FRECCIA_SX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const rx = (modalita, p, cls = '') => `<span class="rx ${cls}">${esc(rxTesto(modalita, p))}</span>`;
const righe = t => String(t || '').split('\n').map(s => s.trim()).filter(Boolean);
const etichettaHome = () => { const b = app.querySelector('.top .back span'); if (b) b.textContent = 'Home'; };
const media = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
const virgola = n => String(n).replace('.', ',');

/* ======================= ALLENA ======================= */
rotta(/^\/allena$/, async () => {
  attesa('Allena');
  const a = await api('/api/allena');
  if (a.giornata && a.giornata.stato !== 'completata') return location.replace(`#/allena/g/${a.giornata.id}`);
  if (a.giornata) {
    return pagina({ titolo: 'Allena', html: `
      <div class="fatto-oggi"><span class="spunta" aria-hidden="true">✓</span><h1>Fatto per oggi</h1>
      <p class="muted">Hai salvato ${esc(a.giornata.nome_giorno || 'l’allenamento')}. Domani potrai scegliere il prossimo giorno.</p></div>
      <a class="btn primary big" href="#/storico">Vedi lo storico</a>` });
  }
  if (!a.scheda) {
    return pagina({ titolo: 'Allena', html: `<div class="empty" style="margin-top:18px"><h3>Nessuna scheda</h3>
      <p class="hint">Il tuo coach non ti ha ancora assegnato una scheda. Appena lo fa, la trovi qui.</p></div>` });
  }
  const s = a.scheda;
  const sugg = s.giorni[a.suggerito]?.posizione;
  pagina({ titolo: 'Allena', html: `
    <div class="intro"><p class="muted small">${esc(s.nome)}</p><h1>Scegli il giorno</h1>
      <div class="chips">${s.settimane > 1 ? `<span class="tag gold">Settimana ${s.settimana} di ${s.settimane}</span>` : ''}
      ${s.scarico ? '<span class="tag bordeaux">Settimana di scarico</span>' : ''}</div>
      ${s.concluso ? '<p class="hint">Le settimane della scheda sono finite: continui con i valori dell’ultima settimana finché il coach non la aggiorna.</p>' : ''}
    </div>
    <div class="giorni">${s.giorni.map(g => `
      <a class="giorno-card${g.posizione === sugg ? ' suggerito' : ''}" href="#/allena/giorno/${g.posizione}">
        <div class="gc-testa"><h3>${esc(g.nome)}</h3>${g.posizione === sugg ? '<span class="tag bordeaux">Tocca a te</span>' : ''}</div>
        <div class="gc-omini">${g.esercizi.slice(0, 5).map(e => `<span class="mini">${ominoSVG(e.animazione)}</span>`).join('')}</div>
        <p class="small muted">${g.esercizi.length} esercizi: ${esc(g.esercizi.map(e => e.nome).join(', '))}</p>
      </a>`).join('')}</div>` });
});

rotta(/^\/allena\/giorno\/(\d+)$/, async pos => {
  attesa('Anteprima', '#/allena');
  const a = await api('/api/allena');
  if (a.giornata && a.giornata.stato !== 'completata') return location.replace(`#/allena/g/${a.giornata.id}`);
  if (a.giornata || !a.scheda) return location.replace('#/allena');
  const g = a.scheda.giorni.find(x => x.posizione === Number(pos));
  if (!g) return location.replace('#/allena');
  pagina({ titolo: g.nome, indietro: '#/allena', html: `
    <div class="intro"><p class="muted small">Anteprima${a.scheda.settimane > 1 ? ` · settimana ${a.scheda.settimana} di ${a.scheda.settimane}` : ''}</p><h1>${esc(g.nome)}</h1></div>
    <ol class="anteprima">${g.esercizi.map((e, i) => {
      const nuovoGruppo = e.gruppo && (i === 0 || g.esercizi[i - 1].gruppo !== e.gruppo);
      return `${nuovoGruppo ? `<li class="gruppo-testa">Superserie ${esc(e.gruppo)}</li>` : ''}
      <li class="anteprima-es${e.gruppo ? ' in-gruppo' : ''}"><span class="mini">${ominoSVG(e.animazione)}</span>
        <div><h3>${esc(e.nome)}</h3>${rx(e.modalita, e.parametri, 'sm')}
        ${e.variazione ? `<p class="variazione">${esc(e.variazione)}</p>` : ''}</div></li>`;
    }).join('')}</ol>`,
    barra: '<button class="btn primary big" type="button" id="avvia">Avvia scheda</button>' });
  document.getElementById('avvia').onclick = async () => {
    const ok = await chiedi({ titolo: `Avvii ${g.nome}?`, testo: 'Da adesso la data di oggi resta legata a questo giorno e non si può cambiare.', ok: 'Avvia' });
    if (!ok) return;
    try {
      const r = await api('/api/giornate', { metodo: 'POST', dati: { giorno_id: g.id } });
      location.replace(`#/allena/g/${r.id}`);
    } catch (e) { toast(e.message); }
  };
});

/* ---------- Flusso dell'allenamento ---------- */
const F = { id: null };
let blocco = null;
async function tieniSveglio() {
  try { if (!blocco && 'wakeLock' in navigator) { blocco = await navigator.wakeLock.request('screen'); blocco.addEventListener('release', () => { blocco = null; }); } } catch {}
}
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/allena/g/') && blocco) { blocco.release().catch(() => {}); blocco = null; } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && location.hash.startsWith('#/allena/g/')) tieniSveglio(); });

rotta(/^\/allena\/g\/(\d+)$/, async id => {
  if (F.id !== Number(id) || !F.g) {
    attesa('Allenamento');
    const [{ giornata }, d] = await Promise.all([api(`/api/giornate/${id}`), api('/api/domande').catch(() => ({ domande: { pre: [], post: [] } }))]);
    if (giornata.atleta_id !== stato.io.id) return location.replace('#/');
    Object.assign(F, { id: Number(id), g: giornata, domande: d.domande, mod: {}, voti: {}, sub: null,
      sens: { pre: { modalita: 'guidato', risposte: {}, testo: '' }, post: { modalita: 'guidato', risposte: {}, testo: '' } } });
    for (const [rif, s] of Object.entries(giornata.svolti)) {
      if (s.esito === 'modificato' && s.effettivo) F.mod[rif] = s.effettivo;
      if (s.voto) F.voti[rif] = s.voto;
    }
  }
  if (F.g.stato !== 'completata') tieniSveglio();
  disegnaFlusso();
});

function disegnaFlusso() {
  const g = F.g;
  if (g.stato === 'pre') return schermataSensazioni('pre');
  if (g.stato === 'in_corso') return schermataEsercizio();
  if (g.stato === 'post') return F.sub === 'sensazioni' ? schermataSensazioni('post') : schermataVoti();
  return schermataFine();
}

/* ---------- Sensazioni (pre e post) ---------- */
function editorSensazioni(el, fase) {
  const s = F.sens[fase];
  const domande = F.domande?.[fase] || [];
  if (s.modalita === 'guidato' && !domande.length) s.modalita = 'libero';
  el.onclick = el.oninput = null;
  if (s.modalita === 'libero') {
    el.innerHTML = `<label class="full">${fase === 'pre' ? 'Come ti senti prima di iniziare?' : 'Com’è andato l’allenamento?'}
      <textarea rows="6" placeholder="Scrivi liberamente: energia, sonno, dolori, umore…">${esc(s.testo)}</textarea></label>`;
    el.querySelector('textarea').oninput = e => { s.testo = e.target.value; };
    return;
  }
  el.innerHTML = domande.map((q, i) => {
    const v = s.risposte[i];
    let campo = '';
    if (q.tipo === 'scala') campo = `<div class="scala" role="group">${Array.from({ length: 10 }, (_, k) => `<button type="button" data-q="${i}" data-v="${k + 1}" aria-pressed="${v === k + 1}">${k + 1}</button>`).join('')}</div>
      ${q.etichetta_min || q.etichetta_max ? `<div class="scala-et"><span>${esc(q.etichetta_min)}</span><span>${esc(q.etichetta_max)}</span></div>` : ''}`;
    else if (q.tipo === 'scelta') campo = `<div class="chips">${q.opzioni.map(o => `<button type="button" class="chip" data-q="${i}" data-v="${esc(o)}" aria-pressed="${v === o}">${esc(o)}</button>`).join('')}</div>`;
    else campo = `<textarea rows="3" data-q="${i}" placeholder="Scrivi qui">${esc(v || '')}</textarea>`;
    return `<fieldset class="domanda"><legend>${esc(q.testo)}</legend>${campo}</fieldset>`;
  }).join('');
  el.onclick = e => {
    const b = e.target.closest('button[data-q]'); if (!b) return;
    const i = Number(b.dataset.q), q = domande[i];
    const val = q.tipo === 'scala' ? Number(b.dataset.v) : b.dataset.v;
    s.risposte[i] = s.risposte[i] === val ? undefined : val;
    b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b && s.risposte[i] !== undefined)));
  };
  el.oninput = e => { const t = e.target.closest('textarea[data-q]'); if (t) s.risposte[Number(t.dataset.q)] = t.value; };
}
function datiSensazioni(fase) {
  const s = F.sens[fase], domande = F.domande?.[fase] || [];
  if (s.modalita === 'libero') return s.testo.trim() ? { modalita: 'libero', testo: s.testo.trim() } : null;
  const risposte = domande.map((q, i) => ({ q: q.testo, tipo: q.tipo, v: s.risposte[i] }))
    .filter(r => r.v !== undefined && r.v !== null && String(r.v).trim() !== '');
  return risposte.length ? { modalita: 'guidato', risposte } : null;
}

function schermataSensazioni(fase) {
  const s = F.sens[fase];
  const pre = fase === 'pre';
  pagina({ titolo: F.g.nome_giorno || 'Allenamento', indietro: '#/', html: `
    <div class="intro"><p class="muted small">${pre ? 'Prima di iniziare' : 'Ultimo passo'}</p><h1>${pre ? 'Come stai oggi?' : 'Come ti senti?'}</h1>
    ${pre ? '<p class="hint">Rispondi oppure salta: il coach lo leggerà nello storico.</p>' : ''}</div>
    <div class="seg" role="tablist">
      <button type="button" data-m="guidato" aria-current="${s.modalita === 'guidato'}">Guidato</button>
      <button type="button" data-m="libero" aria-current="${s.modalita === 'libero'}">Scrivo io</button></div>
    <div id="sens"></div>`,
    barra: pre
      ? '<button class="btn ghost" type="button" id="salta">Salta</button><button class="btn primary grow" type="button" id="avanti">Avanti</button>'
      : `<button class="btn ghost quad" type="button" id="indietro" aria-label="Indietro">${FRECCIA_SX}</button><button class="btn primary grow" type="button" id="salva">Salva allenamento</button>` });
  etichettaHome();
  const el = document.getElementById('sens');
  editorSensazioni(el, fase);
  app.querySelector('.seg').onclick = e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    s.modalita = b.dataset.m;
    editorSensazioni(el, fase);
    app.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-current', String(x.dataset.m === s.modalita)));
    if (s.modalita === 'libero') el.querySelector('textarea')?.focus();
  };
  const blocca = v => app.querySelectorAll('.bottombar button').forEach(b => { b.disabled = v; });
  if (pre) {
    const avanti = async dati => {
      blocca(true);
      try {
        await api(`/api/giornate/${F.id}/pre`, { metodo: 'PUT', dati: dati || {} });
        F.g.stato = 'in_corso'; F.g.passo = 0; disegnaFlusso();
      } catch (e) { toast(e.message); blocca(false); }
    };
    document.getElementById('salta').onclick = () => avanti(null);
    document.getElementById('avanti').onclick = () => avanti(datiSensazioni('pre'));
  } else {
    document.getElementById('indietro').onclick = () => { F.sub = null; disegnaFlusso(); };
    document.getElementById('salva').onclick = async () => {
      blocca(true);
      try {
        await api(`/api/giornate/${F.id}/completa`, { metodo: 'POST', dati: { voti: F.voti, post: datiSensazioni('post') } });
        F.g.stato = 'completata'; disegnaFlusso();
      } catch (e) { toast(e.message); blocca(false); }
    };
  }
}

/* ---------- Un esercizio per schermata ---------- */
function schermataEsercizio() {
  const es = F.g.piano.esercizi;
  const i = Math.max(0, Math.min(es.length - 1, F.g.passo || 0));
  const e = es[i];
  const mod = F.mod[e.rif];
  const t = e.tecnica?.tempo;
  const acc = righe(e.accorgimenti);
  pagina({ titolo: `${i + 1} di ${es.length}`, indietro: '#/', html: `
    <div class="progresso" aria-hidden="true">${es.map((x, k) => `<span class="${k < i ? 'fatto' : k === i ? 'ora' : ''}"></span>`).join('')}</div>
    <div class="esercizio">
      <div class="stage" id="stage"></div>
      <div class="es-info">
        <p class="muted small">${e.gruppo ? `<span class="tag gold">Superserie ${esc(e.gruppo)}</span>` : esc(F.g.nome_giorno || '')}</p>
        <h2>${esc(e.nome)}</h2>
        <div class="rx-riga">
          ${rx(e.modalita, mod || e.parametri, 'big')}
          <button class="penna" type="button" id="penna" aria-label="Correggi quello che hai fatto davvero">${PENNA}</button>
        </div>
        ${mod ? `<p class="prima">Previsto: <s>${esc(rxTesto(e.modalita, e.parametri))}</s></p>${mod.nota ? `<p class="small">${esc(mod.nota)}</p>` : ''}` : ''}
        ${e.variazione ? `<p class="variazione">${esc(e.variazione)}</p>` : ''}
      </div>
    </div>
    ${t ? `<p class="tempo-es"><b>Tempo ${esc(t)}</b> ${esc(tempoTesto(t))}</p>` : ''}
    <div id="timer"></div>
    ${e.nota ? `<div class="nota-coach"><b>Nota del coach</b><p>${esc(e.nota)}</p></div>` : ''}
    ${acc.length ? `<h3 class="sotto">Accorgimenti</h3><ul class="accorgimenti">${acc.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`,
    barra: `<button class="btn ghost quad" type="button" id="indietro" aria-label="Esercizio precedente" ${i === 0 ? 'disabled' : ''}>${FRECCIA_SX}</button>
      <button class="btn ghost" type="button" id="nonfatto">Non l’ho fatto</button>
      <button class="btn primary grow" type="button" id="fatto">Fatto ›</button>` });
  etichettaHome();
  montaOmino(document.getElementById('stage'), e.animazione, { tempo: t, tenuta: e.modalita === 'tempo' });
  montaTimer(document.getElementById('timer'), e);

  const blocca = v => app.querySelectorAll('.bottombar button').forEach(b => { b.disabled = v || (b.id === 'indietro' && i === 0); });
  const registra = async esito => {
    blocca(true);
    try {
      const m = esito === 'fatto' && F.mod[e.rif] ? F.mod[e.rif] : null;
      const r = await api(`/api/giornate/${F.id}/esercizi/${e.rif}`, { metodo: 'PUT', dati: { esito: m ? 'modificato' : esito, effettivo: m, passo: i + 1 } });
      F.g.svolti[e.rif] = { esito: m ? 'modificato' : esito, effettivo: m };
      if (esito === 'non_fatto') delete F.voti[e.rif];
      if (r.fine) F.g.stato = 'post'; else F.g.passo = i + 1;
      disegnaFlusso();
    } catch (ex) { toast(ex.message); blocca(false); }
  };
  document.getElementById('fatto').onclick = () => registra('fatto');
  document.getElementById('nonfatto').onclick = () => registra('non_fatto');
  document.getElementById('indietro').onclick = async () => {
    blocca(true);
    try { await api(`/api/giornate/${F.id}/passo`, { metodo: 'PUT', dati: { passo: i - 1 } }); F.g.passo = i - 1; disegnaFlusso(); }
    catch (ex) { toast(ex.message); blocca(false); }
  };
  document.getElementById('penna').onclick = () => modificaFatto(e);
}

// La penna: l'atleta scrive quello che ha fatto davvero
function modificaFatto(e) {
  const base = { ...e.parametri, ...(F.mod[e.rif] || {}) };
  const campi = CAMPI_FATTI[e.modalita];
  const v = finestra(`<h3>Cosa hai fatto davvero?</h3><p class="muted small">Previsto: ${esc(rxTesto(e.modalita, e.parametri))}</p>
    <form class="stack" style="margin-top:12px" novalidate>
      <div class="two">${campi.filter(c => c !== 'testo').map(c => `<label>${esc(etichetta(c, e.modalita))}
        <input name="${c}" inputmode="${c === 'rip' ? 'text' : 'decimal'}" value="${esc(base[c] ?? '')}" autocomplete="off"></label>`).join('')}</div>
      ${campi.includes('testo') ? `<label>Descrizione<textarea name="testo" rows="3">${esc(base.testo || '')}</textarea></label>` : ''}
      <label>Nota (facoltativa)<input name="nota" value="${esc(F.mod[e.rif]?.nota || '')}" placeholder="Es. ultima serie con elastico"></label>
      <div class="azioni">${F.mod[e.rif] ? '<button class="btn" type="button" data-a="ripristina">Come previsto</button>' : '<button class="btn" type="button" data-a="annulla">Annulla</button>'}
      <button class="btn primary" type="submit">Salva</button></div>
    </form>`);
  const f = v.querySelector('form');
  f.querySelector('input')?.focus();
  v.querySelector('[data-a="annulla"]')?.addEventListener('click', () => v.remove());
  v.querySelector('[data-a="ripristina"]')?.addEventListener('click', () => { delete F.mod[e.rif]; v.remove(); schermataEsercizio(); });
  f.onsubmit = ev => {
    ev.preventDefault();
    const out = {};
    for (const c of campi) {
      const raw = f.elements[c]?.value.trim();
      if (!raw) continue;
      if (c === 'testo' || (c === 'rip' && /[-–]/.test(raw))) out[c] = raw;
      else { const n = Number(raw.replace(',', '.')); if (Number.isFinite(n) && n >= 0) out[c] = n; }
    }
    const nota = f.elements.nota.value.trim();
    if (nota) out.nota = nota;
    const uguale = !nota && campi.every(c => String(out[c] ?? '') === String(e.parametri[c] ?? ''));
    if (uguale) delete F.mod[e.rif]; else F.mod[e.rif] = out;
    v.remove(); schermataEsercizio();
  };
}

/* ---------- Timer: tenute, EMOM, AMRAP, RT e recuperi ---------- */
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
const mmss = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function configTimer(e) {
  const p = e.parametri;
  if (e.modalita === 'tempo' && p.secondi) return { lavoro: p.secondi, serie: p.serie || 1, rec: p.rec || 0, nome: 'Tenuta' };
  if (e.modalita === 'emom' && p.minuti) return { lavoro: p.minuti * 60, minuti: true, nome: 'EMOM' };
  if (e.modalita === 'amrap' && p.minuti) return { lavoro: p.minuti * 60, nome: 'AMRAP' };
  if (e.modalita === 'rt') return { cronometro: true, limite: p.minuti ? p.minuti * 60 : 0, nome: 'Cronometro' };
  if (p.rec) return { solo_rec: true, rec: p.rec, nome: 'Recupero' };
  return null;
}

function montaTimer(el, e) {
  const c = configTimer(e);
  if (!c) return;
  const S = { fase: c.solo_rec ? 'rec' : 'lavoro', corre: false, inizio: 0, passati: 0, serie: 1, ultimo: null };
  const durataFase = () => S.fase === 'rec' ? c.rec : c.lavoro;
  const trascorso = () => S.passati + (S.corre ? (Date.now() - S.inizio) / 1000 : 0);
  el.innerHTML = `<div class="timer"><div class="t-testa"><b id="t-nome"></b><span id="t-info" class="muted small"></span></div>
    <div class="t-cifre" id="t-cifre">0:00</div>
    <div class="t-azioni"><button class="btn primary sm" type="button" id="t-via">Avvia</button>
    <button class="btn sm" type="button" id="t-zero">Azzera</button>
    ${c.cronometro ? '<button class="btn sm" type="button" id="t-segna" hidden>Segna il tempo</button>' : ''}
    ${c.rec && !c.solo_rec ? `<button class="btn sm" type="button" id="t-rec">Recupero ${durata(c.rec)}</button>` : ''}</div></div>`;
  const $ = id => el.querySelector('#' + id);
  const disegna = () => {
    const t = trascorso();
    $('t-cifre').textContent = c.cronometro ? mmss(t) : mmss(durataFase() - t);
    $('t-cifre').classList.toggle('rec', S.fase === 'rec');
    $('t-nome').textContent = S.fase === 'rec' ? 'Recupero' : c.nome;
    $('t-info').textContent = c.serie > 1 && S.fase === 'lavoro' ? `serie ${S.serie} di ${c.serie}`
      : c.minuti && t > 0 ? `minuto ${Math.min(Math.floor(t / 60) + 1, c.lavoro / 60)} di ${c.lavoro / 60}`
      : c.limite ? `limite ${durata(c.limite)}` : '';
    $('t-via').textContent = S.corre ? 'Pausa' : (t > 0 ? 'Riprendi' : 'Avvia');
    if ($('t-segna')) $('t-segna').hidden = S.corre || t < 1;
  };
  const azzera = fase => { S.fase = fase; S.corre = false; S.passati = 0; S.ultimo = null; };
  const parti = () => { S.corre = true; S.inizio = Date.now(); };
  const tick = setInterval(() => {
    if (!el.isConnected) return clearInterval(tick);
    if (!S.corre) return;
    const t = trascorso();
    if (c.cronometro) {
      if (c.limite && t >= c.limite && S.ultimo !== 'limite') { S.ultimo = 'limite'; bip(true); }
    } else {
      const resta = durataFase() - t, sec = Math.ceil(resta);
      if (sec <= 3 && sec > 0 && S.ultimo !== sec) { S.ultimo = sec; bip(); }
      if (c.minuti && resta > 1) { const m = Math.floor(t / 60); if (m > 0 && t - m * 60 < 0.4 && S.ultimo !== 'm' + m) { S.ultimo = 'm' + m; bip(true); } }
      if (resta <= 0) {
        bip(true);
        if (S.fase === 'lavoro' && c.serie > 1 && S.serie < c.serie) {
          S.serie++;
          if (c.rec) { azzera('rec'); parti(); } else azzera('lavoro');
        } else if (S.fase === 'rec' && !c.solo_rec) azzera('lavoro');
        else azzera(S.fase);
      }
    }
    disegna();
  }, 200);
  $('t-via').onclick = () => {
    if (S.corre) { S.passati = trascorso(); S.corre = false; }
    else { parti(); bip(); if (audio?.state === 'suspended') audio.resume(); }
    disegna();
  };
  $('t-zero').onclick = () => { S.serie = 1; azzera(c.solo_rec ? 'rec' : 'lavoro'); disegna(); };
  if ($('t-rec')) $('t-rec').onclick = () => { azzera('rec'); parti(); disegna(); };
  if ($('t-segna')) $('t-segna').onclick = () => {
    const sec = Math.round(trascorso());
    const m = { ...e.parametri, ...(F.mod[e.rif] || {}), secondi_tot: sec };
    delete m.minuti;
    F.mod[e.rif] = m;
    toast(`Tempo segnato: ${durata(sec)}`);
    schermataEsercizio();
  };
  disegna();
}

/* ---------- Voti ---------- */
function schermataVoti() {
  const es = F.g.piano.esercizi;
  pagina({ titolo: 'Fine allenamento', indietro: '#/', html: `
    <div class="intro"><p class="muted small">Quasi finito</p><h1>Dai un voto</h1>
    <p class="hint">Da 1 a 10: quanto ti è venuto bene ogni esercizio?</p></div>
    <ol class="voti">${es.map(e => {
      const sv = F.g.svolti[e.rif] || {};
      const fatto = sv.esito === 'non_fatto' ? '<span class="tag">Non fatto</span>'
        : sv.esito === 'modificato' ? `<span class="small mod">Fatto: ${esc(rxTesto(e.modalita, sv.effettivo || {}))}</span>`
        : `<span class="small muted">${esc(rxTesto(e.modalita, e.parametri))}</span>`;
      return `<li class="voto-es" id="v-${e.rif}"><div class="ve-testa"><span class="mini">${ominoSVG(e.animazione)}</span><div><h3>${esc(e.nome)}</h3>${fatto}</div></div>
        ${sv.esito === 'non_fatto' ? '' : `<div class="scala" role="group" aria-label="Voto per ${esc(e.nome)}">${Array.from({ length: 10 }, (_, k) =>
          `<button type="button" data-r="${e.rif}" data-v="${k + 1}" aria-pressed="${F.voti[e.rif] === k + 1}">${k + 1}</button>`).join('')}</div>`}</li>`;
    }).join('')}</ol>`,
    barra: `<button class="btn ghost quad" type="button" id="indietro" aria-label="Torna all’ultimo esercizio">${FRECCIA_SX}</button><button class="btn primary grow" type="button" id="avanti">Avanti</button>` });
  etichettaHome();
  app.querySelector('.voti').onclick = ev => {
    const b = ev.target.closest('button[data-r]'); if (!b) return;
    F.voti[b.dataset.r] = Number(b.dataset.v);
    b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    b.closest('.voto-es').classList.remove('manca');
  };
  document.getElementById('avanti').onclick = () => {
    const manca = es.filter(e => F.g.svolti[e.rif]?.esito !== 'non_fatto' && !F.voti[e.rif]);
    if (manca.length) {
      manca.forEach(e => document.getElementById('v-' + e.rif).classList.add('manca'));
      document.getElementById('v-' + manca[0].rif).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return toast(manca.length === 1 ? `Manca il voto a ${manca[0].nome}` : `Mancano ${manca.length} voti`);
    }
    F.sub = 'sensazioni'; disegnaFlusso();
  };
  document.getElementById('indietro').onclick = async () => {
    try { await api(`/api/giornate/${F.id}/passo`, { metodo: 'PUT', dati: { passo: es.length - 1 } }); F.g.stato = 'in_corso'; F.g.passo = es.length - 1; disegnaFlusso(); }
    catch (e) { toast(e.message); }
  };
}

function schermataFine() {
  const es = F.g.piano.esercizi;
  const fatti = es.filter(e => F.g.svolti[e.rif]?.esito !== 'non_fatto').length;
  const m = media(Object.values(F.voti).map(Number).filter(Boolean));
  pagina({ titolo: 'Allenamento salvato', indietro: '', html: `
    <div class="fine"><div class="fine-fig" id="fine-fig"></div>
      <h1>Grande, fatto!</h1><span class="gold-line"></span>
      <p class="muted">${esc(F.g.nome_giorno || '')} · ${dataLunga(F.g.data)}</p>
      <div class="numeri-riga"><div><b>${fatti}/${es.length}</b><span>esercizi fatti</span></div>${m ? `<div><b>${virgola(m)}</b><span>voto medio</span></div>` : ''}</div>
    </div>`,
    barra: '<a class="btn" href="#/">Home</a><a class="btn primary grow" href="#/storico">Vedi lo storico</a>' });
  montaOmino(document.getElementById('fine-fig'), 'free', { tempo: '0.5-0.1-0.5-0.1' });
  F.id = null; F.g = null;
}

/* ======================= STORICO ======================= */
const vista = { mese: null, atleta: null, scheda: 'giornate', esercizio: null };
const lunediDi = iso => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); };
const piuGiorni = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// Costanza: settimane consecutive con almeno un allenamento salvato, e le ultime 12 settimane
function costanza(completate, oggi) {
  const sett = new Map();
  for (const g of completate) { const k = lunediDi(g.data); sett.set(k, (sett.get(k) || 0) + 1); }
  let k = lunediDi(oggi), serie = 0;
  if (!sett.has(k)) k = piuGiorni(k, -7);
  while (sett.has(k)) { serie++; k = piuGiorni(k, -7); }
  const ultime = [];
  const questa = lunediDi(oggi);
  for (let i = 11; i >= 0; i--) { const s = piuGiorni(questa, -7 * i); ultime.push({ s, n: sett.get(s) || 0 }); }
  return { serie, ultime };
}

function calendario(giornate, mese, oggi) {
  const [y, m] = mese.split('-').map(Number);
  const primo = new Date(Date.UTC(y, m - 1, 1)), giorniMese = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const vuoti = (primo.getUTCDay() + 6) % 7;
  const per = new Map(giornate.map(g => [g.data, g]));
  let celle = '';
  for (let i = 0; i < vuoti; i++) celle += '<span class="c-vuota"></span>';
  for (let d = 1; d <= giorniMese; d++) {
    const iso = `${mese}-${String(d).padStart(2, '0')}`, g = per.get(iso);
    const cls = [g ? (g.stato === 'completata' ? 'si' : 'corso') : '', iso === oggi ? 'oggi' : ''].join(' ').trim();
    celle += g ? `<button type="button" class="c-giorno ${cls}" data-g="${g.id}" aria-label="${dataLunga(iso)}: ${esc(g.nome_giorno || 'allenamento')}">${d}</button>`
      : `<span class="c-giorno ${cls}">${d}</span>`;
  }
  return `<div class="cal"><div class="cal-testa"><button type="button" class="btn ghost sm" data-mese="-1" aria-label="Mese precedente">‹</button>
    <b>${dataMese(mese + '-01')}</b><button type="button" class="btn ghost sm" data-mese="1" aria-label="Mese successivo" ${mese >= oggi.slice(0, 7) ? 'disabled' : ''}>›</button></div>
    <div class="cal-sett">${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="cal-griglia">${celle}</div>
    <div class="cal-legenda"><span><i class="si"></i>Allenato</span><span><i class="corso"></i>In corso</span></div></div>`;
}

const fattoTesto = (e, sv) => {
  if (!sv) return '<span class="muted">Non registrato</span>';
  if (sv.esito === 'non_fatto') return '<span class="danger-t">Non fatto</span>';
  if (sv.esito === 'modificato') return `<span class="mod">Fatto: ${esc(rxTesto(e.modalita, sv.effettivo || {}))}</span>${sv.effettivo?.nota ? ` <span class="muted">(${esc(sv.effettivo.nota)})</span>` : ''}`;
  return '<span class="ok">Fatto come previsto</span>';
};
function sensazioniHTML(s, titolo) {
  if (!s) return '';
  const corpo = s.modalita === 'libero' ? `<p>${esc(s.testo)}</p>`
    : `<ul>${(s.risposte || []).map(r => `<li><span class="muted">${esc(r.q)}</span> <b>${esc(r.v)}${r.tipo === 'scala' ? '/10' : ''}</b></li>`).join('')}</ul>`;
  return `<div class="sens-box"><b>${titolo}</b>${corpo}</div>`;
}
function cartaGiornata(g, puoEliminare) {
  const es = g.piano.esercizi || [];
  const voti = es.map(e => g.svolti[e.rif]?.voto).filter(Boolean);
  const fatti = es.filter(e => g.svolti[e.rif] && g.svolti[e.rif].esito !== 'non_fatto').length;
  const m = media(voti);
  return `<details class="giornata" id="g-${g.id}">
    <summary><div><b>${dataLunga(g.data)}</b><span class="muted small">${esc(g.nome_giorno || '')}${(g.piano.settimane || 1) > 1 ? ` · settimana ${g.settimana}` : ''}</span></div>
      <div class="g-chips">${g.stato === 'completata' ? `<span class="tag">${fatti}/${es.length}</span>${m ? `<span class="tag gold">★ ${virgola(m)}</span>` : ''}` : '<span class="tag bordeaux">In corso</span>'}</div></summary>
    <div class="g-corpo">
      ${sensazioniHTML(g.sensazioni.pre, 'Prima')}
      <ol class="g-esercizi">${es.map(e => { const sv = g.svolti[e.rif]; return `<li>
        <div class="ge-testa"><b>${esc(e.nome)}</b>${sv?.voto ? `<span class="voto-pill">${sv.voto}</span>` : ''}</div>
        <div class="small"><span class="muted">Previsto:</span> ${esc(rxTesto(e.modalita, e.parametri))}</div>
        <div class="small">${fattoTesto(e, sv)}</div></li>`; }).join('')}</ol>
      ${sensazioniHTML(g.sensazioni.post, 'Dopo')}
      ${puoEliminare ? `<button type="button" class="link danger" data-elimina="${g.id}">Elimina giornata e sbloccala</button>` : ''}
    </div></details>`;
}

// Valore da seguire nel tempo: carico, poi secondi, ripetizioni, giri o tempo impiegato
const METRICHE = [['carico', 'Carico', ' kg'], ['secondi', 'Secondi di tenuta', ' s'], ['rip', 'Ripetizioni', ''], ['giri', 'Giri', ''], ['secondi_tot', 'Tempo impiegato', ' s']];
function serieEsercizio(completate, nome) {
  const punti = [];
  for (const g of [...completate].sort((a, b) => a.data.localeCompare(b.data))) {
    for (const e of g.piano.esercizi || []) {
      if (e.nome !== nome) continue;
      const sv = g.svolti[e.rif];
      if (!sv || sv.esito === 'non_fatto') continue;
      const v = sv.esito === 'modificato' ? { ...e.parametri, ...(sv.effettivo || {}) } : e.parametri;
      punti.push({ data: g.data, v, voto: sv.voto });
    }
  }
  const metrica = METRICHE.find(([k]) => punti.some(p => parseFloat(p.v[k]) > 0));
  if (!metrica) return { punti: [], metrica: null };
  return { punti: punti.map(p => ({ ...p, y: parseFloat(p.v[metrica[0]]) })).filter(p => p.y > 0), metrica };
}
function grafico(punti) {
  if (punti.length < 2) return '<p class="hint">Servono almeno due allenamenti con questo esercizio per vedere la linea.</p>';
  const W = 340, H = 170, px = 30, py = 22;
  const ys = punti.map(p => p.y), min = Math.min(...ys), max = Math.max(...ys), span = max - min || 1;
  const X = i => px + i * (W - 2 * px) / (punti.length - 1);
  const Y = v => H - py - (v - min) / span * (H - 2 * py);
  const linea = punti.map((p, i) => `${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const etichette = punti.length <= 8 ? punti.map((_, i) => i) : [...new Set([0, punti.length - 1, ys.indexOf(max)])];
  return `<svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento nel tempo">
    <line class="g-asse" x1="${px}" x2="${W - px}" y1="${H - py}" y2="${H - py}"/>
    <polyline class="g-linea" points="${linea}"/>
    ${punti.map((p, i) => `<circle class="g-punto" cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4"/>`).join('')}
    ${etichette.map(i => `<text class="g-val" x="${X(i).toFixed(1)}" y="${(Y(punti[i].y) - 9).toFixed(1)}" text-anchor="middle">${virgola(punti[i].y)}</text>`).join('')}
    <text class="g-data" x="${px}" y="${H - 4}" text-anchor="start">${dataCorta(punti[0].data)}</text>
    <text class="g-data" x="${W - px}" y="${H - 4}" text-anchor="end">${dataCorta(punti[punti.length - 1].data)}</text></svg>`;
}

// Usata anche dal coach per lo storico di un atleta
export async function vistaStorico(atletaId, opz = {}) {
  const io = stato.io;
  const mio = atletaId === io.id;
  const indietro = opz.indietro || (mio ? '#/' : `#/atleta/${atletaId}`);
  attesa('Storico', indietro);
  const d = await api(`/api/storico/${atletaId}`);
  const oggi = d.oggi;
  if (vista.atleta !== atletaId) Object.assign(vista, { mese: oggi.slice(0, 7), atleta: atletaId, scheda: 'giornate', esercizio: null });
  const completate = d.giornate.filter(g => g.stato === 'completata');
  const puoEliminare = io.ruolo !== 'atleta';
  const disegna = () => {
    const { serie, ultime } = costanza(completate, oggi);
    const nelMese = completate.filter(g => g.data.startsWith(oggi.slice(0, 7))).length;
    const tuttiVoti = completate.flatMap(g => Object.values(g.svolti).map(s => s.voto).filter(Boolean));
    const nomi = [...new Set(completate.flatMap(g => (g.piano.esercizi || []).filter(e => g.svolti[e.rif] && g.svolti[e.rif].esito !== 'non_fatto').map(e => e.nome)))].sort((a, b) => a.localeCompare(b, 'it'));
    if (!vista.esercizio || !nomi.includes(vista.esercizio)) vista.esercizio = nomi[0] || null;
    const maxSett = Math.max(1, ...ultime.map(u => u.n));
    let contenuto;
    if (vista.scheda === 'giornate') {
      contenuto = d.giornate.length ? d.giornate.map(g => cartaGiornata(g, puoEliminare)).join('')
        : `<div class="empty">${mio ? 'Qui troverai i tuoi allenamenti salvati.' : 'Nessun allenamento salvato.'}</div>`;
    } else {
      const { punti, metrica } = vista.esercizio ? serieEsercizio(completate, vista.esercizio) : { punti: [], metrica: null };
      const diff = punti.length >= 2 ? Math.round((punti[punti.length - 1].y - punti[0].y) * 100) / 100 : null;
      contenuto = !nomi.length ? '<div class="empty">I progressi compaiono dopo il primo allenamento salvato.</div>' : `
        <label class="full">Esercizio<select id="sel-es">${nomi.map(n => `<option ${n === vista.esercizio ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        ${metrica ? `<div class="card"><div class="prog-testa"><b>${metrica[1]}</b>${diff !== null ? `<span class="tag gold">${diff >= 0 ? '+' : '−'}${virgola(Math.abs(diff))}${metrica[2]} dall’inizio</span>` : ''}</div>
          ${grafico(punti)}
          <ol class="prog-lista">${[...punti].reverse().slice(0, 8).map(p => `<li><span>${dataCorta(p.data)}</span><b>${virgola(p.y)}${metrica[2]}</b>${p.voto ? `<span class="voto-pill">${p.voto}</span>` : '<span></span>'}</li>`).join('')}</ol></div>`
          : '<p class="hint">Per questo esercizio non ci sono numeri da confrontare.</p>'}`;
    }
    pagina({ titolo: mio ? 'Storico' : `Storico di ${d.atleta.nome}`, indietro, html: `
      <div class="numeri-riga">
        <div><b>${nelMese}</b><span>questo mese</span></div>
        <div><b>${serie}</b><span>${serie === 1 ? 'settimana' : 'settimane'} di fila</span></div>
        <div><b>${tuttiVoti.length ? virgola(media(tuttiVoti)) : '–'}</b><span>voto medio</span></div>
      </div>
      <div class="costanza" aria-label="Allenamenti nelle ultime 12 settimane">${ultime.map(u => `<span title="Settimana del ${dataCorta(u.s)}: ${u.n}" style="--h:${u.n ? Math.max(18, u.n / maxSett * 100) : 8}%" class="${u.n ? 'si' : ''}"></span>`).join('')}</div>
      <p class="small muted cost-et">Ultime 12 settimane · ${completate.length} ${completate.length === 1 ? 'allenamento' : 'allenamenti'} in totale</p>
      ${calendario(d.giornate, vista.mese, oggi)}
      <div class="seg" role="tablist"><button type="button" data-s="giornate" aria-current="${vista.scheda === 'giornate'}">Giornate</button>
        <button type="button" data-s="progressi" aria-current="${vista.scheda === 'progressi'}">Progressi</button></div>
      <div id="contenuto">${contenuto}</div>` });
    app.onclick = async ev => {
      const t = ev.target;
      const mese = t.closest('[data-mese]');
      if (mese) { const [y, m] = vista.mese.split('-').map(Number); vista.mese = new Date(Date.UTC(y, m - 1 + Number(mese.dataset.mese), 1)).toISOString().slice(0, 7); return disegna(); }
      const s = t.closest('[data-s]');
      if (s) { vista.scheda = s.dataset.s; return disegna(); }
      const giorno = t.closest('[data-g]');
      if (giorno) {
        if (vista.scheda !== 'giornate') { vista.scheda = 'giornate'; disegna(); }
        const det = document.getElementById('g-' + giorno.dataset.g);
        if (det) { det.open = true; det.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }
      const el = t.closest('[data-elimina]');
      if (el) {
        const ok = await chiedi({ titolo: 'Eliminare questa giornata?', testo: 'Si cancellano esercizi, voti e sensazioni di quel giorno. Se è oggi, l’atleta potrà rifare l’allenamento.', ok: 'Elimina', pericolo: true });
        if (!ok) return;
        try { await api(`/api/giornate/${el.dataset.elimina}`, { metodo: 'DELETE' }); toast('Giornata eliminata'); vistaStorico(atletaId, opz); }
        catch (e) { toast(e.message); }
      }
    };
    app.onchange = ev => { if (ev.target.id === 'sel-es') { vista.esercizio = ev.target.value; disegna(); } };
  };
  disegna();
}

rotta(/^\/storico$/, () => vistaStorico(stato.io.id));
rotta(/^\/storico\/(\d+)$/, id => vistaStorico(Number(id)));
