// GymTime · schermate dell'atleta: Allena e Storico (giornate, progressi, schede)
import { api, esc, dataCorta, dataLunga, dataMese } from './api.js';
import { stato, app, rotta, pagina, attesa, toast, chiedi, finestra } from './ui.js';
import { montaOmino, ominoSVG, animazioneVariante, POSE } from './omino.js';
import { montaOmino3D } from './omino3d.js';
import { rxTesto, tempoTesto, CAMPI_FATTI, etichetta, durata, testoVariante } from './regole.js';
import { htmlSchede, apriScheda } from './storico-schede.js';
import {modificaFineRecupero,pausaCambio} from './recuperi.js';
import { FASI, nomeArea, doseTesto } from './mobilita.js';

const PENNA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
const FRECCIA_SX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const rx = (modalita, p, cls = '') => `<span class="rx ${cls}">${esc(rxTesto(modalita, p))}</span>`;
const righe = t => String(t || '').split('\n').map(s => s.trim()).filter(Boolean);
const etichettaHome = () => { const b = app.querySelector('.top .back span'); if (b) b.textContent = 'Home'; };
const media = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
const virgola = n => String(n).replace('.', ',');
const posa = e => animazioneVariante(e.animazione, e.variante);   // omino con la variante scelta dal coach
// Fermo solo nelle tenute: un tapis o un vogatore "a tempo" continuano a muoversi
const tenuta = (e, k) => e.modalita === 'tempo' && !POSE[k]?.lineare;
const htmlVar = e => { const t = testoVariante(e.variante); return t ? `<p class="var-t small">${esc(t)}</p>` : ''; };

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
        <div class="gc-omini">${g.esercizi.slice(0, 5).map(e => `<span class="mini">${ominoSVG(posa(e))}</span>`).join('')}</div>
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
      <li class="anteprima-es${e.gruppo ? ' in-gruppo' : ''}"><span class="mini">${ominoSVG(posa(e))}</span>
        <div><h3>${esc(e.nome)}</h3>${rx(e.modalita, e.parametri, 'sm')}${htmlVar(e)}${e.parametri.rec ? `<p class="small muted">${e.gruppo?'Recupero dopo il giro':'Recupero tra serie'}: ${esc(durata(e.parametri.rec))}</p>` : ''}
        ${e.gruppo && e.parametri.pausa ? `<p class="small muted">poi pausa di ${esc(durata(e.parametri.pausa))}</p>` : ''}
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
// Serie contate, recuperi in corso e punto della superserie: restano nel telefono, per giornata
const CHIAVE_FLUSSO = id => `gymtime-flusso-${id}`;
function leggiFlusso(id) { try { return JSON.parse(localStorage.getItem(CHIAVE_FLUSSO(id))) || {}; } catch { return {}; } }
function salvaFlusso() { try { localStorage.setItem(CHIAVE_FLUSSO(F.id), JSON.stringify(F.flusso)); } catch {} }
function chiudiFlusso(id) { try { localStorage.removeItem(CHIAVE_FLUSSO(id)); } catch {} }
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
    Object.assign(F, { id: Number(id), g: giornata, domande: d.domande, mod: {}, voti: {}, sub: null, flusso: leggiFlusso(Number(id)),
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
  const c=F.flusso?.cambio;if(g.stato==='in_corso'&&c){if(g.piano.esercizi[g.passo]?.rif===c.a&&(!c.fine||c.fine>Date.now()))return schermataCambioEsercizio();F.flusso.cambio=null;salvaFlusso();}
  if (g.stato === 'pre') return schermataSensazioni('pre');
  if (g.stato === 'in_corso') return schermataEsercizio();
  if (g.stato === 'post') return F.sub === 'sensazioni' ? schermataSensazioni('post') : schermataVoti();
  return schermataFine();
}

let fermaCambio=null;
function schermataCambioEsercizio(){if(fermaCambio){fermaCambio();fermaCambio=null;}const c=F.flusso.cambio,p=F.g.piano.esercizi[F.g.passo];const termina=()=>{fermaCambio?.();fermaCambio=null;F.flusso.cambio=null;salvaFlusso();disegnaFlusso();};pagina({titolo:'Prima del prossimo esercizio',html:`<div class="intro"><p class="muted small">Recupero facoltativo</p><h1>Prenditi il tuo tempo</h1><p class="hint">Recupero dell’esercizio concluso + 1 minuto. Modificalo o passa subito oltre.</p></div><div class="card"><span class="lbl">Prossimo esercizio</span><h2>${esc(p.nome)}</h2></div><div class="timer gt-cambio"><div class="t-testa"><b>${c.fine?'Recupero in corso':'Pausa consigliata'}</b></div><div class="t-cifre rec" id="cambio-cifre">${mmss(c.secondi)}</div><div class="t-azioni"><button class="btn sm" id="cambio-meno" type="button">−15 s</button><button class="btn sm" id="cambio-piu" type="button">+15 s</button></div></div><p class="hint">La modifica vale solo per questa pausa: la scheda del coach resta invariata.</p>`,barra:`${!c.fine?'<button class="btn primary grow" id="cambio-avvia">Avvia recupero</button>':''}<button class="btn ${c.fine?'primary grow':''}" id="cambio-salta">Vai al prossimo esercizio</button>`});const modifica=delta=>{if(c.fine){c.fine=modificaFineRecupero(c.fine,delta);if(c.fine<=Date.now())return termina();}else c.secondi=Math.max(0,c.secondi+delta);salvaFlusso();schermataCambioEsercizio();};document.getElementById('cambio-meno').onclick=()=>modifica(-15);document.getElementById('cambio-piu').onclick=()=>modifica(15);document.getElementById('cambio-salta').onclick=termina;const avvia=document.getElementById('cambio-avvia');if(avvia)avvia.onclick=()=>{if(!c.secondi)return termina();c.fine=Date.now()+c.secondi*1000;salvaFlusso();schermataCambioEsercizio();};if(c.fine)fermaCambio=contoAllaRovescia(document.getElementById('cambio-cifre'),c.fine,termina);}

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
  const bl = bloccoDi(es, i);
  if (bl) return schermataSuperserie(bl);
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
        <h2>${esc(e.nome)}</h2>${htmlVar(e)}
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
  const k = posa(e);
  montaOmino3D(document.getElementById('stage'), k, { tempo: t, tenuta: tenuta(e, k), muscoli: e.muscolo });   // 3D se il dispositivo lo regge, altrimenti SVG
  if (contaSerie(e)) montaSerie(document.getElementById('timer'), e); else montaTimer(document.getElementById('timer'), e);

  const blocca = v => app.querySelectorAll('.bottombar button').forEach(b => { b.disabled = v || (b.id === 'indietro' && i === 0); });
  const registra = async esito => {
    blocca(true);
    try {
      const m = esito === 'fatto' && F.mod[e.rif] ? F.mod[e.rif] : null;
      const r = await api(`/api/giornate/${F.id}/esercizi/${e.rif}`, { metodo: 'PUT', dati: { esito: m ? 'modificato' : esito, effettivo: m, passo: i + 1 } });
      F.g.svolti[e.rif] = { esito: m ? 'modificato' : esito, effettivo: m };
      if (esito === 'non_fatto') delete F.voti[e.rif];
      delete F.flusso.serie?.[e.rif]; if (F.flusso.attesa?.rif === e.rif) F.flusso.attesa = null; salvaFlusso();
      if (r.fine) F.g.stato = 'post'; else F.g.passo = i + 1;
      F.flusso.cambio=r.fine?null:pausaCambio(es,i,esito);salvaFlusso();
      disegnaFlusso();
    } catch (ex) { toast(ex.message); blocca(false); }
  };
  document.getElementById('fatto').onclick = async () => {
    // Serie contate ma non tutte: chiede se segnare solo quelle
    const tot = contaSerie(e), fatte = F.flusso.serie?.[e.rif] || 0;
    if (tot && fatte > 0 && fatte < tot && !F.mod[e.rif]) {
      const r = await sceltaSerie(fatte, tot);
      if (!r) return;
      if (r === 'parziale') F.mod[e.rif] = { ...e.parametri, serie: fatte };
    }
    registra('fatto');
  };
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

/* ---------- Serie fatte e recupero automatico (serie × ripetizioni) ---------- */
// Serie × ripetizioni, e cardio a distanza o calorie con più serie (es. 5 × 500 m)
const contaSerie = e => {
  const n = Math.round(Number(e.parametri.serie) || 0);
  if (e.modalita === 'setrep') return n >= 1 ? n : 0;
  if (e.modalita === 'cardio' && (e.parametri.metri || e.parametri.calorie)) return n > 1 ? n : 0;
  return 0;
};

function sceltaSerie(fatte, tot) {
  return new Promise(risolvi => {
    const v = finestra(`<h3>Hai fatto ${fatte} serie su ${tot}?</h3>
      <p class="muted small">Il coach vede quante ne hai fatte davvero.</p>
      <div class="menu" style="margin-top:10px"><button type="button" class="btn primary" data-r="parziale">Segna ${fatte} serie</button>
      <button type="button" class="btn" data-r="tutte">Le ho fatte tutte</button></div>
      <div class="azioni"><button type="button" class="btn" data-r="">Annulla</button></div>`);
    v.addEventListener('click', ev => {
      const b = ev.target.closest('[data-r]');
      if (!b && ev.target !== v) return;
      v.remove(); risolvi(b ? b.dataset.r || null : null);
    });
  });
}

// Conto alla rovescia fino a fine (ms): bip negli ultimi 3 secondi e bip lungo alla fine
function contoAllaRovescia(el, fine, finito) {
  let ultimo = null;
  const tick = () => {
    if (!el.isConnected) return clearInterval(id);
    const resta = (fine - Date.now()) / 1000, sec = Math.ceil(resta);
    el.textContent = mmss(resta);
    if (sec <= 3 && sec > 0 && ultimo !== sec) { ultimo = sec; bip(); }
    if (resta <= 0) { clearInterval(id); bip(true); finito(); }
  };
  const id = setInterval(tick, 200);
  tick();
  return () => clearInterval(id);
}

function montaSerie(el, e) {
  const tot = contaSerie(e), rec = Number(e.parametri.rec) || 0;
  const fl = F.flusso; fl.serie = fl.serie || {};
  let ferma = null;
  const disegna = () => {
    if (ferma) { ferma(); ferma = null; }
    const fatte = Math.min(tot, fl.serie[e.rif] || 0);
    const att = fl.attesa?.rif === e.rif && fl.attesa.fine > Date.now() ? fl.attesa : null;
    const finite = fatte >= tot;
    el.innerHTML = `<div class="timer serie-box">
      <div class="t-testa"><b>${att ? 'Recupero' : finite ? 'Serie finite' : `Serie ${fatte + 1} di ${tot}`}</b>
        <span class="muted small">${att ? `poi serie ${fatte + 1} di ${tot}` : finite ? 'premi Fatto' : rec ? `recupero ${durata(rec)}` : ''}</span></div>
      <div class="s-pallini" aria-label="${fatte} serie fatte su ${tot}">${Array.from({ length: tot }, (_, k) => `<span class="${k < fatte ? 'fatto' : k === fatte && !att ? 'ora' : ''}"></span>`).join('')}</div>
      ${att ? '<div class="t-cifre rec" id="s-cifre"></div>' : ''}
      <div class="t-azioni">${att ? '<button class="btn sm" type="button" id="s-rec-meno">−15 s</button><button class="btn sm" type="button" id="s-rec-piu">+15 s</button><button class="btn primary sm" type="button" id="s-salta">Salta il recupero</button>'
        : finite ? '' : '<button class="btn primary grow" type="button" id="s-fatta">Serie fatta</button>'}
        ${fatte > 0 ? '<button class="btn sm" type="button" id="s-meno">Annulla l’ultima</button>' : ''}</div></div>`;
    document.getElementById('fatto')?.classList.toggle('pronto', finite);
    const $ = id => el.querySelector('#' + id);
    if (att) ferma = contoAllaRovescia($('s-cifre'), att.fine, () => { fl.attesa = null; salvaFlusso(); disegna(); });
    if ($('s-fatta')) $('s-fatta').onclick = () => {
      if (audio?.state === 'suspended') audio.resume();
      fl.serie[e.rif] = fatte + 1;
      fl.attesa = fatte + 1 < tot && rec ? { rif: e.rif, fine: Date.now() + rec * 1000 } : null;
      if (fatte + 1 >= tot) bip(true);
      salvaFlusso(); disegna();
    };
    const varia=delta=>{if(!fl.attesa)return;fl.attesa.fine=modificaFineRecupero(fl.attesa.fine,delta);if(fl.attesa.fine<=Date.now())fl.attesa=null;salvaFlusso();disegna();};
    if($('s-rec-meno'))$('s-rec-meno').onclick=()=>varia(-15);if($('s-rec-piu'))$('s-rec-piu').onclick=()=>varia(15);
    if ($('s-salta')) $('s-salta').onclick = () => { fl.attesa = null; salvaFlusso(); disegna(); };
    if ($('s-meno')) $('s-meno').onclick = () => { fl.serie[e.rif] = Math.max(0, fatte - 1); fl.attesa = null; salvaFlusso(); disegna(); };
  };
  disegna();
}

/* ---------- Superserie: giri, pause tra gli esercizi e recupero dopo il giro ---------- */
function bloccoDi(es, i) {
  const g = es[i]?.gruppo;
  if (!g) return null;
  let a = i, b = i;
  while (a > 0 && es[a - 1].gruppo === g) a--;
  while (b < es.length - 1 && es[b + 1].gruppo === g) b++;
  return b > a ? { inizio: a, fine: b, gruppo: g } : null;
}
// Quello che si fa in un giro: senza il numero di serie
function rxGiro(e) {
  const p = { ...e.parametri, ...(F.mod[e.rif] || {}) }, kg = p.carico ? ` con ${virgola(p.carico)} kg` : '';
  if (e.modalita === 'cardio') return rxTesto('cardio', { ...p, serie: 1 });
  return e.modalita === 'tempo' ? `${p.secondi ?? '?'} s${kg}` : `${p.rip ?? '?'} ripetizioni${kg}`;
}

function schermataSuperserie(bl) {
  const es = F.g.piano.esercizi, membri = es.slice(bl.inizio, bl.fine + 1), ultimo = membri[membri.length - 1];
  const giri = Math.max(1, Math.round(Number(membri[0].parametri.serie) || 1)), rec = Number(ultimo.parametri.rec) || 0;
  const fl = F.flusso;
  if (fl.ss?.inizio !== bl.inizio) fl.ss = { inizio: bl.inizio, giro: 1, pos: 0, fase: 'lavoro', fine: 0, saltati: [], fatti: {} };
  const st = fl.ss;
  if (st.fase !== 'lavoro' && st.fine <= Date.now()) st.fase = 'lavoro';
  // Prossimo passo, saltando gli esercizi tolti; null = superserie finita
  const prossimo = () => {
    let g = st.giro, p = st.pos;
    for (let n = 0; n <= membri.length * giri; n++) {
      if (++p >= membri.length) { p = 0; g++; }
      if (g > giri) return null;
      if (!st.saltati.includes(membri[p].rif)) return { giro: g, pos: p };
    }
    return null;
  };
  if (st.saltati.includes(membri[st.pos].rif)) { const nx = prossimo(); if (!nx) return concludiSuperserie(bl, membri, giri); Object.assign(st, nx); }
  salvaFlusso();
  const e = membri[st.pos], attesa = st.fase !== 'lavoro';
  const t = e.tecnica?.tempo, acc = righe(e.accorgimenti), mod = F.mod[e.rif];
  const giriFatti = Math.min(...membri.filter(m => !st.saltati.includes(m.rif)).map(m => st.fatti[m.rif] || 0));
  pagina({ titolo: `${bl.inizio + 1}–${bl.fine + 1} di ${es.length}`, indietro: '#/', html: `
    <div class="progresso" aria-hidden="true">${es.map((x, k) => `<span class="${k < bl.inizio ? 'fatto' : k <= bl.fine ? 'ora' : ''}"></span>`).join('')}</div>
    <div class="ss-passi">${membri.map((m, k) => `<span class="ss-passo${k === st.pos ? ' ora' : ''}${st.saltati.includes(m.rif) ? ' tolto' : ''}"><b>${esc(bl.gruppo)}${k + 1}</b> ${esc(m.nome)}</span>`).join('<span class="ss-freccia">›</span>')}</div>
    <div class="esercizio">
      <div class="stage" id="stage"></div>
      <div class="es-info">
        <p class="muted small"><span class="tag gold">Superserie ${esc(bl.gruppo)}</span> giro ${st.giro} di ${giri}</p>
        ${attesa ? `<p class="small prossimo">Prossimo</p>` : ''}
        <h2>${esc(e.nome)}</h2>${htmlVar(e)}
        <div class="rx-riga"><span class="rx big">${esc(rxGiro(e))}</span>
          <button class="penna" type="button" id="penna" aria-label="Correggi quello che hai fatto davvero">${PENNA}</button></div>
        ${mod ? `<p class="prima">Previsto: <s>${esc(rxTesto(e.modalita, e.parametri))}</s></p>` : ''}
        ${e.variazione ? `<p class="variazione">${esc(e.variazione)}</p>` : ''}
      </div>
    </div>
    ${t ? `<p class="tempo-es"><b>Tempo ${esc(t)}</b> ${esc(tempoTesto(t))}</p>` : ''}
    <div id="timer"></div>
    <button class="btn sm ss-termina" type="button" id="termina">Termina qui la superserie</button>
    ${e.nota ? `<div class="nota-coach"><b>Nota del coach</b><p>${esc(e.nota)}</p></div>` : ''}
    ${acc.length ? `<h3 class="sotto">Accorgimenti</h3><ul class="accorgimenti">${acc.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`,
    barra: `<button class="btn ghost quad" type="button" id="indietro" aria-label="Esercizio precedente" ${bl.inizio === 0 ? 'disabled' : ''}>${FRECCIA_SX}</button>
      <button class="btn ghost" type="button" id="salta">${attesa ? 'Toglilo' : 'Non lo faccio'}</button>
      <button class="btn primary grow" type="button" id="fatto">${attesa ? 'Vai ora ›' : 'Fatto ›'}</button>` });
  etichettaHome();
  const k = posa(e);
  montaOmino3D(document.getElementById('stage'), k, { tempo: t, tenuta: tenuta(e, k), muscoli: e.muscolo });

  const avanti = () => {   // esercizio del giro completato
    st.fatti[e.rif] = (st.fatti[e.rif] || 0) + 1;
    const nx = prossimo();
    if (!nx) { salvaFlusso(); return concludiSuperserie(bl, membri, giri); }
    const nuovoGiro = nx.giro > st.giro;
    const sec = nuovoGiro ? rec : Number(e.parametri.pausa) || 0;
    Object.assign(st, nx, { fase: sec ? (nuovoGiro ? 'rec' : 'pausa') : 'lavoro', fine: Date.now() + sec * 1000 });
    salvaFlusso(); schermataEsercizio();
  };
  const finePausa = () => { st.fase = 'lavoro'; salvaFlusso(); schermataEsercizio(); };

  const box = document.getElementById('timer');
  if (attesa) {
    box.innerHTML = `<div class="timer"><div class="t-testa"><b>${st.fase === 'rec' ? 'Recupero' : 'Pausa'}</b>
      <span class="muted small">${st.fase === 'rec' ? `poi giro ${st.giro} di ${giri}` : `poi ${esc(e.nome)}`}</span></div>
      <div class="t-cifre rec" id="c-cifre"></div><div class="t-azioni"><button class="btn sm" id="ss-rec-meno" type="button">−15 s</button><button class="btn sm" id="ss-rec-piu" type="button">+15 s</button></div></div>`;
    const ferma=contoAllaRovescia(box.querySelector('#c-cifre'), st.fine, finePausa);
    const varia=delta=>{ferma();st.fine=modificaFineRecupero(st.fine,delta);salvaFlusso();if(st.fine<=Date.now())finePausa();else schermataEsercizio();};
    box.querySelector('#ss-rec-meno').onclick=()=>varia(-15);box.querySelector('#ss-rec-piu').onclick=()=>varia(15);
  } else if ((e.modalita === 'tempo' || (e.modalita === 'cardio' && !e.parametri.metri && !e.parametri.calorie)) && Number(e.parametri.secondi) > 0) {
    // Tenuta dentro la superserie: si avvia a mano, alla fine passa da sola al prossimo
    const sec = Number((mod || e.parametri).secondi);
    box.innerHTML = `<div class="timer"><div class="t-testa"><b>${e.modalita === 'tempo' ? 'Tenuta' : 'Lavoro'}</b><span class="muted small">giro ${st.giro} di ${giri}</span></div>
      <div class="t-cifre" id="c-cifre">${mmss(sec)}</div><div class="t-azioni"><button class="btn primary sm" type="button" id="c-via">Avvia</button></div></div>`;
    box.querySelector('#c-via').onclick = ev => {
      if (audio?.state === 'suspended') audio.resume();
      bip(); ev.target.hidden = true;
      contoAllaRovescia(box.querySelector('#c-cifre'), Date.now() + sec * 1000, avanti);
    };
  } else {
    box.innerHTML = `<div class="timer ss-info"><div class="t-testa"><b>Giro ${st.giro} di ${giri}</b><span class="muted small">esercizio ${st.pos + 1} di ${membri.length}</span></div>
      <div class="s-pallini">${Array.from({ length: giri }, (_, g) => `<span class="${g < giriFatti ? 'fatto' : g === st.giro - 1 ? 'ora' : ''}"></span>`).join('')}</div>
      <p class="small ss-dopo">${(() => { const nx = prossimo(); if (!nx) return 'Ultimo esercizio della superserie'; const sec = nx.giro > st.giro ? rec : Number(e.parametri.pausa) || 0;
        return `Poi ${sec ? `${nx.giro > st.giro ? 'recupero' : 'pausa'} di ${durata(sec)} e ` : ''}${nx.giro > st.giro ? `giro ${nx.giro}` : esc(membri[nx.pos].nome)}`; })()}</p></div>`;
  }

  document.getElementById('fatto').onclick = () => { if (audio?.state === 'suspended') audio.resume(); attesa ? finePausa() : avanti(); };
  document.getElementById('salta').onclick = async () => {
    if (!await chiedi({ titolo: `Togliere ${e.nome}?`, testo: 'Non lo fai nei giri che restano: la superserie continua con gli altri.', ok: 'Toglilo' })) return;
    st.saltati.push(e.rif);
    const nx = prossimo();
    if (!nx) { salvaFlusso(); return concludiSuperserie(bl, membri, giri); }
    Object.assign(st, nx, { fase: 'lavoro', fine: 0 });
    salvaFlusso(); schermataEsercizio();
  };
  document.getElementById('termina').onclick = async () => {
    if (!await chiedi({ titolo: 'Terminare la superserie?', testo: `Giri completi: ${giriFatti} di ${giri}. Si segna quello che hai fatto.`, ok: 'Termina' })) return;
    concludiSuperserie(bl, membri, giri);
  };
  document.getElementById('indietro').onclick = async () => {
    try { await api(`/api/giornate/${F.id}/passo`, { metodo: 'PUT', dati: { passo: bl.inizio - 1 } }); F.g.passo = bl.inizio - 1; disegnaFlusso(); }
    catch (ex) { toast(ex.message); }
  };
  document.getElementById('penna').onclick = () => modificaFatto(e);
}

// Salva ogni esercizio della superserie: fatto, fatto con meno giri (modificato) o non fatto
async function concludiSuperserie(bl, membri, giri) {
  const st = F.flusso.ss;
  app.querySelectorAll('.bottombar button, #termina').forEach(b => { b.disabled = true; });
  try {
    let r = null;
    for (const m of membri) {
      const n = st.fatti[m.rif] || 0;
      let esito = 'fatto', eff = F.mod[m.rif] ? { ...F.mod[m.rif] } : null;
      if (!n) { esito = 'non_fatto'; eff = null; }
      else if (n < giri) eff = { ...m.parametri, ...(eff || {}), serie: n };
      if (eff && esito === 'fatto') esito = 'modificato';
      r = await api(`/api/giornate/${F.id}/esercizi/${m.rif}`, { metodo: 'PUT', dati: { esito, effettivo: eff, passo: bl.fine + 1 } });
      F.g.svolti[m.rif] = { esito, effettivo: eff };
      if (eff) F.mod[m.rif] = eff; else delete F.mod[m.rif];
      if (esito === 'non_fatto') delete F.voti[m.rif];
    }
    F.flusso.ss = null; salvaFlusso();
    if (r?.fine) F.g.stato = 'post'; else F.g.passo = bl.fine + 1;
    disegnaFlusso();
  } catch (ex) {
    toast(ex.message);
    app.querySelectorAll('.bottombar button, #termina').forEach(b => { b.disabled = false; });
  }
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
  if (e.modalita === 'cardio' && p.secondi && !p.metri && !p.calorie) return { lavoro: p.secondi, serie: p.serie || 1, rec: p.rec || 0, nome: 'Lavoro' };
  if (e.modalita === 'cardio') return { cronometro: true, limite: p.secondi || 0, rec: p.rec || 0, nome: 'Cronometro' };
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
  let recCorrente=c.rec;
  const durataFase = () => S.fase === 'rec' ? recCorrente : c.lavoro;
  const trascorso = () => S.passati + (S.corre ? (Date.now() - S.inizio) / 1000 : 0);
  el.innerHTML = `<div class="timer"><div class="t-testa"><b id="t-nome"></b><span id="t-info" class="muted small"></span></div>
    <div class="t-cifre" id="t-cifre">0:00</div>
    <div class="t-azioni"><button class="btn primary sm" type="button" id="t-via">Avvia</button>
    <button class="btn sm" type="button" id="t-zero">Azzera</button><button class="btn sm" id="t-rec-meno" type="button" hidden>−15 s</button><button class="btn sm" id="t-rec-piu" type="button" hidden>+15 s</button><button class="btn sm" id="t-rec-salta" type="button" hidden>Salta recupero</button>
    ${c.cronometro ? '<button class="btn sm" type="button" id="t-segna" hidden>Segna il tempo</button>' : ''}
    ${c.rec && !c.solo_rec ? `<button class="btn sm" type="button" id="t-rec">Recupero ${durata(c.rec)}</button>` : ''}</div></div>`;
  const $ = id => el.querySelector('#' + id);
  const disegna = () => {
    const t = trascorso();
    $('t-cifre').textContent = c.cronometro && S.fase !== 'rec' ? mmss(t) : mmss(durataFase() - t);
    $('t-cifre').classList.toggle('rec', S.fase === 'rec');
    $('t-nome').textContent = S.fase === 'rec' ? 'Recupero' : c.nome;
    $('t-info').textContent = c.serie > 1 && S.fase === 'lavoro' ? `serie ${S.serie} di ${c.serie}`
      : c.minuti && t > 0 ? `minuto ${Math.min(Math.floor(t / 60) + 1, c.lavoro / 60)} di ${c.lavoro / 60}`
      : c.limite ? `limite ${durata(c.limite)}` : '';
    $('t-via').textContent = S.corre ? 'Pausa' : (t > 0 ? 'Riprendi' : 'Avvia');
    if ($('t-segna')) $('t-segna').hidden = S.corre || t < 1 || S.fase === 'rec';
    for(const id of ['t-rec-meno','t-rec-piu','t-rec-salta'])$(id).hidden=S.fase!=='rec';
  };
  const azzera = fase => { S.fase = fase; S.corre = false; S.passati = 0; S.ultimo = null;recCorrente=c.rec; };
  const parti = () => { S.corre = true; S.inizio = Date.now(); };
  const tick = setInterval(() => {
    if (!el.isConnected) return clearInterval(tick);
    if (!S.corre) return;
    const t = trascorso();
    if (c.cronometro && S.fase !== 'rec') {
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
  const saltaRec=()=>{azzera(c.solo_rec?'rec':'lavoro');disegna();};
  const variaRec=delta=>{if(S.fase!=='rec')return;const t=trascorso(),r=Math.max(0,durataFase()-t+delta);if(!r)return saltaRec();recCorrente=t+r;S.ultimo=null;disegna();};
  $('t-rec-meno').onclick=()=>variaRec(-15);$('t-rec-piu').onclick=()=>variaRec(15);$('t-rec-salta').onclick=saltaRec;
  if ($('t-rec')) $('t-rec').onclick = () => { azzera('rec'); parti(); disegna(); };
  if ($('t-segna')) $('t-segna').onclick = () => {
    const sec = Math.round(trascorso());
    // RT: tempo impiegato; cardio: il tempo della distanza o delle calorie
    const m = { ...e.parametri, ...(F.mod[e.rif] || {}), [e.modalita === 'cardio' ? 'secondi' : 'secondi_tot']: sec };
    if (e.modalita !== 'cardio') delete m.minuti;
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
      return `<li class="voto-es" id="v-${e.rif}"><div class="ve-testa"><span class="mini">${ominoSVG(posa(e))}</span><div><h3>${esc(e.nome)}</h3>${fatto}</div></div>
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
  chiudiFlusso(F.id);
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

function calendario(giornate, mese, oggi, mobilita = [], cardio = []) {
  const [y, m] = mese.split('-').map(Number);
  const mob = new Map(); for (const s of mobilita) if (!mob.has(s.data)) mob.set(s.data, s);
  const primo = new Date(Date.UTC(y, m - 1, 1)), giorniMese = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const vuoti = (primo.getUTCDay() + 6) % 7;
  const per = new Map(giornate.map(g => [g.data, g]));
  let celle = '';
  for (let i = 0; i < vuoti; i++) celle += '<span class="c-vuota"></span>';
  for (let d = 1; d <= giorniMese; d++) {
    const iso = `${mese}-${String(d).padStart(2, '0')}`, g = per.get(iso), mo = mob.get(iso), ca = cardio.find(s=>s.data===iso);
    const cls = [g ? (g.stato === 'completata' ? 'si' : 'corso') : '', (mo || ca) ? 'mob' : '', iso === oggi ? 'oggi' : ''].join(' ').trim();
    celle += g ? `<button type="button" class="c-giorno ${cls}" data-g="${g.id}" aria-label="${dataLunga(iso)}: ${esc(g.nome_giorno || 'allenamento')}${mo ? ' e mobilità' : ''}">${d}</button>`
      : mo ? `<button type="button" class="c-giorno ${cls}" data-m="${mo.id}" aria-label="${dataLunga(iso)}: mobilità e stretching">${d}</button>`
      : ca ? `<button class="c-giorno ${cls}" type="button" data-cardio="${ca.id}" aria-label="${dataLunga(iso)}: cardio">${d}</button>` : `<span class="c-giorno ${cls}">${d}</span>`;
  }
  return `<div class="cal"><div class="cal-testa"><button type="button" class="btn ghost sm" data-mese="-1" aria-label="Mese precedente">‹</button>
    <b>${dataMese(mese + '-01')}</b><button type="button" class="btn ghost sm" data-mese="1" aria-label="Mese successivo" ${mese >= oggi.slice(0, 7) ? 'disabled' : ''}>›</button></div>
    <div class="cal-sett">${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="cal-griglia">${celle}</div>
    <div class="cal-legenda"><span><i class="si"></i>Allenato</span><span><i class="corso"></i>In corso</span>${mobilita.length || cardio.length ? '<span><i class="mob"></i>Sessioni libere</span>' : ''}</div></div>`;
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

// Sessione di mobilità nello storico: fatti, durata e area; il coach può eliminarla
const nomeLibera=s=>({mobilita:'Mobilità',stretching:'Stretching',mista:'Mobilità e stretching (mista)'})[s.tipo_sessione||'mista'];
const esitoMob = v => v === 'fatto' ? '<span class="ok">Fatto</span>' : v === 'non_fatto' ? '<span class="danger-t">Non fatto</span>' : '<span class="muted">Non registrato</span>';
function cartaMobilita(s, { puoEliminare, mio, oggi }) {
  const es = s.piano.esercizi || [];
  const fatti = es.filter(e => s.esiti[e.rif] === 'fatto').length;
  const aperta = s.stato !== 'completata';
  const oggiAperta = aperta && mio && s.data === oggi;
  return `<details class="giornata mob" id="m-${s.id}">
    <summary><div><b>${dataLunga(s.data)}</b><span class="muted small">${esc(nomeLibera(s))} · ${s.durata_scelta} min · ${esc(nomeArea(s.zona))}</span></div>
      <div class="g-chips">${!aperta ? `<span class="tag">${fatti}/${es.length}</span><span class="tag gold">${esc(nomeLibera(s))}</span>` : oggiAperta ? '<span class="tag bordeaux">In corso</span>' : '<span class="tag">Non conclusa</span>'}</div></summary>
    <div class="g-corpo">
      <ol class="g-esercizi">${es.map(e => `<li><div class="ge-testa"><b>${esc(e.nome)}</b></div>
        <div class="small"><span class="muted">${esc(FASI[e.fase] || '')}${e.fase ? ' · ' : ''}${esc(doseTesto(e))}</span></div>
        <div class="small">${esitoMob(s.esiti[e.rif])}</div></li>`).join('')}</ol>
      ${oggiAperta ? `<a class="btn primary" href="#/mobilita/s/${s.id}" style="margin-top:8px">Riprendi</a>` : ''}
      ${puoEliminare || (mio && aperta) ? `<button type="button" class="link danger" data-elimina-mob="${s.id}">Elimina sessione</button>` : ''}
    </div></details>`;
}

function cartaCardio(s,puoEliminare,mio){const aperta=s.stato!=='completata';return `<details class="giornata" id="c-${s.id}"><summary><div><b>${dataLunga(s.data)}</b><span class="muted small">Cardio · ${s.piano.esercizi.length} esercizi</span></div><span class="tag gold">${aperta?'In corso':'Cardio'}</span></summary><div class="g-corpo"><ol class="g-esercizi">${s.piano.esercizi.map(e=>{const v=s.esiti[e.rif];return `<li><h3>${esc(e.nome)}</h3><p class="small muted">Previsto: scelta libera</p><p>${!v?'Non registrato':v.esito==='non_fatto'?'Non fatto':`${v.secondi?esc(durata(v.secondi)):''}${v.metri?' · '+esc(v.metri)+' m':''}${v.calorie?' · '+esc(v.calorie)+' cal':''}`}</p></li>`;}).join('')}</ol>${mio&&aperta?`<a class="btn primary" href="#/cardio/s/${s.id}">Riprendi</a>`:''}${puoEliminare||mio&&aperta?`<button class="link danger" data-elimina-cardio="${s.id}">Elimina sessione</button>`:''}</div></details>`;}

// Valore da seguire nel tempo: carico, poi secondi, ripetizioni, giri o tempo impiegato
const METRICHE = [['carico', 'Carico', ' kg'], ['secondi', 'Secondi di tenuta', ' s'], ['rip', 'Ripetizioni', ''], ['giri', 'Giri', ''], ['secondi_tot', 'Tempo impiegato', ' s'], ['metri', 'Metri', ' m'], ['calorie', 'Calorie', ' cal']];
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
  const indietro = opz.indietro ?? (mio ? '' : `#/atleta/${atletaId}`); // il proprio storico è una scheda della barra
  attesa('Storico', indietro);
  const d = await api(`/api/storico/${atletaId}`);
  const oggi = d.oggi;
  if (vista.atleta !== atletaId) Object.assign(vista, { mese: oggi.slice(0, 7), atleta: atletaId, scheda: 'giornate', esercizio: null });
  const scorri = !!opz.tab;
  if (opz.tab) { vista.scheda = opz.tab; opz = { ...opz, tab: null }; }
  const schede = d.schede || [];
  const mobilita = d.mobilita || [];
  const cardio = d.cardio || [];
  const mobFatte = mobilita.filter(s => s.stato === 'completata').length;
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
    if (vista.scheda === 'schede') {
      contenuto = htmlSchede(schede, { atletaId, gestisce: puoEliminare, mio });
    } else if (vista.scheda === 'giornate') {
      // Allenamenti e sessioni di mobilità insieme, dalla data più recente
      const voci = [...d.giornate.map(g => ({ data: g.data, ord: 1, html: () => cartaGiornata(g, puoEliminare) })),
        ...mobilita.map(m => ({ data: m.data, ord: 0, html: () => cartaMobilita(m, { puoEliminare, mio, oggi }) })),...cardio.map(s=>({data:s.data,ord:0,html:()=>cartaCardio(s,puoEliminare,mio)}))]
        .sort((a, b) => b.data.localeCompare(a.data) || b.ord - a.ord);
      contenuto = voci.length ? voci.map(v => v.html()).join('')
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
      <p class="small muted cost-et">Ultime 12 settimane · ${completate.length} ${completate.length === 1 ? 'allenamento' : 'allenamenti'} in totale${mobFatte ? ` · ${mobFatte} ${mobFatte === 1 ? 'sessione' : 'sessioni'} di mobilità` : ''}</p>
      ${calendario(d.giornate, vista.mese, oggi, mobilita, cardio)}
      <div class="seg" role="tablist"><button type="button" data-s="giornate" aria-current="${vista.scheda === 'giornate'}">Giornate</button>
        <button type="button" data-s="progressi" aria-current="${vista.scheda === 'progressi'}">Progressi</button>
        <button type="button" data-s="schede" aria-current="${vista.scheda === 'schede'}">Schede</button></div>
      <div id="contenuto">${contenuto}</div>` });
    app.onclick = async ev => {
      const t = ev.target;
    const ec=t.closest('[data-elimina-cardio]');if(ec){if(!await chiedi({titolo:'Eliminare la sessione cardio?',testo:'Sparisce dallo storico.',ok:'Elimina',pericolo:true}))return;try{await api(`/api/cardio/sessioni/${ec.dataset.eliminaCardio}`,{metodo:'DELETE'});vistaStorico(atletaId,opz);}catch(e){toast(e.message);}return;}
    const cc=t.closest('[data-cardio]');if(cc){if(vista.scheda!=='giornate'){vista.scheda='giornate';disegna();}const det=document.getElementById('c-'+cc.dataset.cardio);if(det){det.open=true;det.scrollIntoView({behavior:'smooth',block:'start'});}return;}

      const mese = t.closest('[data-mese]');
      if (mese) { const [y, m] = vista.mese.split('-').map(Number); vista.mese = new Date(Date.UTC(y, m - 1 + Number(mese.dataset.mese), 1)).toISOString().slice(0, 7); return disegna(); }
      const s = t.closest('[data-s]');
      if (s) { vista.scheda = s.dataset.s; return disegna(); }
      const sc = t.closest('[data-scheda]');
      if (sc) return apriScheda(schede.find(x => x.id === Number(sc.dataset.scheda)), { atletaId, gestisce: puoEliminare, ricarica: () => vistaStorico(atletaId, opz) });
      const sm = t.closest('[data-m]');
      if (sm) {
        if (vista.scheda !== 'giornate') { vista.scheda = 'giornate'; disegna(); }
        const det = document.getElementById('m-' + sm.dataset.m);
        if (det) { det.open = true; det.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }
      const em = t.closest('[data-elimina-mob]');
      if (em) {
        if (!await chiedi({ titolo: 'Eliminare questa sessione di mobilità?', testo: 'Sparisce dallo storico.', ok: 'Elimina', pericolo: true })) return;
        try { await api(`/api/mobilita/sessioni/${em.dataset.eliminaMob}`, { metodo: 'DELETE' }); toast('Sessione eliminata'); vistaStorico(atletaId, opz); }
        catch (e) { toast(e.message); }
        return;
      }
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
  // Aperto direttamente sulle schede (dopo un salvataggio): porta in vista l'elenco
  if (scorri) document.querySelector('.seg')?.scrollIntoView({ block: 'start' });
}

rotta(/^\/storico$/, () => vistaStorico(stato.io.id));
rotta(/^\/storico\/schede$/, () => vistaStorico(stato.io.id, { tab: 'schede' }));
rotta(/^\/storico\/(\d+)$/, id => vistaStorico(Number(id), { indietro: `#/atleta/${id}` }));
rotta(/^\/storico\/(\d+)\/schede$/, id => vistaStorico(Number(id), { tab: 'schede', indietro: `#/atleta/${id}` }));
