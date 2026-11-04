// Formato de cifras de la ficha de jugador: lo que falta se escribe «—», nunca se rompe la página.
export const MISSING = '—';

// 1.5 → «1,5» · undefined → «—»
export function formatNumber(value, decimals = 0) {
  if (value == null || Number.isNaN(value)) return MISSING;
  return value.toFixed(decimals).replace('.', ',');
}

// 91 → «91 %»
export function formatPercent(value) {
  return value == null ? MISSING : `${value} %`;
}

// «3-0» → «3 – 0»
export function formatScore(score) {
  return score ? score.replace('-', ' – ') : MISSING;
}
