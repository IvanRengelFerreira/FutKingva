// Importador de árbitros, eventos de partido y estadísticas arbitrales de temporada desde FotMob.
// 1. Completa en `referees` los metadatos del CTA/RFEF (comité, FIFA, año de debut en Primera y nombre corto).
// 2. Asigna `matches.referee_id` en los partidos finalizados de la temporada actual (corrigiendo asignaciones erróneas),
//    importa en `match_events` las tarjetas y goles/penaltis de FotMob y calcula `referee_season_stats`.
// 3. Corrige en temporadas pasadas `referee_season_stats.red_cards` cuando quedó a 0 existiendo `RED_CARD` en `match_events`.
//
// Uso (desde src/server):
//   npm run import:referees:dry               → simulación sin tocar la BD
//   npm run import:referees                   → actualiza metadatos arbitrales e importa la temporada actual (2026/27)
//   node sync/importReferees.js --season=2025 → recalcula/completa una temporada concreta

import { pathToFileURL } from 'node:url';
import { prisma } from '../db.js';
import { resolveSeason } from '../utils/seasons.js';
import {
  checkFotmobPhotoExists,
  fetchFotmobMatchRefereeSummary,
  fetchFotmobSeasonFixtures,
  fotmobPlayerPhotoUrl,
  suggestFotmobReferees,
} from './fotmobClient.js';
import { buildTeamMaps, createPlayerMatcher } from './playerMatcher.js';
import { createRefereeMatcher, deriveRefereeShortName, lookupRefereeMeta, refereeTokens } from './refereeMetadata.js';

const FOTMOB_SOURCE = 'FOTMOB';
const RESOURCE_NAME = 'referees';
const MATCH_CONCURRENCY = 10;
const SUGGEST_CONCURRENCY = 2;
const SUGGEST_PAUSE_MS = 200;
const HEAD_CONCURRENCY = 12;
const MAX_FETCH_RETRIES = 2;
const RETRY_BASE_MS = 500;
const MAX_SMALLINT = 32767;
const REFEREE_TX_TIMEOUT_MS = 120000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseCliArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const seasonArg = argv.find((arg) => arg.startsWith('--season='))?.split('=')[1];
  return { dryRun, seasonArg };
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

async function fetchSummaryWithRetry(fmMatchId, failures) {
  for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt++) {
    try {
      const summary = await fetchFotmobMatchRefereeSummary(fmMatchId);
      return { summary, requests: attempt + 1 };
    } catch {
      if (attempt < MAX_FETCH_RETRIES) await sleep(RETRY_BASE_MS * (attempt + 1));
    }
  }
  failures.count++;
  return { summary: null, requests: MAX_FETCH_RETRIES + 1 };
}

function isEditorLocked(fieldSources, column) {
  return Boolean(fieldSources && typeof fieldSources === 'object' && fieldSources[column] === 'EDITOR');
}

async function computeEarliestMatchYears() {
  const rows = await prisma.$queryRaw`
    SELECT m.referee_id, MIN(s.start_year)::int AS min_year
    FROM matches m
    JOIN seasons s ON s.id = m.season_id
    WHERE m.referee_id IS NOT NULL AND m.is_simulated = false
    GROUP BY m.referee_id
  `;
  return new Map(rows.map((r) => [r.referee_id, r.min_year]));
}

function buildRefereeMetaUpdates(referees, earliestYears) {
  const updates = [];
  for (const ref of referees) {
    const meta = lookupRefereeMeta(ref.name);
    const minYear = earliestYears.get(ref.id) ?? null;
    const targetFirstSeason = meta?.firstSeason ?? ref.first_season ?? minYear;
    const data = {};

    if (meta?.committee && ref.committee !== meta.committee) data.committee = meta.committee;
    if (meta != null && ref.is_fifa !== meta.isFifa) data.is_fifa = meta.isFifa;
    if (targetFirstSeason != null && ref.first_season !== targetFirstSeason) data.first_season = targetFirstSeason;
    if (meta?.shortName && ref.short_name !== meta.shortName) data.short_name = meta.shortName;

    if (Object.keys(data).length > 0) updates.push({ id: ref.id, data });
  }
  return updates;
}

