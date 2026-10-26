import { useState } from 'react';
import { useLocation } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import Rating from '../../components/Rating/Rating.jsx';
import Button from '../../components/Button/Button.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { MISSING } from './format.js';

// Cabecera de la ficha: avatar con el escudo del club, nombre, valoración media y botones.
// «Seguir» (favorito): con sesión cambia de estado; sin sesión lleva a Acceso y al entrar vuelve aquí.
// Sin servidor, el favorito solo dura mientras la página está abierta.
export default function PlayerHero({ player, team, extras, isMobile }) {
  const { user } = useSession();
  const { pathname } = useLocation();
  const [following, setFollowing] = useState(false);

  const clubName = extras.clubName ?? team?.name;
  const eyebrow = [clubName, player.position, player.number != null ? `#${player.number}` : null]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();

  // Escritorio: nombre completo, edad, país, altura y pie · móvil: solo edad, país y altura
  const details = (isMobile
    ? [player.age != null && `${player.age} años`, player.country, extras.height]
    : [extras.fullName, player.age != null && `${player.age} años`, player.country, extras.height, extras.foot]
  ).filter(Boolean);

  const followLabel = following ? (isMobile ? 'Siguiendo' : 'En favoritos') : isMobile ? 'Seguir' : 'Añadir a favoritos';
  const star = <span className="player-hero__star" aria-hidden="true">{following ? '★' : '☆'}</span>;

  return (
    <header className="player-hero" style={team ? { '--team-color': team.color } : undefined}>
      <div className="player-hero__photo">
        <Avatar name={player.name} size={isMobile ? 100 : 140} className="player-hero__avatar" />
        <span className="player-hero__crest">
          <Crest teamId={player.teamId} size={isMobile ? 34 : 44} labelled />
        </span>
      </div>

      <div className="player-hero__text">
        <p className="player-hero__eyebrow">{eyebrow}</p>
        <h1 className="player-hero__name">{player.name}</h1>
        {details.length > 0 && <p className="player-hero__details">{details.join(' · ')}</p>}
      </div>

      <div className="player-hero__rating-box">
        {player.rating != null ? (
          <Rating value={player.rating} size="lg" className="player-hero__rating" />
        ) : (
          <span className="player-hero__no-rating" role="img" aria-label="Sin valoración">{MISSING}</span>
        )}
        <div className="player-hero__rating-text">
          <p className="player-hero__rating-label">Valoración media</p>
          {extras.ratingRank && <p className="player-hero__rating-rank">{extras.ratingRank}</p>}
        </div>
      </div>

      <div className="player-hero__actions">
        {user ? (
          <Button
            variant="secondary"
            className={`player-hero__follow${following ? ' player-hero__follow--on' : ''}`}
            aria-pressed={following}
            onClick={() => setFollowing(!following)}
          >
            {star}
            {followLabel}
          </Button>
        ) : (
          <Button variant="secondary" className="player-hero__follow" to="/acceso" state={{ from: pathname }}>
            {star}
            {followLabel}
          </Button>
        )}
        <Button className="player-hero__compare" to="/comparador">
          {isMobile ? 'Comparar' : 'Comparar jugador'}
        </Button>
      </div>
    </header>
  );
}
