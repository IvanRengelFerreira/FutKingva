import { Link } from 'react-router';
import './StandingsTable.css';
import Crest from '../Crest/Crest.jsx';
import FormGuide from '../FormGuide/FormGuide.jsx';
import { STANDINGS_LALIGA, STANDINGS_ZONES, getTeam, getStandingsZone } from '../../data/mockData.js';

// Tabla de clasificación de una liga, con el líder en oro.
// Dos formas:
//   variant="full" (por defecto) → 05 · Clasificaciones: todas las columnas, forma, franja de color por zona
//                                   (Champions, Europa League, Conference, descenso) y leyenda debajo.
//                                   En móvil (< 800 px) se queda en # · Equipo · PJ · DG · PTS, como en el mockup.
//   variant="compact"            → clasificación rápida (Inicio): # · Equipo · PJ · DG · PTS, el líder con línea dorada.
// Cada equipo enlaza a su ficha (/equipos/<id>).
// Diseño: Figma › Mockups › 05 · Clasificaciones › Tabla LaLiga (escritorio y móvil)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-350
// y Figma › Guía de estilo › 3. Componentes › Tabla de clasificación (la compacta)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-112
// Uso:
//   <StandingsTable />                                          → LaLiga completa (STANDINGS_LALIGA)
//   <StandingsTable variant="compact" limit={5} />              → los 5 primeros
//   <StandingsTable highlightTeamId="real-madrid" />            → resalta una fila (p. ej. desde la ficha de equipo)
//   <StandingsTable standings={otraTabla} caption="Clasificación de la Premier League" />
//   <StandingsTable legendExtra={<span>Actualizada hace 5 min</span>} />   → algo más a la derecha de la leyenda
export default function StandingsTable({
  standings = STANDINGS_LALIGA,
  variant = 'full',
  limit,
  highlightTeamId,
  showLegend = variant === 'full',
  caption = 'Clasificación de LaLiga',
  legendExtra,
  className = '',
}) {
  const full = variant === 'full';
  const rows = limit ? standings.slice(0, limit) : standings;

  return (
    <div className={`standings-table standings-table--${variant} ${className}`.trim()}>
      <div className="standings-table__wrapper">
        <table className="standings-table__table">
          <caption className="standings-table__caption">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="standings-table__pos">#</th>
              <th scope="col" className="standings-table__team">Equipo</th>
              <th scope="col" className="standings-table__num"><abbr title="Partidos jugados">PJ</abbr></th>
              {full && (
                <>
                  <th scope="col" className="standings-table__num standings-table__extra"><abbr title="Ganados">G</abbr></th>
                  <th scope="col" className="standings-table__num standings-table__extra"><abbr title="Empatados">E</abbr></th>
                  <th scope="col" className="standings-table__num standings-table__extra"><abbr title="Perdidos">P</abbr></th>
                  <th scope="col" className="standings-table__num standings-table__extra"><abbr title="Goles a favor">GF</abbr></th>
                  <th scope="col" className="standings-table__num standings-table__extra"><abbr title="Goles en contra">GC</abbr></th>
                </>
              )}
              <th scope="col" className="standings-table__num standings-table__diff"><abbr title="Diferencia de goles">DG</abbr></th>
              <th scope="col" className="standings-table__num standings-table__points"><abbr title="Puntos">PTS</abbr></th>
              {full && <th scope="col" className="standings-table__form standings-table__extra">Últimos 5</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const team = getTeam(row.teamId);
              const leader = row.position === 1;
              const zone = full ? getStandingsZone(row.position) : undefined;
              const rowClasses = [
                'standings-table__row',
                leader && 'standings-table__row--leader',
                zone && `standings-table__row--${zone.id}`,
                row.teamId === highlightTeamId && 'standings-table__row--highlight',
              ].filter(Boolean).join(' ');

              return (
                <tr key={row.teamId} className={rowClasses}>
                  <td className="standings-table__pos">{row.position}</td>
                  <th scope="row" className="standings-table__team">
                    <span className="standings-table__team-cell">
                      <Crest teamId={row.teamId} size={full ? 28 : 24} />
                      <Link className="standings-table__team-name" to={`/equipos/${row.teamId}`}>
                        {team?.name ?? row.teamId}
                      </Link>
                      {leader && full && <span className="standings-table__leader">Líder</span>}
                    </span>
                  </th>
                  <td className="standings-table__num">{row.played}</td>
                  {full && (
                    <>
                      <td className="standings-table__num standings-table__extra">{row.won}</td>
                      <td className="standings-table__num standings-table__extra">{row.drawn}</td>
                      <td className="standings-table__num standings-table__extra">{row.lost}</td>
                      <td className="standings-table__num standings-table__extra">{row.goalsFor}</td>
                      <td className="standings-table__num standings-table__extra">{row.goalsAgainst}</td>
                    </>
                  )}
                  <td className={`standings-table__num standings-table__diff ${full ? diffClass(row.goalDifference) : ''}`.trim()}>
                    {formatDiff(row.goalDifference)}
                  </td>
                  <td className="standings-table__num standings-table__points">{row.points}</td>
                  {full && (
                    <td className="standings-table__form standings-table__extra">
                      <FormGuide form={row.form} size={22} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showLegend && (
        <div className="standings-table__footer">
          <ul className="standings-table__legend" aria-label="Zonas de la clasificación">
            {STANDINGS_ZONES.map((zone) => (
              <li key={zone.id} className={`standings-table__legend-item standings-table__legend-item--${zone.id}`}>
                {zone.label}
              </li>
            ))}
          </ul>
          {legendExtra}
        </div>
      )}
    </div>
  );
}

// +27 · 0 · −3
function formatDiff(value) {
  return value > 0 ? `+${value}` : String(value);
}

function diffClass(value) {
  if (value > 0) return 'standings-table__diff--positive';
  if (value < 0) return 'standings-table__diff--negative';
  return '';
}
