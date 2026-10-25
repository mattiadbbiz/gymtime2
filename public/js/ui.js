// GymTime · navigazione tra le schermate e componenti comuni
import { esc } from './api.js';

export const stato = { io: null };
export const app = document.getElementById('app');

const rotte = [];
const base = {};
// rotta(/^\/allena$/, () => ...) : le parti atleta e coach registrano qui le loro schermate
export const rotta = (re, fn) => rotte.push([re, fn]);
export const impostaBase = ({ home, accesso, nuovaPassword }) => Object.assign(base, { home, accesso, nuovaPassword });
export const percorso = () => location.hash.slice(1) || '/';
export const vai = h => { if (location.hash === h || (h === '#/' && !location.hash)) mostra(); else location.hash = h; };

export async function mostra() {
  chiudiDialoghi();
  app.onclick = app.oninput = app.onchange = app.onsubmit = null;
  if (!stato.io) return base.accesso();
  if (stato.io.cambio_password) return base.nuovaPassword();
  const p = percorso();
  for (const [re, fn] of rotte) {
    const m = p.match(re);
    if (m) {
      try { await fn(...m.slice(1)); }
      catch (e) { erroreSchermata(e); }
      return;
    }
  }
  return base.home();
}
window.addEventListener('hashchange', mostra);

const FRECCIA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

// Impagina una schermata standard: barra nera in alto, contenuto, barra delle azioni in basso
export function pagina({ titolo = '', indietro = '#/', destra = '', html = '', barra = '', largo = false }) {
  app.innerHTML = `
    <header class="top"><div class="top-in">
      ${indietro ? `<a class="back" href="${esc(indietro)}">${FRECCIA}<span>Indietro</span></a>` : '<span></span>'}
      <div class="top-title">${esc(titolo)}</div>
      <div class="top-right">${destra}</div>
    </div></header>
    <main class="wrap${largo ? ' wide' : ''}">${html}</main>
    ${barra ? `<div class="bottombar"><div class="bb-in">${barra}</div></div>` : ''}`;
  window.scrollTo(0, 0);
}

export function attesa(titolo = '', indietro = '#/') {
  pagina({ titolo, indietro, html: '<div class="attesa">Caricamento</div>' });
}

export function erroreSchermata(e, titolo = 'Errore') {
  pagina({ titolo, html: `<div class="errore-box"><h3>Qualcosa non ha funzionato</h3><p class="hint">${esc(e?.message || e)}</p>
    <button class="btn primary" type="button" id="riprova">Riprova</button></div>` });
  document.getElementById('riprova').onclick = () => mostra();
}

export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

function chiudiDialoghi() { document.querySelectorAll('.velo').forEach(v => v.remove()); }

// Finestra di conferma: restituisce true o false
export function chiedi({ titolo, testo = '', ok = 'Conferma', annulla = 'Annulla', pericolo = false }) {
  return new Promise(risolvi => {
    const v = document.createElement('div');
    v.className = 'velo';
    v.innerHTML = `<div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
      <h3 id="dlg-t">${esc(titolo)}</h3>${testo ? `<p class="muted">${esc(testo)}</p>` : ''}
      <div class="azioni"><button class="btn" type="button" data-r="0">${esc(annulla)}</button>
      <button class="btn ${pericolo ? 'danger' : 'primary'}" type="button" data-r="1">${esc(ok)}</button></div></div>`;
    const fine = r => { v.remove(); risolvi(r); };
    v.addEventListener('click', e => { if (e.target === v) fine(false); const b = e.target.closest('[data-r]'); if (b) fine(b.dataset.r === '1'); });
    document.body.appendChild(v);
    v.querySelector('[data-r="1"]').focus();
  });
}

// Finestra con contenuto libero (moduli brevi). Restituisce l'elemento; chiudi con v.remove()
export function finestra(html) {
  const v = document.createElement('div');
  v.className = 'velo';
  v.innerHTML = `<div class="dialogo" role="dialog" aria-modal="true">${html}</div>`;
  v.addEventListener('click', e => { if (e.target === v) v.remove(); });
  document.body.appendChild(v);
  return v;
}

// Campo password con "Mostra"
export const campoPassword = (nome, etichetta, auto = 'current-password') => `
  <label>${esc(etichetta)}<span class="campo-pw"><input name="${nome}" type="password" autocomplete="${auto}" autocapitalize="none" spellcheck="false">
  <button type="button" data-mostra>Mostra</button></span></label>`;
export function attivaMostraPassword(root = app) {
  root.querySelectorAll('[data-mostra]').forEach(b => b.onclick = () => {
    const i = b.previousElementSibling; const vis = i.type === 'password';
    i.type = vis ? 'text' : 'password'; b.textContent = vis ? 'Nascondi' : 'Mostra';
  });
}
