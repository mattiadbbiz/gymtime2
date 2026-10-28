import { stato, app, percorso, finestra } from './ui.js';
// Barra in basso uguale per tutti i ruoli: Storico, Allenamento, Profilo
const SCHEDE = { storico: 'Storico', allenamento: 'Allenamento', profilo: 'Profilo' };
const LINK = { storico: '#/storico', allenamento: '#/', profilo: '#/profilo' };
const icone = { storico: 'M3.5 5h17v15h-17z M3.5 10h17 M8 3v4 M16 3v4', allenamento: 'M4 8v8 M8 6v12 M8 12h8 M16 6v12 M20 8v8 M2 12h2 M20 12h2', profilo: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2' };
// Sezione attiva: lo storico personale a sinistra, la gestione di coach e admin sotto Profilo, il resto è Allenamento
const sezioneDi = p => /^\/storico(\/schede)?$/.test(p) ? 'storico'
  : /^\/(profilo|persone|atleta\/|libreria|domande|importa\/|scheda\/\d|storico-scheda\/|storico\/\d)/.test(p) ? 'profilo' : 'allenamento';
let tentata = '', chiudiAttuale = null;
try {
  document.documentElement.dataset.gtTheme = localStorage.getItem('gt-aspetto') || 'chiaro';
} catch {}
// Guida a matrioska: ogni ruolo legge la parte dell'atleta più la propria
const testi = {
  atleta: '<h3>Tre sezioni</h3><p>Storico: giornate, progressi e schede passate. Allenamento: Allenati, Visiona, Esercizi e sessioni libere. Profilo: password, aspetto e uscita.</p><h3>Allenati e registra</h3><p>La data si lega al giorno con Avvia scheda. Serie fatta avvia il recupero; −15 s e +15 s modificano solo la pausa corrente. Tra esercizi normali puoi avviare la pausa proposta, pari al recupero prescritto più un minuto, o saltarla. La penna corregge il fatto senza cambiare il previsto.</p><h3>Sessioni libere</h3><p>Mobilità e Stretching generano proposte full body. Controlla l’anteprima prima di avviare. In Cardio scegli gli esercizi, salva la bozza o completa indicando la durata degli esercizi fatti.</p><h3>Account</h3><p>Non ricordi la password? Chiedi al coach il reset. Non serve un’email. Nelle note inserisci solo informazioni indispensabili all’allenamento.</p>',
  coach: '<h3>Gestione, nel Profilo</h3><p>Ti alleni come un atleta: la tua scheda la crei da Profilo → Atleti, aprendo il tuo nome. Sempre dal Profilo gestisci atleti, libreria esercizi, mobilità e domande.</p><h3>Atleti e schede</h3><p>Crea gli account, assegna le schede e controlla giorni, varianti, superserie e progressioni.</p><h3>Segui il lavoro</h3><p>Apri lo storico dell’atleta per leggere previsto/fatto, voti, sensazioni e sessioni libere. Le schede archiviate e importate rimangono in Schede.</p><h3>Password dimenticata</h3><p>Reimposta una password provvisoria dal profilo dell’atleta mantenendo il cambio obbligatorio. Il reset revoca le sessioni precedenti. Comunica le credenziali direttamente, senza raccogliere email.</p>',
  admin: '<h3>Admin</h3><p>Da Profilo → Persone gestisci anche i coach e i loro atleti, e nella libreria hai le funzioni riservate.</p>',
};
const LIVELLI = { atleta: ['atleta'], coach: ['atleta', 'coach'], admin: ['atleta', 'coach', 'admin'] };
const CHIAVE_GUIDA = () => `gt-guida-v4-${stato.io.id}-${stato.io.ruolo}`;
function guida() {
  if (!stato.io || stato.io.cambio_password) return;
  chiudiAttuale?.();
  const prima = document.activeElement;
  const v = finestra(`<h2 id="gt-guida-titolo">La tua guida GymTime</h2>${(LIVELLI[stato.io.ruolo] || LIVELLI.atleta).map(r => testi[r]).join('')}<button class="btn primary big" id="gt-guida-chiudi">Ho capito</button>`);
  v.querySelector('.dialogo').classList.add('gt-guida');
  v.querySelector('.dialogo').setAttribute('aria-labelledby', 'gt-guida-titolo');
  const chiudi = () => {
    document.removeEventListener('keydown', tasti);
    v.remove();
    chiudiAttuale = null;
    prima?.focus();
  };
  const tasti = e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      chiudi();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      v.querySelector('button').focus();
    }
  };
  chiudiAttuale = chiudi;
  document.addEventListener('keydown', tasti);
  v.querySelector('button').onclick = chiudi;
  v.addEventListener('click', e => {
    if (e.target === v) chiudi();
  });
  v.querySelector('button').focus();
  try {
    localStorage.setItem(CHIAVE_GUIDA(), '1');
  } catch {}
}
function aggiorna() {
  if (chiudiAttuale && !document.getElementById('gt-guida-titolo')) chiudiAttuale();
  const attiva = !!stato.io && !stato.io.cambio_password;
  document.body.classList.toggle('gt-atleta', attiva);
  let n = document.getElementById('gt-nav');
  if (!attiva) n?.remove();
  else {
    if (!n) {
      n = document.createElement('nav');
      n.id = 'gt-nav';
      n.setAttribute('aria-label', 'Navigazione principale');
      n.innerHTML = Object.entries(SCHEDE).map(([k, t]) => `<a href="${LINK[k]}" data-tab="${k}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icone[k]}"/></svg><span>${t}</span></a>`).join('');
      document.body.appendChild(n);
    }
    const tab = sezioneDi(percorso());
    n.querySelectorAll('a').forEach(a => a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  }
  const destra = app.querySelector('.top-right');
  if (attiva && destra && !destra.querySelector('#gt-aiuto')) destra.insertAdjacentHTML('beforeend', '<button id="gt-aiuto" type="button" aria-label="Apri guida">?</button>');
  if (attiva && destra && !app.querySelector('.attesa')) {
    const k = CHIAVE_GUIDA();
    if (tentata !== k) {
      tentata = k;
      let vista = false;
      try {
        vista = localStorage.getItem(k) === '1';
      } catch {}
      if (!vista) guida();
    }
  }
}
document.addEventListener('click', e => {
  if (e.target.closest('#gt-aiuto')) {
    e.preventDefault();
    guida();
    return;
  }
  const a = e.target.closest('a[href^="#/"]');
  if (a && a.hash !== location.hash && /^#\/(allena\/g\/\d+|mobilita\/s\/\d+|cardio\/s\/\d+)$/.test(location.hash) && !confirm('Cambiare schermata? I dati registrati rimangono. Risposte, voti e modifiche non confermati potrebbero non essere conservati.')) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);
window.addEventListener('beforeunload', e => {
  if (/^#\/(allena\/g\/\d+|mobilita\/s\/\d+|cardio\/s\/\d+)$/.test(location.hash)) {
    e.preventDefault();
    e.returnValue = '';
  }
});
new MutationObserver(aggiorna).observe(app, { childList: true, subtree: true });
window.addEventListener('hashchange', aggiorna);
