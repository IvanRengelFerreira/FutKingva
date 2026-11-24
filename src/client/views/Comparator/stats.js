// Estadísticas del comparador (10 · Comparador): qué filas salen en la tabla, cómo se escriben
// y cuál es el mejor valor de cada una (la corona). Solo usa datos reales disponibles en la BD.

import { shortPlayerName } from '../../../shared/players.js';

export { MIN_PLAYERS, MAX_PLAYERS } from '../../../shared/validation/comparisons.js';

export const MISSING = '—';

// best: 'max' (gana el más alto), 'min' (gana el más bajo, p. ej. tarjetas) o null (sin corona)
// perMatch: en «Por partido» se divide entre los partidos jugados
export const STATS = [
  { id: 'matches', label: 'Partidos', best: null },
  { id: 'minutes', label: 'Minutos', best: null, perMatch: true },
  { id: 'goals', label: 'Goles', best: 'max', perMatch: true },
  { id: 'assists', label: 'Asistencias', best: 'max', perMatch: true },
  { id: 'cards', label: 'Tarjetas', best: 'min', perMatch: true },
  { id: 'rating', label: 'Valoración media', best: 'max', decimals: 1 },
];

// Ejes del radar con los datos disponibles en la BD (sin valoración, que es NULL en toda la BD); siempre totales
export const RADAR_AXES = [
  { id: 'matches', label: 'Partidos', max: 38 },
  { id: 'minutes', label: 'Minutos', max: 3420 },
  { id: 'goals', label: 'Goles', max: 25 },
  { id: 'assists', label: 'Asistencias', max: 15 },
  { id: 'cards', label: 'Tarjetas', max: 15 },
];

export const MODES = [
  { value: 'totals', label: 'Totales' },
  { value: 'perMatch', label: 'Por partido' },
];

// Valor bruto del jugador en la estadística (tarjetas suma amarillas + rojas; null si falta el dato)
function rawStatValue(player, statId) {
  if (statId === 'cards') {
    if (player.yellowCards == null && player.redCards == null) return null;
    return (player.yellowCards ?? 0) + (player.redCards ?? 0);
  }
  return player[statId] ?? null;
}

// Valor de un jugador en una estadística, según el modo (null si el dato no está en la BD)
export function statValue(player, stat, mode) {
  const value = rawStatValue(player, stat.id);
  if (value == null) return null;
  if (mode === 'perMatch' && stat.perMatch) {
    // Sin partidos jugados no hay promedio por partido
    return player.matches ? value / player.matches : null;
  }
  return value;
}

// «4,0» · en «Por partido», con dos decimales (los minutos, sin decimales)
export function formatStat(value, stat, mode) {
  if (value == null) return MISSING;
  let decimals = stat.decimals ?? 0;
  if (mode === 'perMatch' && stat.perMatch) decimals = stat.id === 'minutes' ? 0 : 2;
  return value.toFixed(decimals).replace('.', ',');
}

// Índices de los jugadores con el mejor valor (pueden empatar). Sin corona si todos empatan.
// Se comparan las cifras tal como se ven (redondeadas a 2 decimales): 0,033 y 0,025 salen las dos «0,03» y empatan.
export function bestIndexes(rawValues, best) {
  const values = rawValues.map((value) => (value == null ? null : Math.round(value * 100) / 100));
  const known = values.filter((value) => value != null);
  if (!best || known.length < 2) return [];
  const target = best === 'max' ? Math.max(...known) : Math.min(...known);
  const winners = values.flatMap((value, i) => (value === target ? [i] : []));
  return winners.length === known.length ? [] : winners;
}

// Escala del radar: amplía el máximo de un eje si algún jugador comparado supera el tope habitual
export function radarAxesFor(players) {
  return RADAR_AXES.map((axis) => {
    const highest = Math.max(axis.max, ...players.map((player) => rawStatValue(player, axis.id) ?? 0));
    return highest > axis.max ? { ...axis, max: highest } : axis;
  });
}

// Valores para el radar: si falta un dato, el punto va al centro del eje
export function radarValues(player) {
  return Object.fromEntries(RADAR_AXES.map((axis) => [axis.id, rawStatValue(player, axis.id) ?? 0]));
}

// Nombre corto para la tabla y el radar: «Jude Bellingham» → «Bellingham»; «Pedri» y «Vinícius Jr.» se quedan igual
export const compactName = (player) => shortPlayerName(player.name);

// «FC Barcelona · Centrocampista» (solo las partes que existen; vacío si faltan las dos)
export function playerMeta(player) {
  return [player.team?.name, player.position].filter(Boolean).join(' · ');
}
