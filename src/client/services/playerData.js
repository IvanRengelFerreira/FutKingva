// 19 · Actualizar datos de jugadores (/api/player-data, solo editores). Responsable: Carlota.
import { apiFetch } from './client.js';

/** Temporada, última sincronización, equipos de la temporada y jugador de ejemplo (featuredPlayerId) */
export const getPlayerDataOverview = (options) => apiFetch('/player-data', options);

/** Buscador: { q, teamId } → { items: [{ id, name, team, position }], total } */
export const searchPlayers = (query, options) => apiFetch('/player-data/players', { ...options, query });

/** Datos que se pueden corregir: { player, season, stats, edited } */
export const getPlayerData = (id, options) => apiFetch(`/player-data/players/${id}`, options);

/** Guarda una corrección: { values: { yellowCards: 3, … }, reason } → los datos ya guardados + saved */
export const savePlayerData = (id, body) => apiFetch(`/player-data/players/${id}`, { method: 'PATCH', body });

/** Historial de cambios, del más reciente al más antiguo */
export const getPlayerDataHistory = (options) => apiFetch('/player-data/history', options);
