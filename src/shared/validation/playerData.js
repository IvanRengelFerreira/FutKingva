// Reglas de 19 · Actualizar datos de jugadores (RF11). Las usan los dos lados con el mismo código:
//   cliente:  views/PlayerDataEditor (enseña el error junto al campo antes de guardar)
//   servidor: routes/playerData.js con validate() (400 con los mismos mensajes)
//
// Cuerpo de la corrección: { values: { campo: número | posición }, reason }
// En `values` solo van los campos que cambian. Devuelve { campo: 'mensaje' } con los que fallan ({} si todo vale).

// Estadísticas de la temporada que se pueden corregir (las de Figma que existen en la BD).
// key = nombre en la API · column = columna de player_season_stats · short = nombre en el historial
export const STAT_FIELDS = [
  { key: 'matches', column: 'played', label: 'Partidos', max: 99 },
  { key: 'minutes', column: 'minutes', label: 'Minutos', max: 9999 },
  { key: 'goals', column: 'goals', label: 'Goles', max: 99 },
  { key: 'assists', column: 'assists', label: 'Asistencias', max: 99 },
  { key: 'yellowCards', column: 'yellow_cards', label: 'Tarjetas amarillas', short: 'Amarillas', max: 99 },
  { key: 'redCards', column: 'red_cards', label: 'Tarjetas rojas', short: 'Rojas', max: 99 },
];

// Posiciones detalladas de la BD (players.detailed_position) con su grupo (players.position)
export const POSITIONS = [
  { value: 'Portero', group: 'GOALKEEPER' },
  { value: 'Central', group: 'DEFENDER' },
  { value: 'Lateral derecho', group: 'DEFENDER' },
  { value: 'Lateral izquierdo', group: 'DEFENDER' },
  { value: 'Pivote', group: 'MIDFIELDER' },
  { value: 'Mediocentro', group: 'MIDFIELDER' },
  { value: 'Interior derecho', group: 'MIDFIELDER' },
  { value: 'Interior izquierdo', group: 'MIDFIELDER' },
  { value: 'Mediapunta', group: 'MIDFIELDER' },
  { value: 'Extremo derecho', group: 'FORWARD' },
  { value: 'Extremo izquierdo', group: 'FORWARD' },
  { value: 'Segundo delantero', group: 'FORWARD' },
  { value: 'Delantero centro', group: 'FORWARD' },
];

export const REASON_MAX = 300;

/** Nombre corto de un campo para el historial («Amarillas», «Posición»…) */
export function fieldLabel(key) {
  if (key === 'position') return 'Posición';
  const field = STAT_FIELDS.find((item) => item.key === key);
  return field ? (field.short ?? field.label) : key;
}

/** Grupo de posición de la BD de una posición detallada («Pivote» → 'MIDFIELDER') */
export function positionGroup(value) {
  return POSITIONS.find((item) => item.value === value)?.group;
}

// Quita los campos sin error
function onlyErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

function statError(field, value) {
  if (!Number.isInteger(value) || value < 0) return 'Escribe un número entero (0 o más)';
  if (value > field.max) return `No puede ser mayor que ${field.max}`;
  return null;
}

function reasonError(reason) {
  const value = typeof reason === 'string' ? reason.trim() : '';
  if (!value) return 'Explica el motivo del cambio';
  if (value.length > REASON_MAX) return `El motivo no puede tener más de ${REASON_MAX} caracteres`;
  return null;
}

/** Corrección: { values: { matches?, minutes?, goals?, assists?, yellowCards?, redCards?, position? }, reason } */
export function validatePlayerData({ values, reason } = {}) {
  const isObject = values !== null && typeof values === 'object' && !Array.isArray(values);
  const keys = isObject ? Object.keys(values) : [];
  if (keys.length === 0) return { values: 'No hay cambios que guardar' };

  const errors = {};
  for (const key of keys) {
    const field = STAT_FIELDS.find((item) => item.key === key);
    if (field) errors[key] = statError(field, values[key]);
    else if (key === 'position')
      errors.position = positionGroup(values.position) ? null : 'Elige una posición de la lista';
    else errors[key] = 'Este dato no se puede corregir';
  }
  errors.reason = reasonError(reason);
  return onlyErrors(errors);
}
