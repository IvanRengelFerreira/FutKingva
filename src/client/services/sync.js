// TEMPORAL: llamadas a la API de sincronización manual con football-data.org (20 · Administración).
// La sincronización automática periódica se implementará en otra tarea.

import { apiFetch } from './client.js';

/** Últimas ejecuciones por recurso y cuota de football-data.org: { items, quota } */
export const getSyncRuns = (options) => apiFetch('/admin/sync', options);

/** Lanza la sincronización manual de un recurso ('matches' | 'scorers') y devuelve el resultado junto a quota */
export const runSyncResource = (resource) => apiFetch(`/admin/sync/${resource}`, { method: 'POST' });