// Exige que todas las palabras significativas del árbitro de nuestra BD estén en el candidato de FotMob
// (evita confundir hermanos como Fernando vs José Antonio Teixeira Vitienes)
function isExactRefereeCandidate(dbName, candidateName) {
  const dbToks = refereeTokens(dbName);
  if (dbToks.length < 2) return false;
  const candSet = new Set(refereeTokens(candidateName));
  return dbToks.every((tok) => candSet.has(tok));
}

async function resolveRefereePhotos(referees, matchFmIdByRefId) {
  const takenFmIds = new Set(referees.filter((r) => r.fm_id != null).map((r) => r.fm_id));
  const candidateFmByRef = new Map();

  for (const ref of referees) {
    if (ref.photo_url != null) continue;
    if (ref.fm_id != null) {
      candidateFmByRef.set(ref.id, { fmId: ref.fm_id, fromMatch: true });
      continue;
    }
    const fromMatch = matchFmIdByRefId.get(ref.id);
    if (fromMatch != null && !takenFmIds.has(fromMatch)) {
      takenFmIds.add(fromMatch);
      candidateFmByRef.set(ref.id, { fmId: fromMatch, fromMatch: true });
    }
  }

  const needSuggest = referees.filter((r) => r.photo_url == null && !candidateFmByRef.has(r.id));
  let suggestRequests = 0;
  const suggested = await mapWithConcurrency(needSuggest, SUGGEST_CONCURRENCY, async (ref) => {
    try {
      suggestRequests++;
      const options = await suggestFotmobReferees(ref.name);
      await sleep(SUGGEST_PAUSE_MS);
      return { ref, options };
    } catch {
      return { ref, options: [] };
    }
  });

  for (const { ref, options } of suggested) {
    const matchOpt = options.find(
      (opt) => !takenFmIds.has(BigInt(opt.fmRefereeId)) && isExactRefereeCandidate(ref.name, opt.name),
    );
    if (matchOpt) {
      const fmBig = BigInt(matchOpt.fmRefereeId);
      takenFmIds.add(fmBig);
      candidateFmByRef.set(ref.id, { fmId: fmBig, fromMatch: false });
    }
  }

  const entries = [...candidateFmByRef.entries()].map(([refId, info]) => ({ refId, ...info }));
  const checked = await mapWithConcurrency(entries, HEAD_CONCURRENCY, async (entry) => ({
    ...entry,
    hasPhoto: await checkFotmobPhotoExists(entry.fmId),
  }));

  const photoUpdates = new Map();
  for (const item of checked) {
    const ref = referees.find((r) => r.id === item.refId);
    if (!ref) continue;
    const data = {};
    if (item.hasPhoto) {
      data.photo_url = fotmobPlayerPhotoUrl(item.fmId);
      data.photo_source = FOTMOB_SOURCE;
      if (ref.fm_id == null) data.fm_id = item.fmId;
    } else if (item.fromMatch && ref.fm_id == null) {
      data.fm_id = item.fmId;
    }
    if (Object.keys(data).length > 0) photoUpdates.set(item.refId, data);
  }

  return { photoUpdates, requests: suggestRequests + entries.length };
}

function pickBestDbMatch(candidates, utcDate) {
  if (candidates.length === 0) return null;
  if (candidates.length === 1 || !utcDate) return candidates[0];
  return [...candidates].sort(
    (a, b) => Math.abs(a.utc_date.getTime() - utcDate.getTime()) - Math.abs(b.utc_date.getTime() - utcDate.getTime()),
  )[0];
}

