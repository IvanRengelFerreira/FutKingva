// Qué pasa cuando cambia un partido (RF6, RF9). Lo usan el simulador de la demo
// (realtime/matchSimulator.js) y la sincronización con football-data (sync/matches.js):
//   1. se avisa a todos del marcador nuevo (match:update / match:finished),
//   2. se guardan avisos para quien sigue a alguno de los dos equipos y se le envían a su sala,
//   3. solo con datos reales: al terminar partidos, se envía una vez la clasificación nueva
//      (standings:update). Los partidos simulados nunca cuentan en la clasificación.
// La clasificación se recalcula donde se guarda el partido (en su misma transacción), no aquí.

import { prisma } from '../db.js';
import { MATCH_TEAMS, matchSummary } from '../utils/matches.js';
import { standingRow } from '../utils/standings.js';
import { TEAM_SUMMARY_FIELDS } from '../utils/teams.js';
import { notificationRow, notificationText } from '../utils/notifications.js';
import { emitToAll, emitToUser } from './socket.js';

// La sincronización solo avisa de partidos de las últimas horas (no de jornadas atrasadas)
const RECENT_MATCH_MS = 6 * 60 * 60 * 1000;
const NOT_STARTED = ['SCHEDULED', 'TIMED'];
const LIVE_STATUSES = ['IN_PLAY', 'PAUSED'];

/** Partido con sus dos equipos (lo que necesitan matchSummary y los textos de los avisos) */
export function findMatchWithTeams(matchId) {
  return prisma.matches.findUnique({ where: { id: matchId }, include: MATCH_TEAMS });
}

const homeTeam = (match) => match.teams_matches_home_team_idToteams;
const awayTeam = (match) => match.teams_matches_away_team_idToteams;

/** «Espanyol 0 – 1 Atlético» */
export function scoreLine(match) {
  return `${homeTeam(match).short_name} ${match.home_goals ?? 0} – ${match.away_goals ?? 0} ${awayTeam(match).short_name}`;
}

/** Usuarios activos que siguen a alguno de esos equipos (sin repetir) */
async function followerIds(teamIds) {
  const rows = await prisma.favorite_teams.findMany({
    where: { team_id: { in: teamIds }, users: { status: 'ACTIVE' } },
    select: { user_id: true },
    distinct: ['user_id'],
  });
  return rows.map((row) => row.user_id);
}

/**
 * Guarda un aviso para cada seguidor de esos equipos y se lo envía en directo.
 * @param {bigint[]} teamIds
 * @param {{ type: string, title: string, detail?: string, link?: string, matchId?: bigint }} notice
 */
export async function notifyFollowers(teamIds, { type, title, detail, link, matchId }) {
  const userIds = await followerIds(teamIds);
  if (!userIds.length) return;

  const rows = await prisma.notifications.createManyAndReturn({
    data: userIds.map((userId) => ({
      user_id: userId,
      type,
      text: notificationText(title, detail),
      link: link ?? null,
      match_id: matchId ?? null,
    })),
  });
  for (const row of rows) emitToUser(row.user_id, 'notification:new', notificationRow(row));
}

/** Puesto de cada equipo en la clasificación de la temporada (Map team_id → posición) */
export async function standingPositions(seasonId) {
  const rows = await prisma.standings.findMany({
    where: { season_id: seasonId },
    select: { team_id: true, position: true },
  });
  return new Map(rows.map((row) => [row.team_id, row.position]));
}

async function standingsTable(seasonId) {
  const rows = await prisma.standings.findMany({
    where: { season_id: seasonId },
    orderBy: { position: 'asc' },
    include: { teams: { select: TEAM_SUMMARY_FIELDS } },
  });
  return rows.map(standingRow);
}

/** Marcador o minuto nuevo para todos. lastEvent: { type, minute, teamId, playerName } o null */
export function publishMatchUpdate(match, lastEvent = null) {
  emitToAll('match:update', { match: matchSummary(match), lastEvent });
}

/** Empieza un partido: marcador para todos y aviso a los seguidores de los dos equipos */
export async function publishMatchStarted(match) {
  publishMatchUpdate(match);
  await notifyFollowers([match.home_team_id, match.away_team_id], {
    type: 'MATCH_START',
    title: `Empieza el ${homeTeam(match).short_name} – ${awayTeam(match).short_name}`,
    detail: 'Sigue el partido en directo en Inicio',
    link: '/',
    matchId: match.id,
  });
}

/**
 * Gol: marcador para todos y aviso a los seguidores de los dos equipos.
 * @param {object} match partido ya con el gol sumado (findMatchWithTeams)
 * @param {{ minute?: number | null, teamId: bigint, playerName?: string }} goal sin minuto, el aviso no lo pone
 */
export async function publishGoal(match, { minute, teamId, playerName }) {
  publishMatchUpdate(match, { type: 'GOAL', minute: minute ?? null, teamId, playerName: playerName ?? null });
  const scorer = teamId === match.home_team_id ? homeTeam(match) : awayTeam(match);
  const who = playerName ? `¡Gol de ${playerName}!` : `¡Gol del ${scorer.short_name}!`;
  await notifyFollowers([match.home_team_id, match.away_team_id], {
    type: 'GOAL',
    title: minute ? `${who} · ${minute}'` : who,
    detail: scoreLine(match),
    link: '/',
    matchId: match.id,
  });
}

