import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { getTeam } from '../../data/mockData.js';
import chevronIcon from '../../assets/icon-chevron-right-lg.svg';
import Highlighted from './Highlighted.jsx';

// Sección «Jugadores» de los resultados: tabla en escritorio y tarjetas con flecha en móvil
export default function PlayerResults({ players, query }) {
  return (
    <section className="search-results__section" aria-labelledby="search-players-title">
      <div className="search-results__section-header">
        <h2 id="search-players-title" className="search-results__section-title">
          Jugadores
        </h2>
        <span className="search-results__order search-results__desktop">Ordenar: relevancia</span>
      </div>

      <div className="search-results__table-wrapper search-results__desktop-block">
        <table className="search-results__table">
          <caption className="search-results__sr-only">Jugadores que coinciden con «{query}»</caption>
          <thead>
            <tr>
              <th scope="col">Jugador</th>
              <th scope="col" className="search-results__team-col">
                Equipo
              </th>
              <th scope="col" className="search-results__position-col">
                Posición
              </th>
              <th scope="col" className="search-results__num">
                Goles
              </th>
              <th scope="col" className="search-results__num search-results__num--wide">
                Asistencias
              </th>
              <th scope="col" className="search-results__link-col">
                <span className="search-results__sr-only">Ficha</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <PlayerRow key={player.id} player={player} query={query} />
            ))}
          </tbody>
        </table>
      </div>

      <ul className="search-results__list search-results__mobile-block">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} query={query} />
        ))}
      </ul>
    </section>
  );
}

// Fila de la tabla (escritorio)
function PlayerRow({ player, query }) {
  const team = getTeam(player.teamId);
  return (
    <tr>
      <th scope="row">
        <span className="search-results__player">
          <Avatar name={player.name} size={34} color={team?.color} />
          <Highlighted name={player.name} query={query} className="search-results__player-name" />
        </span>
      </th>
      <td className="search-results__team-col">
        <Link className="search-results__team" to={`/equipos/${player.teamId}`}>
          <Crest teamId={player.teamId} size={22} />
          {team?.name}
        </Link>
      </td>
      <td className="search-results__position-col">{player.position}</td>
      <td className="search-results__num search-results__big">{player.goals ?? 0}</td>
      <td className="search-results__num search-results__num--wide search-results__big">{player.assists ?? 0}</td>
      <td className="search-results__link-col">
        <Link className="search-results__see" to={`/jugadores/${player.id}`} aria-label={`Ver ficha de ${player.name}`}>
          Ver ficha →
        </Link>
      </td>
    </tr>
  );
}

// Tarjeta de la lista (móvil)
function PlayerCard({ player, query }) {
  const team = getTeam(player.teamId);
  return (
    <li>
      <Link className="search-results__card" to={`/jugadores/${player.id}`}>
        <Avatar name={player.name} size={40} color={team?.color} />
        <span className="search-results__card-text">
          <Highlighted name={player.name} query={query} className="search-results__card-name" />
          <span className="search-results__card-meta">
            {team?.code} · {player.position} · {player.goals ?? 0} G · {player.assists ?? 0} A
          </span>
        </span>
        <img src={chevronIcon} alt="" width="18" height="18" />
      </Link>
    </li>
  );
}
