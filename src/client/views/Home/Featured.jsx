import { Link } from 'react-router';
import ArticleCard from '../../components/ArticleCard/ArticleCard.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Button from '../../components/Button/Button.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { numericDate } from '../../services/format.js';

// Columna «Destacados»: análisis destacado, jugador de la jornada y «Tus favoritos».
// Si no hay artículo publicado o jugador de la jornada en la BD, ese bloque no se pinta.
// «Tus favoritos» cambia con la sesión: un invitado ve la llamada a iniciar sesión; con sesión, un acceso a equipos y jugadores.
// Diseño: Figma › Mockups › 01 · Inicio › Destacados (escritorio 420 px, móvil 358 px)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-150
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=41-260
export default function Featured({ article, topScorer }) {
  return (
    <aside className="home-featured" aria-labelledby="home-featured-title">
      <h2 id="home-featured-title" className="home-section-header__title">
        Destacados
      </h2>

      {article && (
        <ArticleCard
          className="home-featured__article"
          article={{
            id: article.id,
            title: article.title,
            author: article.author,
            date: numericDate(article.publishedAt),
          }}
          excerpt={article.summary}
        />
      )}

      {topScorer && <TopScorerCard player={topScorer} />}

      <Favorites />
    </aside>
  );
}

function TopScorerCard({ player }) {
  const goalsLabel = `${player.goals} ${player.goals === 1 ? 'gol' : 'goles'}`;
  const roundLabel = player.round ? `Jugador de la jornada ${player.round}` : 'Jugador de la jornada';

  return (
    <Link to={`/jugadores/${player.id}`} className="home-star">
      <Avatar name={player.name} size={60} className="home-star__avatar" />
      <span className="home-star__text">
        <span className="home-star__eyebrow">
          <span className="home__desktop">{roundLabel}</span>
          <span className="home__mobile">Jugador de la jornada</span>
        </span>
        <span className="home-star__name">{player.name}</span>
        <span className="home-star__note">
          {player.team?.name ?? '—'} · {goalsLabel}
        </span>
      </span>
    </Link>
  );
}

function Favorites() {
  const { user } = useSession();

  return (
    <section className="home-favorites" aria-labelledby="home-favorites-title">
      <h3 id="home-favorites-title" className="home-favorites__title">
        Tus favoritos
      </h3>
      {user ? (
        <>
          <p className="home-favorites__text">
            <span className="home__desktop">
              Hola, {user.name}. Sigue a tus equipos y jugadores desde sus fichas para recibir avisos de goles en
              directo.
            </span>
            <span className="home__mobile">Sigue equipos y jugadores desde sus fichas.</span>
          </p>
          <Button variant="secondary" to="/equipos" className="home-favorites__button">
            Explorar equipos
          </Button>
        </>
      ) : (
        <>
          <p className="home-favorites__text">
            <span className="home__desktop">
              Inicia sesión para seguir a tus equipos y jugadores y recibir avisos de goles en directo.
            </span>
            <span className="home__mobile">Inicia sesión para seguir equipos y jugadores.</span>
          </p>
          <Button variant="secondary" to="/acceso" className="home-favorites__button">
            Iniciar sesión
          </Button>
        </>
      )}
    </section>
  );
}
