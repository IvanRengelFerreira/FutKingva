// Equipos (GET /api/teams/:id). Responsable: Angel.
import { apiFetch } from './client.js';

/** Ficha de un equipo: club, fila de la clasificación, tabla, plantilla y partidos de la temporada actual */
export const getTeam = (id, options) => apiFetch(`/teams/${id}`, options);
