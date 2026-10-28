import { api, esc } from './api.js';
import { stato, rotta, pagina, attesa, toast, vai, chiedi } from './ui.js';
rotta(/^\/cardio$/, async () => {
  attesa('Cardio');
  const d = await api('/api/cardio');
  pagina({ titolo: 'Cardio', html: `<p class="gt-eyebrow">SESSIONE LIBERA</p><h1>Il tuo ritmo.</h1><p class="hint">Scegli fino a 12 esercizi. La data si fissa all’avvio; puoi salvare una bozza e riprenderla.</p>${d.aperta ? `<div class="card"><h3>Sessione aperta</h3><p>${esc(d.aperta.data)}</p><a class="btn primary" href="#/cardio/s/${d.aperta.id}">Riprendi</a></div>` : ''}<div class="gt-filtri"><label>Cerca<input id="cardio-cerca" type="search" placeholder="Nome esercizio"></label></div><form id="cardio-scelta">${d.esercizi.map(e => `<label class="gt-cardio-check" data-nome="${esc(e.nome.toLocaleLowerCase('it'))}"><input type="checkbox" name="esercizio" value="${e.id}" ${d.aperta ? 'disabled' : ''}>${esc(e.nome)}</label>`).join('') || '<p>Nessun esercizio cardio disponibile in libreria.</p>'}</form>`, barra: !d.aperta && d.esercizi.length ? '<button class="btn primary grow" id="cardio-avvia">Avvia cardio</button>' : '' });
  document.getElementById('cardio-cerca').oninput = e => document.querySelectorAll('[data-nome]').forEach(x => x.hidden = !x.dataset.nome.includes(e.target.value.toLocaleLowerCase('it')));
  const b = document.getElementById('cardio-avvia');
  if (b) b.onclick = async () => {
    const ids = [...document.querySelectorAll('[name="esercizio"]:checked')].map(x => +x.value);
    if (!ids.length || ids.length > 12) return toast('Scegli da 1 a 12 esercizi');
    b.disabled = true;
    try {
      const r = await api('/api/cardio/sessioni', { metodo: 'POST', dati: { esercizi: ids } });
      vai(`#/cardio/s/${r.id}`);
    } catch (e) {
      toast(e.message);
      b.disabled = false;
    }
  };
});
rotta(/^\/cardio\/s\/(\d+)$/, async id => {
  attesa('Cardio', '#/cardio');
  const { sessione: s } = await api(`/api/cardio/sessioni/${id}`);
  if (s.utente_id !== stato.io.id) return vai('#/');
  const chiusa = s.stato === 'completata';
  pagina({ titolo: chiusa ? 'Cardio salvato' : 'Sessione cardio', indietro: '#/cardio', html: `<p class="gt-eyebrow">${esc(s.data)}</p><h1>${chiusa ? 'Sessione salvata' : 'Come è andata?'}</h1><p class="hint">Durata in minuti, anche decimali. Metri e calorie dell’attrezzo sono facoltativi.</p><form id="cardio-form">${s.piano.esercizi.map(e => {
      const v = s.esiti[e.rif] || {};
      return `<fieldset class="card"><legend>${esc(e.nome)}</legend><p class="small">${esc(e.accorgimenti || '')}</p><a href="#/esercizi/${e.id}" class="link">Impara</a><label>Esito<select name="esito-${e.rif}" ${chiusa ? 'disabled' : ''}><option value="fatto">Fatto</option><option value="non_fatto" ${v.esito === 'non_fatto' ? 'selected' : ''}>Non fatto</option></select></label>${[['minuti', 'Durata in minuti', v.secondi ? v.secondi / 60 : '', 720], ['metri', 'Metri, facoltativi', v.metri || '', 500000], ['calorie', 'Calorie dell’attrezzo, facoltative', v.calorie || '', 10000]].map(([k, t, val, max]) => `<label>${t}<input name="${k}-${e.rif}" type="number" inputmode="decimal" min="0.01" max="${max}" step="any" value="${val}" ${chiusa ? 'disabled' : ''}></label>`).join('')}</fieldset>`;
    }).join('')}<p class="err" id="cardio-errore" role="alert"></p></form>${!chiusa ? '<button class="link danger" id="cardio-elimina">Elimina sessione aperta</button>' : ''}`, barra: chiusa ? '<a class="btn primary" href="#/storico">Vedi lo storico</a>' : '<button class="btn" id="cardio-bozza">Salva bozza</button><button class="btn primary grow" id="cardio-completa">Completa</button>'
  });
  if (chiusa) return;
  const f = document.getElementById('cardio-form');
  f.onsubmit = e => e.preventDefault();
  const abilita = () => s.piano.esercizi.forEach(e => {
    for (const k of ['minuti', 'metri', 'calorie']) f.elements[`${k}-${e.rif}`].disabled = f.elements[`esito-${e.rif}`].value === 'non_fatto';
  });
  f.onchange = abilita;
  abilita();
  const salva = async fine => {
    const esiti = {};
    for (const e of s.piano.esercizi) {
      const x = { esito: f.elements[`esito-${e.rif}`].value };
      if (x.esito === 'fatto') for (const k of ['minuti', 'metri', 'calorie']) {
        const raw = f.elements[`${k}-${e.rif}`].value.trim();
        if (raw) x[k === 'minuti' ? 'secondi' : k] = Number(raw.replace(',', '.')) * (k === 'minuti' ? 60 : 1);
      }
      esiti[e.rif] = x;
    }
    const bottoni = [document.getElementById('cardio-bozza'), document.getElementById('cardio-completa')];
    bottoni.forEach(b => b.disabled = true);
    try {
      await api(`/api/cardio/sessioni/${id}${fine ? '/completa' : ''}`, { metodo: fine ? 'POST' : 'PUT', dati: { esiti } });
      if (fine) {
        toast('Cardio salvato');
        vai('#/storico');
      } else toast('Bozza salvata');
    } catch (e) {
      document.getElementById('cardio-errore').textContent = e.message;
    } finally {
      bottoni.forEach(b => b.disabled = false);
    }
  };
  document.getElementById('cardio-bozza').onclick = () => salva(false);
  document.getElementById('cardio-completa').onclick = () => salva(true);
  document.getElementById('cardio-elimina').onclick = async () => {
    if (!await chiedi({ titolo: 'Eliminare la sessione aperta?', testo: 'Si cancellano anche gli eventuali risultati salvati.', ok: 'Elimina', pericolo: true })) return;
    try {
      await api(`/api/cardio/sessioni/${id}`, { metodo: 'DELETE' });
      vai('#/cardio');
    } catch (e) {
      toast(e.message);
    }
  };
});
