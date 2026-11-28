// Jugadores de LaLiga (04 · Ficha de jugador, 10 · Comparador, 11 · Equipo ideal). Responsable: Ivan.
//   GET /api/players?search=&ids=&position=&sort=&scope=&limit=&offset=  → listado paginado
//     ?scope=all: sin el filtro de plantilla (todo el histórico; lo usa el Editor de artículo para enlazar jugadores)
//     ?sort=rating|goals|assists|name (por defecto rating; lo usa 02 · Equipos y jugadores, Angel)
//   GET /api/players/:id?season=2025                        → ficha completa del jugador

import { Prisma } from '../generated/prisma/client.ts';
import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { resolveSeason, listSeasons, seasonSummary } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from '../utils/teams.js';
import { MATCH_TEAMS } from '../utils/matches.js';
import { readId, readPagination } from '../utils/params.js';
import { toLikePattern, foldedLike } from '../utils/search.js';
import {
  VALID_POSITIONS,
  aggregateSeasonStats,
  playerProfile,
  playerListItem,
  playerAppearance,
} from '../utils/players.js';

const MAX_IDS = 4; // Límite del Comparador (RF4: de 2 a 4 jugadores)
const LAST_MATCHES_COUNT = 5;
const MIN_RANK_MATCHES = 3; // Mínimo de partidos en la temporada para entrar en los rankings
const TEAM_INCLUDE = { select: TEAM_SUMMARY_FIELDS };
const SORTS = ['rating', 'goals', 'assists', 'name']; // El primero es el orden por defecto
const SCOPES = ['squad', 'all']; // squad (por defecto): solo la plantilla de la temporada; all: todo el histórico

/**
 * GET /api/players
 * El listado solo trae a los jugadores de la plantilla de la temporada (salvo con ?scope=all), con la misma regla que la ficha de
 * equipo (findSquad en teams.js): en la actual, los de los clubes que la juegan; en una pasada, los que tienen
 * estadísticas con un club ese año. El club que se enseña es el de esa temporada (pickSeasonClub).
 * Si llega ?ids=1,2,3 (máx. 4), devuelve esos jugadores en ese orden e ignora search, limit, offset y la
 * plantilla (una comparativa guardada puede tener jugadores que ya no están).
 * Cada elemento de `items` sigue la forma de `playerListItem` (reutilizada por 10 · Comparador y 11 · Equipo ideal):
 *   { id, name, number, position, positionGroup, age, team, matches, minutes, goals, assists,
 *     xg, shotsOnTarget, passAccuracy, keyPasses, yellowCards, redCards, rating }
 */
export async function list(req, res) {
  const { season, isCurrent } = await resolveSeason(req.query.season);
  const position = parsePosition(req.query.position);

  if (req.query.ids !== undefined) {
    const ids = parseIds(req.query.ids);
    const items = await loadPlayerItems(ids, season.id, isCurrent, position);
    res.json({ items, total: items.length, limit: MAX_IDS, offset: 0 });
    return;
  }

  const { limit, offset } = readPagination(req.query);
  const onlySquad = parseScope(req.query.scope) === 'squad';
  const filter = playerFilter(season.id, isCurrent, onlySquad, toLikePattern(req.query.search), position);
  const sort = parseSort(req.query.sort);

  const [total, ids, seasons] = await Promise.all([
    countFilteredPlayers(filter),
    findRankedPlayerIds(season.id, filter, sort, limit, offset),
    listSeasons(),
  ]);
  const items = await loadPlayerItems(ids, season.id, isCurrent);

  // seasons: las temporadas que se pueden elegir en el desplegable de 02 · Equipos y jugadores
  res.json({ items, total, limit, offset, season: { ...seasonSummary(season), isCurrent }, seasons });
}

/** GET /api/players/:id */
export async function detail(req, res) {
  const id = readId(req.params.id, 'id del jugador');
  const { season, isCurrent } = await resolveSeason(req.query.season);

  const player = await prisma.players.findUnique({ where: { id }, include: { teams: TEAM_INCLUDE } });
  if (!player) throw AppError.notFound('No existe ese jugador');

  const [seasonRows, allSeasonStats, appearances, seasons] = await Promise.all([
    findPlayerSeasonRows(id, season.id),
    prisma.player_season_stats.findMany({
      where: { season_id: season.id },
      select: { player_id: true, played: true, minutes: true, assists: true, rating: true },
    }),
    findLastAppearances(id, season.id),
    findPlayerSeasons(id, season),
  ]);

  const stats = aggregateSeasonStats(seasonRows);
  res.json({
    player: playerProfile(player),
    team: teamSummary(pickSeasonClub(player, seasonRows, isCurrent)),
    season: { ...seasonSummary(season), isCurrent },
    seasons,
    stats,
    ranks: computeRanks(stats, allSeasonStats),
    lastMatches: appearances.map(playerAppearance),
  });
}

