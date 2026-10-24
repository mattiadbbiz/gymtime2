// GymTime · libreria esercizi (coach e admin): ricerca, filtri, modifica
const CATEGORIE = { cal: 'Calisthenics', str: 'Streetlifting', pl: 'Powerlifting', bb: 'Bodybuilding', fn: 'Funzionale', kb: 'Kettlebell' };
const ANIMAZIONI = { squat: 'Squat', lunge: 'Affondo', hinge: 'Stacco', push: 'Piegamento', bench: 'Panca', press: 'Spinta sopra la testa', pull: 'Trazione', row: 'Rematore', dip: 'Dip', curl: 'Curl', raise: 'Alzate', core: 'Addome', jump: 'Salto', free: 'Generico' };
const MODALITA = { setrep: 'Serie × ripetizioni', emom: 'EMOM', amrap: 'AMRAP', tempo: 'Tenuta a tempo', free: 'Libero', rt: 'RT', ladder: 'Ladder' };

const lib = { esercizi: [], cat: 'tutte', q: '', aperto: null };
const normLib = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ');
const opzioni = (mappa, scelto) => Object.entries(mappa).map(([k, v]) => `<option value="${k}" ${k === scelto ? 'selected' : ''}>${esc(v)}</option>`).join('');

async function apriLibreria() {
  vista('libreria');
  $('#lib-elenco').innerHTML = '<p class="sotto">Carico la libreria…</p>';
  try {
    ({ esercizi: lib.esercizi } = await chiama('/api/libreria'));
  } catch (err) {
    $('#lib-elenco').innerHTML = `<p class="errore">${esc(err.message)}</p>`;
    return;
  }
  disegnaFiltri();
  disegnaLibreria();
}
$('#apri-libreria').addEventListener('click', apriLibreria);

function disegnaFiltri() {
  const presenti = Object.keys(CATEGORIE).filter(c => lib.esercizi.some(e => e.categoria === c));
  $('#lib-filtri').innerHTML = [['tutte', 'Tutte'], ...presenti.map(c => [c, CATEGORIE[c]])]
    .map(([k, v]) => `<button type="button" class="filtro" data-cat="${k}" aria-pressed="${lib.cat === k}">${esc(v)}</button>`).join('');
}

function form(e = {}) {
  return `<form class="lib-form" data-id="${e.id || ''}" novalidate>
    <label>Nome<input name="nome" maxlength="80" value="${esc(e.nome)}" required></label>
    <div class="due">
      <label>Categoria<select name="categoria"><option value="">—</option>${opzioni(CATEGORIE, e.categoria)}</select></label>
      <label>Omino<select name="animazione">${opzioni(ANIMAZIONI, e.animazione || 'free')}</select></label>
    </div>
    <label>Muscoli<input name="muscolo" maxlength="120" value="${esc(e.muscolo)}" placeholder="Schiena: gran dorsale, romboidi, bicipiti"></label>
    <div class="due">
      <label>Famiglia<input name="famiglia" maxlength="40" value="${esc(e.famiglia)}" placeholder="Trazione"></label>
      <label>Variante<input name="variante" maxlength="60" value="${esc(e.variante)}" placeholder="presa prona"></label>
    </div>
    <label>Attrezzo<input name="attrezzo" maxlength="80" value="${esc(e.attrezzo)}"></label>
    <div class="due">
      <label>Modalità di base<select name="modalita_default">${opzioni(MODALITA, e.modalita_default || 'setrep')}</select></label>
      <label>Si parte con<select name="inizia_con">${opzioni({ ecc: 'Discesa (eccentrica)', conc: 'Salita (concentrica)' }, e.inizia_con || 'conc')}</select></label>
    </div>
    <label>Altri nomi, separati da virgola<input name="altri_nomi" maxlength="200" value="${esc(e.altri_nomi)}"></label>
    <label>Accorgimenti, uno per riga<textarea name="accorgimenti" rows="6">${esc(e.accorgimenti)}</textarea></label>
    <p class="aiuto">Frasi brevi e concrete: posizione, movimento, errore da evitare. Sono quelle che l’atleta legge durante l’esercizio.</p>
    <p class="errore" role="alert"></p>
    <div class="comandi">
      <button class="primario">${e.id ? 'Salva modifiche' : 'Aggiungi alla libreria'}</button>
      ${e.id ? '<button type="button" class="pericolo" data-elimina>Elimina</button>' : '<button type="button" class="secondario" data-annulla>Annulla</button>'}
    </div>
  </form>`;
}

