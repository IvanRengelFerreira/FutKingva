import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import starFilledIcon from '../../assets/icon-star-filled.svg';

const MISSING = '—';

// Equipos favoritos: escudo, nombre, «LaLiga · 1.º · 24 pts» y estrella para quitarlo
export function FavoriteTeams({ teams, onRemove }) {
  if (teams.length === 0) {
    return (
      <p className="profile__empty">
        No sigues a ningún equipo. Márcalos con la estrella en <Link to="/equipos">Equipos y jugadores</Link>.
      </p>
    );
  }

  return (
    <ul className="profile__cards">
      {teams.map((team) => {
        const meta = [
          team.competition,
          team.position != null && `${team.position}.º`,
          team.points != null && `${team.points} pts`,
        ]
          .filter(Boolean)
          .join(' · ');

        return (
          <li key={team.id} className="profile-card">
            <Crest team={team} size={44} />
            <Link className="profile-card__text" to={`/equipos/${team.id}`}>
              <span className="profile-card__name">{team.name}</span>
              {meta && <span className="profile-card__meta">{meta}</span>}
            </Link>
            <FavoriteStar name={team.name} onClick={() => onRemove(team.id)} />
          </li>
        );
      })}
    </ul>
  );
}

// Jugadores favoritos: avatar con el color del club, nombre, «FCB · 2 G · 4 A» y estrella para quitarlo
export function FavoritePlayers({ players, onRemove }) {
  if (players.length === 0) {
    return <p className="profile__empty">No sigues a ningún jugador.</p>;
  }

  return (
    <ul className="profile__cards">
      {players.map((player) => {
        const meta = [player.team?.code, `${player.goals ?? MISSING} G`, `${player.assists ?? MISSING} A`]
          .filter(Boolean)
          .join(' · ');

        return (
          <li key={player.id} className="profile-card">
            <Avatar name={player.name} size={44} color={player.team?.color} />
            <Link className="profile-card__text" to={`/jugadores/${player.id}`}>
              <span className="profile-card__name">{player.name}</span>
              <span className="profile-card__meta">{meta}</span>
            </Link>
            <FavoriteStar name={player.name} onClick={() => onRemove(player.id)} />
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
