import { REFEREES } from '../../data/mockData.js';
import { toSearchText } from '../../utils/text.js';

// Filas de 06 · Árbitros sacadas de mockData.js, filtradas por nombre y ordenadas.

export const SORTS = [
  { value: 'cardsPerMatch', label: 'Tarjetas / partido' },
  { value: 'matches', label: 'Partidos' },
  { value: 'redCards', label: 'Rojas' },
  { value: 'penalties', label: 'Penaltis' },
  { value: 'name', label: 'Nombre' },
];

// Árbitros cuyo nombre contiene el texto (sin tildes ni mayúsculas), ordenados por el criterio elegido.
// Por nombre, de la A a la Z; por cifras, de mayor a menor y, si empatan, por tarjetas por partido.
export function getRefereeRows(query, sort) {
  const text = toSearchText(query);
  return REFEREES.filter((referee) => toSearchText(referee.name).includes(text)).sort((a, b) =>
    sort === 'name'
      ? a.name.localeCompare(b.name, 'es')
      : (b[sort] ?? 0) - (a[sort] ?? 0) || b.cardsPerMatch - a.cardsPerMatch,
  );
}
