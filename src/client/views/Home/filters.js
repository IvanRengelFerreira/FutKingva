// Filtros por competición de 01 · Inicio: los chips del mockup. «competition» es el nombre que llevan los
// partidos de /api/home; «all» no filtra. Hoy la BD solo tiene LaLiga: el resto sale vacío hasta tener datos.
export const COMPETITION_FILTERS = [
  { id: 'all', label: 'Todas', competition: null },
  { id: 'laliga', label: 'LaLiga', competition: 'LaLiga' },
  { id: 'premier', label: 'Premier', competition: 'Premier League' },
  { id: 'serie-a', label: 'Serie A', competition: 'Serie A' },
  { id: 'bundesliga', label: 'Bundesliga', competition: 'Bundesliga' },
  { id: 'ligue-1', label: 'Ligue 1', competition: 'Ligue 1' },
];

export function matchesFilter(match, filter) {
  if (!filter?.competition) return true;
  return match.competition === filter.competition;
}
