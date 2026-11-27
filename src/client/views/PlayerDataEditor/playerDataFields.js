import { POSITIONS, STAT_FIELDS } from '../../../shared/validation/playerData.js';

// Casillas del formulario, en el orden de Figma. Todas se guardan en la BD (player_season_stats).
// El xG lleva decimales («1,45»): se escribe con coma o con punto y se enseña con coma.
const stat = (key) => STAT_FIELDS.find((field) => field.key === key);

export const FORM_FIELDS = [
  stat('matches'),
  stat('minutes'),
  stat('goals'),
  stat('assists'),
  stat('xg'),
  stat('shotsOnTarget'),
  stat('yellowCards'),
  stat('redCards'),
];

export const POSITION_OPTIONS = POSITIONS.map((position) => position.value);

const EDITABLE_KEYS = [...STAT_FIELDS.map((field) => field.key), 'position'];
const EMPTY = '—'; // Dato que todavía no tenemos (null en la BD)

/** Número de la BD → texto en español (1.5 → «1,5») */
function toText(value) {
  return String(value).replace('.', ',');
}

/** Texto de una casilla → número («1,5» → 1.5; «abc» → NaN, no válido; vacío → null) */
function toNumber(text) {
  const clean = text.trim().replace(',', '.');
  if (!clean) return null;
  return /^\d+(\.\d+)?$/.test(clean) ? Number(clean) : Number.NaN;
}

/** Datos de la API → textos de las casillas (null → vacío) */
export function toFormValues(data) {
  const values = { position: data.player.position ?? '' };
  STAT_FIELDS.forEach((field) => {
    const value = data.stats[field.key];
    values[field.key] = value == null ? '' : toText(value);
  });
  return values;
}

/** Texto para enseñar un valor guardado («antes 2», historial): vacío o null → «—»; «1.5» → «1,5» */
export function displayValue(value) {
  return value == null || value === '' ? EMPTY : toText(value);
}

// ¿Es el mismo dato? «03» = «3», «1,50» = «1.5», y los espacios no cuentan
function sameValue(a, b) {
  if (a.trim() === b.trim()) return true;
  const numberA = toNumber(a);
  const numberB = toNumber(b);
  return numberA != null && !Number.isNaN(numberA) && numberA === numberB;
}

export function getChangedFields(values, original) {
  return EDITABLE_KEYS.filter((key) => !sameValue(values[key], original[key]));
}

/** Lo que se envía a la API: solo los campos cambiados, los números como números (vacío o «abc» → NaN, no válido) */
export function toPayload(values, changedFields) {
  return Object.fromEntries(
    changedFields.map((key) => {
      if (key === 'position') return [key, values.position];
      return [key, toNumber(values[key]) ?? Number.NaN];
    }),
  );
}

/** «2026-11-10T16:18:19Z» → «10/11» (hora de Madrid) */
export function shortDay(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Madrid' });
}
