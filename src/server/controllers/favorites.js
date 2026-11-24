// Favoritos del usuario autenticado (12 · Mi perfil, RF3). Responsable: Ivan.
//   GET    /api/me/favorites              → { teams, players } ordenados por fecha de alta (más recientes primero)
//   PUT    /api/me/favorites/teams/:id    → añade el equipo a favoritos (idempotente → 204; si no existe → 404)
//   DELETE /api/me/favorites/teams/:id    → quita el equipo de favoritos (idempotente → 204 incluso si no estaba)
//   PUT    /api/me/favorites/players/:id  → añade el jugador a favoritos (idempotente → 204; si no existe → 404)
//   DELETE /api/me/favorites/players/:id  → quita el jugador de favoritos (idempotente → 204 incluso si no estaba)

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { readId } from '../utils/params.js';
import { LALIGA, resolveSeason } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from '../utils/teams.js';
import { aggregateSeasonStats, playerListItem } from '../utils/players.js';

/** GET /api/me/favorites → { teams, players } con los datos de la temporada actual para las tarjetas del perfil */
export async function list(req, res) {
  const { season } = await resolveSeason();
  const [teams, players] = await Promise.all([
    findFavoriteTeams(req.user.id, season.id),
    findFavoritePlayers(req.user.id, season.id),
  ]);
  res.json({ teams, players });
}

/** PUT /api/me/favorites/teams/:id → 204 (idempotente; 404 si el equipo no existe) */
export async function addTeam(req, res) {
  const teamId = readId(req.params.id, 'id del equipo');
  const team = await prisma.teams.findUnique({ where: { id: teamId }, select: { id: true } });
  if (!team) throw AppError.notFound('No existe ese equipo');

  // createMany + skipDuplicates evita fallos si ya era favorito o si llegan dos peticiones a la vez
  await prisma.favorite_teams.createMany({
    data: [{ user_id: req.user.id, team_id: teamId }],
    skipDuplicates: true,
  });
  res.status(204).end();
}

/** DELETE /api/me/favorites/teams/:id → 204 (idempotente: si no estaba en favoritos, el estado final es el mismo) */
export async function removeTeam(req, res) {
  const teamId = readId(req.params.id, 'id del equipo');
  await prisma.favorite_teams.deleteMany({
    where: { user_id: req.user.id, team_id: teamId },
  });
  res.status(204).end();
}

/** PUT /api/me/favorites/players/:id → 204 (idempotente; 404 si el jugador no existe) */
export async function addPlayer(req, res) {
  const playerId = readId(req.params.id, 'id del jugador');
  const player = await prisma.players.findUnique({ where: { id: playerId }, select: { id: true } });
  if (!player) throw AppError.notFound('No existe ese jugador');

  await prisma.favorite_players.createMany({
    data: [{ user_id: req.user.id, player_id: playerId }],
    skipDuplicates: true,
  });
  res.status(204).end();
}

/** DELETE /api/me/favorites/players/:id → 204 (idempotente: si no estaba en favoritos, el estado final es el mismo) */
export async function removePlayer(req, res) {
  const playerId = readId(req.params.id, 'id del jugador');
  await prisma.favorite_players.deleteMany({
    where: { user_id: req.user.id, player_id: playerId },
  });
  res.status(204).end();
}

async function findFavoriteTeams(userId, seasonId) {
  const rows = await prisma.favorite_teams.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    include: {
      teams: {
        select: {
          ...TEAM_SUMMARY_FIELDS,
          standings: {
            where: { season_id: seasonId },
            select: { position: true, points: true },
          },
        },
      },
    },
  });
  return rows.map(({ teams: team }) => favoriteTeamItem(team, team.standings[0]));
}

async function findFavoritePlayers(userId, seasonId) {
  const rows = await prisma.favorite_players.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    include: {
      players: {
        include: {
          teams: { select: TEAM_SUMMARY_FIELDS },
          player_season_stats: { where: { season_id: seasonId } },
        },
      },
    },
  });
  return rows.map(({ players: player }) => playerListItem(player, aggregateSeasonStats(player.player_season_stats)));
}

function favoriteTeamItem(team, standing) {
  return {
    ...teamSummary(team),
    competition: LALIGA,
    position: standing?.position ?? null,
    points: standing?.points ?? null,
  };
}
