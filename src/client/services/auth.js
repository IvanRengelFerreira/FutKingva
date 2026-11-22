// Acceso (RF1): registro, inicio y cierre de sesión. Rutas del servidor en src/server/routes/auth.js.
// La sesión va en una cookie que pone el servidor; el navegador la envía sola en cada petición.

import { apiFetch } from './client.js';

/** Usuario de la sesión actual, o null si es un invitado */
export const getMe = (options) => apiFetch('/auth/me', options);

/** { email, password, remember } → usuario */
export const login = (data) => apiFetch('/auth/login', { method: 'POST', body: data });

/** { name, email, password, repeat, accepted } → usuario (ya con la sesión iniciada) */
export const register = (data) => apiFetch('/auth/register', { method: 'POST', body: data });

export const logout = () => apiFetch('/auth/logout', { method: 'POST' });
