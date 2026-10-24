// GymTime · frontend: accesso, cambio password, gestione profili (la libreria è in libreria.js)
const $ = s => document.querySelector(s);
const ETICHETTE = { admin: 'Admin', coach: 'Coach', atleta: 'Atleta' };
let io = null;
let modoAdmin = false;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function chiama(percorso, { metodo = 'GET', dati } = {}) {
  const r = await fetch(percorso, {
    method: metodo,
    headers: dati ? { 'Content-Type': 'application/json' } : {},
    body: dati ? JSON.stringify(dati) : undefined,
    credentials: 'same-origin',
  });
  let corpo = {};
  try { corpo = await r.json(); } catch {}
  if (!r.ok) {
    if (r.status === 403 && corpo.cambio_password) { vista('password'); }
    const e = new Error(corpo.errore || 'Qualcosa non ha funzionato, riprova.');
    e.stato = r.status;
    throw e;
  }
  return corpo;
}

function vista(nome) {
  for (const v of document.querySelectorAll('.vista')) v.hidden = v.id !== `vista-${nome}`;
  const primo = document.querySelector(`#vista-${nome} input`);
  if (primo && (nome === 'accesso' || nome === 'password')) primo.focus();
}

function mostraErrore(form, testo) { form.querySelector('.errore').textContent = testo || ''; }

function generaPassword() {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const n = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(n, x => alfabeto[x % alfabeto.length]).join('');
}

/* ---------- Accesso ---------- */
function impostaModoAdmin(attivo) {
  modoAdmin = attivo;
  $('#vista-accesso').classList.toggle('modo-admin', attivo);
  $('#titolo-accesso').textContent = attivo ? 'Accesso admin' : 'GymTime';
  $('#sotto-accesso').textContent = attivo ? 'Area riservata all’admin.' : 'Entra con le credenziali che ti ha dato il tuo coach.';
  $('#tasto-admin').textContent = attivo ? 'Accesso normale' : 'Admin';
  mostraErrore($('#form-accesso'), '');
}
$('#tasto-admin').addEventListener('click', () => impostaModoAdmin(!modoAdmin));

$('#form-accesso').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.currentTarget, d = Object.fromEntries(new FormData(f));
  if (!d.username.trim() || !d.password) return mostraErrore(f, 'Inserisci username e password.');
  const tasto = f.querySelector('button');
  tasto.disabled = true;
  try {
    const { utente } = await chiama('/api/login', { metodo: 'POST', dati: { ...d, area: modoAdmin ? 'admin' : undefined } });
    f.reset();
    mostraErrore(f, '');
    entra(utente);
  } catch (err) {
    mostraErrore(f, err.message);
  } finally {
    tasto.disabled = false;
  }
});

function entra(utente) {
  io = utente;
  if (utente.cambio_password) return vista('password');
  mostraHome();
}

/* ---------- Cambio password ---------- */
$('#form-password').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.currentTarget, d = Object.fromEntries(new FormData(f));
  if (!d.attuale) return mostraErrore(f, 'Inserisci la password attuale.');
  if (d.nuova.length < 8) return mostraErrore(f, 'La nuova password deve avere almeno 8 caratteri.');
  if (d.nuova !== d.conferma) return mostraErrore(f, 'Le due password nuove non coincidono.');
  try {
    await chiama('/api/password', { metodo: 'POST', dati: { attuale: d.attuale, nuova: d.nuova } });
    f.reset();
    mostraErrore(f, '');
    io.cambio_password = false;
    mostraHome();
  } catch (err) {
    mostraErrore(f, err.message);
  }
});

for (const b of document.querySelectorAll('[data-esci]')) {
  b.addEventListener('click', async () => {
    try { await chiama('/api/logout', { metodo: 'POST' }); } catch {}
    io = null;
    impostaModoAdmin(false);
    vista('accesso');
  });
}

/* ---------- Home ---------- */
function mostraHome() {
  $('#saluto').textContent = `Ciao ${io.nome}`;
  $('#ruolo').textContent = ETICHETTE[io.ruolo];
  const gestisce = io.ruolo !== 'atleta';
  $('#sez-persone').hidden = !gestisce;
  $('#sez-coach').hidden = !gestisce;
  if (gestisce) {
    $('#titolo-persone').textContent = io.ruolo === 'admin' ? 'Coach e atleti' : 'I tuoi atleti';
    $('#campo-ruolo').hidden = io.ruolo !== 'admin';
    $('#credenziali').hidden = true;
    caricaPersone();
  }
  vista('home');
}

