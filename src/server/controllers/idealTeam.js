// Equipo ideal del usuario (RF5 · 11 · Mi equipo ideal). Responsable: Ivan.
//   GET /api/me/ideal-team  → equipo guardado del usuario (o vacío por defecto)
//   PUT /api/me/ideal-team  → crea o sustituye el equipo ideal del usuario

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { resolveSeason } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS } from '../utils/teams.js';
import { aggregateSeasonStats, playerListItem } from '../utils/players.js';
import { DEFAULT_FORMATION, slotPosition, slotsOf } from '../../shared/formations.js';
import { fitsSlot } from '../../shared/positions.js';
import { DEFAULT_IDEAL_TEAM_NAME } from '../../shared/validation/idealTeam.js';

const TEAM_INCLUDE = { select: TEAM_SUMMARY_FIELDS };

/** GET /api/me/ideal-team */
export async function detail(req, res) {
  const { season } = await resolveSeason();
  const team = await loadIdealTeam(req.user.id, season);
  res.json(team);
}

/** PUT /api/me/ideal-team */
export async function save(req, res) {
  const name = req.body.name.trim();
  const { formation, players } = req.body;

  await assertPlayersValid(players);

  const now = new Date();
  // En una sola transacción: si falla la inserción de algún jugador, no se pierden los anteriores.
  // updated_at se pasa a mano para reflejar también cambios solo en ideal_team_players
  // (el trigger ideal_teams_updated_at solo salta si cambia la fila de ideal_teams).
  await prisma.$transaction(async (tx) => {
    const saved = await tx.ideal_teams.upsert({
      where: { user_id: req.user.id },
      create: { user_id: req.user.id, name, formation, updated_at: now },
      update: { name, formation, updated_at: now },
      select: { id: true },
    });
    await tx.ideal_team_players.deleteMany({ where: { ideal_team_id: saved.id } });
    if (players.length > 0) {
      await tx.ideal_team_players.createMany({
        data: players.map(({ slot, playerId }) => ({
          ideal_team_id: saved.id,
          slot,
          player_id: BigInt(playerId),
        })),
      });
    }
  });

  const { season } = await resolveSeason();
  const team = await loadIdealTeam(req.user.id, season);
  res.json(team);
}

async function assertPlayersValid(players) {
  if (players.length === 0) return;
  const ids = players.map(({ playerId }) => BigInt(playerId));
  const found = await prisma.players.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, position: true, detailed_position: true },
  });
  if (found.length !== ids.length) {
    throw AppError.badRequest('Revisa los datos del formulario', {
      players: 'Alguno de los jugadores indicados no existe',
    });
  }

  const byId = new Map(found.map((player) => [player.id, player]));
  for (const { slot, playerId } of players) {
    const player = byId.get(BigInt(playerId));
    if (!fitsSlot(player, slot)) {
      throw AppError.badRequest('Revisa los datos del formulario', {
        players: `${player.name} no encaja en la posición ${slotPosition(slot)}`,
      });
    }
  }
}

async function loadIdealTeam(userId, season) {
  const row = await prisma.ideal_teams.findUnique({
    where: { user_id: userId },
    include: {
      ideal_team_players: {
        include: {
          players: {
            include: {
              teams: TEAM_INCLUDE,
              player_season_stats: { where: { season_id: season.id } },
            },
          },
        },
      },
    },
  });

  if (!row) {
    return {
      name: DEFAULT_IDEAL_TEAM_NAME,
      formation: DEFAULT_FORMATION,
      updatedAt: null,
      season: season.label,
      players: [],
    };
  }

  return formatIdealTeam(row, season);
}

function formatIdealTeam(row, season) {
  const order = new Map(slotsOf(row.formation).map((slot, index) => [slot, index]));
  const players = [...row.ideal_team_players]
    .sort((a, b) => (order.get(a.slot) ?? order.size) - (order.get(b.slot) ?? order.size))
    .map(({ slot, players: player }) => ({
      slot,
      player: playerListItem(player, aggregateSeasonStats(player.player_season_stats)),
    }));

  return {
    name: row.name,
    formation: row.formation,
    updatedAt: row.updated_at,
    season: season.label,
    players,
  };
}
