// GymTime · libreria di mobilità e stretching: coach e admin la consultano, solo l'admin la modifica
import { api, esc } from './api.js';
import { stato, app, rotta, pagina, attesa, toast, chiedi, finestra, vai } from './ui.js';
import { montaOmino, ominoSVG, POSE } from './omino.js';
import { ZONE, TIPI, ATTREZZI, LIVELLI, DURATE_SCELTA, DURATA_MAX, doseTesto } from './mobilita.js';
import { norm } from './regole.js';

const PIU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const filtro = { q: '', zona: '', tipo: '' };

// Selettore Esercizi | Mobilità in cima alle due librerie
export const sceltaLibreria = attiva => `<div class="seg" role="tablist">
  <a role="tab" href="#/libreria" aria-current="${attiva === 'esercizi'}">Esercizi</a>
  <a role="tab" href="#/libreria/mobilita" aria-current="${attiva === 'mobilita'}">Mobilità</a></div>`;

rotta(/^\/libreria\/mobilita$/, async () => {
  attesa('Libreria', '#/profilo');
  const { esercizi } = await api('/api/mobilita/libreria');
  const admin = stato.io.ruolo === 'admin';
  const zone = Object.keys(ZONE).filter(z => esercizi.some(x => x.zona === z));
  pagina({ titolo: 'Libreria', indietro: '#/profilo', html: `
    ${sceltaLibreria('mobilita')}
    <div class="intro"><h1>Mobilità e stretching</h1><p class="hint">${esercizi.length} esercizi. Tocca un esercizio per vedere l’omino, la dose e gli accorgimenti di sicurezza.</p></div>
    <div class="card mob-imp" id="mob-imp"><p class="small muted">Caricamento impostazioni</p></div>
    <input type="search" id="cerca" placeholder="Cerca per nome o muscolo" value="${esc(filtro.q)}" aria-label="Cerca" autocomplete="off">
    <div class="chips scroll" style="margin:10px 0 0"><button type="button" class="chip sm" data-tipo="" aria-pressed="${!filtro.tipo}">Tutti i tipi</button>
      ${Object.entries(TIPI).map(([k, l]) => `<button type="button" class="chip sm" data-tipo="${k}" aria-pressed="${filtro.tipo === k}">${esc(l)}</button>`).join('')}</div>
    <div class="chips scroll" style="margin:6px 0 4px"><button type="button" class="chip sm" data-zona="" aria-pressed="${!filtro.zona}">Tutte le zone</button>
      ${zone.map(z => `<button type="button" class="chip sm" data-zona="${z}" aria-pressed="${filtro.zona === z}">${esc(ZONE[z])}</button>`).join('')}</div>
    <ul class="lib-lista" id="lista"></ul>`,
    barra: admin ? `<button class="btn primary big" type="button" id="nuovo">${PIU} Nuovo esercizio</button>` : '' });
  const lista = document.getElementById('lista');
  const filtra = () => {
    const q = norm(filtro.q);
    const v = esercizi.filter(x => (!filtro.zona || x.zona === filtro.zona) && (!filtro.tipo || x.tipo === filtro.tipo)
      && (!q || norm(`${x.nome} ${x.muscolo || ''} ${ZONE[x.zona] || ''}`).includes(q)));
    lista.innerHTML = v.map(x => `<li><button type="button" class="lib-riga" data-id="${x.id}"><span class="mini">${ominoSVG(x.animazione)}</span>
      <span><b>${esc(x.nome)}</b><span class="small muted">${esc(ZONE[x.zona] || x.zona)} · ${esc(TIPI[x.tipo] || x.tipo)} · ${esc(doseTesto(x))}</span></span></button></li>`).join('')
      || '<li class="empty">Nessun esercizio trovato.</li>';
  };
  filtra();
  document.getElementById('cerca').oninput = e => { filtro.q = e.target.value; filtra(); };
  app.onclick = e => {
    const z = e.target.closest('[data-zona]'), t = e.target.closest('[data-tipo]');
    if (z) { filtro.zona = z.dataset.zona; app.querySelectorAll('[data-zona]').forEach(x => x.setAttribute('aria-pressed', String(x === z))); return filtra(); }
    if (t) { filtro.tipo = t.dataset.tipo; app.querySelectorAll('[data-tipo]').forEach(x => x.setAttribute('aria-pressed', String(x === t))); return filtra(); }
    const r = e.target.closest('[data-id]');
    if (r) dettaglio(esercizi.find(x => x.id === Number(r.dataset.id)), admin);
  };
  document.getElementById('nuovo')?.addEventListener('click', () => modulo(null));
  impostazioni(document.getElementById('mob-imp'));
});

