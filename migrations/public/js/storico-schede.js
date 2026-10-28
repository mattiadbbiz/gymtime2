// GymTime · storico delle schede: periodo, elenco nello Storico, dettaglio e azioni del coach
import { api, esc } from './api.js';
import { toast, chiedi, finestra, vai } from './ui.js';
import { rxTesto } from './regole.js';

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const oggiISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());

/* ---------- Periodo: 'AAAA-MM' (mese e anno) oppure 'AAAA-MM-GG' ---------- */
const parti = v => { const [a, m, g] = String(v || '').split('-').map(Number); return { a, m, g }; };
export function dataPeriodo(v) {
  if (!v) return '';
  const { a, m, g } = parti(v);
  return g ? `${g} ${MESI[m - 1].slice(0, 3)} ${a}` : `${MESI[m - 1]} ${a}`;
}
export function testoPeriodo(s) {
  const dal = s.periodo_dal, al = s.periodo_al;
  if (s.attiva) return dal ? `Dal ${dataPeriodo(dal)} · in corso` : 'In corso';
  if (dal && al) {
    const d = parti(dal), f = parti(al);
    if (dal === al) return dataPeriodo(dal);
    if (!d.g && !f.g && d.a === f.a) return `${MESI[d.m - 1]} – ${MESI[f.m - 1]} ${f.a}`;
    return `${dataPeriodo(dal)} – ${dataPeriodo(al)}`;
  }
  if (dal) return `Dal ${dataPeriodo(dal)}`;
  if (al) return `Fino a ${dataPeriodo(al)}`;
  return 'Periodo non indicato';
}

