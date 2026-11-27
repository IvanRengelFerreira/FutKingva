// Importador de estadísticas de jugadores de LaLiga (FotMob / Opta + respaldo FBref en Kaggle).
// Completa minutos, titularidades, tarjetas, valoración, xG, tiros a puerta, % de pase y pases clave
// respetando siempre los campos corregidos manualmente por un editor (`field_sources`).
//
// Uso (desde src/server):
//   npm run import:stats:dry               → simulación sin tocar la BD (temporada actual)
//   npm run import:stats                   → importa la temporada actual (requiere migración aplicada)
//   node sync/importPlayerStats.js --season=2025
//   node sync/importPlayerStats.js --all-seasons

import { pathToFileURL } from 'node:url';
import { prisma } from '../db.js';
import { resolveSeason } from '../utils/seasons.js';
import { SYNC_TX_TIMEOUT_MS } from './footballData.js';
import { fetchFotmobSeasonStats } from './fotmobClient.js';
import { fetchFbrefSeasonStats } from './kaggleFbref.js';
import { buildTeamMaps, createPlayerMatcher, normalizeText } from './playerMatcher.js';

const FOTMOB_SOURCE = 'FOTMOB';
const RESOURCE_NAME = 'player_stats';
const MIN_FOTMOB_YEAR = 2017;

const UPDATABLE_COLUMNS = [
  'played',
  'starts',
  'minutes',
  'goals',
  'assists',
  'penalties',
  'xg',
  'shots_on_target',
  'pass_accuracy',
  'key_passes',
  'yellow_cards',
  'red_cards',
  'rating',
];

function parseCliArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const allSeasons = argv.includes('--all-seasons');
  const seasonArg = argv.find((arg) => arg.startsWith('--season='))?.split('=')[1];
  const fbrefCsv = argv.find((arg) => arg.startsWith('--fbref-csv='))?.split('=')[1] ?? null;
  return { dryRun, allSeasons, seasonArg, fbrefCsv };
}

function isEditorLocked(fieldSources, column) {
  return Boolean(fieldSources && typeof fieldSources === 'object' && fieldSources[column] === 'EDITOR');
}