function voce(e) {
  const cues = (e.accorgimenti || '').split('\n').filter(Boolean);
  const etichette = [CATEGORIE[e.categoria], e.attrezzo].filter(Boolean).join(' · ');
  return `<details class="lib-voce" data-id="${e.id}" ${lib.aperto === e.id ? 'open' : ''}>
    <summary>
      <span class="lib-nome">${esc(e.nome)}${e.creato_da !== null ? '<span class="tag">Tuo</span>' : ''}</span>
      <span class="info">${esc(e.muscolo || '')}</span>
      <span class="info piccola">${esc(etichette)}</span>
    </summary>
    <div class="lib-corpo">
      ${cues.length ? `<ul class="cues">${cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : '<p class="sotto">Nessun accorgimento.</p>'}
      <p class="info piccola">${esc(MODALITA[e.modalita_default] || '')} · si parte con la ${e.inizia_con === 'ecc' ? 'discesa' : 'salita'}${e.altri_nomi ? ` · anche: ${esc(e.altri_nomi)}` : ''}</p>
      ${e.modificabile ? form(e) : '<p class="aiuto">Esercizio della libreria di base: lo modifica l’admin.</p>'}
    </div>
  </details>`;
}

function disegnaLibreria() {
  const q = normLib(lib.q).trim();
  const visibili = lib.esercizi.filter(e =>
    (lib.cat === 'tutte' || e.categoria === lib.cat) &&
    (!q || normLib([e.nome, e.altri_nomi, e.muscolo, e.attrezzo, e.famiglia].join(' ')).includes(q)));
  $('#lib-conta').textContent = `${lib.esercizi.length} esercizi`;
  $('#lib-vuoto').hidden = visibili.length > 0;
  $('#lib-elenco').innerHTML = visibili.map(voce).join('');
}

$('#lib-cerca').addEventListener('input', e => { lib.q = e.target.value; disegnaLibreria(); });

$('#lib-filtri').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  lib.cat = b.dataset.cat;
  disegnaFiltri();
  disegnaLibreria();
});

$('#lib-elenco').addEventListener('toggle', e => {
  const d = e.target;
  if (d.open) lib.aperto = Number(d.dataset.id);
  else if (lib.aperto === Number(d.dataset.id)) lib.aperto = null;
}, true);

$('#lib-nuovo').addEventListener('click', () => {
  $('#lib-form-nuovo').innerHTML = `<div class="riquadro"><h3>Nuovo esercizio</h3>${form({ categoria: lib.cat !== 'tutte' ? lib.cat : '' })}</div>`;
  $('#lib-form-nuovo input[name="nome"]').focus();
});

document.querySelector('#vista-libreria main').addEventListener('click', async e => {
  if (e.target.closest('[data-annulla]')) { $('#lib-form-nuovo').innerHTML = ''; return; }
  const b = e.target.closest('[data-elimina]');
  if (!b) return;
  const f = b.closest('form'), id = Number(f.dataset.id);
  const x = lib.esercizi.find(y => y.id === id);
  if (!confirm(`Eliminare «${x.nome}» dalla libreria? Le schede che lo usano mantengono nome e parametri.`)) return;
  try {
    await chiama(`/api/libreria/${id}`, { metodo: 'DELETE' });
    lib.esercizi = lib.esercizi.filter(y => y.id !== id);
    lib.aperto = null;
    disegnaLibreria();
  } catch (err) { mostraErrore(f, err.message); }
});

document.querySelector('#vista-libreria main').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  if (d.nome.trim().length < 2) return mostraErrore(f, 'Il nome deve avere almeno 2 caratteri.');
  const id = Number(f.dataset.id) || null;
  const tasto = f.querySelector('.primario');
  tasto.disabled = true;
  try {
    if (id) await chiama(`/api/libreria/${id}`, { metodo: 'PUT', dati: d });
    else {
      const r = await chiama('/api/libreria', { metodo: 'POST', dati: d });
      lib.aperto = r.id;
      $('#lib-form-nuovo').innerHTML = '';
    }
    ({ esercizi: lib.esercizi } = await chiama('/api/libreria'));
    if (id) lib.aperto = id;
    disegnaFiltri();
    disegnaLibreria();
  } catch (err) {
    mostraErrore(f, err.message);
    tasto.disabled = false;
  }
});
