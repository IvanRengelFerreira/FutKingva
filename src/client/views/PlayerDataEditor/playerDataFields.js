import { PLAYERS, TEAMS, getPlayer } from '../../data/mockData.js';
import { toSearchText } from '../../utils/text.js';

// Campos que se pueden corregir: clave en PLAYERS, etiqueta, nombre corto para el historial
export const FIELDS = [
  { key: 'matches', label: 'Partidos' },
  { key: 'minutes', label: 'Minutos' },
  { key: 'goals', label: 'Goles' },
  { key: 'assists', label: 'Asistencias' },
  { key: 'xg', label: 'xG', decimal: true },
  { key: 'shotsOnTarget', label: 'Tiros a puerta' },
  { key: 'cards', label: 'Tarjetas amarillas', short: 'Amarillas' },
  { key: 'redCards', label: 'Tarjetas rojas', short: 'Rojas' },
];

export const POSITIONS = ['Portero', 'Defensa', 'Centrocampista', 'Extremo', 'Delantero'];

// Fecha de hoy en la maqueta (sábado 17/10/2026)
export const TODAY_SHORT_DATE = '17/10';

const MAX_SUGGESTIONS = 6;

// Valores del jugador tal como están (mockData.js + lo ya guardado en esta visita), como textos para los campos
export function originalValues(playerId, saved) {
  const player = getPlayer(playerId);
  const values = { position: player.position };
  FIELDS.forEach((field) => {
    const value = player[field.key] ?? 0;
    values[field.key] = field.decimal ? value.toLocaleString('es-ES') : String(value);
  });
  return { ...values, ...saved[playerId] };
}

// ¿Es el mismo dato? Los números se comparan como números («0,8» = «0.8», «03» = «3»)
export function sameValue(a, b) {
  const textA = String(a).trim();
  const textB = String(b).trim();
  if (textA === textB) return true;
  const numberA = Number(textA.replace(',', '.'));
  const numberB = Number(textB.replace(',', '.'));
  return textA !== '' && Number.isFinite(numberA) && numberA === numberB;
}

export function isValidNumber(text, decimal) {
  const pattern = decimal ? /^\d+([.,]\d+)?$/ : /^\d+$/;
  return pattern.test(text.trim());
}

export function fieldName(key) {
  if (key === 'position') return 'Posición';
  const field = FIELDS.find((item) => item.key === key);
  return field.short ?? field.label;
}

export function pick(object, keys) {
  return Object.fromEntries(keys.map((key) => [key, object[key]]));
}

export function getChangedFields(values, original) {
  const editableKeys = [...FIELDS.map((field) => field.key), 'position'];
  return editableKeys.filter((key) => !sameValue(values[key], original[key]));
}

export function validatePlayerValues(values, changedFields, reason) {
  const fieldErrors = Object.fromEntries(
    FIELDS.map((field) => [field.key, isValidNumber(values[field.key], field.decimal) ? null : 'Número no válido']),
  );
  const reasonError = changedFields.length > 0 && !reason.trim() ? 'Explica el motivo del cambio' : null;
  return { ...fieldErrors, reason: reasonError };
}

// Equipos que tienen jugadores en mockData.js
export function teamsWithPlayers() {
  const teamIds = new Set(Object.values(PLAYERS).map((player) => player.teamId));
  return Object.values(TEAMS)
    .filter((team) => teamIds.has(team.id))
    .map((team) => ({ value: team.id, label: team.name }));
}

// Jugadores que coinciden con lo buscado y con el equipo elegido (máximo 6)
export function getSuggestions(query, teamId, currentId) {
  const text = toSearchText(query);
  if (!text && teamId === 'all') return [];
  return Object.values(PLAYERS)
    .filter((player) => player.id !== currentId)
    .filter((player) => teamId === 'all' || player.teamId === teamId)
    .filter((player) => !text || toSearchText(player.name).includes(text))
    .slice(0, MAX_SUGGESTIONS);
}
