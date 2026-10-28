// GymTime · importazione di una scheda da file, foto, voce o testo
// File, foto e audio non vengono salvati: diventano testo, il testo diventa un'anteprima
// che il coach controlla e corregge nell'editor prima di salvare.
import { json, corpo, fallisci, richiedi, testo as pulisci } from './util.js';
import { leggiTesto, trovaInLibreria, pulisciParametri, MODALITA } from '../public/js/regole.js';

const MAX_FILE = 10 * 1024 * 1024;
const MAX_AUDIO = 12 * 1024 * 1024;
const MAX_FOTO = 10 * 1024 * 1024;
const MODELLO_TESTO = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
// Foto di una scheda (anche scritta a mano): un modello che legge le immagini la trascrive riga per riga.
// Se il primo non risponde si prova il secondo. Si cambiano qui, in un punto solo.
const MODELLI_FOTO = ['@cf/google/gemma-4-26b-a4b-it', '@cf/meta/llama-4-scout-17b-16e-instruct'];
const ISTRUZIONI_FOTO = `Trascrivi la scheda di allenamento che vedi nella foto, così com'è scritta, in italiano.
Regole:
- Una riga per esercizio, nello stesso ordine del foglio, con numeri e unità come scritti (es. "Squat 4x8 40 kg rec 90").
- Mantieni i titoli dei giorni o delle sezioni ("Giorno 1", "Lunedì", "A", "B") su una riga a sé.
- Se una parola non si legge, scrivi [?] al suo posto. Non inventare esercizi, numeri o note.
- Ignora nomi di persone, numeri di telefono, firme, loghi e tutto ciò che non è allenamento.
- Rispondi solo con la trascrizione, senza commenti.`;

function base64(buf) {
  const b = new Uint8Array(buf); let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
const serveAI = env => { if (!env.AI) fallisci(501, 'Workers AI non è collegato: aggiungi il blocco [ai] in wrangler.toml'); };

export async function daFile(request, env, io) {
  richiedi(io, 'admin', 'coach');
  const form = await request.formData().catch(() => fallisci(400, 'Carica un file'));
  const file = form.get('file');
  if (!file || typeof file === 'string') fallisci(400, 'Carica un file');
  if (file.size > MAX_FILE) fallisci(413, 'File troppo grande: massimo 10 MB');
  const nome = file.name || 'scheda';
  if (/\.(txt|md|csv|tsv)$/i.test(nome) || /^text\//.test(file.type)) {
    return json({ testo: (await file.text()).slice(0, 30000) });
  }
  serveAI(env);
  const buf = await file.arrayBuffer();
  if (isImmagine(file)) {
    const t = await trascriviFoto(env, buf, file.type);
    if (t) return json({ testo: t.slice(0, 30000), metodo: 'foto' });
  }
  const blob = new Blob([buf], { type: file.type || 'application/octet-stream' });
  const [r] = await env.AI.toMarkdown([{ name: nome, blob }]);
  if (!r || r.format === 'error') fallisci(422, `Non riesco a leggere questo file${r?.error ? `: ${r.error}` : ''}. Prova con PDF, Word, Excel o una foto nitida.`);
  const t = String(r.data || '').replace(/\n{3,}/g, '\n\n').trim();
  if (!t) fallisci(422, 'Il file sembra vuoto');
  return json({ testo: t.slice(0, 30000) });
}

const isImmagine = f => /^image\/(jpeg|png|webp)$/i.test(f.type || '') || /\.(jpe?g|png|webp)$/i.test(f.name || '');

// Testo della risposta, qualunque sia la forma restituita dal modello
function testoRisposta(r) {
  const t = typeof r?.response === 'string' ? r.response : r?.choices?.[0]?.message?.content ?? r?.result?.response ?? '';
  return String(Array.isArray(t) ? t.map(x => x?.text || '').join('') : t)
    .replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^```[a-z]*\n?|```$/gm, '').trim();
}

