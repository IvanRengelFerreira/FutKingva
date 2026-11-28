// 19 · Actualizar datos de jugadores (RF11): el editor corrige las estadísticas que llegan del proveedor.
// Responsable: Carlota. Todo es de la temporada actual de LaLiga y solo para editores (routes/playerData.js).
//   GET   /api/player-data                → temporada, última sincronización, equipos y jugador de ejemplo
//   GET   /api/player-data/players?q=&teamId= → buscador de jugadores (plantillas de la temporada actual)
//   GET   /api/player-data/players/:id    → datos del jugador que se pueden corregir
//   PATCH /api/player-data/players/:id    → guarda la corrección y la apunta en el historial
//   GET   /api/player-data/history        → historial de cambios (los más recientes primero)
//
// Cada campo corregido se marca como EDITOR en field_sources, para que el importador no lo pise.

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { resolveSeason, seasonSummary } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from '../utils/teams.js';
import { readId } from '../utils/params.js';
import { STAT_FIELDS, positionGroup } from '../../shared/validation/playerData.js';

const FEATURED_PLAYER = 'Pedri'; // El ejemplo de Figma: el aviso de Contacto sobre su tarjeta
const SUGGESTIONS_LIMIT = 6;
const SUGGESTIONS_MAX = 20;
const HISTORY_LIMIT = 20;
const HISTORY_MAX = 100;
const QUERY_MAX = 60;

const PLAYER_FIELDS = {
  id: true,
  name: true,
  photo_url: true,
  position: true,
  detailed_position: true,
  team_id: true,
  teams: { select: TEAM_SUMMARY_FIELDS },
};

/** GET /api/player-data */
export async function overview(req, res) {
  const { season } = await resolveSeason();
  const [sync, seasonTeams, featured] = await Promise.all([
    prisma.sync_runs.findFirst({
      where: { status: 'OK', finished_at: { not: null } },
      orderBy: { finished_at: 'desc' },
      select: { source: true, finished_at: true },
    }),
    prisma.season_teams.findMany({
      where: { season_id: season.id },
      select: { teams: { select: TEAM_SUMMARY_FIELDS } },
    }),
    prisma.players.findFirst({ where: { name: FEATURED_PLAYER, ...inSeasonSquads(season.id) }, select: { id: true } }),
  ]);

  res.json({
    season: seasonSummary(season),
    sync: sync ? { source: sync.source, finishedAt: sync.finished_at } : null,
    teams: seasonTeams.map((row) => teamSummary(row.teams)).sort((a, b) => a.name.localeCompare(b.name, 'es')),
    featuredPlayerId: featured?.id ?? null,
  });
}

/** GET /api/player-data/players?q=ped&teamId=4&limit=6 */
export async function search(req, res) {
  const { season } = await resolveSeason();
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, QUERY_MAX) : '';
  const teamId = req.query.teamId ? readId(req.query.teamId, 'id del equipo') : null;
  const limit = readLimit(req.query.limit, SUGGESTIONS_LIMIT, SUGGESTIONS_MAX);

  const where = {
    ...inSeasonSquads(season.id),
    ...(teamId ? { team_id: teamId } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.players.findMany({ where, orderBy: { name: 'asc' }, take: limit, select: PLAYER_FIELDS }),
    prisma.players.count({ where }),
  ]);

  res.json({ items: rows.map(playerProfile), total, limit, offset: 0 });
}

/** GET /api/player-data/players/:id */
export async function detail(req, res) {
  const id = readId(req.params.id, 'id del jugador');
  const { season } = await resolveSeason();
  const player = await findPlayer(prisma, id);
  const stats = await findStats(prisma, season.id, player);
  res.json(playerData(player, stats, season));
}

/** PATCH /api/player-data/players/:id  { values: { yellowCards: 3, … }, reason } */
export async function update(req, res) {
  const id = readId(req.params.id, 'id del jugador');
  const { season } = await resolveSeason();
  const { values, reason } = req.body;
  const editorId = req.user.id;

  // Todo o nada: la estadística, la posición y el historial se guardan juntos
  const result = await prisma.$transaction(async (tx) => {
    const player = await findPlayer(tx, id);
    const stats = await findStats(tx, season.id, player);
    const changes = listChanges(values, player, stats);
    if (changes.length === 0) throw AppError.badRequest('No hay cambios que guardar', { values: 'No hay cambios' });

    const statChanges = changes.filter((change) => change.column);
    const positionChange = changes.find((change) => change.key === 'position');
    const savedStats = statChanges.length ? await saveStats(tx, season.id, player, stats, statChanges) : stats;
    const savedPlayer = positionChange ? await savePosition(tx, player, positionChange.newValue) : player;

    await tx.player_data_changes.createMany({
      data: changes.map((change) => ({
        player_id: player.id,
        season_id: change.column ? season.id : null, // NULL = dato de la ficha (la posición)
        editor_id: editorId,
        field: change.key,
        old_value: change.oldValue == null ? null : String(change.oldValue),
        new_value: String(change.newValue),
        reason: reason.trim(),
      })),
    });
    return { player: savedPlayer, stats: savedStats, saved: changes.length };
  });

  res.json({ ...playerData(result.player, result.stats, season), saved: result.saved });
}

