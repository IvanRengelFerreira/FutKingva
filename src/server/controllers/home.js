// Resumen de la portada (01 · Inicio). Responsable: Ivan.
//   GET /api/home → jornada actual, partidos en juego, últimos resultados, próximos partidos,
//                   clasificación rápida (top 5), análisis destacado y jugador de la jornada.

import { prisma } from '../db.js';
import { resolveSeason, seasonSummary } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from '../utils/teams.js';
import { MATCH_TEAMS, matchSummary } from '../utils/matches.js';
import { standingRow } from '../utils/standings.js';

const LIVE_STATUSES = ['IN_PLAY', 'PAUSED'];
const UPCOMING_STATUSES = ['SCHEDULED', 'TIMED'];
const LATEST_RESULTS_LIMIT = 8;
const UPCOMING_MATCHES_LIMIT = 8;
const STANDINGS_LIMIT = 5;
const FEATURED_TAG = 'Destacado';

export async function overview(req, res) {
  const { season } = await resolveSeason();

  const [liveMatches, latestResults, upcomingMatches, standings, featuredArticle, topScorerOfRound] = await Promise.all(
    [
      findLiveMatches(season.id),
      findLatestResults(season.id),
      findUpcomingMatches(season.id),
      findTopStandings(season.id),
      findFeaturedArticle(),
      findTopScorerOfRound(season.id),
    ],
  );

  res.json({
    round: season.current_matchday,
    season: seasonSummary(season),
    liveMatches,
    latestResults,
    upcomingMatches,
    standings,
    featuredArticle,
    topScorerOfRound,
  });
}

async function findLiveMatches(seasonId) {
  const rows = await prisma.matches.findMany({
    where: { season_id: seasonId, status: { in: LIVE_STATUSES } },
    orderBy: { utc_date: 'asc' },
    include: MATCH_TEAMS,
  });
  return rows.map(matchSummary);
}

async function findLatestResults(seasonId) {
  const rows = await prisma.matches.findMany({
    // Los partidos simulados de la demo solo se ven en directo, nunca como resultado
    where: { season_id: seasonId, status: 'FINISHED', is_simulated: false },
    orderBy: { utc_date: 'desc' },
    take: LATEST_RESULTS_LIMIT,
    include: MATCH_TEAMS,
  });
  return rows.map(matchSummary);
}

async function findUpcomingMatches(seasonId) {
  const rows = await prisma.matches.findMany({
    where: {
      season_id: seasonId,
      status: { in: UPCOMING_STATUSES },
      utc_date: { gte: new Date() },
      is_simulated: false,
    },
    orderBy: { utc_date: 'asc' },
    take: UPCOMING_MATCHES_LIMIT,
    include: MATCH_TEAMS,
  });
  return rows.map(matchSummary);
}

async function findTopStandings(seasonId) {
  const rows = await prisma.standings.findMany({
    where: { season_id: seasonId },
    orderBy: { position: 'asc' },
    take: STANDINGS_LIMIT,
    include: { teams: { select: TEAM_SUMMARY_FIELDS } },
  });
  return rows.map(standingRow);
}

function findLatestPublishedArticle(extraWhere = {}) {
  return prisma.articles.findFirst({
    // Publicado y con fecha ya pasada: un artículo programado no sale hasta su hora
    where: { status: 'PUBLISHED', published_at: { lte: new Date() }, ...extraWhere },
    orderBy: [{ published_at: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      title: true,
      summary: true,
      published_at: true,
      users: { select: { name: true } },
    },
  });
}

// El último marcado como «Destacado»; si no hay ninguno, el último publicado
async function findFeaturedArticle() {
  const article =
    (await findLatestPublishedArticle({ tags: { has: FEATURED_TAG } })) ?? (await findLatestPublishedArticle());
  if (!article) return null;

  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    publishedAt: article.published_at,
    author: article.users?.name ?? null,
  };
}

function findLastFinishedMatchday(seasonId) {
  return prisma.matches.findFirst({
    where: { season_id: seasonId, status: 'FINISHED', matchday: { not: null }, is_simulated: false },
    orderBy: [{ matchday: 'desc' }, { utc_date: 'desc' }],
    select: { matchday: true },
  });
}

function findRoundTopAppearance(seasonId, matchday) {
  return prisma.appearances.findFirst({
    where: {
      goals: { gt: 0 },
      matches: { season_id: seasonId, matchday, status: 'FINISHED', is_simulated: false },
    },
    // Desempate: más goles, menos minutos jugados y menor id
    orderBy: [{ goals: 'desc' }, { minutes: 'asc' }, { player_id: 'asc' }],
    include: {
      players: { select: { id: true, name: true, photo_url: true } },
      teams: { select: TEAM_SUMMARY_FIELDS },
    },
  });
}

async function findTopScorerOfRound(seasonId) {
  const lastFinished = await findLastFinishedMatchday(seasonId);
  if (!lastFinished) return null;

  const appearance = await findRoundTopAppearance(seasonId, lastFinished.matchday);
  if (!appearance) return null;

  return {
    id: appearance.players.id,
    name: appearance.players.name,
    photoUrl: appearance.players.photo_url,
    team: teamSummary(appearance.teams),
    goals: appearance.goals,
    round: lastFinished.matchday,
  };
}
