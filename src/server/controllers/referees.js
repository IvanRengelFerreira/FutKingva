// Árbitros de LaLiga (RF11). Responsable: Angel.
//
// Listado (06 · Árbitros): cada árbitro con sus cifras de la temporada y la media de la liga.
//   GET /api/referees?season=2025&q=gil&sort=cardsPerMatch|matches|redCards|penalties|name&limit=10&offset=0
//
// Ficha (07 · Ficha de árbitro):
//   GET /api/referees/:id?season=2025
// Datos del árbitro, sus cifras de la temporada, la media de la liga, las temporadas en las que tiene cifras
// y sus partidos terminados con las tarjetas de cada uno.
//
// Temporada por defecto: NO es la actual, sino la última con estadísticas de árbitros (referee_season_stats),
// porque la temporada en juego puede tener partidos con árbitro pero todavía ninguna cifra; en cuanto las
// tenga, pasa a ser la de por defecto sin tocar nada. En la ficha, sin ?season, es la última en la que ese
// árbitro tiene cifras. La respuesta dice siempre de qué temporada es (season.label). Al pedir con ?season
// una temporada sin estadísticas, el listado llega vacío y la ficha con stats a null (no es un error).
//
// Partidos, amarillas y penaltis salen de referee_season_stats y las amarillas de cada partido, de appearances
// (cuadran entre sí). Las rojas, en cambio, se cuentan en match_events (RED_CARD; la doble amarilla va aparte,
// como en referee_season_stats): en 2025/26 la importación dejó las rojas a 0 en esas dos tablas y en las
// demás temporadas coinciden.

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { LALIGA, resolveSeason, seasonSummary } from '../utils/seasons.js';
import { MATCH_TEAMS, matchSummary } from '../utils/matches.js';
import { readId, readPagination } from '../utils/params.js';
import { readNameFilter, readSort, byName } from '../utils/search.js';

// Órdenes del listado (el primero, si no se pide ninguno)
const REFEREE_ORDERS = {
  cardsPerMatch: byStat('cardsPerMatch'),
  matches: byStat('matches'),
  redCards: byStat('redCards'),
  penalties: byStat('penalties'),
  name: byName,
};

export async function list(req, res) {
  const { limit, offset } = readPagination(req.query);
  const sort = readSort(req.query.sort, Object.keys(REFEREE_ORDERS));
  const matchesName = readNameFilter(req.query.q);
  const seasons = await findStatsSeasons();
  const { season, isCurrent } = await resolveRefereeSeason(req.query.season, seasons);

  const [rows, redCards] = await Promise.all([
    prisma.referee_season_stats.findMany({ where: { season_id: season.id }, include: { referees: true } }),
    findRedCardsByReferee(season.id),
  ]);
  const referees = rows
    .filter((row) => matchesName(row.referees.name, row.referees.short_name))
    .map((row) => ({ ...refereeSummary(row.referees), ...seasonStats(row, redCards) }))
    .sort(REFEREE_ORDERS[sort]);

  res.json({
    items: referees.slice(offset, offset + limit),
    total: referees.length,
    limit,
    offset,
    season: { ...seasonSummary(season), isCurrent },
    seasons,
    leagueCardsPerMatch: leagueAverage(rows, redCards),
  });
}

// De mayor a menor; si empatan, por tarjetas por partido y después por nombre e id (orden estable al paginar)
function byStat(field) {
  return (a, b) =>
    valueOf(b, field) - valueOf(a, field) || valueOf(b, 'cardsPerMatch') - valueOf(a, 'cardsPerMatch') || byName(a, b);
}

function valueOf(referee, field) {
  return referee[field] ?? -1;
}

export async function detail(req, res) {
  const id = readId(req.params.id, 'id del árbitro');
  const referee = await prisma.referees.findUnique({ where: { id } });
  if (!referee) throw AppError.notFound('No existe ese árbitro');

  const seasons = await findStatsSeasons(id);
  const defaultSeasons = seasons.length > 0 ? seasons : await findStatsSeasons();
  const { season, isCurrent } = await resolveRefereeSeason(req.query.season, defaultSeasons);

  const [rows, redCards, matches] = await Promise.all([
    prisma.referee_season_stats.findMany({ where: { season_id: season.id } }),
    findRedCardsByReferee(season.id),
    findRefereeMatches(season.id, id),
  ]);
  const own = rows.find((row) => row.referee_id === id);

  res.json({
    referee: refereeProfile(referee),
    season: { ...seasonSummary(season), isCurrent },
    seasons,
    stats: own ? seasonStats(own, redCards) : null,
    leagueCardsPerMatch: leagueAverage(rows, redCards),
    matches,
  });
}

