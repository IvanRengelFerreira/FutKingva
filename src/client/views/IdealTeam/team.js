// Reglas y cálculos del equipo ideal (11 · Mi equipo ideal): cómo se reubica el once al cambiar de formación,
// conversión entre lista y mapa por hueco, y totales del resumen.
import { slotPosition, slotsOf } from '../../../shared/formations.js';
import { fitsSlot } from '../../../shared/positions.js';

export const TEAM_SIZE = 11;

/** Primera posición libre de la formación (empezando después de la actual, si se indica); null si está completa */
export function firstEmpty(formation, assigned, after) {
  const slots = slotsOf(formation);
  const start = after ? slots.indexOf(after) + 1 : 0;
  const ordered = [...slots.slice(start), ...slots.slice(0, start)];
  return ordered.find((slot) => !assigned[slot]) ?? null;
}

/** [{ slot, playerId, player }] de toda la formación (los huecos con playerId y player a null) */
export function lineupOf(formation, assigned) {
  return slotsOf(formation).map((slot) => {
    const player = assigned[slot] ?? null;
    return { slot, playerId: player?.id ?? null, player };
  });
}

/** Solo los huecos ocupados para validar y enviar a PUT /api/me/ideal-team: [{ slot, playerId }] */
export function filledPlayersOf(formation, assigned) {
  return slotsOf(formation)
    .filter((slot) => assigned[slot])
    .map((slot) => ({ slot, playerId: assigned[slot].id }));
}

/** De la lista de jugadores ({ slot, player }) a { slot: player }, sin repetir jugador ni posición */
export function toAssigned(players = []) {
  const assigned = {};
  const used = new Set();
  players.forEach(({ slot, player }) => {
    if (player?.id != null && !used.has(player.id) && !(slot in assigned)) {
      assigned[slot] = player;
      used.add(player.id);
    }
  });
  return assigned;
}

// Pone a un jugador en una posición. Regla: un jugador no puede estar dos veces y cada posición lleva uno;
// si el jugador ya estaba en otra posición, esa queda libre (se «mueve»); si la posición estaba ocupada, se sustituye.
// Devuelve null si no se puede (posición inexistente, jugador desconocido o que no encaja).
export function assignPlayer(assigned, formation, slot, player) {
  if (!slotsOf(formation).includes(slot) || !fitsSlot(player, slot)) return null;
  const next = Object.fromEntries(Object.entries(assigned).filter(([, current]) => current.id !== player.id));
  next[slot] = player;
  return next;
}

export function removePlayer(assigned, slot) {
  const { [slot]: _removed, ...rest } = assigned;
  return rest;
}

// Cambio de formación. Se conservan los jugadores cuya posición sigue existiendo (mismo nombre: DFC1, MC2…).
// Los de posiciones que desaparecen se reubican en un hueco libre donde encajen (p. ej. el MC3 del 4-3-3 pasa a
// MD en el 4-4-2); si no hay hueco, salen del once (no se pierden: se pueden volver a añadir) y se avisa.
// Devuelve { assigned, moved: [{ player, from, to }], dropped: [{ player, from }] }.
export function changeFormation(assigned, from, to) {
  const target = slotsOf(to);
  const next = {};
  const pending = [];
  Object.entries(assigned).forEach(([slot, player]) => {
    if (target.includes(slot)) next[slot] = player;
    else pending.push({ slot, player });
  });

  const moved = [];
  const dropped = [];
  pending.forEach(({ slot, player }) => {
    const free = target.find((candidateSlot) => !(candidateSlot in next) && fitsSlot(player, candidateSlot));
    if (free) {
      next[free] = player;
      moved.push({ player, from: slot, to: free });
    } else {
      dropped.push({ player, from: slot });
    }
  });
  return { assigned: next, moved, dropped };
}

/** Aviso tras cambiar de formación: qué jugadores se han movido y cuáles han salido del once */
export function describeChange(to, { moved, dropped }) {
  const parts = [`Formación ${to}.`];
  moved
    .filter(({ from, to: slot }) => slotPosition(from) !== slotPosition(slot))
    .forEach(({ player, from, to: slot }) =>
      parts.push(`${player.name} pasa de ${slotPosition(from)} a ${slotPosition(slot)}.`),
    );
  dropped.forEach(({ player, from }) =>
    parts.push(`${player.name} (${slotPosition(from)}) sale del once: no hay hueco para su posición.`),
  );
  return parts.join(' ');
}

function knownNumbers(values) {
  return values.filter((value) => typeof value === 'number' && Number.isFinite(value));
}

function sumOptional(values) {
  const known = knownNumbers(values);
  if (known.length === 0) return null;
  return known.reduce((total, value) => total + value, 0);
}

function average(values, decimals) {
  const known = knownNumbers(values);
  if (known.length === 0) return null;
  return Number((known.reduce((sum, value) => sum + value, 0) / known.length).toFixed(decimals));
}

/** Totales del resumen; lo que falta en los datos no cuenta y, si no queda nada, sale null («—») */
export function summarize(assigned) {
  const players = Object.values(assigned).filter(Boolean);
  return {
    count: players.length,
    goals: sumOptional(players.map((player) => player.goals)),
    assists: sumOptional(players.map((player) => player.assists)),
    averageAge: average(
      players.map((player) => player.age),
      1,
    ),
    averageRating: average(
      players.map((player) => player.rating),
      1,
    ),
  };
}

export const SORTS = [
  { value: 'goals', label: 'Ordenar por goles' },
  { value: 'assists', label: 'Ordenar por asistencias' },
  { value: 'rating', label: 'Ordenar por valoración' },
];

// Reordena los candidatos ya cargados por la métrica elegida (los sin dato al final; desempate por nombre)
export function sortCandidates(players, sort) {
  return [...players].sort((a, b) => {
    const aValue = typeof a[sort] === 'number' ? a[sort] : -1;
    const bValue = typeof b[sort] === 'number' ? b[sort] : -1;
    return bValue - aValue || a.name.localeCompare(b.name, 'es');
  });
}