// Impostazioni di coach e admin: sezione attiva per i propri atleti e durate proposte (valgono anche per sé)
async function impostazioni(card) {
  let imp;
  try { imp = await api('/api/mobilita/impostazioni'); } catch (e) { card.innerHTML = `<p class="small err">${esc(e.message)}</p>`; return; }
  if (!card.isConnected) return;
  const scelte = new Set(imp.durate);
  card.innerHTML = `<div class="card-testa"><b>Per i tuoi atleti</b><span class="tag ${imp.attiva ? 'gold' : ''}" id="imp-stato">${imp.attiva ? 'Attiva' : 'Spenta'}</span></div>
    <label class="check"><input type="checkbox" id="imp-attiva" ${imp.attiva ? 'checked' : ''}> Mostra il tasto Mobilità nella loro home</label>
    <p class="lbl" style="margin-top:12px">Durate proposte</p>
    <div class="chips" role="group" aria-label="Durate proposte">${DURATE_SCELTA.map(m => `<button type="button" class="chip sm" data-dmin="${m}" aria-pressed="${scelte.has(m)}">${m} min</button>`).join('')}</div>
    <p class="small muted" style="margin-top:8px">Valgono anche per te. Fino a ${DURATA_MAX} minuti finché la libreria non cresce.</p>
    <div class="azioni-riga"><button type="button" class="btn primary sm" id="imp-salva">Salva impostazioni</button></div>`;
  card.onclick = async e => {
    const c = e.target.closest('[data-dmin]');
    if (c) {
      const m = Number(c.dataset.dmin);
      if (scelte.has(m)) { if (scelte.size === 1) return toast('Lascia almeno una durata'); scelte.delete(m); } else scelte.add(m);
      c.setAttribute('aria-pressed', String(scelte.has(m)));
      return;
    }
    if (e.target.id === 'imp-salva') {
      const attiva = card.querySelector('#imp-attiva').checked;
      try {
        const r = await api('/api/mobilita/impostazioni', { metodo: 'PUT', dati: { attiva, durate: [...scelte] } });
        const t = card.querySelector('#imp-stato'); t.textContent = r.attiva ? 'Attiva' : 'Spenta'; t.classList.toggle('gold', r.attiva);
        toast('Impostazioni salvate');
      } catch (ex) { toast(ex.message); }
    }
  };
}