function sameStatValue(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

const statKey = (playerId, teamId) => `${playerId}:${teamId}`;

function mergeFbrefIntoEntries(entriesByKey, fbrefRows, teamIdByFbrefSquad, matcher) {
  for (const row of fbrefRows) {
    const teamId = teamIdByFbrefSquad.get(normalizeText(row.squad));
    if (!teamId) continue;

    const playerId = matcher.match({ name: row.name, teamId, bornYear: row.bornYear });
    if (!playerId) continue;

    const target = entriesByKey.get(statKey(playerId, teamId));
    if (!target) continue;

    if (row.starts != null) target.starts = row.starts;
    if (row.shotsOnTarget != null) target.shots_on_target = row.shotsOnTarget;
  }
}

function buildSeasonEntries(fotmobRecords, fbrefRows, teamMaps, matcher) {
  const entriesByKey = new Map();
  const fmIdByPlayerId = new Map();
  const unmatched = [];

  for (const rec of fotmobRecords) {
    const teamId = teamMaps.teamIdByFmId.get(rec.fmTeamId);
    if (!teamId) {
      unmatched.push({ name: rec.name, team: rec.teamName, minutes: rec.minutes });
      continue;
    }

    const playerId = matcher.match({ fmPlayerId: rec.fmPlayerId, name: rec.name, teamId });
    if (!playerId) {
      unmatched.push({ name: rec.name, team: rec.teamName, minutes: rec.minutes });
      continue;
    }

    fmIdByPlayerId.set(playerId, BigInt(rec.fmPlayerId));
    entriesByKey.set(statKey(playerId, teamId), {
      player_id: playerId,
      team_id: teamId,
      played: rec.played,
      starts: null,
      minutes: rec.minutes,
      goals: rec.goals,
      assists: rec.assists,
      penalties: Math.min(rec.penalties, rec.goals),
      xg: rec.xg,
      shots_on_target: rec.shotsOnTarget,
      pass_accuracy: rec.passAccuracy,
      key_passes: rec.keyPasses,
      yellow_cards: rec.yellowCards,
      red_cards: rec.redCards,
      rating: rec.rating,
    });
  }

  mergeFbrefIntoEntries(entriesByKey, fbrefRows, teamMaps.teamIdByFbrefSquad, matcher);
  return { entries: [...entriesByKey.values()], fmIdByPlayerId, unmatched };
}

// En temporadas históricas (Transfermarkt) conserva PJ, minutos, goles, asistencias y tarjetas ya cargados
function buildUpdatePayload(existing, incoming, isCurrentSeason) {
  const fs = existing.field_sources;
  const historicalKeep = new Set([
    'played',
    'starts',
    'minutes',
    'goals',
    'assists',
    'penalties',
    'yellow_cards',
    'red_cards',
  ]);
  const next = {};

  for (const col of UPDATABLE_COLUMNS) {
    if (isEditorLocked(fs, col)) continue;
    if (!isCurrentSeason && historicalKeep.has(col) && existing[col] != null) continue;
    if (incoming[col] == null) continue;
    if (!sameStatValue(existing[col], incoming[col])) next[col] = incoming[col];
  }

  // Garantiza CHECK (penalties <= goals) aunque un editor haya fijado uno de los dos campos
  const finalGoals = next.goals ?? existing.goals;
  const finalPenalties = next.penalties ?? existing.penalties;
  if (finalPenalties > finalGoals) {
    if (!isEditorLocked(fs, 'penalties')) next.penalties = finalGoals;
    else if (!isEditorLocked(fs, 'goals')) next.goals = finalPenalties;
  }

  return next;
}

function partitionChanges(seasonId, entries, existingByKey, isCurrentSeason) {
  const toCreate = [];
  const toUpdate = [];

  for (const incoming of entries) {
    const existing = existingByKey.get(statKey(incoming.player_id, incoming.team_id));
    if (!existing) {
      toCreate.push({ season_id: seasonId, ...incoming, source: FOTMOB_SOURCE });
      continue;
    }
    const data = buildUpdatePayload(existing, incoming, isCurrentSeason);
    if (Object.keys(data).length > 0) {
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

async function loadReferenceData(dryRun) {
  // En --dry-run evitamos pedir `fm_id` para que pueda probarse antes de aplicar la migración
  const teamSelect = { id: true, fd_id: true, tm_id: true, ...(!dryRun && { fm_id: true }) };
  const playerSelect = {
    id: true,
    name: true,
    first_name: true,
    last_name: true,
    date_of_birth: true,
    team_id: true,
    ...(!dryRun && { fm_id: true }),
  };

  const [teams, players, pastSeasons] = await Promise.all([
    prisma.teams.findMany({ select: teamSelect }),
    prisma.players.findMany({ select: playerSelect }),
    prisma.player_season_stats.findMany({
      select: { player_id: true, team_id: true },
      distinct: ['player_id', 'team_id'],
    }),
  ]);

  const clubHistory = new Map();
  for (const row of pastSeasons) {
    const list = clubHistory.get(row.player_id) ?? [];
    list.push(row.team_id);
    clubHistory.set(row.player_id, list);
  }

  return { teams, players, clubHistory };
}

function collectUnassignedIds(rows, idMap) {
  const taken = new Set(rows.filter((r) => r.fm_id != null).map((r) => r.fm_id));
  const pending = [];
  for (const row of rows) {
    if (row.fm_id != null || !idMap.has(row.id)) continue;
    const fmId = idMap.get(row.id);
    if (taken.has(fmId)) continue;
    taken.add(fmId);
    pending.push({ id: row.id, fmId });
  }
  return pending;
}

async function persistSeasonChanges(seasonId, toCreate, toUpdate, fmIdByPlayerId, fmIdByTeamId, refData) {
  const playersToLink = collectUnassignedIds(refData.players, fmIdByPlayerId);
  const teamsToLink = collectUnassignedIds(refData.teams, fmIdByTeamId);

  await prisma.$transaction(
    async (tx) => {
      if (toCreate.length > 0) {
        await tx.player_season_stats.createMany({ data: toCreate, skipDuplicates: true });
      }
      for (const item of toUpdate) {
        await tx.player_season_stats.update(item);
      }
      for (const team of teamsToLink) {
        await tx.teams.update({ where: { id: team.id }, data: { fm_id: team.fmId } });
      }
      for (const player of playersToLink) {
        await tx.players.update({ where: { id: player.id }, data: { fm_id: player.fmId } });
      }
    },
    { timeout: SYNC_TX_TIMEOUT_MS },
  );

  for (const team of teamsToLink) {
    const target = refData.teams.find((t) => t.id === team.id);
    if (target) target.fm_id = team.fmId;
  }
  for (const player of playersToLink) {
    const target = refData.players.find((p) => p.id === player.id);
    if (target) target.fm_id = player.fmId;
  }
}

async function recordSyncRun(seasonId, records, requests) {
  const startedAt = new Date();
  await prisma.sync_runs.create({
    data: {
      source: FOTMOB_SOURCE,
      resource: RESOURCE_NAME,
      season_id: seasonId,
      status: 'OK',
      records,
      requests,
      started_at: startedAt,
      finished_at: new Date(Math.max(Date.now(), startedAt.getTime())),
    },
  });
}

export async function importSeasonPlayerStats(season, isCurrentSeason, refData, options = {}) {
  const { dryRun = false, fbrefCsv = null } = options;
  const [fotmob, fbref] = await Promise.all([
    fetchFotmobSeasonStats(season.start_year),
    fetchFbrefSeasonStats(season.start_year, fbrefCsv),
  ]);

  const teamMaps = buildTeamMaps(refData.teams);
  const matcher = createPlayerMatcher(refData.players, refData.clubHistory);
  const { entries, fmIdByPlayerId, unmatched } = buildSeasonEntries(fotmob.records, fbref.rows, teamMaps, matcher);

  const existingRows = entries.length
    ? await prisma.player_season_stats.findMany({
        where: { season_id: season.id, player_id: { in: entries.map((e) => e.player_id) } },
      })
    : [];
  const existingByKey = new Map(existingRows.map((row) => [statKey(row.player_id, row.team_id), row]));
  const { toCreate, toUpdate } = partitionChanges(season.id, entries, existingByKey, isCurrentSeason);
  const requests = fotmob.requests + fbref.requests;

  if (!dryRun) {
    await persistSeasonChanges(season.id, toCreate, toUpdate, fmIdByPlayerId, teamMaps.fmIdByTeamId, refData);
    await recordSyncRun(season.id, toCreate.length + toUpdate.length, requests);
  }

  return {
    season: season.label,
    matched: entries.length,
    created: toCreate.length,
    updated: toUpdate.length,
    skipped: unmatched.length,
    requests,
    samples: entries.slice(0, 5),
    unmatched,
  };
}

async function resolveTargetSeasons(seasonArg, allSeasons) {
  if (!allSeasons) {
    const { season, isCurrent } = await resolveSeason(seasonArg);
    return [{ season, isCurrent }];
  }
  const { season: current } = await resolveSeason();
  const seasons = await prisma.seasons.findMany({
    where: { start_year: { gte: MIN_FOTMOB_YEAR } },
    orderBy: { start_year: 'desc' },
  });
  return seasons.map((season) => ({ season, isCurrent: season.id === current.id }));
}

async function runCli() {
  const { dryRun, allSeasons, seasonArg, fbrefCsv } = parseCliArgs(process.argv.slice(2));
  try {
    const targets = await resolveTargetSeasons(seasonArg, allSeasons);
    const refData = await loadReferenceData(dryRun);

    for (const { season, isCurrent } of targets) {
      const summary = await importSeasonPlayerStats(season, isCurrent, refData, { dryRun, fbrefCsv });
      const mode = dryRun ? '[DRY-RUN]' : '[OK]';
      console.log(
        `${mode} ${summary.season}: ${summary.matched} emparejados (${summary.created} nuevos, ${summary.updated} actualizados), ${summary.skipped} omitidos (${summary.requests} peticiones)`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
