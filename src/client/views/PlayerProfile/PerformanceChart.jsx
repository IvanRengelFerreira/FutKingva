import BarChart from '../../components/BarChart/BarChart.jsx';
import Select from '../../components/Select/Select.jsx';
import { formatNumber } from './format.js';

const DESKTOP_BARS_COUNT = 10;
const MOBILE_BARS_COUNT = 8;

// Color de la barra: la última jornada en oro fuerte, las notas ≥ 8 en oro suave y el resto en verde
function barTone(value, isLast) {
  if (isLast) return 'gold';
  return value >= 8 ? 'gold-soft' : 'win';
}

// Rendimiento por jornada: valoración del jugador en las últimas jornadas con nota de la temporada elegida
// (10 en escritorio y 8 en móvil para que las cifras y etiquetas no se pisen), en orden cronológico.
export default function PerformanceChart({ player, season, seasons, lastMatches, onSeasonChange, isMobile }) {
  const allRated = [...lastMatches].reverse().filter((match) => match.rating != null);
  const rated = allRated.slice(-(isMobile ? MOBILE_BARS_COUNT : DESKTOP_BARS_COUNT));
  const ratings = rated.map((match) => match.rating);
  const hasData = ratings.length > 0;

  const data = rated.map((match, index) => ({
    label: match.round != null ? `J${match.round}` : (match.opponent?.code ?? `P${index + 1}`),
    value: match.rating,
    tone: barTone(match.rating, index === rated.length - 1),
  }));

  // Escala del mockup (6–9); se amplía solo si alguna nota se sale
  const min = hasData ? Math.min(6, Math.floor(Math.min(...ratings))) : 6;
  const max = hasData ? Math.max(9, Math.ceil(Math.max(...ratings))) : 9;
  const average = hasData ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null;
  const seasonOptions = seasons.map((item) => ({
    value: item.year,
    label: isMobile ? item.label : `Temporada ${item.label}`,
  }));

  return (
    <section className="player-performance" aria-labelledby="player-performance-title">
      <div className="player-section-head">
        <h2 id="player-performance-title" className="player-section-head__title">
          {isMobile ? 'Rendimiento' : 'Rendimiento por jornada'}
        </h2>
        <span className="player-section-head__line" aria-hidden="true" />
        <Select
          size="sm"
          label="Temporada"
          hideLabel
          options={seasonOptions}
          value={season.year}
          onChange={(e) => onSeasonChange(Number(e.target.value))}
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
              <li className="player-legend__item">
                <span className="player-legend__swatch player-legend__swatch--gold" />≥ 8
              </li>
              <li className="player-legend__item">
                <span className="player-legend__swatch player-legend__swatch--win" />7 – 8
              </li>
              <li className="player-legend__item">
                <span className="player-legend__dash" />
                Media {formatNumber(average, 1)}
              </li>
            </ul>
          </>
        ) : (
          <p className="player-card__empty">Todavía no hay valoraciones por jornada de este jugador.</p>
        )}
      </div>
    </section>
  );
}
