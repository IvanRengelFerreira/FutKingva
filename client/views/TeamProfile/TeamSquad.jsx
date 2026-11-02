import { Link } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Rating from '../../components/Rating/Rating.jsx';

// Plantilla del equipo.
//   TeamSquadTable → tabla de escritorio: dorsal, jugador, posición, PJ, goles, asistencias y valoración
//                    (el máximo goleador, con los goles en oro)
//   TeamSquadList  → lista de tarjetas del móvil: avatar, nombre, «10 · Delantero · 7 goles» y valoración
// Cada jugador lleva a su ficha (/jugadores/<id>). Lo que no está en los datos sale como «—».
// Diseño: Figma › Mockups › 03 · Ficha de equipo › Tabla (escritorio) y lista de Plantilla (móvil)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-256
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-550
export function TeamSquadTable({ players, className = '' }) {
  const topGoals = Math.max(0, ...players.map((player) => player.goals ?? 0));

  return (
    <div className={`team-squad ${className}`.trim()}>
      <table className="team-squad__table">
        <caption className="team-profile__sr-only">Plantilla</caption>
        <thead>
          <tr>
            <th scope="col" className="team-squad__number">Dorsal</th>
            <th scope="col" className="team-squad__player">Jugador</th>
            <th scope="col" className="team-squad__position">Posición</th>
            <th scope="col" className="team-squad__num"><abbr title="Partidos jugados">PJ</abbr></th>
            <th scope="col" className="team-squad__num">Goles</th>
            <th scope="col" className="team-squad__num"><abbr title="Asistencias">Asist.</abbr></th>
            <th scope="col" className="team-squad__rating"><abbr title="Valoración media">Val.</abbr></th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td className="team-squad__number">{player.number ?? '—'}</td>
              <th scope="row" className="team-squad__player">
                <Link className="team-squad__player-link" to={`/jugadores/${player.id}`}>
                  <Avatar name={player.name} size={32} />
                  <span>{player.name}</span>
                </Link>
              </th>
              <td className="team-squad__position">{player.position}</td>
              <td className="team-squad__num team-squad__played">{player.matches ?? '—'}</td>
              <td className={`team-squad__num team-squad__big${player.goals > 0 && player.goals === topGoals ? ' team-squad__big--top' : ''}`}>
                {player.goals ?? '—'}
              </td>
              <td className="team-squad__num team-squad__big">{player.assists ?? '—'}</td>
              <td className="team-squad__rating">
                {player.rating != null ? <Rating value={player.rating} size="sm" /> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TeamSquadList({ players, className = '' }) {
  return (
    <ul className={`team-squad-list ${className}`.trim()}>
      {players.map((player) => (
        <li key={player.id}>
          <Link className="team-squad-list__item" to={`/jugadores/${player.id}`}>
            <Avatar name={player.name} size={44} />
            <span className="team-squad-list__text">
              <span className="team-squad-list__name">{player.name}</span>
              <span className="team-squad-list__meta">
                {[player.number, player.position, `${player.goals ?? 0} ${player.goals === 1 ? 'gol' : 'goles'}`]
                  .filter((part) => part != null)
                  .join(' · ')}
              </span>
            </span>
            <Rating value={player.rating} size="md" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
