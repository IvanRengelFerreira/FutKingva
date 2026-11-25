// Equipos de LaLiga (RF2). Responsable: Angel.
//
// Listado (02 · Equipos y jugadores): cada equipo con su fila de la clasificación.
//   GET /api/teams?season=2025&q=real&sort=standings|name|goals&limit=12&offset=0
//
// Ficha (03 · Ficha de equipo):
//   GET /api/teams/:id              → temporada actual
//   GET /api/teams/:id?season=2025  → la 2025/26
// Datos del club, su fila de la clasificación (y la tabla entera para la pestaña Estadísticas),
// la plantilla, los próximos partidos y los últimos resultados.

import { prisma, findSeasonTeams } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { resolveSeason, seasonSummary } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from '../utils/teams.js';
import { standingRow } from '../utils/standings.js';
import { playerSummary, bySquadOrder } from '../utils/players.js';
import { MATCH_TEAMS, teamMatch } from '../utils/matches.js';
import { readId } from '../utils/params.js';
import { readPagination } from '../utils/pagination.js';
import { readNameFilter, readSort, byName } from '../utils/search.js';

const COMPETITION = 'LaLiga'; // Por ahora solo hay datos de LaLiga
const UPCOMING_COUNT = 3; // Como en el mockup: los tres próximos
const RESULTS_COUNT = 5; // Los mismos que la forma
const UPCOMING_STATUSES = ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'];

// Órdenes del listado (el primero, si no se pide ninguno). Los equipos sin fila en la tabla van al final.
const TEAM_ORDERS = {
  standings: (a, b) => byPosition(a, b) || byName(a, b),
  name: byName,
  goals: (a, b) => goalsFor(b) - goalsFor(a) || byPosition(a, b) || byName(a, b),
};

export async function list(req, res) {
  const { limit, offset } = readPagination(req.query);
  const sort = readSort(req.query.sort, Object.keys(TEAM_ORDERS));
  const matchesName = readNameFilter(req.query.q);
  const { season, isCurrent } = await resolveSeason(req.query.season);

  const teams = (await findSeasonTeams(season.id))
    .filter((team) => matchesName(team.name, team.short_name))
    .map(teamListItem)
    .sort(TEAM_ORDERS[sort]);

  res.json({
    items: teams.slice(offset, offset + limit),
    total: teams.length,
    limit,
    offset,
    season: { ...seasonSummary(season), isCurrent },
  });
}

function teamListItem(team) {
  const [row] = team.standings;
  return { ...teamSummary(team), standing: row ? standingRow({ ...row, teams: team }) : null };
}

function byPosition(a, b) {
  const last = Number.MAX_SAFE_INTEGER;
  return (a.standing?.position ?? last) - (b.standing?.position ?? last);
}

function goalsFor(team) {
  return team.standing?.goalsFor ?? -1;
}

export async function detail(req, res) {
  const id = readId(req.params.id, 'id del equipo');
  const { season, isCurrent } = await resolveSeason(req.query.season);

  const team = await prisma.teams.findUnique({ where: { id } });
  if (!team) throw AppError.notFound('No existe ese equipo');

  const seasonTeam = await findSeasonTeam(season.id, id);
  const [table, squad, upcoming, results] = await Promise.all([
    findTable(season.id),
    findSquad(season.id, id, isCurrent && Boolean(seasonTeam)),
    findMatches(season.id, id, { status: { in: UPCOMING_STATUSES } }, 'asc', UPCOMING_COUNT),
    findMatches(season.id, id, { status: 'FINISHED' }, 'desc', RESULTS_COUNT),
  ]);

  res.json({
    team: teamProfile(team, seasonTeam?.coach_name ?? null),
    season: { ...seasonSummary(season), isCurrent },
    standing: table.find((row) => row.teamId === id) ?? null,
    table,
    squad,
    upcoming: upcoming.map((match) => teamMatch(match, id)),
    results: results.map((match) => teamMatch(match, id)),
  });
}

function teamProfile(team, coach) {
  return {
    ...teamSummary(team),
    competition: COMPETITION,
    venue: team.venue,
    city: team.city,
    founded: team.founded,
    coach,
  };
}

async function findTable(seasonId) {
  const rows = await prisma.standings.findMany({
    where: { season_id: seasonId },
    orderBy: { position: 'asc' },
    include: { teams: { select: TEAM_SUMMARY_FIELDS } },
  });
  return rows.map(standingRow);
}

/** El equipo en esa temporada (con su entrenador), o null si no jugó en LaLiga ese año */
function findSeasonTeam(seasonId, teamId) {
  return prisma.season_teams.findUnique({
    where: { season_id_team_id: { season_id: seasonId, team_id: teamId } },
    select: { coach_name: true },
  });
}

// Si el equipo juega la temporada actual salen todos sus jugadores, aunque aún no hayan jugado;
// si no, los que jugaron con él esa temporada (players.team_id es solo el club de ahora)
async function findSquad(seasonId, teamId, isCurrentSquad) {
  const stats = await prisma.player_season_stats.findMany({
    where: { season_id: seasonId, team_id: teamId },
    include: { players: true },
  });
  const statsByPlayer = new Map(stats.map((row) => [row.player_id, row]));
  const players = isCurrentSquad
    ? await prisma.players.findMany({ where: { team_id: teamId } })
    : stats.map((row) => row.players);
  return players.map((player) => playerSummary(player, statsByPlayer.get(player.id))).sort(bySquadOrder);
}

function findMatches(seasonId, teamId, where, order, count) {
  return prisma.matches.findMany({
    where: { season_id: seasonId, OR: [{ home_team_id: teamId }, { away_team_id: teamId }], ...where },
    orderBy: { utc_date: order },
    take: count,
    include: MATCH_TEAMS,
  });
}
