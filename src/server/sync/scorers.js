// TEMPORAL: sincronización manual de goleadores (player_season_stats) con football-data.org.
// La sincronización automática periódica se implementará en otra tarea.

import { prisma } from '../db.js';
import {
  COMPETITION_CODE,
  FOOTBALL_DATA_SOURCE,
  SYNC_TX_TIMEOUT_MS,
  createFootballDataClient,
} from './footballData.js';

const SCORERS_LIMIT = 100;

const EXISTING_STAT_FIELDS = {
  player_id: true,
  team_id: true,
  played: true,
  goals: true,
  assists: true,
  penalties: true,
  field_sources: true,
};

function nonNegativeInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 ? num : 0;
}

function isFieldLocked(fieldSources, field) {
  return Boolean(fieldSources && typeof fieldSources === 'object' && Object.hasOwn(fieldSources, field));
}

function buildUpdateForExisting(existing, incoming) {
  const fs = existing.field_sources;
  const next = {};

  if (!isFieldLocked(fs, 'played') && incoming.played !== existing.played) next.played = incoming.played;
  if (!isFieldLocked(fs, 'assists') && incoming.assists !== existing.assists) next.assists = incoming.assists;

  const goalsLocked = isFieldLocked(fs, 'goals');
  const penaltiesLocked = isFieldLocked(fs, 'penalties');
  const finalGoals = goalsLocked
    ? existing.goals
    : penaltiesLocked
      ? Math.max(incoming.goals, existing.penalties)
      : incoming.goals;
  // Mantiene CHECK (penalties <= goals) incluso si un editor corrigió goles
  const finalPenalties = penaltiesLocked ? existing.penalties : Math.min(incoming.penalties, finalGoals);

  if (!goalsLocked && finalGoals !== existing.goals) next.goals = finalGoals;
  if (!penaltiesLocked && finalPenalties !== existing.penalties) next.penalties = finalPenalties;

  return next;
}

const statKey = (playerId, teamId) => `${playerId}:${teamId}`;

function resolveScorerEntries(apiScorers, playerByFdId, teamByFdId) {
  const matched = new Map();
  let skipped = 0;

  for (const entry of apiScorers) {
    const playerId = entry?.player?.id != null ? playerByFdId.get(BigInt(entry.player.id)) : null;
    const teamId = entry?.team?.id != null ? teamByFdId.get(BigInt(entry.team.id)) : null;
    if (!playerId || !teamId) {
      skipped++;
      continue;
    }

    const key = statKey(playerId, teamId);
    if (matched.has(key)) continue;

    const goals = nonNegativeInt(entry.goals);
    matched.set(key, {
      player_id: playerId,
      team_id: teamId,
      played: nonNegativeInt(entry.playedMatches),
      goals,
      assists: nonNegativeInt(entry.assists),
      penalties: Math.min(nonNegativeInt(entry.penalties), goals),
    });
  }

  return { entries: [...matched.values()], skipped };
}

async function loadIdMaps(apiScorers) {
  const playerFdIds = [...new Set(apiScorers.map((s) => s?.player?.id).filter((id) => id != null))].map(BigInt);
  const teamFdIds = [...new Set(apiScorers.map((s) => s?.team?.id).filter((id) => id != null))].map(BigInt);

  const [players, teams] = await Promise.all([
    playerFdIds.length
      ? prisma.players.findMany({ where: { fd_id: { in: playerFdIds } }, select: { id: true, fd_id: true } })
      : [],
    teamFdIds.length
      ? prisma.teams.findMany({ where: { fd_id: { in: teamFdIds } }, select: { id: true, fd_id: true } })
      : [],
  ]);

  return {
    playerByFdId: new Map(players.map((p) => [p.fd_id, p.id])),
    teamByFdId: new Map(teams.map((t) => [t.fd_id, t.id])),
  };
}

function partitionStats(seasonId, entries, existingByKey) {
  const toCreate = [];
  const toUpdate = [];

  for (const incoming of entries) {
    const existing = existingByKey.get(statKey(incoming.player_id, incoming.team_id));
    if (!existing) {
      toCreate.push({ season_id: seasonId, ...incoming, source: FOOTBALL_DATA_SOURCE });
      continue;
    }
    const data = buildUpdateForExisting(existing, incoming);
    if (Object.keys(data).length) {
      toUpdate.push({
        where: {
          season_id_player_id_team_id: {
            season_id: seasonId,
            player_id: incoming.player_id,
            team_id: incoming.team_id,
          },
        },
        data,
      });
    }
  }

  return { toCreate, toUpdate };
}

async function persistStats(toCreate, toUpdate) {
  if (!toCreate.length && !toUpdate.length) return;
  await prisma.$transaction(
    async (tx) => {
      if (toCreate.length) {
        await tx.player_season_stats.createMany({ data: toCreate, skipDuplicates: true });
      }
      for (const item of toUpdate) {
        await tx.player_season_stats.update(item);
      }
    },
    { timeout: SYNC_TX_TIMEOUT_MS },
  );
}

/**
 * Sincroniza goleadores de la temporada desde football-data.org (1 petición).
 * Respeta campos corregidos por un editor (field_sources) y omite jugadores no existentes en la BD.
 */
export async function syncScorers(season, api = createFootballDataClient()) {
  const payload = await api.get(
    `/competitions/${COMPETITION_CODE}/scorers?season=${season.start_year}&limit=${SCORERS_LIMIT}`,
  );
  const apiScorers = Array.isArray(payload?.scorers) ? payload.scorers : [];

  const { playerByFdId, teamByFdId } = await loadIdMaps(apiScorers);
  const { entries, skipped } = resolveScorerEntries(apiScorers, playerByFdId, teamByFdId);

  const existingRows = entries.length
    ? await prisma.player_season_stats.findMany({
        where: { season_id: season.id, player_id: { in: entries.map((e) => e.player_id) } },
        select: EXISTING_STAT_FIELDS,
      })
    : [];
  const existingByKey = new Map(existingRows.map((row) => [statKey(row.player_id, row.team_id), row]));

  const { toCreate, toUpdate } = partitionStats(season.id, entries, existingByKey);
  await persistStats(toCreate, toUpdate);

  return { records: toCreate.length + toUpdate.length, skipped, requests: api.requestCount() };
}
