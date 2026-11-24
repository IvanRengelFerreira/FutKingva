// Ayudas para enseñar datos de la API en español. Responsable: Angel.

// Las fechas y horas de los partidos se enseñan siempre en hora de Madrid
const TIME_ZONE = 'Europe/Madrid';

/** «hace 5 min», «hace 3 h», «hace 2 días» a partir de una fecha ISO */
export function timeAgo(iso, now = Date.now()) {
  if (!iso) return '';
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
}

/** Fecha corta en hora de Madrid: «dom 25/10» */
export function shortDate(iso) {
  return new Date(iso)
    .toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      timeZone: TIME_ZONE,
    })
    .replace(',', '');
}

/** Hora en Madrid: «21:00» */
export function shortTime(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE });
}

/** Mes y año en hora de Madrid: «09/2026» */
export function monthYear(iso) {
  return new Date(iso).toLocaleDateString('es-ES', {
    month: '2-digit',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}
