// GymTime · avvio, accesso, home e profilo
import { api, esc, iniziale, RUOLI, quandoNonAutorizzato } from './api.js';
import { stato, app, rotta, impostaBase, mostra, vai, pagina, toast, chiedi, campoPassword, attivaMostraPassword } from './ui.js';
import { montaOmino } from './omino.js';
import './atleta.js';
import './coach.js';
import './mobilita-sessione.js';
import './navigazione.js';
import './atleta-sezioni.js';
import './cardio.js';


/* ---------- Accesso ---------- */
function accesso() {
  let admin = new URLSearchParams(location.search).has('admin');
  const disegna = () => {
    app.innerHTML = `
      <div class="accesso"><div class="accesso-in">
        <div class="accesso-marchio">
          <img class="logo" src="/icon.svg" alt="">
          <h1>GymTime</h1><span class="gold-line"></span>
          <p>Il diario di allenamento della squadra</p>
        </div>
        <div class="accesso-card">
          <h2>${admin ? 'Accesso admin' : 'Entra'}</h2>
          <p class="muted small">${admin ? 'Riservato al responsabile dell’app.' : 'Usa username e password che ti ha dato il coach.'}</p>
          <form id="f-accesso" novalidate>
            <label>Username<input name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required></label>
            ${campoPassword('password', 'Password')}
            <p class="err" id="err" role="alert"></p>
            <button class="btn primary big" type="submit">Entra</button>
          </form>
        </div>
      </div></div>
      <button class="tasto-admin" type="button" id="t-admin" aria-pressed="${admin}">Admin</button>`;
    attivaMostraPassword();
    const f = document.getElementById('f-accesso');
    f.username.focus();
    document.getElementById('t-admin').onclick = () => { admin = !admin; disegna(); };
    f.onsubmit = async e => {
      e.preventDefault();
      const err = document.getElementById('err'); err.textContent = '';
      const b = f.querySelector('button[type="submit"]'); b.disabled = true;
      try {
        const { utente } = await api('/api/login', { metodo: 'POST', dati: { username: f.username.value.trim(), password: f.password.value, admin } });
        stato.io = utente;
        history.replaceState(null, '', location.pathname + '#/');
        mostra();
      } catch (ex) { err.textContent = ex.message; b.disabled = false; }
    };
  };
  disegna();
}

/* ---------- Primo accesso: password nuova ---------- */
function nuovaPassword() {
  app.innerHTML = `
    <div class="accesso"><div class="accesso-in">
      <div class="accesso-marchio"><img class="logo" src="/icon.svg" alt=""><h1>Ciao ${esc(stato.io.nome)}</h1><span class="gold-line"></span></div>
      <div class="accesso-card">
        <h2>Scegli la tua password</h2>
        <p class="muted small">Quella che hai usato adesso era provvisoria. Scegline una tua: da ora entrerai con questa.</p>
        <form id="f-pw" novalidate>
          ${campoPassword('nuova', 'Nuova password', 'new-password')}
          ${campoPassword('conferma', 'Ripeti la password', 'new-password')}
          <p class="err" id="err" role="alert"></p>
          <button class="btn primary big" type="submit">Salva password</button>
        </form>
        <button class="link" type="button" id="esci">Esci</button>
      </div>
    </div></div>`;
  attivaMostraPassword();
  const f = document.getElementById('f-pw');
  f.nuova.focus();
  document.getElementById('esci').onclick = esci;
  f.onsubmit = async e => {
    e.preventDefault();
    const err = document.getElementById('err'); err.textContent = '';
    if (!f.nuova.value) return void (err.textContent = 'Scrivi la nuova password');
    if (f.nuova.value !== f.conferma.value) return void (err.textContent = 'Le due password non coincidono');
    try {
      await api('/api/password', { metodo: 'POST', dati: { nuova: f.nuova.value } });
      stato.io.cambio_password = 0;
      toast('Password salvata');
      vai('#/');
    } catch (ex) { err.textContent = ex.message; }
  };
}

