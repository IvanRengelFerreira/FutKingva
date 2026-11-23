// Fechas de los artículos, guardadas como «15/10/2026»

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// «15/10/2026» → número para poder ordenar por fecha
export function toTime(date) {
  const [day, month, year] = date.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

// «15/10/2026» → «15 de octubre de 2026»
export function toLongDate(date) {
  if (!date) return null;
  const [day, month, year] = date.split('/').map(Number);
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}