function pairSeasonMatches(fixtures, dbMatches, teamIdByFmId) {
  const byFmId = new Map(dbMatches.filter((m) => m.fm_id != null).map((m) => [Number(m.fm_id), m]));
  const used = new Set();
  const paired = [];

  for (const fix of fixtures) {
    const homeTeamId = teamIdByFmId.get(fix.fmHomeTeamId);
    const awayTeamId = teamIdByFmId.get(fix.fmAwayTeamId);
    if (!homeTeamId || !awayTeamId) continue;

    let dbMatch = byFmId.get(fix.fmMatchId) ?? null;
    if (!dbMatch) {
      const pool = dbMatches.filter(
        (m) => !used.has(m.id) && m.home_team_id === homeTeamId && m.away_team_id === awayTeamId,
      );
      dbMatch = pickBestDbMatch(pool, fix.utcDate);
    }
    if (!dbMatch || used.has(dbMatch.id)) continue;
    used.add(dbMatch.id);
    paired.push({ fixture: fix, dbMatch });
  }
  return paired;
}

async function ensureSeasonReferees(fetchedItems, dbReferees, seasonYear, dryRun) {
  let matcher = createRefereeMatcher(dbReferees);
  const seenMissing = new Map();

  for (const { summary } of fetchedItems) {
    const ref = summary?.referee;
    if (!ref?.name || matcher.match(ref.name) != null || seenMissing.has(ref.name)) continue;
    const meta = lookupRefereeMeta(ref.name);
    seenMissing.set(ref.name, {
      name: ref.name,
      short_name: deriveRefereeShortName(ref.name),
      nationality: ref.country || 'Spain',
      committee: meta?.committee ?? null,
      is_fifa: meta?.isFifa ?? false,
      first_season: meta?.firstSeason ?? seasonYear,
    });
  }

  if (!dryRun && seenMissing.size > 0) {
    for (const data of seenMissing.values()) {
      const created = await prisma.referees.create({ data });
      dbReferees.push(created);
    }
    matcher = createRefereeMatcher(dbReferees);
  }
  return { matcher, createdCount: seenMissing.size };
}

function buildMatchEventsPayload(dbMatchId, rawEvents, teamIdByFmId, byFmPlayerId, playerMatcher) {
  const rows = [];
  for (const ev of rawEvents) {
    const teamId = teamIdByFmId.get(ev.fmTeamId);
    if (!teamId) continue;
    const playerId =
      (ev.fmPlayerId && byFmPlayerId.get(ev.fmPlayerId)) ||
      (ev.playerName ? playerMatcher.match({ fmPlayerId: ev.fmPlayerId, name: ev.playerName, teamId }) : null);
    if (!playerId && !ev.playerName) continue;

    const relatedPlayerId =
      (ev.fmRelatedPlayerId && byFmPlayerId.get(ev.fmRelatedPlayerId)) ||
      (ev.relatedPlayerName
        ? playerMatcher.match({ fmPlayerId: ev.fmRelatedPlayerId, name: ev.relatedPlayerName, teamId })
        : null);

    rows.push({
      match_id: dbMatchId,
      minute: ev.minute,
      extra_minute: ev.extraMinute,
      type: ev.type,
      team_id: teamId,
      player_id: playerId ?? null,
      player_name: ev.playerName,
      related_player_id: relatedPlayerId ?? null,
      related_player_name: ev.relatedPlayerName,
      source: FOTMOB_SOURCE,
      external_key: ev.externalKey,
    });
  }
  return rows;
}

