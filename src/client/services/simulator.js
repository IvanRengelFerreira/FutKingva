// Simulador de partidos de la demo (20 · Administración, RF9). Solo administradores.
import { apiFetch } from './client.js';

/** Partidos simulados recientes: { items, total, limit, offset } */
export const getSimulatedMatches = (options) => apiFetch('/admin/simulator', options);

/** Empieza un partido simulado ahora: { homeTeamId, awayTeamId } */
export const startSimulatedMatch = (body) => apiFetch('/admin/simulator', { method: 'POST', body });

/** Gol ahora en un partido simulado. side: 'home' | 'away' */
export const scoreSimulatedGoal = (id, side) =>
  apiFetch(`/admin/simulator/${id}/goal`, { method: 'POST', body: { side } });

/** Termina un partido simulado (no cuenta en la clasificación) */
export const finishSimulatedMatch = (id) => apiFetch(`/admin/simulator/${id}/finish`, { method: 'POST' });

/** Borra un partido simulado */
export const deleteSimulatedMatch = (id) => apiFetch(`/admin/simulator/${id}`, { method: 'DELETE' });
