// Jugadores (GET /api/players). Responsable: Angel.
import { apiFetch } from './client.js';

/** Listado de jugadores: { items, total, limit, offset, season }. query: { q, sort, limit, offset } */
export const listPlayers = (query, options) => apiFetch('/players', { ...options, query });