// Calcula las estadísticas arbitrales de una temporada cuadrando amarillas con `appearances` y rojas con `match_events`
async function buildSeasonRefereeStats(seasonId, penaltiesByMatch = null) {
  const finishedMatches = await prisma.matches.findMany({
    where: { season_id: seasonId, status: 'FINISHED', is_simulated: false, referee_id: { not: null } },
    select: { id: true, referee_id: true },
  });
  if (finishedMatches.length === 0) return [];

  const matchIds = finishedMatches.map((m) => m.id);
  const [yellowRows, redRows, penaltyGoalRows, missedPenRows] = await Promise.all([
    prisma.appearances.groupBy({
      by: ['match_id'],
      where: { match_id: { in: matchIds } },
      _sum: { yellow_cards: true },
    }),
    prisma.match_events.groupBy({
      by: ['match_id'],
      where: { match_id: { in: matchIds }, type: 'RED_CARD' },
      _count: true,
    }),
    prisma.match_events.groupBy({
      by: ['match_id'],
      where: { match_id: { in: matchIds }, type: 'PENALTY_GOAL' },
      _count: true,
    }),
    prisma.match_events.groupBy({
      by: ['match_id'],
      where: { match_id: { in: matchIds }, type: 'MISSED_PENALTY' },
      _count: true,
    }),
  ]);

  const yellowsByMatch = new Map(yellowRows.map((r) => [r.match_id, r._sum.yellow_cards ?? 0]));
  const redsByMatch = new Map(redRows.map((r) => [r.match_id, r._count]));
  const penEventsByMatch = new Map();
  for (const r of [...penaltyGoalRows, ...missedPenRows]) {
    penEventsByMatch.set(r.match_id, (penEventsByMatch.get(r.match_id) ?? 0) + r._count);
  }

  const byReferee = new Map();
  for (const match of finishedMatches) {
    const agg = byReferee.get(match.referee_id) ?? { matches: 0, yellow_cards: 0, red_cards: 0, penalties: 0 };
    agg.matches++;
    agg.yellow_cards += yellowsByMatch.get(match.id) ?? 0;
    agg.red_cards += redsByMatch.get(match.id) ?? 0;
    agg.penalties += penaltiesByMatch?.get(match.id) ?? penEventsByMatch.get(match.id) ?? 0;
    byReferee.set(match.referee_id, agg);
  }

  return [...byReferee.entries()].map(([refereeId, stats]) => ({ referee_id: refereeId, ...stats }));
}

async function upsertRefereeSeasonStats(tx, seasonId, computedRows) {
  const existing = await tx.referee_season_stats.findMany({ where: { season_id: seasonId } });
  const existingByRef = new Map(existing.map((r) => [r.referee_id, r]));
  let written = 0;

  for (const row of computedRows) {
    const prev = existingByRef.get(row.referee_id);
    if (!prev) {
      await tx.referee_season_stats.create({
        data: { season_id: seasonId, ...row, source: FOTMOB_SOURCE },
      });
      written++;
      continue;
    }

    const fs = prev.field_sources;
    const data = {};
    for (const col of ['matches', 'yellow_cards', 'red_cards', 'penalties']) {
      if (!isEditorLocked(fs, col) && prev[col] !== row[col]) data[col] = row[col];
    }
    if (Object.keys(data).length > 0) {
      await tx.referee_season_stats.update({
        where: { season_id_referee_id: { season_id: seasonId, referee_id: row.referee_id } },
        data: { ...data, updated_at: new Date() },
      });
      written++;
    }
  }
  return written;
}

// Rellena red_cards en temporadas pasadas (p. ej. 2025/26, donde quedó a 0 pese a existir RED_CARD en match_events)
async function repairHistoricalRedCards(dryRun) {
  const broken = await prisma.$queryRaw`
    WITH real_reds AS (
      SELECT m.season_id, m.referee_id, COUNT(*)::smallint AS reds
      FROM match_events me
      JOIN matches m ON m.id = me.match_id
      WHERE me.type = 'RED_CARD' AND m.status = 'FINISHED' AND m.is_simulated = false AND m.referee_id IS NOT NULL
      GROUP BY m.season_id, m.referee_id
    )
    SELECT rss.season_id, rss.referee_id, rr.reds, rss.field_sources
    FROM referee_season_stats rss
    JOIN real_reds rr ON rr.season_id = rss.season_id AND rr.referee_id = rss.referee_id
    WHERE rss.red_cards = 0 AND rr.reds > 0
  `;

  const fixable = broken.filter((row) => !isEditorLocked(row.field_sources, 'red_cards'));
  if (!dryRun && fixable.length > 0) {
    await prisma.$transaction(
      fixable.map((row) =>
        prisma.referee_season_stats.update({
          where: { season_id_referee_id: { season_id: row.season_id, referee_id: row.referee_id } },
          data: { red_cards: row.reds, updated_at: new Date() },
        }),
      ),
    );
  }
  return fixable.length;
}

