import { formatDecimal } from '../Referees/format.js';

// Año «actual» de los datos de mockData.js (temporada 2026/27 congelada): sirve para contar las temporadas del árbitro
export const MOCK_CURRENT_YEAR = 2026;

// Texto de la cabecera: cuánto se aleja de la media de LaLiga («+12 % sobre la media de LaLiga (5,1)»)
export function describeLeagueComparison(cardsPerMatch, leagueCardsPerMatch) {
  const difference = Math.round((cardsPerMatch / leagueCardsPerMatch - 1) * 100);
  const average = formatDecimal(leagueCardsPerMatch);
  if (difference === 0) return `En la media de LaLiga (${average})`;
  const sign = difference > 0 ? '+' : '−';
  const direction = difference > 0 ? 'sobre' : 'bajo';
  return `${sign}${Math.abs(difference)} % ${direction} la media de LaLiga (${average})`;
}

// Temporadas en Primera División, o null si no se sabe desde cuándo
export function countSeasons(since) {
  return since ? MOCK_CURRENT_YEAR - since : null;
}

// Líneas de datos bajo el nombre: país, edad y comité
export function buildMeta(referee) {
  return [
    'España',
    referee.age && `${referee.age} años`,
    referee.committeeAdjective && `Comité ${referee.committeeAdjective}`,
  ].filter(Boolean);
}

// El gráfico va de la jornada más antigua a la más reciente (BarChart: amarillas + rojas apiladas)
export function toChartData(matches) {
  return [...matches]
    .sort((a, b) => a.round - b.round)
    .map((match) => ({
      label: `J${match.round}`,
      segments: [
        { value: match.yellow, tone: 'yellow-card' },
        { value: match.red, tone: 'red-card' },
      ],
    }));
}

// Nombre del equipo en la tabla de escritorio: el completo, salvo los muy largos («Atlético de Madrid» → «Atlético»)
const LONG_NAME_LENGTH = 14;
export function tableName(team) {
  if (!team) return '';
  return team.name.length > LONG_NAME_LENGTH ? team.shortName : team.name;
}
