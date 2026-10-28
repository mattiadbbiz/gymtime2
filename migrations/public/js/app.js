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

const ICONE = {
  calendario: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M16 14h0M8 17h2M12 17h2"/></svg>',
  libro: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7h8M8 10.5h6"/></svg>',
  domande: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.7-.9 1.2"/><path d="M12 14.6v.1"/></svg>',
  persone: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.6.1 4.4 1.8 5 5.4"/></svg>',
};

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
const testoOggi = a => {
  if (!a) return '';
  if (a.giornata?.stato === 'completata') return { cls: 'fatto', t: `Allenamento di oggi salvato: ${a.giornata.nome_giorno || ''}` };
  if (a.giornata) return { cls: '', t: `Hai un allenamento in corso: ${a.giornata.nome_giorno || ''}` };
  if (!a.scheda) return { cls: '', t: 'Il coach non ti ha ancora assegnato una scheda' };
  const g = a.scheda.giorni[a.suggerito] || a.scheda.giorni[0];
  const sett = a.scheda.settimane > 1 ? ` · settimana ${a.scheda.settimana} di ${a.scheda.settimane}` : '';
  return { cls: '', t: `Oggi tocca a ${g ? g.nome : 'te'}${sett}` };
};
const sottoAllena = a => !a ? '' : a.giornata?.stato === 'completata' ? 'Fatto per oggi' : a.giornata ? 'Riprendi da dove eri' : a.scheda ? 'Scegli il giorno e parti' : 'In attesa della scheda';

