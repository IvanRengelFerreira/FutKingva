// Formato de un jugador en los listados y ficha de la API (plantilla, Ficha de jugador, Comparador, Equipo ideal).

import { teamSummary } from './teams.js';
import { teamMatch } from './matches.js';
import { countryName } from '../../shared/countries.js';

// Grupo de posición de la BD → texto en español (si el jugador no tiene posición detallada)
const POSITION_LABELS = {
  GOALKEEPER: 'Portero',
  DEFENDER: 'Defensa',
  MIDFIELDER: 'Centrocampista',
  FORWARD: 'Delantero',
};

// Pie hábil de la BD → texto en español para la cabecera de la ficha
const FOOT_LABELS = {
  LEFT: 'Zurdo',
  RIGHT: 'Diestro',
  BOTH: 'Ambidiestro',
};

export const VALID_POSITIONS = Object.keys(POSITION_LABELS);

// Orden de una plantilla: porteros, defensas, centrocampistas y delanteros
const POSITION_ORDER = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
const NO_NUMBER = 99; // Los que no tienen dorsal van al final de su posición

/**
 * Jugador con sus números de una temporada.
 * @param player fila de players
 * @param stats su fila de player_season_stats (o totales agregados) en esa temporada
 */
export function playerSummary(player, stats) {
  return {
    id: player.id,
    name: player.name,
    photoUrl: player.photo_url ?? null,
    number: player.shirt_number,
    position: positionLabel(player),
    positionGroup: player.position,
    matches: stats?.played ?? null,
    goals: stats?.goals ?? null,
    assists: stats?.assists ?? null,
    rating: stats?.rating != null ? Number(stats.rating) : null,
  };
}

/** Edad en años completos a partir de date_of_birth (en UTC, porque Prisma entrega DATE a medianoche UTC) */
export function ageFromBirthDate(dateOfBirth, now = new Date()) {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/** Datos personales y deportivos del jugador para GET /api/players/:id */
export function playerProfile(player) {
  return {
    id: player.id,
    name: player.name,
    fullName: fullNameOf(player),
    number: player.shirt_number,
    position: positionLabel(player),
    positionGroup: player.position,
    nationality: countryName(player.nationality), // En la BD va en inglés («France» → «Francia»)
    age: ageFromBirthDate(player.date_of_birth),
    heightCm: player.height_cm,
    foot: FOOT_LABELS[player.foot] ?? null,
    photoUrl: player.photo_url,
  };
}

/**
 * Forma de cada jugador en GET /api/players (reutilizada por 10 · Comparador y 11 · Equipo ideal):
 * { id, name, number, position, positionGroup, age, team, matches, minutes, goals, assists,
 *   xg, shotsOnTarget, passAccuracy, keyPasses, yellowCards, redCards, rating }
 * @param player fila de players con teams incluido
 * @param stats salida de aggregateSeasonStats (en camelCase) o null
 */
// team: el club que se enseña (por defecto el de ahora; en una temporada pasada, el de esa temporada)
export function playerListItem(player, stats, team = player.teams) {
  return {
    ...playerSummary(player, stats),
    age: ageFromBirthDate(player.date_of_birth),
    team: teamSummary(team),
    minutes: stats?.minutes ?? null,
    xg: stats?.xg ?? null,
    shotsOnTarget: stats?.shotsOnTarget ?? null,
    passAccuracy: stats?.passAccuracy ?? null,
    keyPasses: stats?.keyPasses ?? null,
    yellowCards: stats?.yellowCards ?? null,
    redCards: stats?.redCards ?? null,
  };
}

/**
 * Combina las filas de player_season_stats de un jugador en una temporada (puede tener varias si
 * cambió de club a mitad): suma totales y pondera porcentajes y valoración por minutos jugados
 * (si faltan minutos, pondera por partidos).
 */
export function aggregateSeasonStats(rows) {
  if (!rows || rows.length === 0) return null;

  return {
    played: rows.reduce((total, row) => total + (row.played ?? 0), 0),
    starts: sumOptional(rows, 'starts'),
    minutes: sumOptional(rows, 'minutes'),
    goals: rows.reduce((total, row) => total + (row.goals ?? 0), 0),
    assists: rows.reduce((total, row) => total + (row.assists ?? 0), 0),
    xg: sumDecimalOptional(rows, 'xg', 2),
    shotsOnTarget: sumOptional(rows, 'shots_on_target'),
    passAccuracy: weightedAverage(rows, 'pass_accuracy', 1),
    keyPasses: sumOptional(rows, 'key_passes'),
    yellowCards: sumOptional(rows, 'yellow_cards'),
    redCards: sumOptional(rows, 'red_cards'),
    rating: weightedRating(rows),
  };
}

/** Aparición del jugador en un partido, con rival y resultado vistos desde el club con el que jugó */
export function playerAppearance(appearance) {
  const match = teamMatch(appearance.matches, appearance.team_id);
  return {
    id: match.id,
    date: match.date,
    round: match.round,
    opponent: match.opponent,
    venue: match.venue,
    score: match.score,
    result: match.result,
    goals: appearance.goals,
    assists: appearance.assists,
    minutes: appearance.minutes,
    rating: appearance.rating != null ? Number(appearance.rating) : null,
  };
}

/** Para ordenar una plantilla: por posición, por dorsal y por nombre */
export function bySquadOrder(a, b) {
  return (
    positionIndex(a) - positionIndex(b) ||
    (a.number ?? NO_NUMBER) - (b.number ?? NO_NUMBER) ||
    a.name.localeCompare(b.name, 'es')
  );
}

function positionLabel(player) {
  return player.detailed_position || POSITION_LABELS[player.position] || null;
}

function fullNameOf(player) {
  return [player.first_name, player.last_name].filter(Boolean).join(' ') || player.name;
}

// Suma un campo entero opcional: devuelve null si ninguna fila trae dato (evita convertir «sin dato» en 0)
function sumOptional(rows, field) {
  const values = rows.map((row) => row[field]).filter((value) => value != null);
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) : null;
}

// Suma un Decimal opcional (p. ej. xG) convirtiendo de Prisma Decimal a Number redondeado
function sumDecimalOptional(rows, field, decimals) {
  const values = rows.map((row) => row[field]).filter((value) => value != null);
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + Number(value), 0);
  const factor = 10 ** decimals;
  return Math.round(total * factor) / factor;
}

// Media ponderada por minutos (o partidos si faltan minutos) para magnitudes intensivas (rating, % pase)
function weightedAverage(rows, field, decimals) {
  const valid = rows.filter((row) => row[field] != null);
  if (valid.length === 0) return null;
  const factor = 10 ** decimals;
  if (valid.length === 1) return Math.round(Number(valid[0][field]) * factor) / factor;

  const weights = valid.map((row) => row.minutes ?? row.played ?? 1);
  const weightSum = weights.reduce((total, w) => total + w, 0);
  const score = valid.reduce((total, row, i) => total + Number(row[field]) * weights[i], 0);
  const average = weightSum > 0 ? score / weightSum : score / valid.length;
  return Math.round(average * factor) / factor;
}

// Misma regla de ponderación que la CTE season_totals en controllers/players.js: mantener a la par
function weightedRating(rows) {
  return weightedAverage(rows, 'rating', 1);
}

function positionIndex(player) {
  const index = POSITION_ORDER.indexOf(player.positionGroup);
  return index === -1 ? POSITION_ORDER.length : index;
}
