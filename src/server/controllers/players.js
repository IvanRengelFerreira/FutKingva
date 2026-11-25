// Jugadores de LaLiga (02 · Equipos y jugadores, RF2). Responsable: Angel.
//   GET /api/players?season=2025&q=pedri&sort=rating|goals|assists|name&limit=10&offset=0
// Cada jugador con sus números de la temporada y su equipo. Mismo criterio que la plantilla de la ficha:
// en la temporada actual salen todos los de los equipos de LaLiga (aunque aún no hayan jugado);
// en las anteriores, los que jugaron ese año.

import { prisma, findSeasonTeams } from '../db.js';
import { resolveSeason, seasonSummary } from '../utils/seasons.js';
import { teamSummary } from '../utils/teams.js';
import { playerSummary } from '../utils/players.js';
import { readPagination } from '../utils/pagination.js';
import { readNameFilter, readSort, byName } from '../utils/search.js';

// Órdenes del listado (el primero, si no se pide ninguno)
const PLAYER_ORDERS = {
  rating: byStat('rating'),
  goals: byStat('goals'),
  assists: byStat('assists'),
  name: byName,
};

export async function list(req, res) {
  const { limit, offset } = readPagination(req.query);
  const sort = readSort(req.query.sort, Object.keys(PLAYER_ORDERS));
  const matchesName = readNameFilter(req.query.q);
  const { season, isCurrent } = await resolveSeason(req.query.season);

  const players = (await findSeasonPlayers(season.id, isCurrent))
    .filter((player) => matchesName(player.name))
    .sort(PLAYER_ORDERS[sort]);

  res.json({
    items: players.slice(offset, offset + limit),
    total: players.length,
    limit,
    offset,
    season: { ...seasonSummary(season), isCurrent },
  });
}

// De mayor a menor; los que no tienen el dato van al final y los empates, por nombre
function byStat(field) {
  return (a, b) => (b[field] ?? -1) - (a[field] ?? -1) || byName(a, b);
}

async function findSeasonPlayers(seasonId, isCurrent) {
  const teams = await findSeasonTeams(seasonId);
  const teamsById = new Map(teams.map((team) => [team.id, teamSummary(team)]));
  const rows = isCurrent ? await findCurrentRows(seasonId, [...teamsById.keys()]) : await findPastRows(seasonId);
  return rows.map(({ player, teamId, stats }) => ({
    ...playerSummary(player, stats),
    team: teamsById.get(teamId) ?? null,
  }));
}

// players.team_id es el club de ahora: sus números son los de la temporada con ese club
async function findCurrentRows(seasonId, teamIds) {
  const [players, stats] = await Promise.all([
    prisma.players.findMany({ where: { team_id: { in: teamIds } } }),
    prisma.player_season_stats.findMany({ where: { season_id: seasonId } }),
  ]);
  const statsByKey = new Map(stats.map((row) => [`${row.player_id}-${row.team_id}`, row]));
  return players.map((player) => ({
    player,
    teamId: player.team_id,
    stats: statsByKey.get(`${player.id}-${player.team_id}`),
  }));
}

// Quien jugó en dos equipos ese año sale una sola vez, con aquel en el que más partidos jugó
async function findPastRows(seasonId) {
  const stats = await prisma.player_season_stats.findMany({
    where: { season_id: seasonId },
    include: { players: true },
    orderBy: [{ played: 'asc' }, { team_id: 'asc' }],
  });
  // En un Map gana la última fila de cada jugador: la de más partidos
  const mainRows = new Map(stats.map((row) => [row.player_id, row]));
  return [...mainRows.values()].map((row) => ({ player: row.players, teamId: row.team_id, stats: row }));
}
