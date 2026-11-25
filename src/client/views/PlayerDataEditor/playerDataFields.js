import { POSITIONS, STAT_FIELDS } from '../../../shared/validation/playerData.js';

// Casillas del formulario, en el orden de Figma. Las de STAT_FIELDS se guardan en la BD;
// xG y tiros a puerta salen como en el diseño pero no se pueden corregir:
// el xG se calculará a partir de otros datos (no se guarda) y los tiros a puerta aún no los tenemos.
const stat = (key) => STAT_FIELDS.find((field) => field.key === key);

export const FORM_FIELDS = [
  stat('matches'),
  stat('minutes'),
  stat('goals'),
  stat('assists'),
  { key: 'xg', label: 'xG', readOnly: true, hint: 'Se calculará' },
  { key: 'shotsOnTarget', label: 'Tiros a puerta', readOnly: true, hint: 'Sin datos' },
  stat('yellowCards'),
  stat('redCards'),
];

export const POSITION_OPTIONS = POSITIONS.map((position) => position.value);

const EDITABLE_KEYS = [...STAT_FIELDS.map((field) => field.key), 'position'];
const EMPTY = '—'; // Dato que todavía no tenemos (null en la BD)

/** Datos de la API → textos de las casillas (null → vacío) */
export function toFormValues(data) {
  const values = { position: data.player.position ?? '' };
  STAT_FIELDS.forEach((field) => {
    const value = data.stats[field.key];
    values[field.key] = value == null ? '' : String(value);
  });
  return values;
}

/** Texto para enseñar un valor guardado («antes 2», historial): vacío o null → «—» */
export function displayValue(value) {
  return value == null || value === '' ? EMPTY : String(value);
}

// ¿Es el mismo dato? «03» = «3», y los espacios no cuentan
function sameValue(a, b) {
  const textA = a.trim();
  const textB = b.trim();
  if (textA === textB) return true;
  return /^\d+$/.test(textA) && /^\d+$/.test(textB) && Number(textA) === Number(textB);
}

export function getChangedFields(values, original) {
  return EDITABLE_KEYS.filter((key) => !sameValue(values[key], original[key]));
}

/** Lo que se envía a la API: solo los campos cambiados, los números como números («abc» → NaN, no válido) */
export function toPayload(values, changedFields) {
  return Object.fromEntries(
    changedFields.map((key) => {
      if (key === 'position') return [key, values.position];
      const text = values[key].trim();
      return [key, /^\d+$/.test(text) ? Number(text) : Number.NaN];
    }),
  );
}

/** «2026-11-10T16:18:19Z» → «10/11» (hora de Madrid) */
export function shortDay(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Madrid' });
}
