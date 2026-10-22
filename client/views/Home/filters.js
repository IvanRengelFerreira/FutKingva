// Chips de competición de Inicio. «competition» es el nombre que llevan los partidos en mockData.js;
// «all» no filtra. Serie A y Ligue 1 no tienen partidos en los datos: salen vacías.
export const COMPETITION_FILTERS = [
  { id: 'all', label: 'Todas', competition: null },
  { id: 'laliga', label: 'LaLiga', competition: 'LaLiga' },
  { id: 'premier', label: 'Premier', competition: 'Premier League' },
  { id: 'serie-a', label: 'Serie A', competition: 'Serie A' },
  { id: 'bundesliga', label: 'Bundesliga', competition: 'Bundesliga' },
  { id: 'ligue-1', label: 'Ligue 1', competition: 'Ligue 1' },
];

// Los partidos sin competición (próximos de LaLiga) cuentan como LaLiga
export function matchesFilter(match, filter) {
  if (!filter?.competition) return true;
  return (match.competition ?? 'LaLiga') === filter.competition;
}

// «Sábado 17 de octubre» → «Sáb 17 oct» (móvil). Si el texto no tiene esa forma, se deja tal cual.
export function shortDateLabel(label = '') {
  const words = label.split(' ');
  if (words.length < 4) return label;
  return `${words[0].slice(0, 3)} ${words[1]} ${words[3].slice(0, 3)}`;
}