// La foto resta in memoria il tempo della trascrizione: non si salva da nessuna parte
async function trascriviFoto(env, buf, tipo) {
  const mime = /^image\/(jpeg|png|webp)$/i.test(tipo || '') ? tipo.toLowerCase() : 'image/jpeg';
  const url = `data:${mime};base64,${base64(buf)}`;
  for (const modello of MODELLI_FOTO) {
    try {
      const r = await env.AI.run(modello, {
        messages: [{ role: 'user', content: [{ type: 'text', text: ISTRUZIONI_FOTO }, { type: 'image_url', image_url: { url } }] }],
        max_tokens: 2048, temperature: 0.1
      });
      const t = testoRisposta(r).replace(/\n{3,}/g, '\n\n');
      if (t.replace(/\[\?\]/g, '').trim().length >= 3) return t;
    } catch (e) { console.log(`Trascrizione con ${modello} non riuscita:`, e?.message); }
  }
  return '';
}

// "Scatta foto": il telefono rimpicciolisce la foto prima dell'invio (meno dati, niente posizione GPS)
export async function daFoto(request, env, io) {
  richiedi(io, 'admin', 'coach');
  serveAI(env);
  const form = await request.formData().catch(() => fallisci(400, 'Scatta o scegli una foto'));
  const foto = form.get('foto');
  if (!foto || typeof foto === 'string') fallisci(400, 'Scatta o scegli una foto');
  if (!isImmagine(foto)) fallisci(415, 'Serve una foto in formato JPEG, PNG o WebP');
  if (foto.size > MAX_FOTO) fallisci(413, 'Foto troppo grande: massimo 10 MB');
  const t = await trascriviFoto(env, await foto.arrayBuffer(), foto.type);
  if (!t) fallisci(422, 'Non riesco a leggere la foto: riprova con più luce, foglio dritto e inquadrato tutto');
  return json({ testo: t.slice(0, 30000) });
}

export async function daAudio(request, env, io) {
  richiedi(io, 'admin', 'coach');
  serveAI(env);
  const form = await request.formData().catch(() => fallisci(400, 'Registrazione mancante'));
  const audio = form.get('audio');
  if (!audio || typeof audio === 'string') fallisci(400, 'Registrazione mancante');
  if (audio.size > MAX_AUDIO) fallisci(413, 'Registrazione troppo lunga: massimo circa 10 minuti');
  const buf = await audio.arrayBuffer();
  let testo = '';
  try {
    const r = await env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: base64(buf), language: 'it', vad_filter: true,
      initial_prompt: 'Scheda di allenamento: Giorno 1, trazioni 4 per 6, squat 4x8 con 40 kg, recupero 90 secondi, EMOM, AMRAP.' });
    testo = r?.text || '';
  } catch {
    const r = await env.AI.run('@cf/openai/whisper', { audio: [...new Uint8Array(buf)] });
    testo = r?.text || '';
  }
  testo = testo.trim();
  if (!testo) fallisci(422, 'Non ho capito la registrazione: riprova parlando più vicino al telefono');
  return json({ testo });
}

const SCHEMA = {
  type: 'object',
  properties: {
    giorni: { type: 'array', items: { type: 'object', properties: {
      nome: { type: 'string' },
      esercizi: { type: 'array', items: { type: 'object', properties: {
        nome: { type: 'string' }, modalita: { type: 'string', enum: Object.keys(MODALITA) },
        serie: { type: 'number' }, rip: { type: 'string' }, carico: { type: 'number' }, minuti: { type: 'number' },
        secondi: { type: 'number' }, metri: { type: 'number' }, calorie: { type: 'number' }, rec: { type: 'number' }, da: { type: 'number' }, a: { type: 'number' }, passo: { type: 'number' },
        tempo: { type: 'string' }, gruppo: { type: 'string' }, nota: { type: 'string' }
      }, required: ['nome', 'modalita'] } }
    }, required: ['nome', 'esercizi'] } }
  },
  required: ['giorni']
};

