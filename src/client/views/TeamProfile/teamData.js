// Ayudas de la ficha de equipo para dar forma a lo que llega de la API (GET /api/teams/:id).

// Las fechas de los partidos se enseñan en hora de Madrid
const TIME_ZONE = 'Europe/Madrid';
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** Los máximos goleadores de la plantilla (lista corta del móvil) */
export function getTopScorers(squad, count) {
  return [...squad].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0)).slice(0, count);
}

/** Partes de la fecha para el cuadradito «21 NOV» y el texto «Sáb · 21:00» */
export function matchDateParts(iso) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TIME_ZONE,
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return {
    weekday: capitalize(parts.weekday.replace('.', '')),
    day: parts.day,
    month: MONTHS[Number(parts.month) - 1],
    time: `${parts.hour}:${parts.minute}`,
    dayMonth: `${parts.day}/${parts.month}`,
  };
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
