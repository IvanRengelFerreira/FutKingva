import BarChart from '../../components/BarChart/BarChart.jsx';
import Select from '../../components/Select/Select.jsx';
import { formatNumber } from './format.js';

const FULL_MATCH_MINUTES = 85; // Partido completo o casi completo (barra en oro suave)
const BASE_MAX_MINUTES = 90;
const GRID_STEPS = 3; // Líneas de guía cada 30 minutos

function barTone(minutes, isLast) {
  if (isLast) return 'gold';
  return minutes >= FULL_MATCH_MINUTES ? 'gold-soft' : 'win';
}

// Minutos jugados en los últimos partidos de la temporada elegida (sustituye al gráfico de valoración por jornada,
// que no existe en la BD). Orden cronológico de izquierda a derecha, con línea de media.
export default function PerformanceChart({ player, season, seasons, lastMatches, onSeasonChange, isMobile }) {
  const ordered = [...lastMatches].reverse();
  const hasData = ordered.length > 0;

  const data = ordered.map((match, index) => ({
    label: match.round != null ? `J${match.round}` : (match.opponent?.code ?? `P${index + 1}`),
    value: match.minutes,
    tone: barTone(match.minutes, index === ordered.length - 1),
  }));

  const maxMinutes = hasData ? Math.max(BASE_MAX_MINUTES, ...ordered.map((match) => match.minutes)) : BASE_MAX_MINUTES;
  const average = hasData ? ordered.reduce((sum, match) => sum + match.minutes, 0) / ordered.length : null;
  const seasonOptions = seasons.map((item) => ({
    value: item.year,
    label: isMobile ? item.label : `Temporada ${item.label}`,
  }));

  return (
    <section className="player-performance" aria-labelledby="player-performance-title">
      <div className="player-section-head">
        <h2 id="player-performance-title" className="player-section-head__title">
          {isMobile ? 'Minutos' : 'Minutos por partido'}
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
              label={`Minutos de ${player.name} en los últimos partidos`}
              data={data}
              min={0}
              max={maxMinutes}
              gridSteps={GRID_STEPS}
              average={average}
              decimals={0}
              height={isMobile ? 150 : 240}
              barWidth={isMobile ? 24 : 56}
            />
            <ul className="player-legend">
              <li className="player-legend__item">
                <span className="player-legend__swatch player-legend__swatch--gold" />≥ {FULL_MATCH_MINUTES} min
              </li>
              <li className="player-legend__item">
                <span className="player-legend__swatch player-legend__swatch--win" />
                &lt; {FULL_MATCH_MINUTES} min
              </li>
              <li className="player-legend__item">
                <span className="player-legend__dash" />
                Media {formatNumber(average, 0)} min
              </li>
            </ul>
          </>
        ) : (
          <p className="player-card__empty">Todavía no hay partidos de este jugador en la temporada {season.label}.</p>
        )}
      </div>
    </section>
  );
}