function istruzioni(nomi) {
  return `Sei l'assistente di un coach italiano. Trasforma il testo in una scheda di allenamento in JSON.
Regole:
- Dividi per giorni ("Giorno 1", "Giorno 2"...). Se non ci sono giorni, usa un solo "Giorno 1".
- modalita: setrep (serie × ripetizioni), emom (minuti, rip al minuto), amrap (minuti; il contenuto del circuito va in nota), tempo (tenuta: serie e secondi), rt (ripetizioni totali, eventuale tempo limite in minuti), ladder (scala: da, a, passo), cardio (macchine cardio, corde, slitta, farmer: serie, metri o calorie, secondi per il tempo, carico, rec), free (tutto il resto, descrizione in nota).
- rip è una stringa: "8" oppure un intervallo "8-10". carico in kg, rec in secondi.
- tempo esecutivo nel formato "3-1-1-0" (eccentrica-fermo-concentrica-fermo; X = esplosivo) solo se scritto nel testo.
- gruppo: stessa lettera (A, B...) per esercizi in superserie o circuito, altrimenti vuoto.
- nota: indicazioni del coach per quell'esercizio (elastico, presa, per gamba...). Non inventare nulla.
- Usa il nome esatto di questa libreria quando l'esercizio corrisponde, altrimenti il nome scritto dal coach:
${nomi.join('; ')}`;
}

function normalizzaAI(dati, lib) {
  const giorni = Array.isArray(dati?.giorni) ? dati.giorni : [];
  return giorni.slice(0, 14).map((g, i) => ({
    nome: pulisci(g.nome, 60) || `Giorno ${i + 1}`,
    esercizi: (Array.isArray(g.esercizi) ? g.esercizi : []).slice(0, 40).map(e => {
      const modalita = MODALITA[e.modalita] ? e.modalita : 'free';
      const hit = trovaInLibreria(e.nome, lib);
      const p = pulisciParametri(modalita, { ...e, testo: modalita === 'free' ? e.nota : undefined });
      return {
        nome: hit ? hit.nome : (pulisci(e.nome, 80) || 'Esercizio'), esercizio_id: hit ? hit.id : null,
        modalita, parametri: p, tecnica: e.tempo && /^[0-9xX]-[0-9xX]-[0-9xX]-[0-9xX]$/.test(e.tempo.trim()) ? { tempo: e.tempo.trim().toUpperCase() } : null,
        nota: modalita === 'free' ? '' : pulisci(e.nota, 600), gruppo: pulisci(e.gruppo, 4).toUpperCase() || null
      };
    })
  })).filter(g => g.esercizi.length);
}

export async function analizza(request, env, io) {
  richiedi(io, 'admin', 'coach');
  const d = await corpo(request);
  const t = String(d.testo || '').trim().slice(0, 20000);
  if (!t) fallisci(400, 'Scrivi o incolla la scheda');
  const { results: lib } = await env.DB.prepare(
    'SELECT id, nome, altri_nomi, modalita_default FROM libreria_esercizi WHERE creato_da IS NULL OR creato_da = ?'
  ).bind(io.id).all();
  let giorni = null, metodo = 'regole';
  if (env.AI && d.metodo !== 'regole') {
    try {
      const r = await env.AI.run(MODELLO_TESTO, {
        messages: [{ role: 'system', content: istruzioni(lib.map(x => x.nome)) }, { role: 'user', content: t }],
        response_format: { type: 'json_schema', json_schema: SCHEMA },
        max_tokens: 4096, temperature: 0.1
      });
      const out = typeof r?.response === 'string' ? JSON.parse(r.response.replace(/^```json|```$/g, '').trim()) : r?.response;
      const g = normalizzaAI(out, lib);
      if (g.length) { giorni = g; metodo = 'ai'; }
    } catch (e) { console.log('Import con AI non riuscito, uso le regole:', e?.message); }
  }
  if (!giorni) giorni = leggiTesto(t, lib);
  if (!giorni.length) fallisci(422, 'Non ho trovato esercizi nel testo');
  const nonTrovati = giorni.flatMap(g => g.esercizi.filter(e => !e.esercizio_id).map(e => e.nome));
  return json({ giorni, metodo, non_trovati: [...new Set(nonTrovati)] });
}
