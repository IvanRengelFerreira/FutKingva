import { summarize, TEAM_SIZE } from './team.js';
import infoIcon from '../../assets/icon-info-ideal-team.svg';

// Resumen del equipo (11 · Mi equipo ideal): goles, asistencias, media de edad, valoración media y jugadores.
// Lo que no se puede calcular (sin jugadores o sin dato) sale como «—».
// Diseño: Figma › Mockups › 11 · Mi equipo ideal › Resumen del equipo
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=55-952
function format(value, decimals) {
  if (value == null) return '—';
  return (decimals ? value.toFixed(decimals) : String(value)).replace('.', ',');
}

export default function TeamSummary({ assigned }) {
  const s = summarize(assigned);
  const items = [
    { label: 'Goles totales', value: format(s.goals) },
    { label: 'Asistencias', value: format(s.assists) },
    { label: 'Media de edad', value: format(s.averageAge, 1) },
    { label: 'Valoración media', value: format(s.averageRating, 1), gold: true },
    { label: 'Jugadores', value: `${s.count}/${TEAM_SIZE}` },
  ];

  return (
    <section className="ideal-team-summary" aria-label="Resumen del equipo">
      <dl className="ideal-team-summary__list">
        {items.map((item) => (
          <div key={item.label} className="ideal-team-summary__item">
            <dd className={`ideal-team-summary__value${item.gold ? ' ideal-team-summary__value--gold' : ''}`}>{item.value}</dd>
            <dt className="ideal-team-summary__label">{item.label}</dt>
          </div>
        ))}
      </dl>
      <p className="ideal-team-summary__rule">
        <img src={infoIcon} alt="" width="16" height="16" />
        Regla: una posición, un jugador
      </p>
    </section>
  );
}
