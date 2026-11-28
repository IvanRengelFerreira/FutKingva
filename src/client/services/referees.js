// Árbitros (GET /api/referees y /api/referees/:id). Responsable: Angel.
import { apiFetch } from './client.js';

/**
 * Listado de árbitros con sus cifras: { items, total, limit, offset, season, seasons, leagueCardsPerMatch }.
 * query: { season, q, sort, limit, offset }
 */
export const listReferees = (query, options) => apiFetch('/referees', { ...options, query });

/** Ficha de un árbitro: datos, cifras y partidos de una temporada. query: { season } */
export const getReferee = (id, query, options) => apiFetch(`/referees/${id}`, { ...options, query });
