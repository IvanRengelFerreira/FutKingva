// Formato de un jugador en los listados de la API (plantilla de la ficha de equipo, Equipos, Búsqueda).

// Grupo de posición de la BD → texto en español (si el jugador no tiene posición detallada)
const POSITION_LABELS = {
  GOALKEEPER: 'Portero',
  DEFENDER: 'Defensa',
  MIDFIELDER: 'Centrocampista',
  FORWARD: 'Delantero',
};

// Orden de una plantilla: porteros, defensas, centrocampistas y delanteros
const POSITION_ORDER = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
const NO_NUMBER = 99; // Los que no tienen dorsal van al final de su posición

/**
 * Jugador con sus números de una temporada.
 * @param player fila de players
 * @param stats su fila de player_season_stats en esa temporada (undefined si aún no ha jugado)
 */
export function playerSummary(player, stats) {
  return {
    id: player.id,
    name: player.name,
    number: player.shirt_number,
    position: player.detailed_position || POSITION_LABELS[player.position] || null,
    positionGroup: player.position,
    matches: stats?.played ?? null,
    goals: stats?.goals ?? null,
    assists: stats?.assists ?? null,
    rating: stats?.rating != null ? Number(stats.rating) : null,
  };
}

/** Para ordenar una plantilla: por posición, por dorsal y por nombre */
export function bySquadOrder(a, b) {
  return (
    positionIndex(a) - positionIndex(b) ||
    (a.number ?? NO_NUMBER) - (b.number ?? NO_NUMBER) ||
    a.name.localeCompare(b.name, 'es')
  );
}

function positionIndex(player) {
  const index = POSITION_ORDER.indexOf(player.positionGroup);
  return index === -1 ? POSITION_ORDER.length : index;
}
