import { MISSING, formatNumber, formatRank } from './format.js';

// Indicadores de la temporada con los datos reales de player_season_stats (sin xG, precisión de pase ni pases clave,
// que no existen en la BD). Lo que falta en la temporada actual sale «—».
function desktopStats(stats, ranks) {
  const played = stats?.played;
  const minutes = stats?.minutes;
  const goals = stats?.goals;

  return [
    {
      label: 'Partidos',
      value: formatNumber(played),
      detail: played > 0 && minutes != null ? `${Math.round(minutes / played)} min/partido` : null,
    },
    {
      label: 'Minutos',
      value: formatNumber(minutes),
      detail: null,
    },
    {
      label: 'Goles',
      value: formatNumber(goals),
      detail: goals != null && played > 0 ? `${formatNumber(goals / played, 2)} por partido` : null,
    },
    {
      label: 'Asistencias',
      value: formatNumber(stats?.assists),
      tone: 'gold',
      detail: formatRank(ranks?.assists),
    },
    {
      label: 'Amarillas',
      value: formatNumber(stats?.yellowCards),
      detail: null,
    },
    {
      label: 'Rojas',
      value: formatNumber(stats?.redCards),
      detail: null,
    },
  ];
}

function mobileStats(stats) {
  return [
    { label: 'Partidos', value: formatNumber(stats?.played) },
    { label: 'Goles', value: formatNumber(stats?.goals) },
    { label: 'Asist.', value: formatNumber(stats?.assists), tone: 'gold' },
    { label: 'Minutos', value: formatNumber(stats?.minutes) },
    { label: 'Amarillas', value: formatNumber(stats?.yellowCards) },
    { label: 'Rojas', value: formatNumber(stats?.redCards) },
  ];
}

export default function PlayerStats({ stats, ranks, isMobile }) {
  const items = isMobile ? mobileStats(stats) : desktopStats(stats, ranks);

  return (
    <ul className="player-stats" aria-label="Indicadores de la temporada">
      {items.map((stat) => (
        <li key={stat.label} className={`player-stat player-stat--${stat.tone ?? 'default'}`}>
          <span className="player-stat__value">{stat.value}</span>
          <span className="player-stat__label">{stat.label}</span>
          {!isMobile && <span className="player-stat__detail">{stat.detail ?? MISSING}</span>}
        </li>
      ))}
    </ul>
  );
}