// Tre tendine: giorno (facoltativo), mese, anno
// valore: 'AAAA-MM', 'AAAA-MM-GG' oppure { a, m, g } anche incompleto (scelte a metà nell'editor)
export function campoPeriodo(nome, etichetta, valore) {
  const { a, m, g } = valore && typeof valore === 'object' ? valore : parti(valore);
  const annoOra = Number(oggiISO().slice(0, 4));
  const anni = Array.from({ length: annoOra - 1999 }, (_, i) => annoOra - i);
  return `<fieldset class="periodo" data-periodo="${nome}"><legend class="lbl">${esc(etichetta)}</legend><div class="periodo-in">
    <select data-pp="g" aria-label="${esc(etichetta)}: giorno"><option value="">Giorno</option>${Array.from({ length: 31 }, (_, i) => `<option ${g === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select>
    <select data-pp="m" aria-label="${esc(etichetta)}: mese"><option value="">Mese</option>${MESI.map((x, i) => `<option value="${i + 1}" ${m === i + 1 ? 'selected' : ''}>${x}</option>`).join('')}</select>
    <select data-pp="a" aria-label="${esc(etichetta)}: anno"><option value="">Anno</option>${anni.map(x => `<option ${a === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></fieldset>`;
}

// Scelte correnti delle tre tendine
export function sceltePeriodo(root, nome) {
  const f = root.querySelector(`[data-periodo="${nome}"]`);
  const v = k => Number(f?.querySelector(`[data-pp="${k}"]`)?.value) || 0;
  return { g: v('g'), m: v('m'), a: v('a') };
}
export const partiPeriodo = parti;

// Legge le tendine: { valore } oppure { errore }
export function leggiPeriodo(root, nome) {
  const { g, m, a } = sceltePeriodo(root, nome);
  if (!g && !m && !a) return { valore: null };
  if (!m || !a) return { errore: 'Per il periodo scegli almeno mese e anno' };
  if (g && g > new Date(Date.UTC(a, m, 0)).getUTCDate()) return { errore: `Il ${g} ${MESI[m - 1]} non esiste` };
  const mm = String(m).padStart(2, '0');
  return { valore: g ? `${a}-${mm}-${String(g).padStart(2, '0')}` : `${a}-${mm}` };
}
export function controllaPeriodo(dal, al) {
  if (dal && al && `${al}-31`.slice(0, 10) < `${dal}-01`.slice(0, 10)) return 'La fine del periodo è prima dell’inizio';
  return '';
}

/* ---------- Elenco nella scheda "Schede" dello Storico ---------- */
const PIU = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const etichettaScheda = s => s.attiva ? '<span class="tag bordeaux">Attiva</span>'
  : s.origine === 'importata' ? '<span class="tag gold">Importata</span>' : '<span class="tag">Archiviata</span>';

export function htmlSchede(schede, { atletaId, gestisce, mio }) {
  const aggiungi = gestisce ? `<a class="btn aggiungi-scheda" href="#/importa/${atletaId}/storico">${PIU}Aggiungi scheda vecchia</a>` : '';
  if (!schede.length) return `${aggiungi}<div class="empty">${mio ? 'Qui troverai le tue schede, anche quelle di prima.' : 'Nessuna scheda.'}${gestisce ? ' Carica una scheda vecchia da testo, voce, file o foto: resta nello storico e non diventa quella attiva.' : ''}</div>`;
  return `${aggiungi}<ul class="lista-schede">${schede.map(s => `<li><button type="button" class="carta-scheda" data-scheda="${s.id}">
    <span class="cs-testa"><b>${esc(s.nome)}</b>${etichettaScheda(s)}</span>
    <span class="small muted">${esc(testoPeriodo(s))} · ${s.n_giorni} ${s.n_giorni === 1 ? 'giorno' : 'giorni'}</span>
    ${s.nota ? `<span class="small cs-nota">${esc(s.nota)}</span>` : ''}</button></li>`).join('')}</ul>`;
}

/* ---------- Dettaglio di una scheda e azioni ---------- */
export async function apriScheda(sintesi, { atletaId, gestisce, ricarica }) {
  let scheda;
  try { ({ scheda } = await api(`/api/archivio/${sintesi.id}`)); } catch (e) { return toast(e.message); }
  const importata = sintesi.origine === 'importata';
  const azioni = !gestisce ? '' : sintesi.attiva
    ? `<a class="btn" href="#/scheda/${atletaId}">Apri nell’editor</a>`
    : `${importata ? `<a class="btn" href="#/storico-scheda/${atletaId}/${sintesi.id}">Modifica</a>` : '<button type="button" class="btn" data-az="dati">Modifica nome e periodo</button>'}
       <button type="button" class="btn" data-az="copia">Copia come scheda attiva</button>
       ${importata ? '<button type="button" class="btn danger" data-az="elimina">Elimina</button>' : ''}`;
  const w = finestra(`<div class="cs-dettaglio"><h3>${esc(scheda.nome)}</h3>
    <p class="small muted">${etichettaScheda(sintesi)} ${esc(testoPeriodo(sintesi))}</p>
    ${scheda.nota ? `<p class="small cs-nota">${esc(scheda.nota)}</p>` : ''}
    <div class="riepilogo">${scheda.giorni.map(g => `<p><b>${esc(g.nome)}</b></p><ul>${g.esercizi.map(x => `<li>${esc(x.nome)}: ${esc(rxTesto(x.modalita, x.parametri))}${x.nota ? ` <span class="muted">· ${esc(x.nota)}</span>` : ''}</li>`).join('')}</ul>`).join('')}</div>
    ${azioni ? `<div class="menu">${azioni}</div>` : ''}
    <div class="azioni"><button class="btn primary" type="button" data-chiudi>Chiudi</button></div></div>`);
  w.querySelector('.dialogo').classList.add('grande');
  w.onclick = async e => {
    if (e.target === w || e.target.closest('[data-chiudi]')) return w.remove();
    if (e.target.closest('a')) return w.remove();
    const az = e.target.closest('[data-az]')?.dataset.az;
    if (!az) return;
    if (az === 'elimina') {
      if (!await chiedi({ titolo: `Eliminare ${scheda.nome}?`, testo: 'Sparisce dallo storico. Le giornate di allenamento non vengono toccate.', ok: 'Elimina', pericolo: true })) return;
      try { await api(`/api/storico-schede/scheda/${sintesi.id}`, { metodo: 'DELETE' }); w.remove(); toast('Scheda eliminata'); ricarica(); } catch (ex) { toast(ex.message); }
    }
    if (az === 'copia') { w.remove(); copiaComeAttiva(sintesi, atletaId); }
    if (az === 'dati') { w.remove(); modificaDati(scheda, sintesi, ricarica); }
  };
}

function copiaComeAttiva(sintesi, atletaId) {
  const w = finestra(`<h3>Copia come scheda attiva</h3>
    <p class="muted small">Diventa la scheda che l’atleta vede in Allena. Se ne ha già una, quella va in archivio. Questa resta nello storico.</p>
    <form class="stack" novalidate style="margin-top:10px"><label>Inizio (settimana 1)<input type="date" name="inizio" value="${oggiISO()}"></label>
    <div class="azioni"><button class="btn" type="button" data-chiudi>Annulla</button><button class="btn primary" type="submit">Copia</button></div></form>`);
  const f = w.querySelector('form');
  w.querySelector('[data-chiudi]').onclick = () => w.remove();
  f.onsubmit = async e => {
    e.preventDefault();
    try { await api(`/api/storico-schede/scheda/${sintesi.id}/attiva`, { metodo: 'POST', dati: { inizio: f.inizio.value } }); w.remove(); toast('Ora è la scheda attiva'); vai(`#/atleta/${atletaId}`); }
    catch (ex) { toast(ex.message); }
  };
}

// Schede archiviate dall'app: gli esercizi restano quelli fatti, si correggono nome, periodo e nota
function modificaDati(scheda, sintesi, ricarica) {
  const w = finestra(`<h3>Nome e periodo</h3>
    <form class="stack" novalidate style="margin-top:10px">
      <label>Nome della scheda<input name="nome" value="${esc(scheda.nome)}" maxlength="80"></label>
      ${campoPeriodo('dal', 'Dal', sintesi.periodo_dal)}${campoPeriodo('al', 'Al', sintesi.periodo_al)}
      <label>Nota (facoltativa)<input name="nota" value="${esc(scheda.nota || '')}" maxlength="300"></label>
      <p class="err" role="alert"></p>
      <div class="azioni"><button class="btn" type="button" data-chiudi>Annulla</button><button class="btn primary" type="submit">Salva</button></div></form>`);
  const f = w.querySelector('form'), err = w.querySelector('.err');
  w.querySelector('[data-chiudi]').onclick = () => w.remove();
  f.onsubmit = async e => {
    e.preventDefault();
    const dal = leggiPeriodo(f, 'dal'), al = leggiPeriodo(f, 'al');
    const problema = dal.errore || al.errore || controllaPeriodo(dal.valore, al.valore);
    if (problema) return void (err.textContent = problema);
    try {
      await api(`/api/storico-schede/scheda/${sintesi.id}`, { metodo: 'PUT', dati: { nome: f.nome.value.trim(), periodo_dal: dal.valore, periodo_al: al.valore, nota: f.nota.value.trim() } });
      w.remove(); toast('Salvato'); ricarica();
    } catch (ex) { err.textContent = ex.message; }
  };
}

/* ---------- Foto: rimpicciolita nel telefono prima dell'invio (meno dati, niente posizione GPS) ---------- */
export async function fotoPerInvio(file, lato = 2000) {
  let img, url = null;
  try { img = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    url = URL.createObjectURL(file);
    img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; })
      .catch(() => { throw new Error('Non riesco ad aprire questa foto: scattala di nuovo o scegline un’altra'); });
  }
  const k = Math.min(1, lato / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  img.close?.(); if (url) URL.revokeObjectURL(url);
  const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Non riesco a preparare la foto: riprova');
  return blob;
}
