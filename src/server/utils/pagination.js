// ?limit= y ?offset= de los listados: { items, total, limit, offset } (CONVENCIONES.md › 3)
import { AppError } from '../errors/AppError.js';

export function readPagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const limit = readInteger(query.limit, defaultLimit);
  const offset = readInteger(query.offset, 0);

  const fields = {};
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    fields.limit = `Tiene que ser un número entre 1 y ${maxLimit}`;
  }
  if (!Number.isSafeInteger(offset) || offset < 0) fields.offset = 'Tiene que ser un número igual o mayor que 0';
  if (Object.keys(fields).length > 0) throw AppError.badRequest('La paginación no es válida', fields);

  return { limit, offset };
}

function readInteger(value, fallback) {
  return value === undefined || value === '' ? fallback : Number(value);
}
