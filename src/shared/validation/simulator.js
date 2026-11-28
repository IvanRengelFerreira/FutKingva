// Reglas del simulador de partidos (20 · Administración). Las comparten servidor (validate) y cliente.
// Cada función devuelve { campo: 'mensaje' } solo con lo que falla ({} si todo vale).
// JavaScript puro, sin dependencias, para que funcione en Node y en el navegador.

import { onlyErrors } from './common.js';

export const GOAL_SIDES = ['home', 'away'];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

/** Empezar un partido simulado: { homeTeamId, awayTeamId } (ids de equipos distintos) */
export function validateSimulatorStart(body) {
  const { homeTeamId, awayTeamId } = isObject(body) ? body : {};
  return onlyErrors({
    homeTeamId: isId(homeTeamId) ? null : 'Elige el equipo local',
    awayTeamId: !isId(awayTeamId)
      ? 'Elige el equipo visitante'
      : awayTeamId === homeTeamId
        ? 'El visitante tiene que ser distinto del local'
        : null,
  });
}

/** Forzar un gol: { side?: 'home' | 'away' } (sin side, al azar) */
export function validateSimulatorGoal(body) {
  const { side } = isObject(body) ? body : {};
  if (side !== undefined && !GOAL_SIDES.includes(side)) return { side: 'Tiene que ser local o visitante' };
  return {};
}
