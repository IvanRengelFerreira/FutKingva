// Equipo ideal del usuario (GET/PUT /api/me/ideal-team). Responsable: Ivan.
import { apiFetch } from './client.js';

/** Equipo ideal guardado del usuario (o uno vacío por defecto) */
export const getIdealTeam = (options) => apiFetch('/me/ideal-team', options);

/** Guarda o actualiza el equipo ideal del usuario ({ name, formation, players: [{ slot, playerId }] }) */
export const saveIdealTeam = (team, options) => apiFetch('/me/ideal-team', { ...options, method: 'PUT', body: team });
