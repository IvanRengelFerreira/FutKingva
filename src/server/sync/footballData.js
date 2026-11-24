// TEMPORAL: cliente mínimo de football-data.org para los botones manuales de sincronización (20 · Administración).
// La sincronización automática periódica se implementará en otra tarea.

import { AppError } from '../errors/AppError.js';

export const COMPETITION_CODE = 'PD';
export const FOOTBALL_DATA_SOURCE = 'FOOTBALL_DATA';
export const SYNC_TX_TIMEOUT_MS = 20000;

const BASE_URL = 'https://api.football-data.org/v4';
// Plan gratuito: 10 peticiones/minuto → 6,5 s entre peticiones para no chocar con el límite
const REQUESTS_PER_MINUTE_LIMIT = 10;
const MIN_REQUEST_GAP_MS = 6500;
const MAX_RETRIES = 2;
const DEFAULT_RETRY_AFTER_S = 60;
const RETRY_BUFFER_S = 1;
const REQUEST_TIMEOUT_MS = 15000;
const MS_PER_SECOND = 1000;
const HEADER_AVAILABLE_MINUTE = 'x-requests-available-minute';
const HEADER_RESET_SECONDS = 'x-requestcounter-reset';

// Compartido entre peticiones del servidor para respetar el límite aunque se pulsen dos botones seguidos
let lastRequestAt = 0;
// Última cuota conocida en memoria a partir de las cabeceras de football-data.org (null hasta la primera petición)
let lastQuota = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseHeaderInt(headers, name) {
  const raw = headers.get(name);
  if (raw == null || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function recordQuota(response, now = Date.now()) {
  const available = parseHeaderInt(response.headers, HEADER_AVAILABLE_MINUTE);
  if (available === null) return;

  const resetSeconds = parseHeaderInt(response.headers, HEADER_RESET_SECONDS);
  const resetAt = resetSeconds !== null ? new Date(now + resetSeconds * MS_PER_SECOND).toISOString() : null;
  lastQuota = {
    available,
    limit: REQUESTS_PER_MINUTE_LIMIT,
    resetAt,
    updatedAt: new Date(now).toISOString(),
  };
}

/**
 * Devuelve la última cuota conocida de football-data.org sin gastar peticiones.
 * Si ya pasó `resetAt`, el contador del minuto se habrá reiniciado al límite completo.
 */
export function currentQuota(now = Date.now()) {
  if (!lastQuota) {
    return { available: null, limit: REQUESTS_PER_MINUTE_LIMIT, resetAt: null, updatedAt: null };
  }

  if (lastQuota.resetAt && Date.parse(lastQuota.resetAt) <= now) {
    return {
      available: lastQuota.limit,
      limit: lastQuota.limit,
      resetAt: null,
      updatedAt: lastQuota.updatedAt,
    };
  }

  return { ...lastQuota };
}

function retryWaitMs(response) {
  const header = parseHeaderInt(response.headers, HEADER_RESET_SECONDS);
  const seconds = header !== null && header > 0 ? header : DEFAULT_RETRY_AFTER_S;
  return (seconds + RETRY_BUFFER_S) * MS_PER_SECOND;
}

function httpErrorMessage(status) {
  if (status === 401 || status === 403) {
    return 'La API de football-data.org ha rechazado el token configurado.';
  }
  if (status === 429) {
    return 'Se ha superado el límite de peticiones de football-data.org. Inténtalo de nuevo en un minuto.';
  }
  return `football-data.org ha respondido con un error HTTP ${status}.`;
}

async function fetchOnce(path, token) {
  try {
    return await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-Auth-Token': token },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw AppError.badGateway('No se ha podido conectar con football-data.org. Inténtalo de nuevo en un momento.');
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    throw AppError.badGateway('La respuesta de football-data.org no tiene un formato JSON válido.');
  }
}

/**
 * Crea un cliente para consultar la API v4 de football-data.org con control de ritmo y reintento en 429.
 * Nunca incluye el token en mensajes de error ni en logs.
 */
export function createFootballDataClient(token = process.env.FOOTBALL_ORG_API) {
  if (!token) {
    throw AppError.badGateway('Falta el token FOOTBALL_ORG_API en la configuración del servidor.');
  }

  let requests = 0;

  async function get(path) {
    for (let attempt = 0; ; attempt++) {
      const waitMs = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
      if (lastRequestAt && waitMs > 0) await sleep(waitMs);
      lastRequestAt = Date.now();
      requests++;

      const response = await fetchOnce(path, token);
      recordQuota(response);

      if (response.status === 429 && attempt < MAX_RETRIES) {
        console.warn(`[sync] Límite de football-data.org alcanzado; esperando para reintentar (${path})`);
        await sleep(retryWaitMs(response));
        continue;
      }

      if (!response.ok) {
        throw AppError.badGateway(httpErrorMessage(response.status));
      }

      return readJson(response);
    }
  }

  return { get, requestCount: () => requests };
}
