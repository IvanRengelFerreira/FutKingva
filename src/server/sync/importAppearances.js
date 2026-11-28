// Importador de apariciones y valoraciones por partido desde FotMob (`appearances` + `matches.fm_id`).
// - En la temporada actual (2026/27) crea y actualiza `appearances` (titularidad, minutos, goles, asistencias,
//   tarjetas, valoración y % de pase) para todos los partidos finalizados.
// - En temporadas históricas (2017/18–2025/26) conserva intactos los minutos, goles, asistencias y tarjetas de
//   Transfermarkt y rellena únicamente `rating` y `pass_accuracy`.
// - Es incremental: los partidos ya enlazados con `matches.fm_id` y con valoraciones guardadas no se vuelven a pedir
//   salvo que se pase `--force`.
//
// Uso (desde src/server):
//   npm run import:appearances:dry                 → simulación sin escribir en la BD (temporada actual)
//   npm run import:appearances                     → importa los partidos pendientes de la temporada actual
//   node sync/importAppearances.js --season=2025   → importa una temporada concreta
//   node sync/importAppearances.js --all-seasons   → importa las 10 temporadas disponibles (2017/18–2026/27)

import { pathToFileURL } from 'node:url';
import { Prisma } from '../generated/prisma/client.ts';
import { prisma } from '../db.js';
import { resolveSeason } from '../utils/seasons.js';
import { fetchFotmobMatchAppearances, fetchFotmobSeasonFixtures } from './fotmobClient.js';
import { buildTeamMaps, createPlayerMatcher } from './playerMatcher.js';

const FOTMOB_SOURCE = 'FOTMOB';
const RESOURCE_NAME = 'appearances';
const MIN_FOTMOB_YEAR = 2017;
const MATCH_CONCURRENCY = 10;
const MAX_FETCH_RETRIES = 2;
const RETRY_BASE_MS = 500;
const MAX_SMALLINT = 32767;
const APPEARANCE_TX_TIMEOUT_MS = 120000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const appKey = (matchId, playerId) => `${matchId}:${playerId}`;

function parseCliArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const allSeasons = argv.includes('--all-seasons');
  const force = argv.includes('--force');
  const seasonArg = argv.find((arg) => arg.startsWith('--season='))?.split('=')[1];
  return { dryRun, allSeasons, force, seasonArg };
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(runners);
  return results;
}

async function fetchMatchWithRetry(fmMatchId, failures) {
  for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt++) {
    try {
      const rows = await fetchFotmobMatchAppearances(fmMatchId);
      return { rows, requests: attempt + 1 };
    } catch {
      if (attempt < MAX_FETCH_RETRIES) await sleep(RETRY_BASE_MS * (attempt + 1));
    }
  }
  failures.count++;
  return { rows: null, requests: MAX_FETCH_RETRIES + 1 };
}

async function loadReferenceData() {
  const [teams, players, seasonClubs, appClubs] = await Promise.all([
    prisma.teams.findMany({ select: { id: true, fd_id: true, tm_id: true, fm_id: true } }),
    prisma.players.findMany({
      select: {
        id: true,
        name: true,
        first_name: true,
        last_name: true,
        date_of_birth: true,
        team_id: true,
        fm_id: true,
      },
    }),
    prisma.player_season_stats.findMany({
      select: { player_id: true, team_id: true },
      distinct: ['player_id', 'team_id'],
    }),
    prisma.appearances.findMany({
      select: { player_id: true, team_id: true },
      distinct: ['player_id', 'team_id'],
    }),
  ]);

  const clubHistory = new Map();
  for (const row of [...seasonClubs, ...appClubs]) {
    const set = clubHistory.get(row.player_id) ?? new Set();
    set.add(row.team_id);
    clubHistory.set(row.player_id, set);
  }
  const clubHistoryArrays = new Map([...clubHistory.entries()].map(([id, set]) => [id, [...set]]));
  const playerById = new Map(players.map((p) => [p.id, p]));

  return { teams, players, playerById, clubHistory: clubHistoryArrays };
}

