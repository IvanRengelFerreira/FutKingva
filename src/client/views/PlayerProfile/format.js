// Formato de cifras de la ficha de jugador: lo que falta se escribe «—», nunca se rompe la página.
export const MISSING = '—';

// 1.5 → «1,5» · undefined → «—»
export function formatNumber(value, decimals = 0) {
  if (value == null || Number.isNaN(value)) return MISSING;
  return value.toFixed(decimals).replace('.', ',');
}

// 91 → «91 %» · 94.4 → «94 %» · undefined → «—»
export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return MISSING;
  return `${Math.round(value)} %`;
}

// 174 → «1,74 m»
export function formatHeight(heightCm) {
  return heightCm != null ? `${(heightCm / 100).toFixed(2).replace('.', ',')} m` : null;
}

// 3 → «3.º en LaLiga»
export function formatRank(rank) {
  return rank != null ? `${rank}.º en LaLiga` : null;
}

// [3, 0] → «3 – 0»
export function formatScore(score) {
  return Array.isArray(score) && score.length === 2 ? `${score[0]} – ${score[1]}` : MISSING;
}