function parsePosition(value) {
  if (value === undefined || value === '') return null;
  const normalized = String(value).trim().toUpperCase();
  if (!VALID_POSITIONS.includes(normalized)) {
    throw AppError.badRequest('La posición no es válida', {
      position: `Usa una de: ${VALID_POSITIONS.join(', ')}`,
    });
  }
  return normalized;
}

function parseScope(value) {
  if (value === undefined || value === '') return SCOPES[0];
  if (!SCOPES.includes(value)) {
    throw AppError.badRequest('El alcance no es válido', { scope: `Usa uno de: ${SCOPES.join(', ')}` });
  }
  return value;
}

function parseSort(value) {
  if (value === undefined || value === '') return SORTS[0];
  if (!SORTS.includes(value)) {
    throw AppError.badRequest('El orden no es válido', { sort: `Usa uno de: ${SORTS.join(', ')}` });
  }
  return value;
}

// Va delante del orden de siempre (valoración, minutos…), que hace de desempate
function sortPrefix(sort) {
  if (sort === 'goals') return Prisma.sql`st.goals DESC NULLS LAST,`;
  if (sort === 'assists') return Prisma.sql`st.assists DESC NULLS LAST,`;
  if (sort === 'name') return Prisma.sql`p.name ASC,`;
  return Prisma.empty;
}

