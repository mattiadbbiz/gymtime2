// GymTime · regole condivise tra Worker e pagina (nessuna dipendenza dal browser)

export const MODALITA = {
  setrep: 'Serie × ripetizioni',
  emom: 'EMOM',
  amrap: 'AMRAP',
  tempo: 'Tenuta a tempo',
  rt: 'Ripetizioni totali (RT)',
  ladder: 'Scala (ladder)',
  free: 'Libero'
};

// Campi previsti dal coach per ogni modalità
export const CAMPI = {
  setrep: ['serie', 'rip', 'carico', 'rec'],
  emom: ['minuti', 'rip', 'carico'],
  amrap: ['minuti', 'carico'],
  tempo: ['serie', 'secondi', 'carico', 'rec'],
  rt: ['rip', 'minuti', 'carico'],
  ladder: ['da', 'a', 'passo', 'carico'],
  free: ['testo']
};
// Campi che l'atleta corregge con la penna
export const CAMPI_FATTI = {
  setrep: ['serie', 'rip', 'carico'],
  emom: ['minuti', 'rip', 'carico'],
  amrap: ['minuti', 'giri', 'carico'],
  tempo: ['serie', 'secondi', 'carico'],
  rt: ['rip', 'secondi_tot', 'carico'],
  ladder: ['da', 'a', 'carico'],
  free: ['testo']
};
export const ETICHETTE = {
  serie: 'Serie', rip: 'Ripetizioni', carico: 'Carico (kg)', rec: 'Recupero (s)', minuti: 'Minuti',
  secondi: 'Secondi', giri: 'Giri fatti', da: 'Da', a: 'A', passo: 'Passo', testo: 'Descrizione',
  secondi_tot: 'Tempo impiegato (s)'
};
export const etichetta = (campo, modalita) =>
  campo === 'rip' && modalita === 'emom' ? 'Rip. al minuto'
  : campo === 'rip' && modalita === 'rt' ? 'Ripetizioni totali'
  : campo === 'minuti' && modalita === 'rt' ? 'Tempo limite (min)'
  : ETICHETTE[campo] || campo;
// Campi che possono cambiare nella progressione settimanale
export const CAMPI_PROG = m => CAMPI[m].filter(c => c !== 'testo');

