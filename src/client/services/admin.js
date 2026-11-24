// 20 · Panel de administración (RF8): estadísticas, gestión de usuarios y moderación de reportes.
// Rutas del servidor en src/server/routes/admin.js (solo administradores).

import { apiFetch } from './client.js';

/** Contadores del panel: { users, editors, blockedAccounts, pendingReports } */
export const getAdminStats = (options) => apiFetch('/admin/stats', options);

/** Listado paginado de usuarios con filtros opcionales (?search, ?role, ?status, ?limit, ?offset) */
export const getAdminUsers = (query, options) => apiFetch('/admin/users', { ...options, query });

/** Cambia el rol y/o estado de un usuario: { role?, status? } → usuario actualizado */
export const updateAdminUser = (id, body) => apiFetch(`/admin/users/${id}`, { method: 'PATCH', body });

/** Elimina un usuario → 204 */
export const deleteAdminUser = (id) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' });

/** Listado paginado de reportes (?status, ?limit, ?offset) */
export const getAdminReports = (query, options) => apiFetch('/admin/reports', { ...options, query });

/** Resuelve un reporte pendiente: action = 'dismiss' (aprobar) | 'remove' (retirar a borrador) */
export const resolveAdminReport = (id, action) =>
  apiFetch(`/admin/reports/${id}`, { method: 'PATCH', body: { action } });
