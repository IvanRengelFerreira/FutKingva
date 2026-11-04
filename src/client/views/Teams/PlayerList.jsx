import { Link } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import Rating from '../../components/Rating/Rating.jsx';
import chevronIcon from '../../assets/icon-chevron-right-lg.svg';

// Pestaña «Jugadores» de 02 · Equipos y jugadores (no tiene mockup propio: sigue el estilo de las tablas
// de 03 · Ficha de equipo y 13 · Resultados de búsqueda).
//   Escritorio: tabla con jugador, equipo, posición, PJ, goles, asistencias y valoración
//   Móvil: tarjetas con avatar, nombre, «FCB · Extremo · 5 G · 3 A» y valoración
// rows: { ...player, team } de teamsData.js · mobileRows: las que se ven en móvil (con «Cargar más»)
export default function PlayerList({ rows, mobileRows }) {
  return (
    <>
      <div className="teams__table-wrapper teams__desktop-block">
        <table className="teams__table">
          <caption className="teams__sr-only">Jugadores de LaLiga</caption>
          <thead>
            <tr>
              <th scope="col">Jugador</th>
              <th scope="col" className="teams__team-col">Equipo</th>
              <th scope="col" className="teams__position-col">Posición</th>
              <th scope="col" className="teams__num"><abbr title="Partidos jugados">PJ</abbr></th>
              <th scope="col" className="teams__num">Goles</th>
              <th scope="col" className="teams__num"><abbr title="Asistencias">Asist.</abbr></th>
              <th scope="col" className="teams__rating-col"><abbr title="Valoración media">Val.</abbr></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((player) => (
              <tr key={player.id}>
                <th scope="row">
                  <Link className="teams__player" to={`/jugadores/${player.id}`}>
                    <Avatar name={player.name} size={34} color={player.team?.color} />
                    <span>{player.name}</span>
                  </Link>
                </th>
                <td className="teams__team-col">
                  <Link className="teams__player-team" to={`/equipos/${player.teamId}`}>
                    <Crest teamId={player.teamId} size={22} />
                    {player.team?.name}
                  </Link>
                </td>
                <td className="teams__position-col">{player.position}</td>
                <td className="teams__num">{player.matches ?? '—'}</td>
                <td className="teams__num teams__big">{player.goals ?? '—'}</td>
                <td className="teams__num teams__big">{player.assists ?? '—'}</td>
                <td className="teams__rating-col">
                  {player.rating != null ? <Rating value={player.rating} size="sm" /> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="teams__list teams__mobile-flex">
        {mobileRows.map((player) => (
          <li key={player.id}>
            <Link className="teams__item" to={`/jugadores/${player.id}`}>
              <Avatar name={player.name} size={44} color={player.team?.color} />
              <span className="teams__item-text">
                <span className="teams__item-name">{player.name}</span>
                <span className="teams__item-meta">
                  {player.team?.code} · {player.position} · {player.goals ?? 0} G · {player.assists ?? 0} A
                </span>
              </span>
              {player.rating != null ? <Rating value={player.rating} size="md" /> : <img src={chevronIcon} alt="" width="18" height="18" />}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
