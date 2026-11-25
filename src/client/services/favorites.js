// Favoritos del usuario autenticado (GET/PUT/DELETE /api/me/favorites). Responsable: Ivan.
import { apiFetch } from './client.js';

/** Equipos y jugadores favoritos con los datos necesarios para las tarjetas de 12 · Mi perfil */
export const getFavorites = (options) => apiFetch('/me/favorites', options);

export const addFavoriteTeam = (teamId) => apiFetch(`/me/favorites/teams/${teamId}`, { method: 'PUT' });

export const removeFavoriteTeam = (teamId) => apiFetch(`/me/favorites/teams/${teamId}`, { method: 'DELETE' });

export const addFavoritePlayer = (playerId) => apiFetch(`/me/favorites/players/${playerId}`, { method: 'PUT' });

export const removeFavoritePlayer = (playerId) => apiFetch(`/me/favorites/players/${playerId}`, { method: 'DELETE' });