/**
 * Final del partido: resultado para todos y aviso del final a los seguidores de los dos equipos.
 * La clasificación va aparte (publishStandingsChange), porque los partidos simulados no cuentan en ella.
 * @param {object} match partido terminado (findMatchWithTeams)
 */
export async function publishMatchFinished(match) {
  // simulated: el front no lo pasa a «Últimos resultados» (los simulados nunca cuentan como resultado)
  emitToAll('match:finished', { match: matchSummary(match), simulated: match.is_simulated });
  await notifyFollowers([match.home_team_id, match.away_team_id], {
    type: 'MATCH_END',
    title: `Final: ${scoreLine(match)}`,
    detail: 'Resultado definitivo',
    link: '/',
    matchId: match.id,
  });
}

/**
 * Clasificación nueva para todos (una sola vez) y, a los seguidores de cada equipo que cambia de puesto,
 * un aviso con el puesto nuevo. Solo la usa la sincronización real, con la clasificación ya recalculada.
 * @param {bigint} seasonId
 * @param {Map<bigint, number>} positionsBefore puestos antes de recalcular (standingPositions)
 * @param {{ id: bigint, short_name: string }[]} teams equipos de los partidos que han terminado
 */
async function publishStandingsChange(seasonId, positionsBefore, teams) {
  const standings = await standingsTable(seasonId);
  emitToAll('standings:update', { seasonId, standings });

  for (const team of teams) {
    const before = positionsBefore.get(team.id);
    const row = standings.find((item) => item.teamId === team.id);
    if (!before || !row || before === row.position) continue;
    await notifyFollowers([team.id], {
      type: 'STANDINGS',
      title: `El ${team.short_name} ${row.position < before ? 'sube' : 'baja'} al ${row.position}.º`,
      detail: `Antes era ${before}.º · ${row.points} puntos`,
      link: '/clasificaciones',
    });
  }
}

function isRecent(match, now = Date.now()) {
  return Math.abs(now - new Date(match.utc_date).getTime()) <= RECENT_MATCH_MS;
}

/**
 * Avisa de un cambio llegado de football-data comparando el partido de antes con el nuevo.
 * @returns el partido si acaba de terminar (para la clasificación), o null
 */
async function publishSyncedChange(previous) {
  const match = await findMatchWithTeams(previous.id);
  if (!match) return null;

  if (NOT_STARTED.includes(previous.status) && LIVE_STATUSES.includes(match.status)) await publishMatchStarted(match);

  // Goles uno a uno solo si el partido estaba o está en juego; si salta de programado a terminado,
  // basta con el aviso del final. football-data no dice quién marca: solo el equipo.
  const wasOrIsLive = LIVE_STATUSES.includes(previous.status) || LIVE_STATUSES.includes(match.status);
  const homeNew = wasOrIsLive ? (match.home_goals ?? 0) - (previous.home_goals ?? 0) : 0;
  const awayNew = wasOrIsLive ? (match.away_goals ?? 0) - (previous.away_goals ?? 0) : 0;
  for (let i = 0; i < homeNew; i++) await publishGoal(match, { minute: match.minute, teamId: match.home_team_id });
  for (let i = 0; i < awayNew; i++) await publishGoal(match, { minute: match.minute, teamId: match.away_team_id });
  if (homeNew <= 0 && awayNew <= 0) publishMatchUpdate(match);

  if (match.status === 'FINISHED' && previous.status !== 'FINISHED') {
    await publishMatchFinished(match);
    return match;
  }
  return null;
}

/**
 * Tras una sincronización: avisa de los partidos recientes que han cambiado y, si alguno ha terminado,
 * envía una vez la clasificación nueva.
 * Nunca hace fallar la sincronización (los datos ya están guardados): los errores solo van al log.
 * @param {bigint} seasonId
 * @param {object[]} previousRows filas de matches tal como estaban antes de actualizar
 * @param {Map<bigint, number>} positionsBefore puestos antes de recalcular la clasificación
 */
export async function publishSyncedChanges(seasonId, previousRows, positionsBefore) {
  const finishedTeams = new Map();
  for (const previous of previousRows.filter((row) => isRecent(row))) {
    try {
      const finished = await publishSyncedChange(previous);
      for (const team of finished ? [homeTeam(finished), awayTeam(finished)] : []) finishedTeams.set(team.id, team);
    } catch (error) {
      console.error(`[realtime] No se ha podido avisar del partido ${previous.id}:`, error?.code ?? error?.message);
    }
  }
  if (!finishedTeams.size) return;
  try {
    await publishStandingsChange(seasonId, positionsBefore, [...finishedTeams.values()]);
  } catch (error) {
    console.error('[realtime] No se ha podido enviar la clasificación nueva:', error?.code ?? error?.message);
  }
}
