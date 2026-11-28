// Lectura de parámetros de la dirección (/teams/16) y paginación (?limit=&offset=) compartidos entre rutas.
import { AppError } from '../errors/AppError.js';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** Id numérico de la URL o error 400 («El id del equipo no es válido») */
export function readId(value, label = 'id') {
  // Solo dígitos («1e3» o «0x1A» no valen) y dentro del rango seguro: así un id enorme da 400 y no 500 en la BD
  const id = /^\d+$/.test(String(value).trim()) ? Number(value) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw AppError.badRequest(`El ${label} no es válido`, { id: 'Tiene que ser un número' });
  }
  return BigInt(id);
}

/** Paginación común de listados: ?limit= (20 por defecto, máx. 100) y ?offset= (0 por defecto) */
export function readPagination(query) {
  return {
    limit: parseBoundedInt(query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT, 'limit'),
    offset: parseBoundedInt(query.offset, 0, 0, Number.MAX_SAFE_INTEGER, 'offset'),
  };
}

function parseBoundedInt(raw, fallback, min, max, field) {
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    const range = max === Number.MAX_SAFE_INTEGER ? `mayor o igual que ${min}` : `entre ${min} y ${max}`;
    throw AppError.badRequest(`El parámetro ${field} no es válido`, {
      [field]: `Tiene que ser un entero ${range}`,
    });
  }
  return value;
}
