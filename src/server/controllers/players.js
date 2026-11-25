// Jugadores de LaLiga (04 · Ficha de jugador, 10 · Comparador, 11 · Equipo ideal). Responsable: Ivan.
//   GET /api/players?search=&ids=&position=&limit=&offset=  → listado paginado
//   GET /api/players/:id?season=2025                        → ficha completa del jugador

import { Prisma } from '../generated/prisma/client.ts';
import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { resolveSeason, listSeasons, seasonSummary } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from '../utils/teams.js';
import { MATCH_TEAMS } from '../utils/matches.js';
import { readId, readPagination } from '../utils/params.js';
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

// Caracteres con tilde o diacrítico que se pliegan en SQL en ambos lados de la búsqueda (sin depender de unaccent)
const ACCENTS_FROM = 'áéíóúüñàèìòùâêîôûäëïöãõçćčšžýțșă';
const ACCENTS_TO = 'aeiouunaeiouaeiouaeioaocccszytsa';

/**
 * GET /api/players
 * Si llega ?ids=1,2,3 (máx. 4), devuelve esos jugadores en ese orden e ignora search, limit y offset.
 * Cada elemento de `items` sigue la forma de `playerListItem` (reutilizada por 10 · Comparador y 11 · Equipo ideal):
 *   { id, name, number, position, positionGroup, age, team, matches, minutes, goals, assists, yellowCards, redCards, rating }
 */
export async function list(req, res) {
  const { season } = await resolveSeason(req.query.season);
  const position = parsePosition(req.query.position);

  if (req.query.ids !== undefined) {
    const ids = parseIds(req.query.ids);
    const items = await loadPlayerItems(ids, season.id, position);
    res.json({ items, total: items.length, limit: MAX_IDS, offset: 0 });
    return;
  }

  const { limit, offset } = readPagination(req.query);
  const pattern = buildSearchPattern(req.query.search);

  const [total, ids] = await Promise.all([
    countFilteredPlayers(pattern, position),
    findRankedPlayerIds(season.id, pattern, position, limit, offset),
  ]);
  const items = await loadPlayerItems(ids, season.id);

  res.json({ items, total, limit, offset });
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

// Solo escapa comodines LIKE; el plegado de mayúsculas y tildes se hace en SQL en los dos lados
function buildSearchPattern(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}

// Filtro común para countFilteredPlayers y findRankedPlayerIds (mismo translate en nombre y patrón)
function playerFilter(pattern, position) {
  return Prisma.sql`
    WHERE (${pattern}::text IS NULL
           OR translate(lower(p.name), ${ACCENTS_FROM}, ${ACCENTS_TO})
              LIKE translate(lower(${pattern}), ${ACCENTS_FROM}, ${ACCENTS_TO}) ESCAPE '\\')
      AND (${position}::text IS NULL OR p.position::text = ${position})
  `;
}

// SQL directo: Prisma no puede ordenar players por agregados de player_season_stats ni plegar tildes
async function countFilteredPlayers(pattern, position) {
  const [row] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM players p
    ${playerFilter(pattern, position)}
  `;
  return row.total;
}

async function findRankedPlayerIds(seasonId, pattern, position, limit, offset) {
  const rows = await prisma.$queryRaw`
    WITH season_totals AS (
      SELECT
        player_id,
        SUM(played)::int AS played,
        SUM(minutes)::int AS minutes,
        SUM(goals)::int AS goals,
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
    ${playerFilter(pattern, position)}
    ORDER BY
      st.rating DESC NULLS LAST,
      st.minutes DESC NULLS LAST,
      st.played DESC NULLS LAST,
      st.goals DESC NULLS LAST,
      (p.team_id IS NOT NULL) DESC,
      p.name ASC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows.map((row) => row.id);
}

async function loadPlayerItems(ids, seasonId, position = null) {
  if (ids.length === 0) return [];
  const rows = await prisma.players.findMany({
    where: { id: { in: ids }, ...(position ? { position } : {}) },
    include: {
      teams: TEAM_INCLUDE,
      player_season_stats: { where: { season_id: seasonId } },
    },
  });
  const byId = new Map(rows.map((player) => [player.id, player]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((player) => playerListItem(player, aggregateSeasonStats(player.player_season_stats)));
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
    where: { player_id: playerId, matches: { season_id: seasonId, status: 'FINISHED' } },
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
