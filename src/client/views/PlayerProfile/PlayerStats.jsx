import { MISSING, formatNumber, formatPercent, formatRank } from './format.js';

// Indicadores de la temporada: los del mockup. Los que la BD aún no tiene (xG, precisión de pase,
// pases clave) salen «—» hasta tener una fuente. El mockup móvil usa otros indicadores, de ahí dos listas.
function desktopStats(stats, ranks) {
  return [
    {
      label: 'Partidos',
      value: formatNumber(stats?.played),
      detail: stats?.minutes != null ? `${formatNumber(stats.minutes)} minutos` : null,
    },
    {
      label: 'Goles',
      value: formatNumber(stats?.goals),
      detail: stats?.xg != null ? `xG ${formatNumber(stats.xg, 1)}` : null,
    },
    { label: 'Asistencias', value: formatNumber(stats?.assists), tone: 'gold', detail: formatRank(ranks?.assists) },
    { label: 'Precisión pase', value: formatPercent(stats?.passAccuracy), tone: 'win', detail: null },
    { label: 'Pases clave', value: formatNumber(stats?.keyPasses), detail: null },
    { label: 'Tarjetas', value: formatNumber(totalCards(stats)), detail: cardsDetail(stats) },
  ];
}

// Tarjetas = amarillas + rojas (como en el comparador); null si no hay ninguno de los dos datos
function totalCards(stats) {
  if (stats?.yellowCards == null && stats?.redCards == null) return null;
  return (stats.yellowCards ?? 0) + (stats.redCards ?? 0);
}

// «3 amarillas · 1 roja»
function cardsDetail(stats) {
  if (totalCards(stats) == null) return null;
  const yellow = stats.yellowCards ?? 0;
  const red = stats.redCards ?? 0;
  return `${yellow} ${yellow === 1 ? 'amarilla' : 'amarillas'} · ${red} ${red === 1 ? 'roja' : 'rojas'}`;
}

function mobileStats(stats) {
  return [
    { label: 'Partidos', value: formatNumber(stats?.played) },
    { label: 'Goles', value: formatNumber(stats?.goals) },
    { label: 'Asist.', value: formatNumber(stats?.assists), tone: 'gold' },
    { label: 'Minutos', value: formatNumber(stats?.minutes) },
    { label: 'xG', value: formatNumber(stats?.xg, 1) },
    { label: 'Pase', value: formatPercent(stats?.passAccuracy), tone: 'win' },
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