function parseIds(value) {
  const parts = String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw AppError.badRequest('El parámetro ids no es válido', {
      ids: `Indica entre 1 y ${MAX_IDS} ids numéricos separados por comas`,
    });
  }
  if (parts.length > MAX_IDS) {
    throw AppError.badRequest(`Como máximo se pueden pedir ${MAX_IDS} jugadores a la vez`, {
      ids: `Máximo ${MAX_IDS} jugadores`,
    });
  }

  const seen = new Set();
  const ids = [];
  for (const part of parts) {
    const id = readId(part, 'id del jugador');
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

// Filtro común para countFilteredPlayers y findRankedPlayerIds: plantilla de la temporada (si onlySquad),
// nombre (sin distinguir mayúsculas ni tildes) y posición
function playerFilter(seasonId, isCurrent, onlySquad, pattern, position) {
  return Prisma.sql`
    WHERE ${onlySquad ? squadFilter(seasonId, isCurrent) : Prisma.sql`TRUE`}
      AND (${pattern}::text IS NULL OR ${foldedLike(Prisma.sql`p.name`, pattern)})
      AND (${position}::text IS NULL OR p.position::text = ${position})
  `;
}

// Misma regla que findSquad (teams.js): players.team_id es solo el club de ahora
function squadFilter(seasonId, isCurrent) {
  return isCurrent
    ? Prisma.sql`p.team_id IN (SELECT team_id FROM season_teams WHERE season_id = ${seasonId})`
    : Prisma.sql`EXISTS (
        SELECT 1 FROM player_season_stats ps
        WHERE ps.player_id = p.id AND ps.season_id = ${seasonId} AND ps.team_id IS NOT NULL
      )`;
}

// SQL directo: Prisma no puede ordenar players por agregados de player_season_stats ni plegar tildes
async function countFilteredPlayers(filter) {
  const [row] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM players p
    ${filter}
  `;
  return row.total;
}

async function findRankedPlayerIds(seasonId, filter, sort, limit, offset) {
  const rows = await prisma.$queryRaw`
    WITH season_totals AS (
      SELECT
        player_id,
        SUM(played)::int AS played,
        SUM(minutes)::int AS minutes,
        SUM(goals)::int AS goals,
        SUM(assists)::int AS assists,
        -- Misma regla de ponderación que weightedRating en utils/players.js: mantener a la par
        CASE
          WHEN COUNT(rating) = 0 THEN NULL
          WHEN SUM(COALESCE(minutes, played, 1)) FILTER (WHERE rating IS NOT NULL) > 0 THEN
            SUM(rating * COALESCE(minutes, played, 1)) FILTER (WHERE rating IS NOT NULL)
            / SUM(COALESCE(minutes, played, 1)) FILTER (WHERE rating IS NOT NULL)
          ELSE AVG(rating)
        END AS rating
      FROM player_season_stats
      WHERE season_id = ${seasonId}
      GROUP BY player_id
    )
    SELECT p.id
    FROM players p
    LEFT JOIN season_totals st ON st.player_id = p.id
    ${filter}
    ORDER BY
      ${sortPrefix(sort)}
      st.rating DESC NULLS LAST,
      st.minutes DESC NULLS LAST,
      st.played DESC NULLS LAST,
      st.goals DESC NULLS LAST,
      (p.team_id IS NOT NULL) DESC,
      p.name ASC,
      p.id ASC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows.map((row) => row.id);
}

async function loadPlayerItems(ids, seasonId, isCurrent, position = null) {
  if (ids.length === 0) return [];
  const rows = await prisma.players.findMany({
    where: { id: { in: ids }, ...(position ? { position } : {}) },
    include: {
      teams: TEAM_INCLUDE,
      // Mismo orden que findPlayerSeasonRows, para que pickSeasonClub elija igual que en la ficha
      player_season_stats: {
        where: { season_id: seasonId },
        orderBy: [{ played: 'desc' }, { minutes: 'desc' }, { team_id: 'asc' }],
        include: { teams: TEAM_INCLUDE },
      },
    },
  });
  const byId = new Map(rows.map((player) => [player.id, player]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((player) =>
      playerListItem(
        player,
        aggregateSeasonStats(player.player_season_stats),
        pickSeasonClub(player, player.player_season_stats, isCurrent),
      ),
    );
}

// Ordenado por partidos y minutos (desempate por team_id) para que pickSeasonClub sea determinista si cambió de club
function findPlayerSeasonRows(playerId, seasonId) {
  return prisma.player_season_stats.findMany({
    where: { season_id: seasonId, player_id: playerId },
    orderBy: [{ played: 'desc' }, { minutes: 'desc' }, { team_id: 'asc' }],
    include: { teams: TEAM_INCLUDE },
  });
}

// En la temporada actual manda el club vigente (players.team_id); en históricas, el club con más partidos/minutos ese año
function pickSeasonClub(player, seasonRows, isCurrent) {
  const mainSeasonTeam = seasonRows[0]?.teams ?? null;
  return isCurrent ? (player.teams ?? mainSeasonTeam) : (mainSeasonTeam ?? player.teams);
}

function findLastAppearances(playerId, seasonId) {
  return prisma.appearances.findMany({
    where: { player_id: playerId, matches: { season_id: seasonId, status: 'FINISHED', is_simulated: false } },
    orderBy: { matches: { utc_date: 'desc' } },
    take: LAST_MATCHES_COUNT,
    include: { matches: { include: MATCH_TEAMS } },
  });
}

// Temporadas donde el jugador tiene registros (más la temporada consultada para que siempre aparezca en el selector)
async function findPlayerSeasons(playerId, activeSeason) {
  const [allSeasons, playedSeasons] = await Promise.all([
    listSeasons(),
    prisma.player_season_stats.findMany({
      where: { player_id: playerId },
      select: { season_id: true },
      distinct: ['season_id'],
    }),
  ]);
  const ids = new Set(playedSeasons.map((row) => row.season_id));
  ids.add(activeSeason.id);
  return allSeasons.filter((season) => ids.has(season.id));
}

function computeRanks(playerStats, allSeasonRows) {
  if (!playerStats || playerStats.played < MIN_RANK_MATCHES) {
    return { rating: null, assists: null };
  }

  const byPlayer = new Map();
  for (const row of allSeasonRows) {
    const list = byPlayer.get(row.player_id) ?? [];
    list.push(row);
    byPlayer.set(row.player_id, list);
  }

  const eligible = [...byPlayer.values()]
    .map(aggregateSeasonStats)
    .filter((item) => item && item.played >= MIN_RANK_MATCHES);

  const rating =
    playerStats.rating != null
      ? eligible.filter((item) => item.rating != null && item.rating > playerStats.rating).length + 1
      : null;
  // Con 0 asistencias no se muestra puesto en el ranking de asistentes
  const assists =
    playerStats.assists > 0 ? eligible.filter((item) => item.assists > playerStats.assists).length + 1 : null;

  return { rating, assists };
}
