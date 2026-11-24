// Reglas para guardar una comparativa (10 · Comparador, RF4). Las usan cliente y servidor:
//   cliente:  views/Comparator/Comparator.jsx (antes de enviar a la API)
//   servidor: routes/comparisons.js con validate() (400 con los mismos mensajes)
//
// Cada función devuelve { campo: 'mensaje' } solo con los campos que fallan ({} si todo vale).

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

const isPositiveInt = (value) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

/** Guardar comparativa: { playerIds: [2..4 ids enteros positivos, sin repetir] } */
export function validateComparison({ playerIds } = {}) {
  if (!Array.isArray(playerIds) || playerIds.length < MIN_PLAYERS || playerIds.length > MAX_PLAYERS) {
    return { playerIds: `Tienes que elegir entre ${MIN_PLAYERS} y ${MAX_PLAYERS} jugadores` };
  }
  if (!playerIds.every(isPositiveInt)) {
    return { playerIds: 'Los identificadores de jugador tienen que ser números enteros positivos' };
  }
  if (new Set(playerIds).size !== playerIds.length) {
    return { playerIds: 'No puedes repetir jugadores en la misma comparativa' };
  }
  return {};
}
