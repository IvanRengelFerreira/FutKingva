import { Link } from 'react-router';
import ArticleCard from '../../components/ArticleCard/ArticleCard.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Rating from '../../components/Rating/Rating.jsx';
import Button from '../../components/Button/Button.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import {
  PLAYER_OF_THE_ROUND,
  HOME_FEATURED_ARTICLE,
  HOME_PLAYER_NOTE_SHORT,
  getArticle,
  getPlayer,
  getTeam,
} from '../../data/mockData.js';

// Columna «Destacados»: análisis destacado, jugador de la jornada y «Tus favoritos».
// Si falta el artículo o el jugador en los datos, ese bloque no se pinta.
// «Tus favoritos» cambia con la sesión: un invitado ve la llamada a iniciar sesión; con sesión, un acceso a equipos y jugadores.
// Diseño: Figma › Mockups › 01 · Inicio › Destacados (escritorio 420 px, móvil 358 px)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-150
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=41-260
export default function Featured() {
  const article = getArticle(HOME_FEATURED_ARTICLE.articleId);
  const player = getPlayer(PLAYER_OF_THE_ROUND.playerId);
  const team = player ? getTeam(player.teamId) : undefined;

  return (
    <aside className="home-featured" aria-labelledby="home-featured-title">
      <h2 id="home-featured-title" className="home-section-header__title">Destacados</h2>

      {article && (
        <ArticleCard
          className="home-featured__article"
          article={article}
          excerpt={HOME_FEATURED_ARTICLE.excerpt}
          illustration={{ stat: HOME_FEATURED_ARTICLE.stat }}
        />
      )}

      {player && (
        <Link to={`/jugadores/${player.id}`} className="home-star">
          <Avatar name={player.name} size={60} className="home-star__avatar" />
          <span className="home-star__text">
            <span className="home-star__eyebrow">
              <span className="home__desktop">Jugador de la jornada {PLAYER_OF_THE_ROUND.round}</span>
              <span className="home__mobile">Jugador de la jornada</span>
            </span>
            <span className="home-star__name">{player.name}</span>
            <span className="home-star__note">
              {team?.name ?? '—'} ·{' '}
              <span className="home__desktop">{PLAYER_OF_THE_ROUND.note}</span>
              <span className="home__mobile">{HOME_PLAYER_NOTE_SHORT}</span>
            </span>
          </span>
          <Rating value={PLAYER_OF_THE_ROUND.rating} size="lg" className="home-star__rating" />
        </Link>
      )}

      <Favorites />
    </aside>
  );
}

function Favorites() {
  const { user } = useSession();

  return (
    <section className="home-favorites" aria-labelledby="home-favorites-title">
      <h3 id="home-favorites-title" className="home-favorites__title">Tus favoritos</h3>
      {user ? (
        <>
          <p className="home-favorites__text">
            <span className="home__desktop">Hola, {user.name}. Sigue a tus equipos y jugadores desde sus fichas para recibir avisos de goles en directo.</span>
            <span className="home__mobile">Sigue equipos y jugadores desde sus fichas.</span>
          </p>
          <Button variant="secondary" to="/equipos" className="home-favorites__button">Explorar equipos</Button>
        </>
      ) : (
        <>
          <p className="home-favorites__text">
            <span className="home__desktop">Inicia sesión para seguir a tus equipos y jugadores y recibir avisos de goles en directo.</span>
            <span className="home__mobile">Inicia sesión para seguir equipos y jugadores.</span>
          </p>
          <Button variant="secondary" to="/acceso" className="home-favorites__button">Iniciar sesión</Button>
        </>
      )}
    </section>
  );
}
