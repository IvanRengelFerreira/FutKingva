// Perfil del usuario autenticado (GET /api/me/profile). Responsable: Ivan.
import { apiFetch } from './client.js';

/** Datos públicos del usuario más su fecha de alta (memberSince) */
export const getProfile = (options) => apiFetch('/me/profile', options);
