// Comparativas guardadas del usuario (/api/me/comparisons). Responsable: Ivan.
import { apiFetch } from './client.js';

/** Listado paginado de comparativas guardadas del usuario actual */
export const listComparisons = (query, options) => apiFetch('/me/comparisons', { ...options, query });

/** Guarda una comparativa de 2 a 4 jugadores (si ya existe con los mismos, la sustituye) */
export const createComparison = (playerIds, options) =>
  apiFetch('/me/comparisons', { ...options, method: 'POST', body: { playerIds } });

/** Elimina una comparativa guardada del usuario actual */
export const deleteComparison = (id, options) => apiFetch(`/me/comparisons/${id}`, { ...options, method: 'DELETE' });
