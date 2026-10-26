import BarChart from '../../components/BarChart/BarChart.jsx';
import Select from '../../components/Select/Select.jsx';
import { SEASON } from '../../data/mockData.js';
import { formatNumber } from './format.js';

// Rendimiento por jornada: valoración del jugador en cada partido (oro ≥ 8, verde por debajo,
// la última jornada en oro fuerte) y línea de media. Si no hay valoraciones por jornada, lo dice.
export default function PerformanceChart({ player, isMobile }) {
  const ratings = player.ratingsByRound ?? [];
  const hasData = ratings.length > 0;
  const lastRound = ratings.length;

  const data = ratings.map((value, i) => ({
    label: `J${i + 1}`,
    value,
    tone: i + 1 === lastRound ? 'gold' : value >= 8 ? 'gold-soft' : 'win',
  }));

  // Escala del mockup (6–9); se amplía solo si alguna nota se sale
  const min = hasData ? Math.min(6, Math.floor(Math.min(...ratings))) : 6;
  const max = hasData ? Math.max(9, Math.ceil(Math.max(...ratings))) : 9;
  const average = player.rating ?? (hasData ? ratings.reduce((sum, v) => sum + v, 0) / ratings.length : null);
  const season = isMobile ? SEASON : `Temporada ${SEASON}`;

  return (
    <section className="player-performance" aria-labelledby="player-performance-title">
      <div className="player-section-head">
        <h2 id="player-performance-title" className="player-section-head__title">
          {isMobile ? 'Rendimiento' : 'Rendimiento por jornada'}
        </h2>
        <span className="player-section-head__line" aria-hidden="true" />
        {/* Solo hay una temporada */}
        <Select
          size="sm"
          label="Temporada"
          hideLabel
          options={[season]}
          value={season}
          onChange={() => {}}
          className="player-performance__season"
        />
      </div>

      <div className="player-card player-performance__card">
        {hasData ? (
          <>
            <BarChart
              label={`Valoración de ${player.name} por jornada`}
              data={data}
              min={min}
              max={max}
              gridSteps={max - min}
              average={average}
              decimals={1}
              height={isMobile ? 150 : 240}
              barWidth={isMobile ? 24 : 56}
            />
            <ul className="player-legend">
              <li className="player-legend__item"><span className="player-legend__swatch player-legend__swatch--gold" />≥ 8</li>
              <li className="player-legend__item"><span className="player-legend__swatch player-legend__swatch--win" />7 – 8</li>
              <li className="player-legend__item"><span className="player-legend__dash" />Media {formatNumber(average, 1)}</li>
            </ul>
          </>
        ) : (
          <p className="player-card__empty">Todavía no hay valoraciones por jornada de este jugador.</p>
        )}
      </div>
    </section>
  );
}
