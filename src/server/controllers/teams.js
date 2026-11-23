// Ficha de un equipo de LaLiga (03 · Ficha de equipo, RF2). Responsable: Angel.
//   GET /api/teams/:id              → temporada actual
//   GET /api/teams/:id?season=2025  → la 2025/26
// Datos del club, su fila de la clasificación (y la tabla entera para la pestaña Estadísticas),
// la plantilla, los próximos partidos y los últimos resultados.

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { resolveSeason, seasonSummary } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from '../utils/teams.js';
import { standingRow } from '../utils/standings.js';
import { playerSummary, bySquadOrder } from '../utils/players.js';
import { MATCH_TEAMS, teamMatch } from '../utils/matches.js';
import { readId } from '../utils/params.js';

const COMPETITION = 'LaLiga'; // Por ahora solo hay datos de LaLiga
const UPCOMING_COUNT = 3; // Como en el mockup: los tres próximos
const RESULTS_COUNT = 5; // Los mismos que la forma
const UPCOMING_STATUSES = ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'];

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
