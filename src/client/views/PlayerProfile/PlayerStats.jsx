import { MISSING, formatNumber, formatPercent } from './format.js';

// Indicadores de la temporada. Como StatCard, pero con una línea más debajo de la etiqueta
// (en escritorio: «668 minutos», «xG 1,5»…). Lo que falta en los datos sale «—».
// El mockup móvil usa otros indicadores y otro orden que el de escritorio, de ahí dos listas.
function desktopStats(player, extras) {
  return [
    { label: 'Partidos', value: formatNumber(player.matches), detail: player.minutes != null ? `${player.minutes} minutos` : null },
    { label: 'Goles', value: formatNumber(player.goals), detail: player.xg != null ? `xG ${formatNumber(player.xg, 1)}` : null },
    { label: 'Asistencias', value: formatNumber(player.assists), tone: 'gold', detail: extras.assistsRank },
    { label: 'Precisión pase', value: formatPercent(player.passAccuracy), tone: 'win', detail: extras.passAccuracyChange },
    { label: 'Pases clave', value: formatNumber(extras.keyPasses), detail: extras.keyPassesPer90 },
    { label: 'Tarjetas', value: formatNumber(player.cards), detail: player.cards != null ? 'Amarillas' : null },
  ];
}

function mobileStats(player) {
  return [
    { label: 'Partidos', value: formatNumber(player.matches) },
    { label: 'Goles', value: formatNumber(player.goals) },
    { label: 'Asist.', value: formatNumber(player.assists), tone: 'gold' },
    { label: 'Minutos', value: formatNumber(player.minutes) },
    { label: 'xG', value: formatNumber(player.xg, 1) },
    { label: 'Pase', value: formatPercent(player.passAccuracy), tone: 'win' },
  ];
}

export default function PlayerStats({ player, extras, isMobile }) {
  const stats = isMobile ? mobileStats(player) : desktopStats(player, extras);

  return (
    <ul className="player-stats" aria-label="Indicadores de la temporada">
      {stats.map((stat) => (
        <li key={stat.label} className={`player-stat player-stat--${stat.tone ?? 'default'}`}>
          <span className="player-stat__value">{stat.value}</span>
          <span className="player-stat__label">{stat.label}</span>
          {!isMobile && <span className="player-stat__detail">{stat.detail ?? MISSING}</span>}
        </li>
      ))}
    </ul>
  );
}