async function home() {
  const io = stato.io;
  const destra = `<a class="avatar-btn" href="#/profilo" aria-label="Profilo">${esc(iniziale(io.nome))}</a>`;
  const testa = `<header class="top"><div class="top-in" style="grid-template-columns:1fr auto">
    <span class="marchio"><img src="/icon.svg" alt="">GymTime</span><div class="top-right">${destra}</div></div></header>`;
  app.innerHTML = `${testa}<main class="wrap"><div class="attesa">Caricamento</div></main>`;
  const [allena, persone, mob] = await Promise.all([
    api('/api/allena').catch(() => null),
    io.ruolo === 'atleta' ? null : api('/api/utenti').catch(() => null),
    api('/api/mobilita').catch(() => null),
  ]);
  const mobAttiva = !!mob?.attiva;
  const oggi = testoOggi(allena);
  const tileAllena = (compatta) => `
    <a class="tile ${compatta ? 'compact' : 'main'}" href="#/allena">
      <span class="tile-fig" id="fig-allena"></span>
      <span><span class="tile-title">Allena</span><span class="tile-sub">${esc(sottoAllena(allena))}</span>${compatta ? '' : '<span class="gold-line"></span>'}</span>
    </a>`;
  const tileStorico = (compatta) => `
    <a class="tile${compatta ? ' compact' : ''}" href="#/storico">
      <span class="tile-fig">${ICONE.calendario}</span>
      <span><span class="tile-title">Storico</span><span class="tile-sub">Giornate, voti e schede</span></span>
    </a>`;
  // Terzo tasto: mobilità e stretching, solo se la sezione è attiva
  const tileMobilita = (riga) => `
    <a class="tile compact${riga ? ' riga' : ''}" href="#/mobilita">
      <span class="tile-fig" id="fig-mob"></span>
      <span><span class="tile-title">Mobilità</span><span class="tile-sub">${mob?.aperta ? 'Riprendi la sessione' : 'Stretching e mobilità'}</span></span>
    </a>`;
  let corpo;
  if (io.ruolo === 'atleta') {
    const giorno=allena?.giornata?.nome_giorno||allena?.scheda?.giorni[allena.suggerito||0]?.nome;
    corpo=`<div class="gt-saluto"><div><p class="gt-eyebrow">IL TUO SPAZIO DI ALLENAMENTO</p><h1>Ciao, ${esc(io.nome)}<span>.</span></h1><p class="muted small">Un passo alla volta. Ogni volta meglio.</p></div><span class="avatar">${esc(iniziale(io.nome))}</span></div><section class="gt-hero"><p class="gt-eyebrow">IL TUO PROSSIMO PASSO</p>${allena?.scheda?`<span class="gt-settimana">SETTIMANA ${allena.scheda.settimana} / ${allena.scheda.settimane}</span>`:''}<h2>È il tuo<br>momento.</h2><p>${esc(giorno||'La tua scheda ti aspetta qui')}${allena?.scheda?`<br>${esc(allena.scheda.nome)}`:''}</p><span class="gt-hero-fig" id="fig-allena"></span><a class="btn gt-via" href="#/allena">${allena?.giornata?.stato==='completata'?'Allenamento di oggi salvato':allena?.giornata?'Riprendi':'Allenati'} <span aria-hidden="true">→</span></a></section>${oggi?`<p class="gt-stato">${esc(oggi.t)}</p>`:''}<div class="gt-sezione"><h2>Il tuo allenamento</h2><span>SCEGLI DA DOVE PARTIRE</span></div><div class="gt-menu"><a href="#/scheda"><span class="gt-menu-icon">▤</span><strong>Visiona</strong><small>La scheda, senza iniziare</small><i>↗</i></a>${mobAttiva?'<a href="#/mobilita"><span class="gt-menu-icon">↔</span><strong>Mobilità</strong><small>Muoviti meglio, tutto il corpo</small><i>↗</i></a><a href="#/stretching"><span class="gt-menu-icon">⌁</span><strong>Stretching</strong><small>Una pausa per allungarti</small><i>↗</i></a>':'<div class="gt-spenta"><strong>Mobilità e stretching</strong><small>Sezione disattivata dal coach</small></div>'}<a href="#/cardio"><span class="gt-menu-icon">⌁</span><strong>Cardio</strong><small>Scegli, parti e registra</small><i>↗</i></a></div>`;
  } else {
    const atleti = (persone?.persone || []).filter(p => p.ruolo === 'atleta' && p.id !== io.id);
    const coach = (persone?.persone || []).filter(p => p.ruolo === 'coach');
    const sub = io.ruolo === 'admin' ? `${coach.length} coach · ${atleti.length} ${atleti.length === 1 ? 'atleta' : 'atleti'}` : `${atleti.length} ${atleti.length === 1 ? 'atleta' : 'atleti'}`;
    corpo = `
      <div class="intro"><h1>Ciao ${esc(io.nome)}</h1><p class="muted">${RUOLI[io.ruolo]}</p></div>
      <div class="home">
        <a class="tile main" href="#/persone">
          <span class="tile-fig" id="fig-persone"></span>
          <span><span class="tile-title">${io.ruolo === 'admin' ? 'Persone' : 'Atleti'}</span><span class="tile-sub">${esc(sub)}</span><span class="gold-line"></span></span>
        </a>
        <div class="tiles-2">
          <a class="tile compact" href="#/libreria"><span class="tile-fig">${ICONE.libro}</span><span><span class="tile-title">Libreria</span><span class="tile-sub">Esercizi e omini</span></span></a>
          <a class="tile compact" href="#/domande"><span class="tile-fig">${ICONE.domande}</span><span><span class="tile-title">Domande</span><span class="tile-sub">Prima e dopo</span></span></a>
        </div>
      </div>
      <p class="sezione">Il tuo allenamento</p>
      ${allena?.scheda || allena?.giornata
        ? `${oggi ? `<div class="stato-oggi ${oggi.cls}"><span class="pallino"></span><span>${esc(oggi.t)}</span></div>` : ''}
           <div class="tiles-2" style="margin-top:12px">${tileAllena(true)}${tileStorico(true)}</div>`
        : `<p class="hint">Per allenarti anche tu, apri ${io.ruolo === 'admin' ? 'Persone' : 'Atleti'}, scegli il tuo profilo e crea la tua scheda.</p>`}
      ${mobAttiva ? `<div style="margin-top:12px">${tileMobilita(true)}</div>` : ''}`;
  }
  app.querySelector('main').innerHTML = corpo;
  const fa = document.getElementById('fig-allena'); if (fa) montaOmino(fa, 'squat_bil', { tempo: '1.6-0.3-1.2-0.6', muscoli: 'quadricipite, gluteo' });
  const fp = document.getElementById('fig-persone'); if (fp) montaOmino(fp, 'stacco', { tempo: '1.4-0.4-1.2-0.6', muscoli: 'gluteo, femorali, erettori' });
  const fm = document.getElementById('fig-mob'); if (fm) montaOmino(fm, 'mob_cerchi_braccia', { muscoli: 'deltoidi' });
}

/* ---------- Profilo ---------- */
rotta(/^\/profilo$/, () => {
  const io = stato.io;
  pagina({ titolo: 'Profilo', html: `
    <div class="profilo-testa"><span class="avatar">${esc(iniziale(io.nome))}</span>
      <div><h2 style="margin:0">${esc(io.nome)}</h2><p class="muted">@${esc(io.username)}</p><span class="tag gold ruolo">${RUOLI[io.ruolo]}</span></div></div>
    ${io.ruolo==='atleta'?'<div class="card"><h3>Il tuo percorso</h3><p class="hint">Allenamenti, previsto e fatto, voti e sessioni libere.</p><div class="azioni-riga"><a class="btn primary" href="#/storico">Storico allenamenti</a><a class="btn" href="#/storico/schede">Schede passate</a></div></div>':''}
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
    ${io.ruolo==='atleta'?'<div class="card"><h3>Preferenze</h3><label>Aspetto<select id="gt-aspetto"><option value="chiaro">Chiaro</option><option value="scuro">Scuro</option></select></label><p class="hint">Preferenza salvata solo su questo dispositivo.</p></div>':''}
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