async function loadRefData() {
  const [teams, players, referees, pastClubs] = await Promise.all([
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
    prisma.referees.findMany(),
    prisma.player_season_stats.findMany({
      select: { player_id: true, team_id: true },
      distinct: ['player_id', 'team_id'],
    }),
  ]);

  const clubHistory = new Map();
  for (const row of pastClubs) {
    const list = clubHistory.get(row.player_id) ?? [];
    list.push(row.team_id);
    clubHistory.set(row.player_id, list);
  }
  return { teams, players, referees, clubHistory };
}

export async function importReferees({ dryRun = false, seasonArg } = {}) {
  const startedAt = new Date();
  const [{ season }, refData, earliestYears] = await Promise.all([
    resolveSeason(seasonArg),
    loadRefData(),
    computeEarliestMatchYears(),
  ]);

  const teamMaps = buildTeamMaps(refData.teams);
  const playerMatcher = createPlayerMatcher(refData.players, refData.clubHistory);
  const byFmPlayerId = new Map(refData.players.filter((p) => p.fm_id != null).map((p) => [Number(p.fm_id), p.id]));

  const [fixturesRes, dbMatches] = await Promise.all([
    fetchFotmobSeasonFixtures(season.start_year),
    prisma.matches.findMany({
      where: { season_id: season.id, is_simulated: false },
      select: { id: true, home_team_id: true, away_team_id: true, utc_date: true, fm_id: true, referee_id: true },
    }),
  ]);

  const paired = pairSeasonMatches(fixturesRes.fixtures, dbMatches, teamMaps.teamIdByFmId);
  const failures = { count: 0 };
  const fetched = await mapWithConcurrency(paired, MATCH_CONCURRENCY, async (item) => ({
    ...item,
    ...(await fetchSummaryWithRetry(item.fixture.fmMatchId, failures)),
  }));

  const { matcher: refMatcher, createdCount: newReferees } = await ensureSeasonReferees(
    fetched,
    refData.referees,
    season.start_year,
    dryRun,
  );

  const matchUpdates = [];
  const eventsToCreate = [];
  const penaltiesByMatch = new Map();
  const matchFmIdByRefId = new Map();
  let detailRequests = 0;

  for (const entry of fetched) {
    detailRequests += entry.requests;
    if (!entry.summary) continue;

    const refSummary = entry.summary.referee;
    const refId = refSummary ? refMatcher.match(refSummary.name) : null;
    if (refId != null && refSummary?.fmRefereeId != null) {
      matchFmIdByRefId.set(refId, BigInt(refSummary.fmRefereeId));
    }

    const matchData = {};
    if (refId != null && entry.dbMatch.referee_id !== refId) matchData.referee_id = refId;
    if (entry.dbMatch.fm_id == null) matchData.fm_id = BigInt(entry.fixture.fmMatchId);
    if (Object.keys(matchData).length > 0) matchUpdates.push({ id: entry.dbMatch.id, data: matchData });

    penaltiesByMatch.set(entry.dbMatch.id, entry.summary.penalties);
    eventsToCreate.push(
      ...buildMatchEventsPayload(
        entry.dbMatch.id,
        entry.summary.events,
        teamMaps.teamIdByFmId,
        byFmPlayerId,
        playerMatcher,
      ),
    );
  }

  const metaUpdates = buildRefereeMetaUpdates(refData.referees, earliestYears);
  const { photoUpdates, requests: photoRequests } = await resolveRefereePhotos(refData.referees, matchFmIdByRefId);
  const combinedRefUpdates = mergeRefereeUpdates(metaUpdates, photoUpdates);
  const photosAdded = [...photoUpdates.values()].filter((d) => d.photo_url != null).length;
  const requests = fixturesRes.requests + detailRequests + photoRequests;
  let seasonStatsWritten;

  if (!dryRun) {
    await prisma.$transaction(
      async (tx) => {
        for (const item of combinedRefUpdates) {
          await tx.referees.update({ where: { id: item.id }, data: { ...item.data, updated_at: new Date() } });
        }
        for (const item of matchUpdates) {
          await tx.matches.update({ where: { id: item.id }, data: item.data });
        }
        if (eventsToCreate.length > 0) {
          await tx.match_events.createMany({ data: eventsToCreate, skipDuplicates: true });
        }
      },
      { timeout: REFEREE_TX_TIMEOUT_MS },
    );

    const computedStats = await buildSeasonRefereeStats(season.id, penaltiesByMatch);
    seasonStatsWritten = await prisma.$transaction((tx) => upsertRefereeSeasonStats(tx, season.id, computedStats), {
      timeout: REFEREE_TX_TIMEOUT_MS,
    });
  } else {
    const computedStats = await buildSeasonRefereeStats(season.id, penaltiesByMatch);
    seasonStatsWritten = computedStats.length;
  }

  const historicalRepaired = await repairHistoricalRedCards(dryRun);

  if (!dryRun) {
    const totalRecords = combinedRefUpdates.length + matchUpdates.length + seasonStatsWritten + historicalRepaired;
    await prisma.sync_runs.create({
      data: {
        source: FOTMOB_SOURCE,
        resource: RESOURCE_NAME,
        season_id: season.id,
        status: 'OK',
        records: totalRecords,
        requests: Math.min(requests, MAX_SMALLINT),
        error: failures.count > 0 ? `${failures.count} partidos no han podido descargarse` : null,
        started_at: startedAt,
        finished_at: new Date(Math.max(Date.now(), startedAt.getTime())),
      },
    });
  }

  return {
    season: season.label,
    matchesChecked: paired.length - failures.count,
    failedMatches: failures.count,
    newReferees,
    metaUpdated: metaUpdates.length,
    photosAdded,
    matchesLinked: matchUpdates.length,
    eventsProcessed: eventsToCreate.length,
    seasonStatsWritten,
    historicalRepaired,
    requests,
  };
}

function mergeRefereeUpdates(metaUpdates, photoUpdates) {
  const byId = new Map(metaUpdates.map((item) => [item.id, { ...item.data }]));
  for (const [id, data] of photoUpdates.entries()) {
    byId.set(id, { ...(byId.get(id) ?? {}), ...data });
  }
  return [...byId.entries()].map(([id, data]) => ({ id, data }));
}

async function runCli() {
  const { dryRun, seasonArg } = parseCliArgs(process.argv.slice(2));
  try {
    const s = await importReferees({ dryRun, seasonArg });
    const mode = dryRun ? '[DRY-RUN]' : '[OK]';
    console.log(
      `${mode} ${s.season} referees: ${s.matchesChecked} partidos (${s.matchesLinked} matches actualizados, ` +
        `${s.newReferees} árbitros nuevos, ${s.metaUpdated} fichas, ${s.photosAdded} retratos añadidos, ` +
        `${s.seasonStatsWritten} filas referee_season_stats, ${s.eventsProcessed} eventos leídos, ` +
        `${s.historicalRepaired} históricos reparados, ${s.requests} peticiones, ${s.failedMatches} fallidos)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
