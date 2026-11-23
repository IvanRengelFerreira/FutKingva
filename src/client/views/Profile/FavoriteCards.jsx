import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { getTeam, getPlayer, STANDINGS_LALIGA } from '../../data/mockData.js';
import starFilledIcon from '../../assets/icon-star-filled.svg';

// Equipos favoritos: escudo, nombre, «LaLiga · 1.º · 24 pts» y estrella para quitarlo
export function FavoriteTeams({ teamIds, onRemove }) {
  if (teamIds.length === 0) {
    return (
      <p className="profile__empty">
        No sigues a ningún equipo. Márcalos con la estrella en <Link to="/equipos">Equipos y jugadores</Link>.
      </p>
    );
  }

  return (
    <ul className="profile__cards">
      {teamIds.map((teamId) => {
        const team = getTeam(teamId);
        const row = STANDINGS_LALIGA.find((item) => item.teamId === teamId);
        return (
          <li key={teamId} className="profile-card">
            <Crest teamId={teamId} size={44} />
            <Link className="profile-card__text" to={`/equipos/${teamId}`}>
              <span className="profile-card__name">{team?.name}</span>
              <span className="profile-card__meta">
                {[team?.competition, row && `${row.position}.º`, row && `${row.points} pts`]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </Link>
            <FavoriteStar name={team?.name} onClick={() => onRemove(teamId)} />
          </li>
        );
      })}
    </ul>
  );
}

// Jugadores favoritos: avatar con el color del club, nombre, «FCB · 2 G · 4 A» y estrella para quitarlo
export function FavoritePlayers({ playerIds, onRemove }) {
  if (playerIds.length === 0) {
    return <p className="profile__empty">No sigues a ningún jugador.</p>;
  }

  return (
    <ul className="profile__cards">
      {playerIds.map((playerId) => {
        const player = getPlayer(playerId);
        const team = getTeam(player?.teamId);
        return (
          <li key={playerId} className="profile-card">
            <Avatar name={player?.name} size={44} color={team?.color} />
            <Link className="profile-card__text" to={`/jugadores/${playerId}`}>
              <span className="profile-card__name">{player?.name}</span>
              <span className="profile-card__meta">
                {team?.code} · {player?.goals ?? 0} G · {player?.assists ?? 0} A
              </span>
            </Link>
            <FavoriteStar name={player?.name} onClick={() => onRemove(playerId)} />
          </li>
        );
      })}
    </ul>
  );
}

function FavoriteStar({ name, onClick }) {
  return (
    <button type="button" className="profile-card__star" onClick={onClick} aria-label={`Quitar ${name} de favoritos`}>
      <img src={starFilledIcon} alt="" width="18" height="18" />
    </button>
  );
}
