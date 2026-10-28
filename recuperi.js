export function modificaFineRecupero(fine, delta, adesso = Date.now()) {
  return adesso + Math.max(0, Math.max(0, (Number(fine) || adesso) - adesso) + delta * 1000);
}
export function pausaCambio(es, i, esito) {
  const e = es[i], p = es[i + 1];
  if (esito === 'non_fatto' || !e || !p || e.gruppo || p.gruppo) return null;
  return { da: e.rif, a: p.rif, secondi: Math.max(0, Number(e.parametri?.rec) || 0) + 60, fine: null };
}
