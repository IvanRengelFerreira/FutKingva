// Lectura de los parámetros de la dirección (/teams/16) que comparten varias rutas.
import { AppError } from '../errors/AppError.js';

/** Id numérico de la URL o error 400 («El id del equipo no es válido») */
export function readId(value, label = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest(`El ${label} no es válido`, { id: 'Tiene que ser un número' });
  }
  return BigInt(id);
}