function dettaglio(x, admin) {
  const acc = String(x.accorgimenti || '').split('\n').filter(Boolean);
  const v = finestra(`<div class="es-dettaglio">
    <div class="stage" id="mob-stage"></div>
    <h3>${esc(x.nome)}</h3>
    <p class="small muted">${[ZONE[x.zona], TIPI[x.tipo], LIVELLI[x.livello], ATTREZZI[x.attrezzo]].filter(Boolean).map(esc).join(' · ')}</p>
    <p class="mob-dose"><span class="rx">${esc(doseTesto(x))}</span>${x.riscaldamento ? '<span class="tag">Adatto al riscaldamento</span>' : ''}</p>
    ${x.muscolo ? `<p class="small"><b>Muscoli:</b> ${esc(x.muscolo)}</p>` : ''}
    ${acc.length ? `<ul class="accorgimenti">${acc.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    <div class="azioni">${admin ? '<button type="button" class="btn" data-modifica>Modifica</button>' : ''}<button type="button" class="btn primary" data-chiudi>Chiudi</button></div></div>`);
  v.querySelector('.dialogo').classList.add('grande');
  montaOmino(v.querySelector('#mob-stage'), x.animazione, { forza: true, muscoli: x.muscolo });
  v.querySelector('[data-chiudi]').onclick = () => v.remove();
  v.querySelector('[data-modifica]')?.addEventListener('click', () => { v.remove(); modulo(x); });
}

// Omini disponibili: prima quelli di mobilità e stretching, poi gli altri
const omini = () => Object.entries(POSE).filter(([, p]) => !p.generata).map(([k, p]) => [k, p.nome])
  .sort((a, b) => (b[0].startsWith('mob_') - a[0].startsWith('mob_')) || a[1].localeCompare(b[1], 'it'));
const opzioni = (o, sel) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${String(sel) === String(k) ? 'selected' : ''}>${esc(l)}</option>`).join('');

function modulo(x) {
  const d = x || { nome: '', zona: 'anche', tipo: 'statico', riscaldamento: 0, misura: 'secondi', valore: 30, serie: 1, per_lato: 0, livello: 1, attrezzo: 'corpo_libero', animazione: 'free', muscolo: '', accorgimenti: '' };
  const v = finestra(`<h3>${x ? 'Modifica esercizio' : 'Nuovo esercizio'}</h3>
    <form class="stack" novalidate style="margin-top:10px">
      <label>Nome<input name="nome" value="${esc(d.nome)}" maxlength="80" placeholder="Es. Allungamento dei femorali in piedi"></label>
      <div class="two"><label>Zona<select name="zona">${opzioni(ZONE, d.zona)}</select></label><label>Tipo<select name="tipo">${opzioni(TIPI, d.tipo)}</select></label></div>
      <div class="three"><label>Misura<select name="misura">${opzioni({ secondi: 'Secondi', ripetizioni: 'Ripetizioni' }, d.misura)}</select></label>
        <label>Quanti<input name="valore" type="number" inputmode="numeric" min="1" max="600" value="${d.valore}"></label>
        <label>Serie<input name="serie" type="number" inputmode="numeric" min="1" max="10" value="${d.serie}"></label></div>
      <div class="two"><label>Livello<select name="livello">${opzioni(LIVELLI, d.livello)}</select></label><label>Attrezzo<select name="attrezzo">${opzioni(ATTREZZI, d.attrezzo)}</select></label></div>
      <label class="casella"><input type="checkbox" name="per_lato" ${d.per_lato ? 'checked' : ''}> Da fare per lato</label>
      <label class="casella" id="r-risc"><input type="checkbox" name="riscaldamento" ${d.riscaldamento ? 'checked' : ''}> Adatto ad aprire la sessione (riscaldamento)</label>
      <div class="anim-scelta"><div class="stage" id="form-stage"></div>
        <label>Omino<select name="animazione">${omini().map(([k, l]) => `<option value="${k}" ${d.animazione === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div>
      <label>Muscoli<input name="muscolo" value="${esc(d.muscolo || '')}" placeholder="Es. Allungati: femorali, polpacci"></label>
      <label>Accorgimenti di sicurezza (uno per riga)<textarea name="accorgimenti" rows="4">${esc(d.accorgimenti || '')}</textarea></label>
      <p class="err" role="alert"></p>
      <div class="azioni">${x ? '<button class="btn danger" type="button" data-elimina>Elimina</button>' : '<button class="btn" type="button" data-chiudi>Annulla</button>'}<button class="btn primary" type="submit">Salva</button></div>
    </form>`);
  v.querySelector('.dialogo').classList.add('grande');
  const f = v.querySelector('form'), stage = v.querySelector('#form-stage');
  const prova = () => montaOmino(stage, f.animazione.value, { forza: true, muscoli: f.muscolo.value });
  const risc = () => { const si = f.tipo.value === 'mobilita' || f.tipo.value === 'dinamico'; v.querySelector('#r-risc').hidden = !si; if (!si) f.riscaldamento.checked = false; };
  prova(); risc();
  f.animazione.onchange = prova; f.muscolo.addEventListener('change', prova); f.tipo.onchange = risc;
  v.querySelector('[data-chiudi]')?.addEventListener('click', () => v.remove());
  v.querySelector('[data-elimina]')?.addEventListener('click', async () => {
    if (!await chiedi({ titolo: `Eliminare ${x.nome}?`, testo: 'Le sessioni già fatte lo tengono nella loro copia.', ok: 'Elimina', pericolo: true })) return;
    try { await api(`/api/mobilita/libreria/${x.id}`, { metodo: 'DELETE' }); v.remove(); toast('Esercizio eliminato'); vai('#/libreria/mobilita'); } catch (ex) { toast(ex.message); }
  });
  f.onsubmit = async e => {
    e.preventDefault();
    const dati = { ...Object.fromEntries(['nome', 'zona', 'tipo', 'misura', 'attrezzo', 'animazione', 'muscolo', 'accorgimenti'].map(k => [k, f.elements[k].value.trim()])),
      valore: Number(f.valore.value), serie: Number(f.serie.value), livello: Number(f.livello.value), per_lato: f.per_lato.checked, riscaldamento: f.riscaldamento.checked };
    try {
      await api(x ? `/api/mobilita/libreria/${x.id}` : '/api/mobilita/libreria', { metodo: x ? 'PUT' : 'POST', dati });
      v.remove(); toast('Esercizio salvato'); vai('#/libreria/mobilita');
    } catch (ex) { f.querySelector('.err').textContent = ex.message; }
  };
}
