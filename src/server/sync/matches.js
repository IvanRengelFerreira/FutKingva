// TEMPORAL: sincronización manual de partidos y recálculo de clasificación con football-data.org.
// La sincronización automática periódica se implementará en otra tarea.

import { prisma } from '../db.js';
import {
  COMPETITION_CODE,
  FOOTBALL_DATA_SOURCE,
  SYNC_TX_TIMEOUT_MS,
  createFootballDataClient,
} from './footballData.js';
import { recalculateStandings } from './standings.js';

const MAX_MINUTE = 130;

const VALID_STATUSES = new Set([
  'SCHEDULED',
  'TIMED',
  'IN_PLAY',
  'PAUSED',
  'FINISHED',
  'SUSPENDED',
  'POSTPONED',
  'CANCELLED',
  'AWARDED',
]);

const EXISTING_MATCH_FIELDS = {
  id: true,
  fd_id: true,
  matchday: true,
  utc_date: true,
  status: true,
  minute: true,
  home_team_id: true,
  away_team_id: true,
  home_goals: true,
  away_goals: true,
  home_goals_ht: true,
  away_goals_ht: true,
  is_simulated: true,
};

function sanitizeMinute(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_MINUTE ? value : null;
}

function sanitizeGoals(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function mapApiMatch(apiMatch, seasonId, teamByFdId) {
  if (!apiMatch?.id || !VALID_STATUSES.has(apiMatch.status)) return null;

  const homeTeamId = apiMatch.homeTeam?.id != null ? teamByFdId.get(BigInt(apiMatch.homeTeam.id)) : null;
  const awayTeamId = apiMatch.awayTeam?.id != null ? teamByFdId.get(BigInt(apiMatch.awayTeam.id)) : null;
  if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) return null;

  const homeGoals = sanitizeGoals(apiMatch.score?.fullTime?.home);
  const awayGoals = sanitizeGoals(apiMatch.score?.fullTime?.away);
  // La BD exige marcador no nulo si el partido está FINISHED
  if (apiMatch.status === 'FINISHED' && (homeGoals == null || awayGoals == null)) return null;

  const utcDate = new Date(apiMatch.utcDate);
  if (Number.isNaN(utcDate.getTime())) return null;

  return {
    fd_id: BigInt(apiMatch.id),
    season_id: seasonId,
    matchday: Number.isInteger(apiMatch.matchday) ? apiMatch.matchday : null,
    utc_date: utcDate,
    status: apiMatch.status,
    minute: sanitizeMinute(apiMatch.minute),
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    home_goals: homeGoals,
    away_goals: awayGoals,
    home_goals_ht: sanitizeGoals(apiMatch.score?.halfTime?.home),
    away_goals_ht: sanitizeGoals(apiMatch.score?.halfTime?.away),
    source: FOOTBALL_DATA_SOURCE,
  };
}

function hasMatchChanged(existing, incoming) {
  return (
    existing.status !== incoming.status ||
    existing.utc_date.getTime() !== incoming.utc_date.getTime() ||
    existing.matchday !== incoming.matchday ||
    existing.minute !== incoming.minute ||
    existing.home_goals !== incoming.home_goals ||
    existing.away_goals !== incoming.away_goals ||
    existing.home_goals_ht !== incoming.home_goals_ht ||
    existing.away_goals_ht !== incoming.away_goals_ht
  );
}

function matchUpdateData(incoming) {
  return {
    matchday: incoming.matchday,
    utc_date: incoming.utc_date,
    status: incoming.status,
    minute: incoming.minute,
    home_goals: incoming.home_goals,
    away_goals: incoming.away_goals,
    home_goals_ht: incoming.home_goals_ht,
    away_goals_ht: incoming.away_goals_ht,
  };
}

function readCurrentMatchday(apiMatches) {
  const value = apiMatches.find((m) => Number.isInteger(m?.season?.currentMatchday))?.season?.currentMatchday;
  return Number.isInteger(value) && value > 0 ? value : null;
}

function partitionMatches(mapped, existingByFdId) {
  const toCreate = [];
  const toUpdate = [];

  for (const incoming of mapped) {
    const existing = existingByFdId.get(incoming.fd_id);
    if (!existing) {
      toCreate.push(incoming);
    } else if (!existing.is_simulated && hasMatchChanged(existing, incoming)) {
      // Nunca sobrescribimos partidos del simulador de la demo
      toUpdate.push({ id: existing.id, data: matchUpdateData(incoming) });
    }
  }

  return { toCreate, toUpdate };
}

async function applyMatchChanges(season, toCreate, toUpdate, currentMatchday) {
  await prisma.$transaction(
    async (tx) => {
      if (toCreate.length) {
        await tx.matches.createMany({ data: toCreate, skipDuplicates: true });
      }
      for (const item of toUpdate) {
        await tx.matches.update({ where: { id: item.id }, data: item.data });
      }
      if (currentMatchday != null && currentMatchday !== season.current_matchday) {
        await tx.seasons.update({ where: { id: season.id }, data: { current_matchday: currentMatchday } });
      }
      await recalculateStandings(season.id, tx);
    },
    { timeout: SYNC_TX_TIMEOUT_MS },
  );
}

/**
 * Sincroniza los partidos de la temporada desde football-data.org (1 petición)
 * y recalcula la clasificación de la temporada.
 */
export async function syncMatches(season, api = createFootballDataClient()) {
  const payload = await api.get(`/competitions/${COMPETITION_CODE}/matches?season=${season.start_year}`);
  const apiMatches = Array.isArray(payload?.matches) ? payload.matches : [];

  const teams = await prisma.teams.findMany({ where: { fd_id: { not: null } }, select: { id: true, fd_id: true } });
  const teamByFdId = new Map(teams.map((team) => [team.fd_id, team.id]));

  const mapped = apiMatches.map((m) => mapApiMatch(m, season.id, teamByFdId)).filter(Boolean);
  const existingRows = mapped.length
    ? await prisma.matches.findMany({
        where: { fd_id: { in: mapped.map((m) => m.fd_id) } },
        select: EXISTING_MATCH_FIELDS,
      })
    : [];
  const existingByFdId = new Map(existingRows.map((row) => [row.fd_id, row]));

  const { toCreate, toUpdate } = partitionMatches(mapped, existingByFdId);
  await applyMatchChanges(season, toCreate, toUpdate, readCurrentMatchday(apiMatches));

  return { records: toCreate.length + toUpdate.length, requests: api.requestCount() };
}