function sameOptionalDecimal(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

function pickBestDbMatch(candidates, utcDate) {
  if (candidates.length === 0) return null;
  if (candidates.length === 1 || !utcDate) return candidates[0];
  return [...candidates].sort(
    (a, b) => Math.abs(a.utc_date.getTime() - utcDate.getTime()) - Math.abs(b.utc_date.getTime() - utcDate.getTime()),
  )[0];
}

function isMatchAlreadyImported(dbMatch, existingApps) {
  if (dbMatch.fm_id == null || existingApps.length === 0) return false;
  return existingApps.some((app) => app.rating != null || app.pass_accuracy != null);
}

function pairSeasonFixtures(fixtures, dbMatches, appsByMatch, teamIdByFmId, force) {
  const byFmId = new Map(dbMatches.filter((m) => m.fm_id != null).map((m) => [Number(m.fm_id), m]));
  const usedMatchIds = new Set();
  const pending = [];
  let alreadyDone = 0;

  for (const fix of fixtures) {
    const homeTeamId = teamIdByFmId.get(fix.fmHomeTeamId);
    const awayTeamId = teamIdByFmId.get(fix.fmAwayTeamId);
    if (!homeTeamId || !awayTeamId) continue;

    let dbMatch = byFmId.get(fix.fmMatchId) ?? null;
    if (!dbMatch) {
      const pool = dbMatches.filter(
        (m) =>
          m.fm_id == null && !usedMatchIds.has(m.id) && m.home_team_id === homeTeamId && m.away_team_id === awayTeamId,
      );
      dbMatch = pickBestDbMatch(pool, fix.utcDate);
    }
    if (!dbMatch || usedMatchIds.has(dbMatch.id)) continue;
    usedMatchIds.add(dbMatch.id);

    const existingApps = appsByMatch.get(dbMatch.id) ?? [];
    if (!force && isMatchAlreadyImported(dbMatch, existingApps)) {
      alreadyDone++;
      continue;
    }
    pending.push({ fixture: fix, dbMatch, existingApps });
  }

  return { pending, alreadyDone };
}

// En históricos probamos primero contra los ~15 futbolistas que ya constan en ese partido y club en la BD
function createMatchScopedResolver(existingApps, playerById, globalMatcher, byFmId) {
  const playersByTeam = new Map();
  for (const app of existingApps) {
    const player = playerById.get(app.player_id);
    if (!player) continue;
    const list = playersByTeam.get(app.team_id) ?? [];
    list.push(player);
    playersByTeam.set(app.team_id, list);
  }

  const localMatchers = new Map();
  for (const [teamId, squad] of playersByTeam.entries()) {
    localMatchers.set(teamId, createPlayerMatcher(squad, new Map(squad.map((p) => [p.id, [teamId]]))));
  }

  return function resolvePlayerId(rec, teamId) {
    if (byFmId.has(rec.fmPlayerId)) return byFmId.get(rec.fmPlayerId);
    const local = localMatchers.get(teamId)?.match({ fmPlayerId: rec.fmPlayerId, name: rec.name, teamId });
    if (local != null) return local;
    return globalMatcher.match({ fmPlayerId: rec.fmPlayerId, name: rec.name, teamId });
  };
}

function trackPlayerFmLink(links, ambiguousPlayers, ambiguousFmIds, playerId, fmPlayerId) {
  const fmBig = BigInt(fmPlayerId);
  if (ambiguousPlayers.has(playerId) || ambiguousFmIds.has(fmBig)) return;

  for (const [otherPlayer, otherFm] of links.entries()) {
    if (otherPlayer !== playerId && otherFm === fmBig) {
      ambiguousFmIds.add(fmBig);
      links.delete(otherPlayer);
      return;
    }
  }
  if (links.has(playerId) && links.get(playerId) !== fmBig) {
    ambiguousPlayers.add(playerId);
    links.delete(playerId);
    return;
  }
  links.set(playerId, fmBig);
}

function buildCurrentAppearanceUpdate(existing, incoming) {
  const data = {};
  if (existing.is_starter !== incoming.isStarter) data.is_starter = incoming.isStarter;
  if (existing.minutes !== incoming.minutes) data.minutes = incoming.minutes;
  if (existing.goals !== incoming.goals) data.goals = incoming.goals;
  if (existing.assists !== incoming.assists) data.assists = incoming.assists;
  if (existing.yellow_cards !== incoming.yellowCards) data.yellow_cards = incoming.yellowCards;
  if (existing.red_cards !== incoming.redCards) data.red_cards = incoming.redCards;
  if (!sameOptionalDecimal(existing.rating, incoming.rating)) data.rating = incoming.rating;
  if (!sameOptionalDecimal(existing.pass_accuracy, incoming.passAccuracy)) data.pass_accuracy = incoming.passAccuracy;
  return data;
}

function processMatchAppearances(item, rawRows, ctx, acc) {
  const { fixture, dbMatch, existingApps } = item;
  const fmMatchBig = BigInt(fixture.fmMatchId);
  if (dbMatch.fm_id == null) acc.matchLinks.push({ id: dbMatch.id, fmId: fmMatchBig });

  const resolvePlayerId = createMatchScopedResolver(existingApps, ctx.playerById, ctx.matcher, ctx.byFmId);
  const dedupedByPlayer = new Map();

  for (const rec of rawRows) {
    const teamId = ctx.teamIdByFmId.get(rec.fmTeamId);
    if (!teamId) continue;
    const playerId = resolvePlayerId(rec, teamId);
    if (!playerId) {
      acc.unmatchedPlayers++;
      continue;
    }
    trackPlayerFmLink(acc.fmLinks, acc.ambiguousPlayers, acc.ambiguousFmIds, playerId, rec.fmPlayerId);
    const prev = dedupedByPlayer.get(playerId);
    if (!prev || rec.minutes > prev.rec.minutes) dedupedByPlayer.set(playerId, { rec, teamId });
  }

  const existingByKey = new Map(existingApps.map((a) => [appKey(a.match_id, a.player_id), a]));
  const allowInsert = ctx.isCurrentSeason || existingApps.length === 0;

  for (const [playerId, { rec, teamId }] of dedupedByPlayer.entries()) {
    const existing = existingByKey.get(appKey(dbMatch.id, playerId));
    if (!existing) {
      if (!allowInsert) continue;
      acc.toCreate.push({
        match_id: dbMatch.id,
        player_id: playerId,
        team_id: teamId,
        is_starter: rec.isStarter,
        minutes: rec.minutes,
        goals: rec.goals,
        assists: rec.assists,
        yellow_cards: rec.yellowCards,
        red_cards: rec.redCards,
        rating: rec.rating,
        pass_accuracy: rec.passAccuracy,
        source: FOTMOB_SOURCE,
      });
      continue;
    }

    if (ctx.isCurrentSeason) {
      const data = buildCurrentAppearanceUpdate(existing, rec);
      if (Object.keys(data).length > 0) {
        acc.currentUpdates.push({
          where: { match_id_player_id: { match_id: dbMatch.id, player_id: playerId } },
          data,
        });
      }
    } else if (
      !sameOptionalDecimal(existing.rating, rec.rating) ||
      !sameOptionalDecimal(existing.pass_accuracy, rec.passAccuracy)
    ) {
      acc.historicalEnrichments.push({
        matchId: dbMatch.id,
        playerId,
        rating: rec.rating ?? existing.rating,
        passAccuracy: rec.passAccuracy ?? existing.pass_accuracy,
      });
    }
  }
}

function collectSafeFmUpdates(rows, candidateMap) {
  const taken = new Set(rows.filter((r) => r.fm_id != null).map((r) => r.fm_id));
  const pending = [];
  for (const row of rows) {
    if (row.fm_id != null || !candidateMap.has(row.id)) continue;
    const fmId = candidateMap.get(row.id);
    if (taken.has(fmId)) continue;
    taken.add(fmId);
    pending.push({ id: row.id, fmId });
  }
  return pending;
}

async function bulkLinkIds(tx, tableName, items) {
  if (items.length === 0) return;
  // Convertimos a Number (todos caben en entero seguro JS) para que el adaptador pg serialice bien bigint[]
  const ids = items.map((i) => Number(i.id));
  const fmIds = items.map((i) => Number(i.fmId));
  const table = Prisma.raw(tableName);
  await tx.$executeRaw`
    UPDATE ${table} AS t
    SET fm_id = v.fm_id
    FROM unnest(${ids}::bigint[], ${fmIds}::bigint[]) AS v(id, fm_id)
    WHERE t.id = v.id AND t.fm_id IS NULL
  `;
}

async function bulkEnrichHistoricalAppearances(tx, items) {
  if (items.length === 0) return;
  const matchIds = items.map((i) => Number(i.matchId));
  const playerIds = items.map((i) => Number(i.playerId));
  const ratings = items.map((i) => (i.rating != null ? String(i.rating) : null));
  const passes = items.map((i) => (i.passAccuracy != null ? String(i.passAccuracy) : null));

  await tx.$executeRaw`
    UPDATE appearances AS a
    SET
      rating = v.rating::numeric(3,1),
      pass_accuracy = v.pass_accuracy::numeric(4,1)
    FROM unnest(
      ${matchIds}::bigint[],
      ${playerIds}::bigint[],
      ${ratings}::text[],
      ${passes}::text[]
    ) AS v(match_id, player_id, rating, pass_accuracy)
    WHERE a.match_id = v.match_id AND a.player_id = v.player_id
  `;
}

async function persistSeasonAppearances(acc, fmIdByTeamId, refData, byFmId) {
  const teamsToLink = collectSafeFmUpdates(refData.teams, fmIdByTeamId);
  const playersToLink = collectSafeFmUpdates(refData.players, acc.fmLinks);

  await prisma.$transaction(
    async (tx) => {
      await bulkLinkIds(tx, 'teams', teamsToLink);
      await bulkLinkIds(tx, 'players', playersToLink);
      await bulkLinkIds(tx, 'matches', acc.matchLinks);

      if (acc.toCreate.length > 0) {
        await tx.appearances.createMany({ data: acc.toCreate, skipDuplicates: true });
      }
      await bulkEnrichHistoricalAppearances(tx, acc.historicalEnrichments);

      for (const upd of acc.currentUpdates) {
        await tx.appearances.update(upd);
      }
    },
    { timeout: APPEARANCE_TX_TIMEOUT_MS },
  );

  for (const t of teamsToLink) {
    const target = refData.teams.find((row) => row.id === t.id);
    if (target) target.fm_id = t.fmId;
  }
  for (const p of playersToLink) {
    const target = refData.players.find((row) => row.id === p.id);
    if (target) {
      target.fm_id = p.fmId;
      byFmId.set(Number(p.fmId), p.id);
    }
  }
}

async function recordSyncRun(seasonId, startedAt, records, requests, failedMatches) {
  await prisma.sync_runs.create({
    data: {
      source: FOTMOB_SOURCE,
      resource: RESOURCE_NAME,
      season_id: seasonId,
      status: 'OK',
      records,
      requests: Math.min(requests, MAX_SMALLINT),
      error: failedMatches > 0 ? `${failedMatches} partidos no han podido descargarse` : null,
      started_at: startedAt,
      finished_at: new Date(Math.max(Date.now(), startedAt.getTime())),
    },
  });
}

async function loadSeasonDbState(seasonId) {
  const [dbMatches, existingApps] = await Promise.all([
    prisma.matches.findMany({
      where: { season_id: seasonId, is_simulated: false },
      select: { id: true, home_team_id: true, away_team_id: true, utc_date: true, fm_id: true },
    }),
    prisma.appearances.findMany({
      where: { matches: { season_id: seasonId, is_simulated: false } },
      select: {
        match_id: true,
        player_id: true,
        team_id: true,
        is_starter: true,
        minutes: true,
        goals: true,
        assists: true,
        yellow_cards: true,
        red_cards: true,
        rating: true,
        pass_accuracy: true,
      },
    }),
  ]);

  const appsByMatch = new Map();
  for (const app of existingApps) {
    const list = appsByMatch.get(app.match_id) ?? [];
    list.push(app);
    appsByMatch.set(app.match_id, list);
  }
  return { dbMatches, appsByMatch };
}

export async function importSeasonAppearances(season, isCurrentSeason, refData, options = {}) {
  const { dryRun = false, force = false } = options;
  const startedAt = new Date();
  const teamMaps = buildTeamMaps(refData.teams);
  const matcher = createPlayerMatcher(refData.players, refData.clubHistory);
  const byFmId = new Map(refData.players.filter((p) => p.fm_id != null).map((p) => [Number(p.fm_id), p.id]));

  const [{ fixtures, requests: overviewRequests }, { dbMatches, appsByMatch }] = await Promise.all([
    fetchFotmobSeasonFixtures(season.start_year),
    loadSeasonDbState(season.id),
  ]);

  const { pending, alreadyDone } = pairSeasonFixtures(fixtures, dbMatches, appsByMatch, teamMaps.teamIdByFmId, force);

  const failures = { count: 0 };
  const fetched = await mapWithConcurrency(pending, MATCH_CONCURRENCY, async (item) => ({
    item,
    ...(await fetchMatchWithRetry(item.fixture.fmMatchId, failures)),
  }));

  const acc = {
    matchLinks: [],
    fmLinks: new Map(),
    ambiguousPlayers: new Set(),
    ambiguousFmIds: new Set(),
    toCreate: [],
    currentUpdates: [],
    historicalEnrichments: [],
    unmatchedPlayers: 0,
  };
  const ctx = { isCurrentSeason, playerById: refData.playerById, matcher, byFmId, teamIdByFmId: teamMaps.teamIdByFmId };

  let detailRequests = 0;
  for (const entry of fetched) {
    detailRequests += entry.requests;
    if (entry.rows) processMatchAppearances(entry.item, entry.rows, ctx, acc);
  }

  const totalRequests = overviewRequests + detailRequests;
  const totalRecords = acc.toCreate.length + acc.currentUpdates.length + acc.historicalEnrichments.length;

  if (!dryRun && (totalRecords > 0 || acc.matchLinks.length > 0)) {
    await persistSeasonAppearances(acc, teamMaps.fmIdByTeamId, refData, byFmId);
    await recordSyncRun(season.id, startedAt, totalRecords, totalRequests, failures.count);
  }

  return {
    season: season.label,
    fixtures: fixtures.length,
    alreadyDone,
    processed: pending.length - failures.count,
    failedMatches: failures.count,
    created: acc.toCreate.length,
    updated: acc.currentUpdates.length + acc.historicalEnrichments.length,
    unmatchedPlayers: acc.unmatchedPlayers,
    requests: totalRequests,
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
  const { dryRun, allSeasons, force, seasonArg } = parseCliArgs(process.argv.slice(2));
  try {
    const targets = await resolveTargetSeasons(seasonArg, allSeasons);
    const refData = await loadReferenceData();

    for (const { season, isCurrent } of targets) {
      const s = await importSeasonAppearances(season, isCurrent, refData, { dryRun, force });
      const mode = dryRun ? '[DRY-RUN]' : '[OK]';
      console.log(
        `${mode} ${s.season}: ${s.processed}/${s.fixtures - s.alreadyDone} partidos nuevos (${s.alreadyDone} ya al día, ` +
          `${s.failedMatches} fallidos) → ${s.created} creadas, ${s.updated} actualizadas, ` +
          `${s.unmatchedPlayers} apariciones sin jugador en BD (${s.requests} peticiones)`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
