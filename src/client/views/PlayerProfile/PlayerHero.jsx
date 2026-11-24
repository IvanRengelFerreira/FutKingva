import { useLocation } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import Rating from '../../components/Rating/Rating.jsx';
import Button from '../../components/Button/Button.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useUserData } from '../../context/UserDataContext.jsx';
import { MISSING, formatHeight, formatRank } from './format.js';

function followButtonLabel(following, isMobile) {
  if (following) return isMobile ? 'Siguiendo' : 'En favoritos';
  return isMobile ? 'Seguir' : 'Añadir a favoritos';
}

// Cabecera de la ficha: avatar con el escudo del club, nombre, valoración media y botones.
// «Seguir» (favorito): con sesión lo añade o lo quita de Mi perfil; sin sesión lleva a Acceso y al entrar vuelve aquí.
// «Comparar jugador» abre el Comparador con este jugador.
export default function PlayerHero({ player, team, stats, ranks, isMobile }) {
  const { user } = useSession();
  const { pathname } = useLocation();
  const { favoritePlayers, toggleFavoritePlayer } = useUserData();
  const following = Boolean(user) && favoritePlayers.includes(player.id); // sin sesión no hay favoritos

  const eyebrow = [team?.name, player.position, player.number != null ? `#${player.number}` : null]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();

  // Escritorio: nombre completo (si aporta algo más que el nombre visible), edad, país, altura y pie
  // Móvil: solo edad, país y altura
  const fullName = player.fullName && player.fullName !== player.name ? player.fullName : null;
  const height = formatHeight(player.heightCm);
  const ageText = player.age != null ? `${player.age} años` : null;
  const details = (
    isMobile ? [ageText, player.nationality, height] : [fullName, ageText, player.nationality, height, player.foot]
  ).filter(Boolean);

  const rating = stats?.rating ?? null;
  const ratingRank = formatRank(ranks?.rating);
  const followLabel = followButtonLabel(following, isMobile);
  const star = (
    <span className="player-hero__star" aria-hidden="true">
      {following ? '★' : '☆'}
    </span>
  );

  return (
    <header className="player-hero" style={team?.color ? { '--team-color': team.color } : undefined}>
      <div className="player-hero__photo">
        <Avatar name={player.name} size={isMobile ? 100 : 140} className="player-hero__avatar" />
        {team && (
          <span className="player-hero__crest">
            <Crest team={team} size={isMobile ? 34 : 44} labelled />
          </span>
        )}
      </div>

      <div className="player-hero__text">
        {eyebrow && <p className="player-hero__eyebrow">{eyebrow}</p>}
        <h1 className="player-hero__name">{player.name}</h1>
        {details.length > 0 && <p className="player-hero__details">{details.join(' · ')}</p>}
      </div>

      <div className="player-hero__rating-box">
        {rating != null ? (
          <Rating value={rating} size="lg" className="player-hero__rating" />
        ) : (
          <span className="player-hero__no-rating" role="img" aria-label="Sin valoración">
            {MISSING}
          </span>
        )}
        <div className="player-hero__rating-text">
          <p className="player-hero__rating-label">Valoración media</p>
          {ratingRank && <p className="player-hero__rating-rank">{ratingRank}</p>}
        </div>
      </div>

      <div className="player-hero__actions">
        {user ? (
          <Button
            variant="secondary"
            className={`player-hero__follow${following ? ' player-hero__follow--on' : ''}`}
            aria-pressed={following}
            onClick={() => toggleFavoritePlayer(player.id)}
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
        <Button className="player-hero__compare" to="/comparador" state={{ playerIds: [player.id] }}>
          {isMobile ? 'Comparar' : 'Comparar jugador'}
        </Button>
      </div>
    </header>
  );
}
