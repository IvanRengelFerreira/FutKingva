// Resumen de la portada (GET /api/home). Responsable: Ivan.
import { apiFetch } from './client.js';

/** Resumen del día: partidos en juego, últimos resultados, próximos partidos, clasificación y destacados */
export const getHome = (options) => apiFetch('/home', options);
