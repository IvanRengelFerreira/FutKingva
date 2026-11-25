// Mapeo único de posiciones de la BD a las categorías tácticas de 11 · Mi equipo ideal (regla FIT).
// Compartido entre cliente (Candidatos, cambio de formación) y servidor (validación de PUT /api/me/ideal-team).
//
// Valores reales en la BD (SELECT DISTINCT position, detailed_position FROM players):
//   GOALKEEPER → 'Portero' (o null)
//   DEFENDER   → 'Central', 'Lateral izquierdo', 'Lateral derecho' (o null)
//   MIDFIELDER → 'Mediocentro', 'Pivote', 'Mediapunta', 'Interior izquierdo', 'Interior derecho' (o null)
//   FORWARD    → 'Delantero centro', 'Segundo delantero', 'Extremo derecho', 'Extremo izquierdo' (o null)

import { slotPosition } from './formations.js';

const DETAILED_POSITION_TO_ROLE = {
  Portero: 'Portero',
  Central: 'Defensa',
  'Lateral izquierdo': 'Defensa',
  'Lateral derecho': 'Defensa',
  Defensa: 'Defensa',
  Mediocentro: 'Centrocampista',
  Pivote: 'Centrocampista',
  Mediapunta: 'Centrocampista',
  'Interior izquierdo': 'Centrocampista',
  'Interior derecho': 'Centrocampista',
  Centrocampista: 'Centrocampista',
  'Extremo derecho': 'Extremo',
  'Extremo izquierdo': 'Extremo',
  Extremo: 'Extremo',
  'Delantero centro': 'Delantero',
  'Segundo delantero': 'Delantero',
  Delantero: 'Delantero',
};

// Respaldo cuando `detailed_position` es null o un editor escribe un texto fuera del diccionario anterior
const GROUP_TO_ROLE = {
  GOALKEEPER: 'Portero',
  DEFENDER: 'Defensa',
  MIDFIELDER: 'Centrocampista',
  FORWARD: 'Delantero',
};

// Grupo de la API (GET /api/players?position=...) al que pertenece cada categoría táctica
const ROLE_TO_GROUP = {
  Portero: 'GOALKEEPER',
  Defensa: 'DEFENDER',
  Centrocampista: 'MIDFIELDER',
  Extremo: 'FORWARD',
  Delantero: 'FORWARD',
};

// Categorías tácticas válidas para cada puesto del campo.
// Extremos y delanteros se pueden intercambiar; los medios laterales (MI, MD) admiten también extremos.
const FIT = {
  POR: ['Portero'],
  LD: ['Defensa'],
  LI: ['Defensa'],
  DFC: ['Defensa'],
  MC: ['Centrocampista'],
  MI: ['Centrocampista', 'Extremo'],
  MD: ['Centrocampista', 'Extremo'],
  ED: ['Extremo', 'Delantero'],
  EI: ['Extremo', 'Delantero'],
  DC: ['Delantero', 'Extremo'],
};

/**
 * Categoría táctica del jugador (Portero | Defensa | Centrocampista | Extremo | Delantero | null).
 * Acepta tanto un jugador de la API ({ position, positionGroup }) como una fila de Prisma ({ position, detailed_position }).
 */
export function fitRoleOf(player) {
  if (!player) return null;
  const detailed = player.detailed_position ?? player.position;
  const group = player.positionGroup ?? player.position;
  return DETAILED_POSITION_TO_ROLE[detailed] ?? GROUP_TO_ROLE[group] ?? null;
}

/** ¿Puede jugar este jugador en esta posición del campo (DFC1 → DFC)? */
export function fitsSlot(player, slot) {
  const role = fitRoleOf(player);
  return Boolean(role) && (FIT[slotPosition(slot)] ?? []).includes(role);
}

/** Grupos de la API (GET /api/players?position=...) que pueden cubrir un puesto del campo */
export function slotPositionGroups(slot) {
  const roles = FIT[slotPosition(slot)] ?? [];
  return [...new Set(roles.map((role) => ROLE_TO_GROUP[role]).filter(Boolean))];
}
