import BarChart from '../../components/BarChart/BarChart.jsx';
import { formatDecimal } from '../Referees/format.js';
import { CHART_GRID_STEPS, chartMax, toChartData } from './refereeData.js';

// Gráfico de tarjetas por jornada (amarillas + rojas apiladas) con la media de LaLiga y su leyenda
export default function RefereeCardsChart({ name, matches, leagueCardsPerMatch }) {
  const chart = {
    label: `Tarjetas por jornada de ${name}`,
    data: toChartData(matches),
    max: chartMax(matches),
    gridSteps: CHART_GRID_STEPS,
    average: leagueCardsPerMatch,
    averageTone: 'neutral',
  };

  return (
    <div className="referee-profile__chart">
      {/* Escritorio y móvil solo cambian de tamaño */}
      <div className="referee-profile__desktop-block">
        <BarChart {...chart} height={230} barWidth={72} />
      </div>
      <div className="referee-profile__mobile-block">
        <BarChart {...chart} height={150} barWidth={36} />
      </div>
      <ul className="referee-profile__legend">
        <li className="referee-profile__legend-item referee-profile__legend-item--yellow">Amarillas</li>
        <li className="referee-profile__legend-item referee-profile__legend-item--red">Rojas</li>
        {leagueCardsPerMatch != null && (
          <li className="referee-profile__legend-item referee-profile__legend-item--average">
            Media LaLiga ({formatDecimal(leagueCardsPerMatch)})
          </li>
        )}
      </ul>
    </div>
  );
}