/* ---------- Home ---------- */
// Voce dei menu a elenco (home e gestione nel profilo)
const voce = (href, icona, titolo, sotto) => `<a href="${href}"><span class="gt-menu-icon">${icona}</span><strong>${titolo}</strong><small>${sotto}</small><i>↗</i></a>`;
const testoOggi = a => {
  if (!a) return '';
  if (a.giornata?.stato === 'completata') return { cls: 'fatto', t: `Allenamento di oggi salvato: ${a.giornata.nome_giorno || ''}` };
  if (a.giornata) return { cls: '', t: `Hai un allenamento in corso: ${a.giornata.nome_giorno || ''}` };
  if (!a.scheda) return { cls: '', t: stato.io.ruolo === 'atleta' ? 'Il coach non ti ha ancora assegnato una scheda' : 'Non hai ancora una scheda: creala dal Profilo, in Atleti' };
  const g = a.scheda.giorni[a.suggerito] || a.scheda.giorni[0];
  const sett = a.scheda.settimane > 1 ? ` · settimana ${a.scheda.settimana} di ${a.scheda.settimane}` : '';
  return { cls: '', t: `Oggi tocca a ${g ? g.nome : 'te'}${sett}` };
};

async function home() {
  const io = stato.io;
  const destra = `<a class="avatar-btn" href="#/profilo" aria-label="Profilo">${esc(iniziale(io.nome))}</a>`;
  const testa = `<header class="top"><div class="top-in" style="grid-template-columns:1fr auto">
    <span class="marchio"><img src="/icon.svg" alt="">GymTime</span><div class="top-right">${destra}</div></div></header>`;
  app.innerHTML = `${testa}<main class="wrap"><div class="attesa">Caricamento</div></main>`;
  const [allena, mob] = await Promise.all([api('/api/allena').catch(() => null), api('/api/mobilita').catch(() => null)]);
  const oggi = testoOggi(allena);
  const giorno = allena?.giornata?.nome_giorno || allena?.scheda?.giorni[allena.suggerito || 0]?.nome;
  // Senza scheda: l'atleta aspetta il coach, coach e admin se la creano dal proprio profilo atleta
  const creaScheda = !allena?.scheda && !allena?.giornata && io.ruolo !== 'atleta';
  const via = creaScheda ? `<a class="btn gt-via" href="#/atleta/${io.id}">Crea la tua scheda <span aria-hidden="true">→</span></a>`
    : `<a class="btn gt-via" href="#/allena">${allena?.giornata?.stato === 'completata' ? 'Allenamento di oggi salvato' : allena?.giornata ? 'Riprendi' : 'Allenati'} <span aria-hidden="true">→</span></a>`;
  const mobilita = mob?.attiva
    ? voce('#/mobilita', '↔', 'Mobilità', mob.aperta ? 'Riprendi la sessione' : 'Muoviti meglio, tutto il corpo') + voce('#/stretching', '⌁', 'Stretching', 'Una pausa per allungarti')
    : `<div class="gt-spenta"><strong>Mobilità e stretching</strong><small>${io.ruolo === 'atleta' ? 'Sezione disattivata dal coach' : 'Sezione spenta: la riaccendi da Profilo → Libreria'}</small></div>`;
  app.querySelector('main').innerHTML = `
    <div class="gt-saluto"><div><p class="gt-eyebrow">IL TUO SPAZIO DI ALLENAMENTO</p><h1>Ciao, ${esc(io.nome)}<span>.</span></h1><p class="muted small">Un passo alla volta. Ogni volta meglio.</p></div><span class="avatar">${esc(iniziale(io.nome))}</span></div>
    <section class="gt-hero"><p class="gt-eyebrow">IL TUO PROSSIMO PASSO</p>${allena?.scheda ? `<span class="gt-settimana">SETTIMANA ${allena.scheda.settimana} / ${allena.scheda.settimane}</span>` : ''}
      <h2>È il tuo<br>momento.</h2><p>${esc(giorno || 'La tua scheda ti aspetta qui')}${allena?.scheda ? `<br>${esc(allena.scheda.nome)}` : ''}</p>
      <span class="gt-hero-fig" id="fig-allena"></span>${via}</section>
    ${oggi ? `<p class="gt-stato">${esc(oggi.t)}</p>` : ''}
    <div class="gt-sezione"><h2>Il tuo allenamento</h2><span>SCEGLI DA DOVE PARTIRE</span></div>
    <div class="gt-menu">${voce('#/scheda', '▤', 'Visiona', 'La scheda, senza iniziare')}${voce('#/esercizi', '☰', 'Esercizi', 'Cerca e impara la tecnica')}${mobilita}${voce('#/cardio', '⌁', 'Cardio', 'Scegli, parti e registra')}</div>`;
  const fa = document.getElementById('fig-allena'); if (fa) montaOmino(fa, 'squat_bil', { tempo: '1.6-0.3-1.2-0.6', muscoli: 'quadricipite, gluteo' });
}

