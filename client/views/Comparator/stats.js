// Estadísticas del comparador (10 · Comparador): qué filas salen en la tabla, cómo se escriben
// y cuál es el mejor valor de cada una (la corona).

// best: 'max' (gana el más alto), 'min' (gana el más bajo, p. ej. tarjetas) o null (sin corona)
// perMatch: en «Por partido» se divide entre los partidos jugados
export const STATS = [
  { id: 'matches', label: 'Partidos', best: null },
  { id: 'minutes', label: 'Minutos', best: null, perMatch: true },
  { id: 'goals', label: 'Goles', best: 'max', perMatch: true },
  { id: 'assists', label: 'Asistencias', best: 'max', perMatch: true },
  { id: 'xg', label: 'xG', best: 'max', perMatch: true, decimals: 1 },
  { id: 'shotsOnTarget', label: 'Tiros a puerta', best: 'max', perMatch: true },
  { id: 'passAccuracy', label: 'Pases completados %', best: 'max', suffix: ' %' },
  { id: 'cards', label: 'Tarjetas', best: 'min', perMatch: true },
  { id: 'rating', label: 'Valoración media', best: 'max', decimals: 1 },
];

// Ejes del radar (los mismos del mockup); siempre con los totales de la temporada
export const RADAR_AXES = [
  { id: 'goals', label: 'Goles', max: 8 },
  { id: 'assists', label: 'Asistencias', max: 6 },
  { id: 'xg', label: 'xG', max: 8 },
  { id: 'shotsOnTarget', label: 'Tiros', max: 20 },
  { id: 'passAccuracy', label: 'Pase %', min: 50, max: 100 },
  { id: 'rating', label: 'Valoración', min: 5, max: 9 },
];

export const MODES = [
  { value: 'totals', label: 'Totales' },
  { value: 'perMatch', label: 'Por partido' },
];

export const MAX_PLAYERS = 4;

// Valor de un jugador en una estadística, según el modo (null si el dato no está en mockData.js)
export function statValue(player, stat, mode) {
  const value = player[stat.id];
  if (value == null) return null;
  if (mode === 'perMatch' && stat.perMatch) return player.matches ? value / player.matches : 0;
  return value;
}

// «4,0» · «91 %» · en «Por partido», con dos decimales (los minutos, sin decimales)
export function formatStat(value, stat, mode) {
  if (value == null) return '—';
  let decimals = stat.decimals ?? 0;
  if (mode === 'perMatch' && stat.perMatch) decimals = stat.id === 'minutes' ? 0 : 2;
  return value.toFixed(decimals).replace('.', ',') + (stat.suffix ?? '');
}

// Índices de los jugadores con el mejor valor (pueden empatar). Sin corona si todos empatan.
export function bestIndexes(values, best) {
  const known = values.filter((value) => value != null);
  if (!best || known.length < 2) return [];
  const target = best === 'max' ? Math.max(...known) : Math.min(...known);
  const winners = values.flatMap((value, i) => (value === target ? [i] : []));
  return winners.length === known.length ? [] : winners;
}

// Valores para el radar: si falta un dato, el punto va al centro del eje
export function radarValues(player) {
  return Object.fromEntries(RADAR_AXES.map((axis) => [axis.id, player[axis.id] ?? axis.min ?? 0]));
}

// Nombre corto para la tabla y el radar: «Jude Bellingham» → «Bellingham»; «Pedri» y «Vinícius Jr.» se quedan igual
export function compactName(player) {
  if (player.shortName) return player.shortName;
  const words = player.name.split(' ');
  return words.length === 1 || player.name.endsWith('.') ? player.name : words.at(-1);
}
