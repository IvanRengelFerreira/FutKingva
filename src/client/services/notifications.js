// Avisos del usuario (RF9): los guardados en el servidor. Los nuevos llegan en directo por services/realtime.js.
import { apiFetch } from './client.js';

/** Últimos avisos del usuario: { items, total, limit, offset, unreadCount } */
export const getNotifications = (options) => apiFetch('/me/notifications', options);

/** Marca todos los avisos como leídos */
export const markNotificationsRead = () => apiFetch('/me/notifications/read', { method: 'PATCH' });
