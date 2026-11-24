// Ayudas para enseñar datos de la API en español. Responsable: Angel.
import { capitalize } from '../utils/text.js';

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

/** Fecha numérica en hora de Madrid: «08/11/2026» */
export function numericDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

/** Fecha del día en español (hora de Madrid): { full: «Martes 24 de noviembre», short: «Mar 24 nov» } */
export function todayLabel(date = new Date()) {
  const full = date
    .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIME_ZONE })
    .replace(',', '');
  const short = date
    .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TIME_ZONE })
    .replaceAll(',', '')
    .replaceAll('.', '');
  return { full: capitalize(full), short: capitalize(short) };
}
