// Llamada común a la API del servidor (src/server). Todas las peticiones pasan por apiFetch.
//
//   const standings = await apiFetch('/standings', { query: { season: 2026 } });
//   await apiFetch('/contact', { method: 'POST', body: { email, message } });
//
// Cada recurso tiene su archivo con sus funciones (services/teams.js → getTeam(id)…), que usan apiFetch.
// Si algo sale mal lanza un ApiError con el formato común del servidor:
//   { "error": { "code", "message", "fields"? } }

/** Error de la API: lo que ha respondido el servidor, o NETWORK_ERROR si no se ha podido llegar a él */
export class ApiError extends Error {
  /**
   * @param {number} status estado HTTP (0 si no hay respuesta del servidor)
   * @param {string} code 'NOT_FOUND', 'VALIDATION_ERROR', 'SERVICE_UNAVAILABLE', 'NETWORK_ERROR'…
   * @param {string} message texto para mostrar al usuario (en español)
   * @param {Record<string, string>} [fields] errores por campo de formulario o parámetro
   */
  constructor(status, code, message, fields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const BASE_URL = '/api';

const CONNECTION_MESSAGE = 'No se ha podido conectar con el servidor. Inténtalo de nuevo en un momento.';

/** Monta la dirección: '/standings' + { season: 2026 } → '/api/standings?season=2026' (sin vacíos) */
function buildUrl(path, query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.append(key, value);
  }
  const search = params.toString();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const separator = cleanPath.includes('?') ? '&' : '?'; // Por si la ruta ya trae parámetros
  return `${BASE_URL}${cleanPath}${search ? `${separator}${search}` : ''}`;
}

/**
 * Pide algo a la API y devuelve el JSON de la respuesta (null si no tiene cuerpo).
 * @param {string} path ruta sin /api delante, p. ej. '/teams/86'
 * @param {object} [options]
 * @param {string} [options.method] 'GET' (por defecto), 'POST', 'PUT', 'PATCH', 'DELETE'
 * @param {object} [options.query] parámetros de la dirección (?season=2026)
 * @param {object} [options.body] datos que se envían como JSON
 * @param {AbortSignal} [options.signal] para cancelar la petición (lo usa useApi)
 * @throws {ApiError}
 */
export async function apiFetch(path, { method = 'GET', query, body, signal } = {}) {
  let response;
  let text;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      // Envía la cookie de sesión (misma dirección que la web: en desarrollo, gracias al proxy de Vite)
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    // Leer el cuerpo también puede fallar si se corta la conexión a mitad
    text = await response.text();
  } catch (error) {
    if (error.name === 'AbortError') throw error; // Cancelada a propósito: no es un fallo
    throw new ApiError(0, 'NETWORK_ERROR', CONNECTION_MESSAGE);
  }

  const data = parseJson(text);

  if (response.ok && data === INVALID_JSON) {
    // Responde otra cosa que no es la API (p. ej. otra web en ese puerto)
    throw new ApiError(response.status, 'INVALID_RESPONSE', CONNECTION_MESSAGE);
  }

  if (!response.ok) {
    const error = data?.error;
    if (error?.code) {
      throw new ApiError(response.status, error.code, error.message, error.fields);
    }
    // Respuesta sin el formato común (p. ej. el servidor está apagado y responde el proxy de Vite)
    throw new ApiError(
      response.status,
      response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'UNKNOWN_ERROR',
      CONNECTION_MESSAGE,
    );
  }

  return data;
}

const INVALID_JSON = Symbol('INVALID_JSON');

/** Convierte el cuerpo en JSON: null si está vacío, INVALID_JSON si no es JSON */
function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return INVALID_JSON;
  }
}
