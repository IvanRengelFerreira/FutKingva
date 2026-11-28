// 20 · Panel de administración (RF8): estadísticas, gestión de usuarios y moderación de reportes.
// Todas las rutas exigen rol de administrador (middleware/auth.js).

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { readId } from '../utils/params.js';
import { publicUser } from '../utils/users.js';
import { disconnectUser } from '../realtime/socket.js';
import { REPORT_STATUSES, USER_ROLES, USER_STATUSES } from '../../shared/validation/admin.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_OFFSET = 0;
const SEARCH_MAX = 100;

const ADMIN_USER_FIELDS = { id: true, name: true, email: true, role: true, status: true, created_at: true };
const REPORT_FIELDS = {
  id: true,
  reason: true,
  status: true,
  created_at: true,
  article_id: true,
  articles: {
    select: {
      title: true,
      users: { select: { name: true } },
    },
  },
  users_reports_reporter_idTousers: { select: { name: true } },
};

function readIntParam(value, { min, max, field }) {
  const range = max !== undefined ? `entre ${min} y ${max}` : `mayor o igual que ${min}`;
  const error = () =>
    AppError.badRequest(`El parámetro ${field} no es válido`, { [field]: `Tiene que ser un entero ${range}` });

  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw error();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) throw error();
  return parsed;
}

function readPagination(query) {
  const limit =
    query.limit !== undefined && query.limit !== ''
      ? readIntParam(query.limit, { min: 1, max: MAX_LIMIT, field: 'limit' })
      : DEFAULT_LIMIT;
  const offset =
    query.offset !== undefined && query.offset !== ''
      ? readIntParam(query.offset, { min: 0, field: 'offset' })
      : DEFAULT_OFFSET;
  return { limit, offset };
}

function readEnumFilter(value, allowed, field, label) {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw AppError.badRequest(`El filtro de ${label} no es válido`, { [field]: `Valor de ${label} no válido` });
  }
  return value.toUpperCase();
}

function readSearch(value) {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    throw AppError.badRequest('El texto de búsqueda no es válido', { search: 'Tiene que ser texto' });
  }
  const trimmed = value.trim();
  if (trimmed.length > SEARCH_MAX) {
    throw AppError.badRequest('El texto de búsqueda es demasiado largo', {
      search: `No puede superar los ${SEARCH_MAX} caracteres`,
    });
  }
  return trimmed || null;
}

function buildUsersWhere(query) {
  const search = readSearch(query.search);
  const role = readEnumFilter(query.role, USER_ROLES, 'role', 'rol');
  const status = readEnumFilter(query.status, USER_STATUSES, 'status', 'estado');

  return {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

function adminUser(user, currentUserId) {
  return {
    ...publicUser(user),
    status: user.status.toLowerCase(),
    registeredAt: user.created_at,
    isCurrentUser: user.id === currentUserId,
  };
}

function adminReport(report) {
  return {
    id: report.id,
    reason: report.reason,
    status: report.status.toLowerCase(),
    createdAt: report.created_at,
    content: report.articles?.title ?? null,
    type: 'article',
    articleId: report.article_id ?? null,
    author: report.articles?.users?.name ?? null,
    reporter: report.users_reports_reporter_idTousers?.name ?? null,
  };
}

/** GET /api/admin/stats → contadores del panel */
export async function stats(req, res) {
  const [users, editors, blockedAccounts, pendingReports] = await Promise.all([
    prisma.users.count(),
    prisma.users.count({ where: { role: 'EDITOR' } }),
    prisma.users.count({ where: { status: 'BLOCKED' } }),
    prisma.reports.count({ where: { status: 'PENDING' } }),
  ]);

  res.json({ users, editors, blockedAccounts, pendingReports });
}

/** GET /api/admin/users → listado paginado y filtrable por búsqueda, rol y estado */
export async function listUsers(req, res) {
  const { limit, offset } = readPagination(req.query);
  const where = buildUsersWhere(req.query);

  const [rows, total] = await Promise.all([
    prisma.users.findMany({
      where,
      select: ADMIN_USER_FIELDS,
      orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
      take: limit,
      skip: offset,
    }),
    prisma.users.count({ where }),
  ]);

  res.json({
    items: rows.map((user) => adminUser(user, req.user.id)),
    total,
    limit,
    offset,
  });
}

async function ensureOtherUser(id, currentUserId, selfMessage) {
  if (id === currentUserId) throw AppError.conflict(selfMessage);
  const existing = await prisma.users.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw AppError.notFound('No existe ese usuario');
}

/** PATCH /api/admin/users/:id  { role?, status? } → usuario actualizado */
export async function updateUser(req, res) {
  const id = readId(req.params.id, 'id del usuario');
  await ensureOtherUser(id, req.user.id, 'No puedes cambiar el rol ni el estado de tu propia cuenta');

  const data = {};
  if (req.body.role !== undefined) data.role = req.body.role.toUpperCase();
  if (req.body.status !== undefined) data.status = req.body.status.toUpperCase();

  const updated = await prisma.users.update({ where: { id }, data, select: ADMIN_USER_FIELDS });
  // Bloqueado: sus pestañas abiertas dejan de recibir avisos en directo al momento
  if (updated.status === 'BLOCKED') disconnectUser(id);
  res.json(adminUser(updated, req.user.id));
}

/** DELETE /api/admin/users/:id → 204 */
export async function deleteUser(req, res) {
  const id = readId(req.params.id, 'id del usuario');
  await ensureOtherUser(id, req.user.id, 'No puedes eliminar tu propia cuenta');

  await prisma.users.delete({ where: { id } });
  disconnectUser(id);
  res.status(204).end();
}

/** GET /api/admin/reports → listado paginado de reportes (pendientes por defecto) */
export async function listReports(req, res) {
  const { limit, offset } = readPagination(req.query);
  const status = readEnumFilter(req.query.status, REPORT_STATUSES, 'status', 'estado') ?? 'PENDING';
  const where = { status };

  const [rows, total] = await Promise.all([
    prisma.reports.findMany({
      where,
      select: REPORT_FIELDS,
      orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
      take: limit,
      skip: offset,
    }),
    prisma.reports.count({ where }),
  ]);

  res.json({
    items: rows.map(adminReport),
    total,
    limit,
    offset,
  });
}

/** PATCH /api/admin/reports/:id  { action: 'dismiss' | 'remove' } → reporte resuelto */
export async function resolveReport(req, res) {
  const id = readId(req.params.id, 'id del reporte');
  const { action } = req.body;
  const nextStatus = action === 'remove' ? 'RESOLVED' : 'DISMISSED';

  const updated = await prisma.$transaction(async (tx) => {
    const report = await tx.reports.findUnique({
      where: { id },
      select: { id: true, status: true, article_id: true },
    });
    if (!report) throw AppError.notFound('No existe ese reporte');
    if (report.status !== 'PENDING') throw AppError.conflict('Este reporte ya se ha resuelto');

    // Comprobamos status = PENDING al actualizar para evitar que dos administradores lo resuelvan a la vez
    const { count } = await tx.reports.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: nextStatus, resolved_at: new Date(), resolved_by: req.user.id },
    });
    if (count === 0) throw AppError.conflict('Este reporte ya se ha resuelto');

    // Nunca borramos el artículo: reports.article_id lleva ON DELETE CASCADE y perderíamos el historial
    if (action === 'remove' && report.article_id != null) {
      await tx.articles.update({ where: { id: report.article_id }, data: { status: 'DRAFT' } });
    }

    return tx.reports.findUnique({ where: { id }, select: REPORT_FIELDS });
  });

  res.json(adminReport(updated));
}
