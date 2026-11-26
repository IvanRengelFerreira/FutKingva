// Equipos (GET /api/teams y /api/teams/:id). Responsable: Angel.
import { apiFetch } from './client.js';

/** Listado de equipos con su clasificación: { items, total, limit, offset, season }. query: { q, sort, limit, offset } */
export const listTeams = (query, options) => apiFetch('/teams', { ...options, query });

/** Ficha de un equipo: club, fila de la clasificación, tabla, plantilla y partidos de la temporada actual */
export const getTeam = (id, options) => apiFetch(`/teams/${id}`, options);
