// Jugadores (GET /api/players, GET /api/players/:id). Responsable: Ivan.
import { apiFetch } from './client.js';

/** Ficha de un jugador: datos, club, estadísticas de la temporada, puestos y últimos partidos */
export const getPlayer = (id, options) => apiFetch(`/players/${id}`, options);

/**
 * Listado paginado de jugadores (?search, ?ids, ?position, ?limit, ?offset, ?season).
 * Cada elemento de `items` tiene:
 *   { id, name, number, position, positionGroup, age, team, matches, minutes, goals, assists, yellowCards, redCards, rating }
 */
export function listPlayers(query, options) {
  const normalized = Array.isArray(query?.ids) ? { ...query, ids: query.ids.join(',') } : query;
  return apiFetch('/players', { ...options, query: normalized });
}
