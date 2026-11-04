import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import FormGuide from '../../components/FormGuide/FormGuide.jsx';
import Button from '../../components/Button/Button.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import starFilledIcon from '../../assets/icon-star-filled.svg';
import starOutlineIcon from '../../assets/icon-star-outline.svg';
import chevronIcon from '../../assets/icon-chevron-right-lg.svg';

// Equipos de 02 · Equipos y jugadores.
//   Escritorio: rejilla de tarjetas (LÍDER o liga, estrella de favorito, escudo, nombre, puesto y puntos, forma, «Ver ficha»)
//   Móvil: lista de tarjetas con escudo, nombre, «1º · 24 pts», forma y flecha (el líder con borde oro)
// rows: { ...team, row } de teamsData.js · mobileRows: las que se ven en móvil (con «Cargar más»)
// Diseño: Figma › Mockups › 02 · Equipos y jugadores › tarjeta «Equipo» (escritorio) y Lista (móvil)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-158
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-578
export default function TeamGrid({ rows, mobileRows, favorites, onToggleFavorite }) {
  const { user } = useSession();

  return (
    <>
      <ul className="teams__grid teams__desktop-grid">
        {rows.map((team) => {
          const leader = team.row.position === 1;
          const favorite = favorites.includes(team.id);
          return (
            <li key={team.id} className="team-card">
              <div className="team-card__top">
                <span className={`team-card__label${leader ? ' team-card__label--leader' : ''}`}>
                  {leader ? 'Líder' : team.competition}
                </span>
                {user ? (
                  <button
                    type="button"
                    className="team-card__star"
                    onClick={() => onToggleFavorite(team.id)}
                    aria-pressed={favorite}
                    aria-label={`${favorite ? 'Quitar' : 'Añadir'} ${team.name} ${favorite ? 'de' : 'a'} favoritos`}
                  >
                    <img src={favorite ? starFilledIcon : starOutlineIcon} alt="" width="18" height="18" />
                  </button>
                ) : (
                  <Link className="team-card__star" to="/acceso" state={{ from: '/equipos' }} aria-label={`Inicia sesión para seguir a ${team.name}`}>
                    <img src={starOutlineIcon} alt="" width="18" height="18" />
                  </Link>
                )}
              </div>
              <Crest teamId={team.id} size={72} />
              <h2 className="team-card__name">{team.name}</h2>
              <div className="team-card__stats">
                <span className="team-card__stat">
                  <span className="team-card__value">{team.row.position}º</span>
                  <span className="team-card__stat-label"><abbr title="Posición">Pos.</abbr></span>
                </span>
                <span className="team-card__stat">
                  <span className={`team-card__value${leader ? ' team-card__value--gold' : ''}`}>{team.row.points}</span>
                  <span className="team-card__stat-label"><abbr title="Puntos">Pts</abbr></span>
                </span>
              </div>
              <FormGuide form={team.row.form} size={20} />
              <Button variant="tertiary" to={`/equipos/${team.id}`} className="team-card__button" aria-label={`Ver ficha de ${team.name}`}>
                Ver ficha
              </Button>
            </li>
          );
        })}
      </ul>

      <ul className="teams__list teams__mobile-flex">
        {mobileRows.map((team) => (
          <li key={team.id}>
            <Link
              className={`teams__item${team.row.position === 1 ? ' teams__item--leader' : ''}`}
              to={`/equipos/${team.id}`}
            >
              <Crest teamId={team.id} size={44} />
              <span className="teams__item-text">
                <span className="teams__item-name">{team.name}</span>
                <span className="teams__item-meta">
                  <span className={team.row.position === 1 ? 'teams__item-points--leader' : undefined}>
                    {team.row.position}º · {team.row.points} pts
                  </span>
                  <FormGuide form={team.row.form} size={14} />
                </span>
              </span>
              <img src={chevronIcon} alt="" width="18" height="18" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