/** Temporadas de LaLiga con cifras de árbitros (o solo las de ese árbitro), de la más reciente a la más antigua */
async function findStatsSeasons(refereeId) {
  const seasons = await prisma.seasons.findMany({
    where: {
      competitions_seasons_competition_idTocompetitions: { name: LALIGA },
      referee_season_stats: { some: { referee_id: refereeId } },
    },
    orderBy: { start_year: 'desc' },
  });
  return seasons.map(seasonSummary);
}

/** La temporada de ?season o, sin él, la primera de la lista (si la lista está vacía, la actual) */
function resolveRefereeSeason(seasonParam, seasons) {
  return resolveSeason(seasonParam || seasons[0]?.year);
}

function refereeSummary(referee) {
  return {
    id: referee.id,
    name: referee.name,
    shortName: referee.short_name ?? referee.name,
    photoUrl: referee.photo_url ?? null,
    committee: referee.committee,
    fifa: referee.is_fifa,
  };
}

function refereeProfile(referee) {
  return { ...refereeSummary(referee), nationality: referee.nationality, firstSeason: referee.first_season };
}

/** Rojas de la temporada por árbitro (Map de referee_id → rojas), contadas en match_events */
async function findRedCardsByReferee(seasonId) {
  const events = await prisma.match_events.findMany({
    where: {
      type: 'RED_CARD',
      matches: { season_id: seasonId, referee_id: { not: null }, status: 'FINISHED', is_simulated: false },
    },
    select: { matches: { select: { referee_id: true } } },
  });
  const redCards = new Map();
  for (const { matches } of events) {
    redCards.set(matches.referee_id, (redCards.get(matches.referee_id) ?? 0) + 1);
  }
  return redCards;
}

function seasonStats(row, redCards) {
  const reds = redCards.get(row.referee_id) ?? 0;
  return {
    matches: row.matches,
    yellowCards: row.yellow_cards,
    redCards: reds,
    penalties: row.penalties,
    cardsPerMatch: cardsPerMatch(row.yellow_cards + reds, row.matches),
  };
}

function cardsPerMatch(cards, matches) {
  return matches > 0 ? cards / matches : null;
}

/** Media de la liga: todas las tarjetas de la temporada entre todos los partidos arbitrados */
function leagueAverage(rows, redCards) {
  const cards = rows.reduce((sum, row) => sum + row.yellow_cards + (redCards.get(row.referee_id) ?? 0), 0);
  const matches = rows.reduce((sum, row) => sum + row.matches, 0);
  return cardsPerMatch(cards, matches);
}

/** Partidos terminados que pitó esa temporada, del más reciente al más antiguo, con sus tarjetas */
async function findRefereeMatches(seasonId, refereeId) {
  const matches = await prisma.matches.findMany({
    where: { season_id: seasonId, referee_id: refereeId, status: 'FINISHED', is_simulated: false },
    orderBy: [{ utc_date: 'desc' }, { id: 'desc' }],
    include: MATCH_TEAMS,
  });
  const ids = matches.map((match) => match.id);
  const [yellows, reds] = await Promise.all([
    prisma.appearances.groupBy({ by: ['match_id'], where: { match_id: { in: ids } }, _sum: { yellow_cards: true } }),
    prisma.match_events.groupBy({ by: ['match_id'], where: { match_id: { in: ids }, type: 'RED_CARD' }, _count: true }),
  ]);
  const yellowsByMatch = new Map(yellows.map((row) => [row.match_id, row._sum.yellow_cards]));
  const redsByMatch = new Map(reds.map((row) => [row.match_id, row._count]));
  return matches.map((match) => refereeMatch(match, yellowsByMatch.get(match.id), redsByMatch.get(match.id) ?? 0));
}

// Sin alineaciones del partido no se sabe cuántas tarjetas hubo: null, no cero
function refereeMatch(match, yellowCards, redCards) {
  const { id, date, round, homeTeam, awayTeam, score } = matchSummary(match);
  return {
    id,
    date,
    round,
    homeTeam,
    awayTeam,
    score,
    yellowCards: yellowCards ?? null,
    redCards: yellowCards == null ? null : redCards,
  };
}
