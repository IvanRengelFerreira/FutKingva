// ?q= y ?sort= de los listados (Equipos y jugadores).
// El filtro por nombre se hace aquí y no en la consulta: Postgres no ignora las tildes sin la extensión unaccent.
import { AppError } from '../errors/AppError.js';

/** Sin tildes, mayúsculas ni espacios en los extremos («  Díaz » → «diaz») */
function toSearchText(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .trim();
}

/** Valida ?q y devuelve una función que dice si algún nombre lo contiene (sin ?q, valen todos) */
export function readNameFilter(value = '') {
  if (typeof value !== 'string') {
    throw AppError.badRequest('La búsqueda no es válida', { q: 'Tiene que ser un texto' });
  }
  const text = toSearchText(value);
  return (...names) => names.some((name) => toSearchText(name ?? '').includes(text));
}

/** Valida ?sort contra los órdenes del listado; sin ?sort, el primero */
export function readSort(value, allowed) {
  if (value === undefined || value === '') return allowed[0];
  if (!allowed.includes(value)) {
    throw AppError.badRequest('El orden no es válido', { sort: `Tiene que ser uno de: ${allowed.join(', ')}` });
  }
  return value;
}

// Con el mismo nombre, por id: así el orden no cambia entre peticiones y al paginar no se repiten ni faltan filas
export function byName(a, b) {
  return a.name.localeCompare(b.name, 'es') || byId(a, b);
}

function byId(a, b) {
  return Number(a.id) - Number(b.id);
}