let persone = [];
async function caricaPersone() {
  try {
    ({ utenti: persone } = await chiama('/api/utenti'));
  } catch (err) {
    persone = [];
    $('#elenco').innerHTML = `<li class="errore">${esc(err.message)}</li>`;
    return;
  }
  disegnaElenco();
  aggiornaCampoCoach();
}

function disegnaElenco() {
  $('#elenco-vuoto').hidden = persone.length > 0;
  $('#elenco').innerHTML = persone.map(u => {
    const dettagli = [ETICHETTE[u.ruolo], `@${u.username}`];
    if (io.ruolo === 'admin' && u.ruolo === 'atleta') dettagli.push(u.coach_id === io.id ? 'segue te' : `coach: ${u.coach_nome || 'nessuno'}`);
    return `<li data-id="${u.id}">
      <div><span class="nome">${esc(u.nome)}</span>${u.cambio_password ? '<span class="tag">Primo accesso</span>' : ''}
        <div class="info">${esc(dettagli.join(' – '))}</div></div>
      <div class="comandi">
        <button type="button" class="secondario" data-azione="reimposta">Nuova password iniziale</button>
        <button type="button" class="pericolo" data-azione="elimina">Elimina</button>
      </div></li>`;
  }).join('');
}

function aggiornaCampoCoach() {
  const f = $('#form-nuovo');
  const mostra = io.ruolo === 'admin' && f.ruolo.value === 'atleta';
  $('#campo-coach').hidden = !mostra;
  if (!mostra) return;
  const scelto = f.coach_id.value;
  const coach = persone.filter(u => u.ruolo === 'coach');
  f.coach_id.innerHTML = `<option value="${io.id}">Io (${esc(io.nome)})</option>` +
    coach.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
  if ([...f.coach_id.options].some(o => o.value === scelto)) f.coach_id.value = scelto;
}
$('#form-nuovo').ruolo.addEventListener('change', aggiornaCampoCoach);

document.querySelector('[data-genera]').addEventListener('click', () => {
  $('#form-nuovo').password.value = generaPassword();
});

function mostraCredenziali(nome, username, password) {
  const box = $('#credenziali');
  box.innerHTML = `<strong>Credenziali per ${esc(nome)}</strong><br>
    Username: <code>${esc(username)}</code><br>Password iniziale: <code>${esc(password)}</code><br>
    <small>Al primo accesso dovrà sceglierne una sua. Questa password non verrà più mostrata.</small>`;
  box.hidden = false;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

$('#form-nuovo').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.currentTarget, d = Object.fromEntries(new FormData(f));
  if (!d.nome.trim()) return mostraErrore(f, 'Inserisci un nome o soprannome.');
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(d.username.trim())) return mostraErrore(f, 'Username: da 3 a 30 caratteri tra lettere, numeri, punto, trattino e trattino basso.');
  if (d.password.length < 8) return mostraErrore(f, 'La password iniziale deve avere almeno 8 caratteri.');
  try {
    await chiama('/api/utenti', { metodo: 'POST', dati: { ...d, username: d.username.trim(), nome: d.nome.trim() } });
    mostraErrore(f, '');
    mostraCredenziali(d.nome.trim(), d.username.trim(), d.password);
    f.nome.value = f.username.value = f.password.value = '';
    caricaPersone();
  } catch (err) {
    mostraErrore(f, err.message);
  }
});

$('#elenco').addEventListener('click', async e => {
  const tasto = e.target.closest('button[data-azione]');
  if (!tasto) return;
  const id = Number(tasto.closest('li').dataset.id);
  const u = persone.find(p => p.id === id);
  if (!u) return;
  try {
    if (tasto.dataset.azione === 'reimposta') {
      if (!confirm(`Creare una nuova password iniziale per ${u.nome}? Quella attuale smetterà di funzionare.`)) return;
      const password = generaPassword();
      await chiama(`/api/utenti/${id}/password`, { metodo: 'POST', dati: { password } });
      mostraCredenziali(u.nome, u.username, password);
    } else {
      if (!confirm(`Eliminare il profilo di ${u.nome}? Verranno eliminati anche schede e storico.`)) return;
      await chiama(`/api/utenti/${id}`, { metodo: 'DELETE' });
    }
    caricaPersone();
  } catch (err) {
    alert(err.message);
  }
});

for (const b of document.querySelectorAll('[data-home]')) b.addEventListener('click', mostraHome);

/* ---------- Avvio ---------- */
(async () => {
  try {
    const { utente } = await chiama('/api/io');
    entra(utente);
  } catch {
    impostaModoAdmin(new URLSearchParams(location.search).has('admin'));
    vista('accesso');
  }
})();