const num = v => { if (v === '' || v === null || v === undefined) return null; const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const fmtN = n => String(n).replace('.', ',');

export function pulisciParametri(modalita, p = {}) {
  const out = {};
  for (const c of [...new Set([...CAMPI[modalita] || [], ...CAMPI_FATTI[modalita] || []])]) {
    const v = p[c];
    if (v === undefined || v === null || v === '') continue;
    if (c === 'testo') { out.testo = String(v).slice(0, 300); continue; }
    if (c === 'rip' && /^\d+\s*[-–]\s*\d+$/.test(String(v))) { out.rip = String(v).replace(/\s/g, '').replace('–', '-'); continue; }
    const n = num(v); if (n !== null && n >= 0 && n < 100000) out[c] = n;
  }
  return out;
}

// Testo breve della prescrizione, per l'etichetta gialla
export function rxTesto(modalita, p = {}) {
  const kg = p.carico ? ` con ${fmtN(p.carico)} kg` : '';
  switch (modalita) {
    case 'setrep': return `${p.serie ?? '?'} × ${p.rip ?? '?'}${kg}`;
    case 'emom': return `EMOM ${p.minuti ?? '?'} min, ${p.rip ?? '?'} al minuto${kg}`;
    case 'amrap': return `AMRAP ${p.minuti ?? '?'} min${p.giri ? `, ${p.giri} giri` : ''}${kg}`;
    case 'tempo': return `${p.serie ?? 1} × ${p.secondi ?? '?'} s${kg}`;
    case 'rt': return `${p.rip ?? '?'} ripetizioni totali${p.minuti ? ` in max ${p.minuti} min` : ''}${p.secondi_tot ? ` in ${durata(p.secondi_tot)}` : ''}${kg}`;
    case 'ladder': return `Scala ${p.da ?? 1}→${p.a ?? '?'}${p.passo && p.passo !== 1 ? ` (passo ${p.passo})` : ''}${kg}`;
    default: return p.testo || 'Libero';
  }
}
export const durata = s => { s = Math.round(Number(s) || 0); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s} s`; };

// Tempo esecutivo: "3-1-1-0" → testo per i ragazzi
export function tempoTesto(t) {
  if (!t) return '';
  const u = String(t).toUpperCase().trim();
  const p = /[-\s/]/.test(u) ? u.split(/[-\s/]+/) : u.split('');
  if (p.length !== 4) return '';
  const s = v => v === 'X' ? 'esplosivo' : `${v} s`;
  const parti = [`frena in ${s(p[0])}`];
  if (p[1] !== '0') parti.push(`fermo ${s(p[1])}`);
  parti.push(p[2] === 'X' ? 'spingi o tira esplosivo' : `spingi o tira in ${s(p[2])}`);
  if (p[3] !== '0') parti.push(`fermo ${s(p[3])}`);
  return parti.join(' · ');
}

/* ---------- Progressione settimanale ---------- */
// progressione: {"2":{"carico":42.5},"3":{"serie":4}} — ogni valore resta valido dalle settimane successive
export function valoriSettimana(es, w) {
  const p = { ...(es.parametri || {}) };
  let tecnica = es.tecnica ? { ...es.tecnica } : null;
  const prog = es.progressione || {};
  for (let k = 2; k <= w; k++) {
    const d = prog[k] || prog[String(k)];
    if (!d) continue;
    for (const [c, v] of Object.entries(d)) {
      if (c === 'tempo') tecnica = { ...(tecnica || {}), tempo: v };
      else p[c] = v;
    }
  }
  return { parametri: p, tecnica };
}
// Differenze rispetto alla settimana prima, in parole
export function variazioni(es, w) {
  if (w < 2 || !es.progressione) return '';
  const a = valoriSettimana(es, w - 1).parametri, b = valoriSettimana(es, w).parametri;
  const out = [];
  for (const c of Object.keys(b)) {
    if (typeof b[c] !== 'number' || typeof a[c] !== 'number' || a[c] === b[c]) continue;
    const d = Math.round((b[c] - a[c]) * 100) / 100;
    const segno = d > 0 ? '+' : '−';
    const u = { carico: ' kg', secondi: ' s', minuti: ' min', rec: ' s di recupero' }[c] || ({ serie: ' serie', rip: ' rip.' }[c] || ` ${ETICHETTE[c] || c}`);
    out.push(`${segno}${fmtN(Math.abs(d))}${u}`);
  }
  return out.length ? `${out.join(', ')} rispetto alla settimana scorsa` : '';
}
export function settimanaDi(scheda, oggi) {
  const n = Math.max(1, Number(scheda.settimane) || 1);
  if (n === 1) return { settimana: 1, concluso: false };
  const inizio = scheda.inizio || lunedi(String(scheda.creata_il || oggi).slice(0, 10));
  const giorni = Math.floor((Date.parse(oggi + 'T12:00:00Z') - Date.parse(inizio + 'T12:00:00Z')) / 86400000);
  const w = Math.floor(giorni / 7) + 1;
  return { settimana: Math.max(1, Math.min(n, w)), concluso: w > n };
}
export function lunedi(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  const g = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - g);
  return d.toISOString().slice(0, 10);
}

/* ---------- Abbinamento alla libreria ---------- */
export const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const radice = w => w.length > 4 ? w.slice(0, -1) : w;
const nomiDi = x => [x.nome, ...String(x.altri_nomi || '').split(',')].map(norm).filter(Boolean);

export function trovaInLibreria(nome, lib) {
  const q = norm(nome); if (!q) return null;
  for (const x of lib) if (nomiDi(x).includes(q)) return x;
  const qt = q.split(' ').map(radice);
  let best = null, score = 0;
  for (const x of lib) for (const c of nomiDi(x)) {
    const ct = c.split(' ').map(radice);
    const comuni = qt.filter(t => ct.includes(t)).length;
    const sc = comuni / Math.max(qt.length, ct.length);
    if (sc > score) { score = sc; best = x; }
  }
  return score >= 0.6 ? best : null;
}

/* ---------- Lettura di una scheda scritta a parole ---------- */
const MAIUSC = s => s.charAt(0).toUpperCase() + s.slice(1);
export function leggiRiga(raw, lib = []) {
  let s = ' ' + raw.replace(/^[-•*·]\s*/, '').replace(/^\d+[.)]\s+/, '') + ' ';
  const r = { nome: '', modalita: 'free', parametri: {}, tecnica: null, nota: '' };
  const P = r.parametri;
  let m;
  const via = x => { s = s.replace(x, ' '); };
  if ((m = s.match(/\(([^)]*)\)/))) { r.nota = m[1].trim(); via(m[0]); }
  if ((m = s.match(/\b(?:tempo|tut)\s*[:=]?\s*([0-9xX])[-\s]?([0-9xX])[-\s]?([0-9xX])[-\s]?([0-9xX])\b/i))) { r.tecnica = { tempo: [m[1], m[2], m[3], m[4]].join('-').toUpperCase() }; via(m[0]); }
  if ((m = s.match(/\b(?:rec(?:upero)?|riposo|pausa)\s*[:=]?\s*(\d+)\s*(?:s|sec|secondi|"|″)?\b/i))) { P.rec = +m[1]; via(m[0]); }
  else if ((m = s.match(/\b(?:rec(?:upero)?|riposo|pausa)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:min|minuti|')/i))) { P.rec = Math.round(parseFloat(m[1].replace(',', '.')) * 60); via(m[0]); }
  if ((m = s.match(/(?:\+|@|con\s+)?\s*(\d+(?:[.,]\d+)?)\s*kg\b/i))) { P.carico = parseFloat(m[1].replace(',', '.')); via(m[0]); }
  if ((m = s.match(/\bemom\s*(\d+)\s*(?:minuti|min|['′])?/i))) {
    r.modalita = 'emom'; P.minuti = +m[1]; via(m[0]);
    const rm = s.match(/(\d+)\s*(?:rip\w*|reps?|al\s+minuto|\/\s*min|x)?\b/i); if (rm) { P.rip = +rm[1]; via(rm[0]); }
  } else if ((m = s.match(/\bamrap\s*(\d+)\s*(?:minuti|min|['′])?/i))) {
    r.modalita = 'amrap'; P.minuti = +m[1]; via(m[0]);
    const rest = s.replace(/^[\s:–-]+/, '').trim();
    if (/\d/.test(rest)) { r.nota = [rest, r.nota].filter(Boolean).join(', '); s = ' Circuito AMRAP '; }
  } else if ((m = s.match(/\b(\d+)\s+((?:[a-zà-ù'’-]+\s+){0,4}?)(?:rip\w*\s+|reps?\s+)?(?:totali|tot\.|in totale)\b(?:\s*(?:in|entro)\s*(?:max\s*)?(\d+)\s*(?:min|minuti|['′]))?/i))) {
    r.modalita = 'rt'; P.rip = +m[1]; if (m[3]) P.minuti = +m[3]; s = s.replace(m[0], ' ' + (m[2] || '') + ' ');
  } else if ((m = s.match(/\b(?:scala|ladder)\s*(\d+)\s*(?:→|->|-|a|fino a)\s*(\d+)/i)) || (m = s.match(/\b(1)(?:\s*-\s*\d+){3,}\s*-\s*(\d+)\b/))) {
    r.modalita = 'ladder'; P.da = +m[1]; P.a = +m[2]; P.passo = 1; via(m[0]);
  } else if ((m = s.match(/(\d+)\s*[x×*]\s*(\d+)\s*(?:s|sec|secondi|["″])(?=\W)/i))) {
    r.modalita = 'tempo'; P.serie = +m[1]; P.secondi = +m[2]; via(m[0]);
  } else if ((m = s.match(/(\d+)\s*(?:[x×*]|serie\s*(?:da|x|di))\s*(\d+(?:\s*[-–]\s*\d+)?)/i))) {
    r.modalita = 'setrep'; P.serie = +m[1]; P.rip = /[-–]/.test(m[2]) ? m[2].replace(/\s/g, '').replace('–', '-') : +m[2]; via(m[0]);
  } else if ((m = s.match(/(\d+)\s*(?:s|sec|secondi|["″])(?=\W)/i))) {
    r.modalita = 'tempo'; P.serie = 1; P.secondi = +m[1]; via(m[0]);
  }
  const nome = s.replace(/[:;,–]+/g, ' ').replace(/\s[x×-]\s/g, ' ')
    .replace(/\b(minuti|min|rip|reps|serie|al minuto|ripetizioni)\b/gi, ' ').replace(/\s+/g, ' ').trim().replace(/^-+|-+$/g, '').trim();
  const hit = trovaInLibreria(nome, lib);
  r.nome = hit ? hit.nome : MAIUSC(nome || 'Esercizio');
  r.esercizio_id = hit ? hit.id : null;
  if (r.modalita === 'free') { if (hit && hit.modalita_default && hit.modalita_default !== 'free') r.modalita = hit.modalita_default; if (r.nota) P.testo = r.nota; }
  return r;
}

export function leggiTesto(testo, lib = []) {
  const giorni = []; let cur = null;
  for (const line of String(testo).split('\n').map(l => l.trim()).filter(Boolean)) {
    const dm = line.match(/^#*\s*(giorno|day|g|seduta|allenamento|scheda)\s*([a-z]|\d+)\b\s*[:\-–.]?\s*(.*)$/i);
    if (dm || (/:$/.test(line) && !/\d/.test(line) && line.length < 40)) {
      cur = { nome: dm ? `Giorno ${dm[2].toUpperCase()}${dm[3] ? ' ' + dm[3] : ''}`.trim() : line.replace(/:$/, ''), esercizi: [] };
      giorni.push(cur); continue;
    }
    if (/^(settimana|week)\s*\d+/i.test(line)) continue;
    if (!cur) { cur = { nome: 'Giorno 1', esercizi: [] }; giorni.push(cur); }
    cur.esercizi.push(leggiRiga(line, lib));
  }
  return giorni.filter(g => g.esercizi.length);
}
