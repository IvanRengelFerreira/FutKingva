// Clasificación de LaLiga (GET /api/standings). Responsable: Angel.
import { apiFetch } from './client.js';

/** Clasificación de una temporada (año de inicio, p. ej. 2025) o de la actual si no se indica */
export const getStandings = (season, options) => apiFetch('/standings', { ...options, query: { season } });
