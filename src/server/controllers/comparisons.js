// Comparativas guardadas del usuario (10 · Comparador, RF4). Responsable: Ivan.
//   GET    /api/me/comparisons?limit=&offset=  → listado paginado del usuario
//   POST   /api/me/comparisons                 → crea (o sustituye si repite jugadores)
//   DELETE /api/me/comparisons/:id             → borra una comparativa propia (404 si es ajena)

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { readId, readPagination } from '../utils/params.js';
import { shortPlayerName } from '../../shared/players.js';

const MAX_NAME_LENGTH = 40; // Tope del CHECK (length(name) BETWEEN 1 AND 40) en la BD
const ELLIPSIS = '…';

const COMPARISON_INCLUDE = {
  comparison_players: {
    orderBy: { sort_order: 'asc' },
    include: { players: { select: { id: true, name: true } } },
  },
};

/** GET /api/me/comparisons */
export async function list(req, res) {
  const { limit, offset } = readPagination(req.query);
  const where = { user_id: req.user.id };

  const [total, rows] = await Promise.all([
    prisma.comparisons.count({ where }),
    prisma.comparisons.findMany({
      where,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: offset,
      include: COMPARISON_INCLUDE,
    }),
  ]);

  res.json({ items: rows.map(formatComparison), total, limit, offset });
}

/** POST /api/me/comparisons  { playerIds } → 201 con la comparativa creada */
export async function create(req, res) {
  const ids = req.body.playerIds.map((id) => BigInt(id));
  const orderedPlayers = await loadExistingPlayers(ids);
  const name = buildComparisonName(orderedPlayers);

  const created = await prisma.$transaction((tx) => replaceComparison(tx, req.user.id, ids, name));
  res.status(201).json(formatComparison(created));
}

/** DELETE /api/me/comparisons/:id → 204 */
export async function remove(req, res) {
  const id = readId(req.params.id, 'id de la comparativa');
  // Filtramos por user_id para que una comparativa ajena devuelva 404 (no 403) y no revele su existencia
  const { count } = await prisma.comparisons.deleteMany({
    where: { id, user_id: req.user.id },
  });
  if (count === 0) throw AppError.notFound('No existe esa comparativa');
  res.status(204).end();
}

function formatComparison(comparison) {
  return {
    id: comparison.id,
    name: comparison.name,
    createdAt: comparison.created_at,
    players: comparison.comparison_players.map((entry) => ({
      id: entry.players.id,
      name: entry.players.name,
    })),
  };
}

async function loadExistingPlayers(ids) {
  const rows = await prisma.players.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  if (rows.length !== ids.length) {
    throw AppError.badRequest('Alguno de los jugadores no existe', {
      playerIds: 'Alguno de los jugadores elegidos no existe',
    });
  }
  const byId = new Map(rows.map((player) => [player.id, player]));
  return ids.map((id) => byId.get(id));
}

// Si el usuario ya guardó el mismo conjunto de jugadores (en cualquier orden), se sustituye en la misma transacción
async function replaceComparison(tx, userId, ids, name) {
  const targetKey = playerSetKey(ids);
  const existing = await tx.comparisons.findMany({
    where: { user_id: userId },
    select: { id: true, comparison_players: { select: { player_id: true } } },
  });
  const duplicateIds = existing
    .filter((row) => playerSetKey(row.comparison_players.map((entry) => entry.player_id)) === targetKey)
    .map((row) => row.id);

  if (duplicateIds.length > 0) {
    await tx.comparisons.deleteMany({ where: { id: { in: duplicateIds }, user_id: userId } });
  }

  return tx.comparisons.create({
    data: {
      user_id: userId,
      name,
      comparison_players: {
        create: ids.map((playerId, index) => ({ player_id: playerId, sort_order: index + 1 })),
      },
    },
    include: COMPARISON_INCLUDE,
  });
}

function playerSetKey(ids) {
  return [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join(',');
}

// Genera «Pedri vs Bellingham…» respetando el límite de 40 caracteres de la BD
function buildComparisonName(players) {
  const label = players.map((player) => shortPlayerName(player.name)).join(' vs ');
  const chars = [...label];
  if (chars.length <= MAX_NAME_LENGTH) return label;
  return `${chars
    .slice(0, MAX_NAME_LENGTH - 1)
    .join('')
    .trimEnd()}${ELLIPSIS}`;
}
