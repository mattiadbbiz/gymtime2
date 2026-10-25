// GymTime · mobilità e stretching: valori condivisi tra Worker e sito

export const ZONE = {
  collo: 'Collo', spalle: 'Spalle', torace: 'Torace', dorsale: 'Dorsale', lombare: 'Lombare',
  anche: 'Anche', glutei: 'Glutei', adduttori: 'Adduttori', quadricipiti: 'Quadricipiti', femorali: 'Femorali',
  caviglie: 'Caviglie e polpacci', polsi: 'Polsi e avambracci', corpo: 'Tutto il corpo'
};
export const TIPI = { mobilita: 'Mobilità articolare', dinamico: 'Stretching dinamico', statico: 'Stretching statico', respirazione: 'Respirazione' };
export const ATTREZZI = { corpo_libero: 'Corpo libero', bastone: 'Bastone' };
export const LIVELLI = { 1: 'Base', 2: 'Intermedio', 3: 'Avanzato' };

export const DURATE_PREDEFINITE = [10, 15, 20, 30];
export const DURATA_MIN = 5;
export const DURATA_MAX = 60;

// Durate proposte: minuti interi tra 5 e 60, senza doppioni, in ordine, al massimo 6
export function pulisciDurate(v) {
  const lista = (Array.isArray(v) ? v : []).map(Number).filter(n => Number.isInteger(n) && n >= DURATA_MIN && n <= DURATA_MAX);
  return [...new Set(lista)].sort((a, b) => a - b).slice(0, 6);
}

// Tempi per stimare la durata, in secondi. Provvisori: si confermano con le regole del generatore.
export const TEMPI = { secondiRip: 3, cambioLato: 5, pausaSerie: 10, cambioEsercizio: 10 };

// Durata di un esercizio: lavoro di ogni serie, cambio lato se va fatto per lato, pause tra le serie
export function secondiEsercizio(e) {
  const unaVolta = e.misura === 'ripetizioni' ? e.valore * TEMPI.secondiRip : e.valore;
  const lati = e.per_lato ? 2 : 1;
  const serie = Math.max(1, e.serie || 1);
  return unaVolta * lati * serie + (lati - 1) * TEMPI.cambioLato * serie + (serie - 1) * TEMPI.pausaSerie;
}

// Durata della sessione: esercizi più i cambi tra un esercizio e l'altro
export function durataPiano(esercizi) {
  if (!esercizi.length) return 0;
  return esercizi.reduce((s, e) => s + secondiEsercizio(e), 0) + (esercizi.length - 1) * TEMPI.cambioEsercizio;
}

// Dose leggibile: "30 s per lato", "2 × 10 rip"
export function doseTesto(e) {
  const base = e.misura === 'ripetizioni' ? `${e.valore} rip` : `${e.valore} s`;
  return `${e.serie > 1 ? `${e.serie} × ` : ''}${base}${e.per_lato ? ' per lato' : ''}`;
}