/* ---------- Profilo ---------- */
// Matrioska: tutti hanno il profilo dell'atleta; il coach aggiunge la gestione, l'admin anche i coach (in Persone)
function gestione(io) {
  if (io.ruolo === 'atleta') return '';
  return `<div class="gt-sezione"><h2>Gestione</h2><span>${io.ruolo === 'admin' ? 'COACH, ATLETI E APP' : 'I TUOI ATLETI'}</span></div>
    <div class="gt-menu">${io.ruolo === 'admin' ? voce('#/persone', '◉', 'Persone', 'Coach e atleti, schede e storico') : voce('#/persone', '◉', 'Atleti', 'Profili, schede e storico')}${voce('#/libreria', '☰', 'Libreria', 'Esercizi, omini e mobilità')}${voce('#/domande', '?', 'Domande', 'Prima e dopo l’allenamento')}</div>`;
}
rotta(/^\/profilo$/, () => {
  const io = stato.io;
  pagina({ titolo: 'Profilo', indietro: '', html: `
    <div class="profilo-testa"><span class="avatar">${esc(iniziale(io.nome))}</span>
      <div><h2 style="margin:0">${esc(io.nome)}</h2><p class="muted">@${esc(io.username)}</p><span class="tag gold ruolo">${RUOLI[io.ruolo]}</span></div></div>
    ${gestione(io)}
    <div class="card">
      <h3>Cambia password</h3>
      <p class="hint">Scegli quella che preferisci: non ci sono regole su lunghezza o simboli.</p>
      <form id="f-pw" class="stack" novalidate>
        ${campoPassword('attuale', 'Password attuale')}
        ${campoPassword('nuova', 'Nuova password', 'new-password')}
        ${campoPassword('conferma', 'Ripeti la nuova password', 'new-password')}
        <p class="err" id="err" role="alert"></p>
        <button class="btn primary" type="submit">Salva password</button>
      </form>
    </div>
    <div class="card"><h3>Preferenze</h3><label>Aspetto<select id="gt-aspetto"><option value="chiaro">Chiaro</option><option value="scuro">Scuro</option></select></label><p class="hint">Preferenza salvata solo su questo dispositivo.</p></div>
    <button class="btn danger big" type="button" id="esci" style="margin-top:8px">Esci</button>` });
  attivaMostraPassword();
  const f = document.getElementById('f-pw');
  const aspetto=document.getElementById('gt-aspetto');if(aspetto){aspetto.value=document.documentElement.dataset.gtTheme||'chiaro';aspetto.onchange=()=>{document.documentElement.dataset.gtTheme=aspetto.value;try{localStorage.setItem('gt-aspetto',aspetto.value);}catch{}};}
  document.getElementById('esci').onclick = async () => { if (await chiedi({ titolo: 'Vuoi uscire?', ok: 'Esci' })) esci(); };
  f.onsubmit = async e => {
    e.preventDefault();
    const err = document.getElementById('err'); err.textContent = '';
    if (!f.nuova.value) return void (err.textContent = 'Scrivi la nuova password');
    if (f.nuova.value !== f.conferma.value) return void (err.textContent = 'Le due password non coincidono');
    try {
      await api('/api/password', { metodo: 'POST', dati: { attuale: f.attuale.value, nuova: f.nuova.value } });
      f.reset(); toast('Password cambiata');
    } catch (ex) { err.textContent = ex.message; }
  };
});

async function esci() {
  try { await api('/api/logout', { metodo: 'POST' }); } catch {}
  stato.io = null;
  history.replaceState(null, '', location.pathname);
  mostra();
}

/* ---------- Avvio ---------- */
impostaBase({ home, accesso, nuovaPassword });
quandoNonAutorizzato(() => { if (stato.io) { stato.io = null; mostra(); } });
(async () => {
  try { stato.io = (await api('/api/io')).utente; } catch { stato.io = null; }
  mostra();
})();
