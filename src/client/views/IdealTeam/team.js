// Reglas y cálculos del equipo ideal (11 · Mi equipo ideal): qué jugador cabe en cada posición,
// cómo se reubica el once al cambiar de formación y los totales del resumen.
import { FORMATIONS, slotPosition } from '../../components/Pitch/Pitch.jsx';
import { PLAYERS, PLAYER_AGES_ESTIMATED, getPlayer } from '../../data/mockData.js';

export const FORMATION_NAMES = Object.keys(FORMATIONS);
export const TEAM_SIZE = 11;
export const MAX_NAME_LENGTH = 24;

// Posición de los datos (PLAYERS) que sirve para cada posición del campo.
// Los extremos y delanteros se pueden intercambiar; los medios laterales (MI, MD) admiten también extremos.
const FIT = {
  POR: ['Portero'],
  LD: ['Defensa'], LI: ['Defensa'], DFC: ['Defensa'],
  MC: ['Centrocampista'], MI: ['Centrocampista', 'Extremo'], MD: ['Centrocampista', 'Extremo'],
  ED: ['Extremo', 'Delantero'], EI: ['Extremo', 'Delantero'], DC: ['Delantero', 'Extremo'],
};

// ¿Puede jugar este jugador en esta posición del campo (DFC1 → DFC)?
export function fitsSlot(player, slot) {
  return Boolean(player) && (FIT[slotPosition(slot)] ?? []).includes(player.position);
}

// Posiciones de la formación en el orden en que se rellenan (delantera arriba → portero)
export function slotsOf(formation) {
  return Object.keys(FORMATIONS[formation] ?? FORMATIONS['4-3-3']);
}

// [{ slot, playerId }] de toda la formación (los huecos con playerId null)
export function lineupOf(formation, assigned) {
  return slotsOf(formation).map((slot) => ({ slot, playerId: assigned[slot] ?? null }));
}

// De la lista de IDEAL_TEAM_EXAMPLE a { slot: playerId }, sin repetir jugador ni posición
export function toAssigned(players = []) {
  const assigned = {};
  const used = new Set();
  players.forEach(({ slot, playerId }) => {
    if (playerId && getPlayer(playerId) && !used.has(playerId) && !(slot in assigned)) {
      assigned[slot] = playerId;
      used.add(playerId);
    }
  });
  return assigned;
}

// Pone a un jugador en una posición. Regla: un jugador no puede estar dos veces y cada posición lleva uno;
// si el jugador ya estaba en otra posición, esa queda libre (se «mueve»); si la posición estaba ocupada, se sustituye.
// Devuelve null si no se puede (posición inexistente, jugador desconocido o que no encaja).
export function assignPlayer(assigned, formation, slot, playerId) {
  if (!slotsOf(formation).includes(slot) || !fitsSlot(getPlayer(playerId), slot)) return null;
  const next = Object.fromEntries(Object.entries(assigned).filter(([, id]) => id !== playerId));
  next[slot] = playerId;
  return next;
}

export function removePlayer(assigned, slot) {
  const { [slot]: _removed, ...rest } = assigned;
  return rest;
}

// Cambio de formación. Se conservan los jugadores cuya posición sigue existiendo (mismo nombre: DFC1, MC2…).
// Los de posiciones que desaparecen se reubican en un hueco libre donde encajen (p. ej. el MC3 del 4-3-3 pasa a
// MD en el 4-4-2); si no hay hueco, salen del once (no se pierden: se pueden volver a añadir) y se avisa.
// Devuelve { assigned, moved: [{ playerId, from, to }], dropped: [{ playerId, from }] }.
export function changeFormation(assigned, from, to) {
  const target = slotsOf(to);
  const next = {};
  const pending = [];
  Object.entries(assigned).forEach(([slot, playerId]) => {
    if (target.includes(slot)) next[slot] = playerId;
    else pending.push({ slot, playerId });
  });

  const moved = [];
  const dropped = [];
  pending.forEach(({ slot, playerId }) => {
    const free = target.find((s) => !(s in next) && fitsSlot(getPlayer(playerId), s));
    if (free) {
      next[free] = playerId;
      moved.push({ playerId, from: slot, to: free });
    } else {
      dropped.push({ playerId, from: slot });
    }
  });
  return { assigned: next, moved, dropped };
}

export function ageOf(player) {
  return player?.age ?? PLAYER_AGES_ESTIMATED[player?.id] ?? null;
}

function average(values, decimals) {
  const known = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (known.length === 0) return null;
  return Number((known.reduce((sum, v) => sum + v, 0) / known.length).toFixed(decimals));
}

// Totales del resumen; lo que falta en los datos no cuenta y, si no queda nada, sale null («—»)
export function summarize(assigned) {
  const players = Object.values(assigned).map(getPlayer).filter(Boolean);
  const sum = (key) => (players.length ? players.reduce((total, p) => total + (Number.isFinite(p[key]) ? p[key] : 0), 0) : null);
  return {
    count: players.length,
    goals: sum('goals'),
    assists: sum('assists'),
    averageAge: average(players.map(ageOf), 1),
    averageRating: average(players.map((p) => p.rating), 1),
  };
}

// Candidatos para una posición: jugadores que encajan, que no están ya en el once y que coinciden con el texto
function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export const SORTS = [
  { value: 'goals', label: 'Ordenar por goles' },
  { value: 'assists', label: 'Ordenar por asistencias' },
  { value: 'rating', label: 'Ordenar por valoración' },
];

export function candidatesFor({ slot, assigned, query, onlySlotPosition, sort }) {
  const used = new Set(Object.values(assigned));
  const search = normalize(query);
  return Object.values(PLAYERS)
    .filter((p) => !used.has(p.id))
    .filter((p) => !onlySlotPosition || !slot || fitsSlot(p, slot))
    .filter((p) => !search || normalize(p.name).includes(search))
    .sort((a, b) => (Number(b[sort]) || 0) - (Number(a[sort]) || 0) || a.name.localeCompare(b.name));
}
