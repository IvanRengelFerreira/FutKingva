// Avisos del usuario (RF9). Responsable: Ivan.
//   GET   /api/me/notifications       → los últimos avisos y cuántos quedan sin leer
//   PATCH /api/me/notifications/read  → los marca todos como leídos (204)
// Los avisos nuevos los crea realtime/events.js y llegan también en directo por Socket.IO.

import { prisma } from '../db.js';
import { notificationRow } from '../utils/notifications.js';

const LATEST_LIMIT = 20;

export async function list(req, res) {
  const [rows, total, unreadCount] = await Promise.all([
    prisma.notifications.findMany({
      where: { user_id: req.user.id },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: LATEST_LIMIT,
    }),
    prisma.notifications.count({ where: { user_id: req.user.id } }),
    prisma.notifications.count({ where: { user_id: req.user.id, is_read: false } }),
  ]);
  // Formato de listado de CONVENCIONES §3 (sin paginar: la campana solo enseña los últimos) + unreadCount
  res.json({ items: rows.map(notificationRow), total, limit: LATEST_LIMIT, offset: 0, unreadCount });
}

export async function markAllRead(req, res) {
  await prisma.notifications.updateMany({ where: { user_id: req.user.id, is_read: false }, data: { is_read: true } });
  res.status(204).end();
}
