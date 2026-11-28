import { formatDecimal } from '../Referees/format.js';

// Cálculos de 07 · Ficha de árbitro sobre los datos de la API.

const MIN_CHART_MAX = 8; // Tope del gráfico del mockup; sube si algún partido tuvo más tarjetas
export const CHART_GRID_STEPS = 4;

// La BD guarda el país en inglés
const COUNTRY_NAMES = { Spain: 'España' };

// Texto de la cabecera: cuánto se aleja de la media de LaLiga («+12 % sobre la media de LaLiga (5,1)»).
// null si falta alguna de las dos cifras.
export function describeLeagueComparison(cardsPerMatch, leagueCardsPerMatch) {
  if (cardsPerMatch == null || !leagueCardsPerMatch) return null;
  const difference = Math.round((cardsPerMatch / leagueCardsPerMatch - 1) * 100);
  const average = formatDecimal(leagueCardsPerMatch);
  if (difference === 0) return `En la media de LaLiga (${average})`;
  const sign = difference > 0 ? '+' : '−';
  const direction = difference > 0 ? 'sobre' : 'bajo';
  return `${sign}${Math.abs(difference)} % ${direction} la media de LaLiga (${average})`;
}

// Líneas de datos bajo el nombre: país y comité (solo lo que se sepa)
export function buildMeta(referee) {
  return [
    referee.nationality && (COUNTRY_NAMES[referee.nationality] ?? referee.nationality),
    referee.committee && `Comité de ${referee.committee}`,
  ].filter(Boolean);
}

// El gráfico va de la jornada más antigua a la más reciente (BarChart: amarillas + rojas apiladas)
export function toChartData(matches) {
  return [...matches]
    .sort((a, b) => a.round - b.round)
    .map((match) => ({
      label: `J${match.round}`,
      segments: [
        { value: match.yellowCards, tone: 'yellow-card' },
        { value: match.redCards, tone: 'red-card' },
      ],
    }));
}

// Borde superior del gráfico: múltiplo de los tramos para que las líneas de guía caigan en números enteros
export function chartMax(matches) {
  const highest = Math.max(0, ...matches.map((match) => match.yellowCards + match.redCards));
  return Math.max(MIN_CHART_MAX, Math.ceil(highest / CHART_GRID_STEPS) * CHART_GRID_STEPS);
}
