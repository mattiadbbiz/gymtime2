import { api, esc } from './api.js';
import { stato, app, rotta, pagina, attesa, toast } from './ui.js';
import { rxTesto, testoVariante, durata } from './regole.js';
import { ominoSVG } from './omino.js';
import { montaOmino3D } from './omino3d.js';
const righe = s => String(s || '').split('\n').filter(Boolean).map(x => `<p>${esc(x)}</p>`).join('');
const prescrizione = e => rxTesto(e.modalita, e.parametri) + (e.parametri?.rec ? ` · ${e.gruppo ? 'recupero dopo il giro' : 'recupero tra serie'} ${durata(e.parametri.rec)}` : '') + (e.parametri?.pausa ? ` · pausa nella superserie ${durata(e.parametri.pausa)}` : '');
rotta(/^\/scheda$/, async () => {
  attesa('Visiona');
  const { scheda: s } = await api('/api/allena');
  if (!s) return pagina({ titolo: 'Visiona', html: `<h1>Nessuna scheda</h1><p>${stato.io.ruolo === 'atleta' ? 'Il tuo coach non ti ha ancora assegnato una scheda.' : 'Creala dal Profilo, in Atleti, aprendo il tuo nome.'}</p>` });
  const dettagli = e => `${e.gruppo ? `<p class="tag gold">Superserie ${esc(e.gruppo)}</p>` : ''}<h3>${esc(e.nome)}</h3><p class="rx sm">${esc(prescrizione(e))}</p>${e.variante ? `<p>${esc(testoVariante(e.variante))}</p>` : ''}${e.tecnica?.tempo ? `<p>Tempo esecutivo: ${esc(e.tecnica.tempo)}</p>` : ''}${e.variazione ? `<p>${esc(e.variazione)}</p>` : ''}${e.nota ? `<p>Nota del coach: ${esc(e.nota)}</p>` : ''}${e.accorgimenti ? `<h4>Accorgimenti</h4>${righe(e.accorgimenti)}` : ''}`;
  pagina({ titolo: 'Visiona', html: `<div class="gt-scheda"><p class="gt-eyebrow">LA TUA SCHEDA</p><h1>${esc(s.nome)}</h1><p>Settimana ${s.settimana} di ${s.settimane}${s.scarico ? ' · Scarico' : ''}</p>${s.concluso ? '<p>Le settimane sono terminate: rimangono i valori dell’ultima settimana.</p>' : ''}${s.giorni.map(g => `<section class="card"><h2>${esc(g.nome)}</h2>${g.esercizi.map(e => `<article>${dettagli(e)}</article>`).join('')}</section>`).join('')}</div>`, barra: '<button class="btn primary" id="gt-pdf">Scarica PDF</button><button class="btn" id="gt-esporta">Esporta</button>' });
  document.getElementById('gt-pdf').onclick = () => window.print();
  document.getElementById('gt-esporta').onclick = async () => {
    const text = `${s.nome}\nSettimana ${s.settimana} di ${s.settimane}\n\n` + s.giorni.map(g => g.nome + '\n' + g.esercizi.map(e => `${e.nome}${e.gruppo ? ' [Superserie ' + e.gruppo + ']' : ''}: ${prescrizione(e)}\n${testoVariante(e.variante) || ''}${e.tecnica?.tempo ? '\nTempo: ' + e.tecnica.tempo : ''}\n${e.nota || ''}\n${e.accorgimenti || ''}`).join('\n')).join('\n\n');
    try {
      if (navigator.share) await navigator.share({ title: s.nome, text }); else {
        const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })), a = document.createElement('a');
        a.href = url;
        a.download = 'GymTime-scheda.txt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        toast('Scheda esportata in TXT');
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast('Condivisione non disponibile: usa Scarica PDF');
    }
  };
});
rotta(/^\/esercizi$/, async () => {
  attesa('Esercizi');
  const { esercizi: lib } = await api('/api/libreria'), gruppo = e => (e.muscolo || '').split(':')[0].trim(), gruppi = [...new Set(lib.map(gruppo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it'));
  pagina({ titolo: 'Esercizi', html: `<p class="gt-eyebrow">LA TUA LIBRERIA</p><h1>Prima impara.<br>Poi migliora.</h1><div class="gt-filtri"><label>Cerca<input id="gt-cerca" type="search" placeholder="Nome, attrezzo o sinonimo"></label><label>Gruppo muscolare<select id="gt-gruppo"><option value="">Tutti</option>${gruppi.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join('')}</select></label></div><p id="gt-conta" class="small muted" role="status"></p><ul class="gt-catalogo" id="gt-lista"></ul>` });
  const disegna = () => {
    const q = document.getElementById('gt-cerca').value.trim().toLocaleLowerCase('it'), g = document.getElementById('gt-gruppo').value;
    const lista = lib.filter(e => (!g || gruppo(e) === g) && (!q || [e.nome, e.attrezzo, e.muscolo, e.altri_nomi, e.famiglia].join(' ').toLocaleLowerCase('it').includes(q)));
    document.getElementById('gt-conta').textContent = `${lista.length} esercizi`;
    document.getElementById('gt-lista').innerHTML = lista.map(e => `<li><div class="mini">${ominoSVG(e.animazione)}</div><div><h3>${esc(e.nome)}</h3><p class="muted">${esc(e.muscolo || e.categoria || '')}</p></div><a class="btn" href="#/esercizi/${e.id}" aria-label="Impara ${esc(e.nome)}">Impara</a></li>`).join('') || '<li>Nessun esercizio trovato.</li>';
  };
  document.getElementById('gt-cerca').oninput = disegna;
  document.getElementById('gt-gruppo').onchange = disegna;
  disegna();
});
rotta(/^\/esercizi\/(\d+)$/, async id => {
  attesa('Impara', '#/esercizi');
  const { esercizi } = await api('/api/libreria'), e = esercizi.find(x => x.id === +id);
  if (!e) return pagina({ titolo: 'Impara', indietro: '#/esercizi', html: '<p>Esercizio non disponibile.</p>' });
  pagina({ titolo: 'Impara', indietro: '#/esercizi', html: `<p class="gt-eyebrow">IMPARA IL MOVIMENTO</p><h1>${esc(e.nome)}</h1><p class="small muted">${esc(e.attrezzo || '')}</p><div class="stage" id="gt-impara-stage"></div><div class="card"><h3>Muscoli coinvolti</h3><p>${esc(e.muscolo || 'Non specificati in libreria')}</p></div><div class="card"><h3>Esecuzione e accorgimenti</h3>${e.accorgimenti ? righe(e.accorgimenti) : '<p>Chiedi le indicazioni al coach prima di eseguire questo esercizio.</p>'}</div><section class="card" id="gt-ultime"><h3>Le ultime cinque volte</h3><p>Caricamento…</p></section>` });
  montaOmino3D(document.getElementById('gt-impara-stage'), e.animazione, { muscoli: e.muscolo });
  const box = document.getElementById('gt-ultime');
  try {
    const { ultime } = await api(`/api/esercizi/${id}/ultime`);
    if (!box.isConnected) return;
    const fatto = r => r.esito === 'non_fatto' ? 'Non fatto' : r.origine === 'cardio' ? `${r.effettivo.secondi ? durata(r.effettivo.secondi) : ''}${r.effettivo.metri ? ' · ' + r.effettivo.metri + ' m' : ''}${r.effettivo.calorie ? ' · ' + r.effettivo.calorie + ' cal' : ''}` : r.esito === 'modificato' ? rxTesto(r.esercizio.modalita, r.effettivo || {}) : rxTesto(r.esercizio.modalita, r.esercizio.parametri);
    box.innerHTML = '<h3>Le ultime cinque volte</h3>' + (ultime.length ? ultime.map(r => `<article style="padding:14px 0;border-bottom:1px solid var(--line)"><b>${esc(r.data)} · ${r.origine === 'cardio' ? 'Cardio' : 'Allenamento'}</b><p class="small muted">Previsto: ${esc(r.origine === 'cardio' ? 'Scelta libera' : rxTesto(r.esercizio.modalita, r.esercizio.parametri))}</p><p>Fatto: ${esc(fatto(r))}</p>${r.voto ? `<p>Voto ${r.voto}/10</p>` : ''}</article>`).join('') : '<p>Nessuna esecuzione registrata nelle sessioni completate. Gli elementi storici senza identificativo non vengono associati per nome.</p>');
  } catch (ex) {
    if (box.isConnected) box.innerHTML = `<h3>Le ultime cinque volte</h3><p>${esc(ex.message)}</p>`;
  }
});
