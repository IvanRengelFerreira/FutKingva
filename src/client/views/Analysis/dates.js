// Fechas de los artículos (vienen de la API en ISO) en hora de Madrid

const TIME_ZONE = 'Europe/Madrid';

/** «2026-10-15T08:00:00.000Z» → «15 de octubre de 2026» */
export function longDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}
