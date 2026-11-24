// Reglas del formulario de 11 · Mi equipo ideal (RF5). Las usan los dos lados con el mismo código:
//   cliente:  views/IdealTeam (error junto al campo antes de enviar)
//   servidor: routes/idealTeam.js con validate() (400 con los mismos mensajes)
//
// JavaScript puro, sin dependencias, para que funcione en Node y en el navegador.

import { FORMATIONS, FORMATION_NAMES } from '../formations.js';
import { onlyErrors, text } from './common.js';

export const IDEAL_TEAM_NAME_MIN = 1;
export const IDEAL_TEAM_NAME_MAX = 24;
export const DEFAULT_IDEAL_TEAM_NAME = 'Mi equipo ideal';

function nameError(name) {
  const value = text(name).trim();
  if (value.length < IDEAL_TEAM_NAME_MIN) return 'Ponle un nombre al equipo';
  if (value.length > IDEAL_TEAM_NAME_MAX) {
    return `El nombre no puede tener más de ${IDEAL_TEAM_NAME_MAX} caracteres`;
  }
  return null;
}

function formationError(formation) {
  if (typeof formation !== 'string' || !FORMATION_NAMES.includes(formation)) {
    return 'La formación no es válida';
  }
  return null;
}

function isPositiveInt(value) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function playersError(players, formation) {
  if (!Array.isArray(players)) return 'La alineación no es válida';

  const validSlots = FORMATIONS[formation] ? new Set(Object.keys(FORMATIONS[formation])) : null;
  const seenSlots = new Set();
  const seenPlayers = new Set();

  for (const entry of players) {
    if (!entry || typeof entry !== 'object') return 'La alineación no es válida';
    if (typeof entry.slot !== 'string' || !entry.slot) return 'Hay una posición que no es válida';
    if (validSlots && !validSlots.has(entry.slot)) return 'Hay una posición que no pertenece a esta formación';
    if (!isPositiveInt(entry.playerId)) return 'Hay un jugador con un identificador no válido';
    if (seenSlots.has(entry.slot)) return 'No puede haber dos jugadores en la misma posición';
    if (seenPlayers.has(entry.playerId)) return 'Un jugador no puede estar en dos posiciones a la vez';
    seenSlots.add(entry.slot);
    seenPlayers.add(entry.playerId);
  }
  return null;
}

/** Guardar equipo ideal: { name, formation, players: [{ slot, playerId }] } */
export function validateIdealTeam({ name, formation, players } = {}) {
  return onlyErrors({
    name: nameError(name),
    formation: formationError(formation),
    players: playersError(players, formation),
  });
}
