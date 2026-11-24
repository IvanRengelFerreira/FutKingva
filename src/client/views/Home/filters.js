// Filtros por competición de 01 · Inicio.

const ALL_FILTER = { id: 'all', label: 'Todas', competition: null };

/**
 * Chips de competición a partir de los partidos reales.
 * Si solo hay una competición (hoy solo hay datos de LaLiga), se omite el filtro.
 */
export function getCompetitionFilters(matches) {
  const competitions = [...new Set(matches.map((match) => match.competition).filter(Boolean))];
  if (competitions.length <= 1) return [];
  return [ALL_FILTER, ...competitions.map((name) => ({ id: name, label: name, competition: name }))];
}

export function matchesFilter(match, filter) {
  if (!filter?.competition) return true;
  return match.competition === filter.competition;
}
