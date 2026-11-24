// TEMPORAL: llamadas a la API de sincronización manual con football-data.org (20 · Administración).
// La sincronización automática periódica se implementará en otra tarea.

import { apiFetch } from './client.js';

/** Últimas ejecuciones por recurso: { items: [{ resource, status, records, requests, error, startedAt, finishedAt }] } */
export const getSyncRuns = (options) => apiFetch('/admin/sync', options);

/** Lanza la sincronización manual de un recurso ('matches' | 'scorers') */
export const runSyncResource = (resource) => apiFetch(`/admin/sync/${resource}`, { method: 'POST' });