/** GET /api/player-data/history?limit=20&offset=0 */
export async function history(req, res) {
  const limit = readLimit(req.query.limit, HISTORY_LIMIT, HISTORY_MAX);
  const offset = readOffset(req.query.offset);
  const [rows, total] = await Promise.all([
    prisma.player_data_changes.findMany({
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: offset,
      include: { players: { select: { id: true, name: true, photo_url: true } }, users: { select: { name: true } } },
    }),
    prisma.player_data_changes.count(),
  ]);

  res.json({
    items: rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      player: { id: row.players.id, name: row.players.name, photoUrl: row.players.photo_url },
      field: row.field,
      oldValue: row.old_value,
      newValue: row.new_value,
      reason: row.reason,
      editor: row.users ? { name: row.users.name } : null,
    })),
    total,
    limit,
    offset,
  });
}

// --- Ayudas ----------------------------------------------------------------

// Jugadores de las plantillas de la temporada (players.team_id es su club de ahora)
function inSeasonSquads(seasonId) {
  return { teams: { season_teams: { some: { season_id: seasonId } } } };
}

async function findPlayer(db, id) {
  const player = await db.players.findUnique({ where: { id }, select: PLAYER_FIELDS });
  if (!player) throw AppError.notFound('No existe ese jugador');
  return player;
}

// Su fila de la temporada: la de su club actual o, si cambió de equipo, la última que tenga
async function findStats(db, seasonId, player) {
  const rows = await db.player_season_stats.findMany({
    where: { season_id: seasonId, player_id: player.id },
    orderBy: { updated_at: 'desc' },
  });
  return rows.find((row) => row.team_id === player.team_id) ?? rows[0] ?? null;
}

function playerProfile(player) {
  return {
    id: player.id,
    name: player.name,
    photoUrl: player.photo_url,
    team: teamSummary(player.teams),
    position: player.detailed_position,
    positionGroup: player.position,
  };
}

function statValues(stats) {
  return Object.fromEntries(STAT_FIELDS.map((field) => [field.key, stats ? stats[field.column] : null]));
}

// Qué campos de la estadística ha corregido un editor ({ yellowCards: true, … })
function editedFields(stats) {
  const sources = stats?.field_sources ?? {};
  return Object.fromEntries(STAT_FIELDS.map((field) => [field.key, sources[field.column] === 'EDITOR']));
}

function playerData(player, stats, season) {
  return {
    player: playerProfile(player),
    season: seasonSummary(season),
    stats: statValues(stats),
    edited: editedFields(stats),
  };
}

/** Los campos que de verdad cambian: [{ key, column?, oldValue, newValue }] */
function listChanges(values, player, stats) {
  const current = statValues(stats);
  const changes = STAT_FIELDS.filter((field) => field.key in values && values[field.key] !== current[field.key]).map(
    (field) => ({ key: field.key, column: field.column, oldValue: current[field.key], newValue: values[field.key] }),
  );
  if ('position' in values && values.position !== player.detailed_position) {
    changes.push({ key: 'position', oldValue: player.detailed_position, newValue: values.position });
  }
  return changes;
}

async function saveStats(tx, seasonId, player, stats, changes) {
  const data = Object.fromEntries(changes.map((change) => [change.column, change.newValue]));
  const merged = {
    ...(stats ? { goals: stats.goals, penalties: stats.penalties } : { goals: 0, penalties: 0 }),
    ...data,
  };
  // La BD exige que los goles de penalti no pasen de los goles (CHECK penalties <= goals)
  if (merged.goals < merged.penalties) {
    throw AppError.badRequest('Revisa los datos del formulario', {
      goals: `No puede tener menos goles que los ${merged.penalties} de penalti que tiene apuntados`,
    });
  }
  const editorSources = Object.fromEntries(changes.map((change) => [change.column, 'EDITOR']));

  if (stats) {
    return tx.player_season_stats.update({
      where: {
        season_id_player_id_team_id: { season_id: stats.season_id, player_id: stats.player_id, team_id: stats.team_id },
      },
      data: { ...data, field_sources: { ...stats.field_sources, ...editorSources }, updated_at: new Date() },
    });
  }
  // Aún no tiene fila esta temporada: se crea con su club actual y como dato del editor
  if (!player.team_id) throw AppError.badRequest('Este jugador no tiene equipo esta temporada');
  return tx.player_season_stats.create({
    data: { season_id: seasonId, player_id: player.id, team_id: player.team_id, source: 'EDITOR', ...data },
  });
}

function savePosition(tx, player, position) {
  return tx.players.update({
    where: { id: player.id },
    data: { detailed_position: position, position: positionGroup(position) },
    select: PLAYER_FIELDS,
  });
}

function readLimit(value, fallback, max) {
  const number = Number(value);
  if (value === undefined || value === '') return fallback;
  if (!Number.isInteger(number) || number < 1) throw AppError.badRequest('El límite no es válido', { limit: 'Número' });
  return Math.min(number, max);
}

function readOffset(value) {
  const number = Number(value ?? 0);
  if (!Number.isInteger(number) || number < 0) throw AppError.badRequest('El desplazamiento no es válido');
  return number;
}
