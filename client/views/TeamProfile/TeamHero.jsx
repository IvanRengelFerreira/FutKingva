import { useLocation } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import FormGuide from '../../components/FormGuide/FormGuide.jsx';
import Button from '../../components/Button/Button.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useUserData } from '../../context/UserDataContext.jsx';
import starIcon from '../../assets/icon-star.svg';

// Cabecera de la ficha de equipo: escudo grande, liga y puesto, nombre, estadio · entrenador · fundación,
// forma y los botones «Seguir equipo» y «Ver clasificación».
// En móvil va centrada, con el escudo más pequeño y los textos cortos.
// «Seguir equipo» sin sesión lleva a Acceso (y al entrar vuelve aquí); con sesión lo añade a los favoritos de Mi perfil.
// Diseño: Figma › Mockups › 03 · Ficha de equipo › Cabecera de ficha
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-193
export default function TeamHero({ team, extras, row }) {
  const { user } = useSession();
  const { pathname } = useLocation();
  const { favoriteTeams, toggleFavoriteTeam } = useUserData();
  const following = Boolean(user) && favoriteTeams.includes(team.id); // sin sesión no hay favoritos

  const eyebrow = row ? `${team.competition} · ${row.position}.º` : team.competition;
  const coachSurname = team.coach?.split(' ').at(-1);
  const meta = [
    extras?.stadium,
    team.coach && `Entrenador: ${team.coach}`,
    extras?.founded && `Fundado en ${extras.founded}`,
  ].filter(Boolean);
  const metaShort = [extras?.stadiumShort, coachSurname].filter(Boolean);

  const followProps = user
    ? { onClick: () => toggleFavoriteTeam(team.id), 'aria-pressed': following }
    : { to: '/acceso', state: { from: pathname } };

  return (
    <header className="team-hero">
      <Crest teamId={team.id} size={128} className="team-hero__crest team-hero__crest--desktop" />
      <Crest teamId={team.id} size={92} className="team-hero__crest team-hero__crest--mobile" />

      <div className="team-hero__text">
        <p className="team-hero__eyebrow">{eyebrow}</p>
        <h1 className="team-hero__name">{team.name}</h1>
        {meta.length > 0 && (
          <p className="team-hero__meta">
            <span className="team-profile__desktop">{meta.join('  ·  ')}</span>
            <span className="team-profile__mobile">{metaShort.join(' · ')}</span>
          </p>
        )}
        {row && (
          <div className="team-hero__form">
            <span className="team-hero__form-label">Forma</span>
            <FormGuide form={row.form} size={24} className="team-profile__desktop" />
            <FormGuide form={row.form} size={20} className="team-profile__mobile" />
          </div>
        )}
      </div>

      <div className="team-hero__actions">
        <Button variant="secondary" className="team-hero__button" {...followProps}>
          <img src={starIcon} alt="" width="16" height="16" />
          <span className="team-profile__desktop">{following ? 'Siguiendo' : 'Seguir equipo'}</span>
          <span className="team-profile__mobile">{following ? 'Siguiendo' : 'Seguir'}</span>
        </Button>
        <Button to="/clasificaciones" className="team-hero__button">
          <span className="team-profile__desktop">Ver clasificación</span>
          <span className="team-profile__mobile">Clasificación</span>
        </Button>
      </div>
    </header>
  );
}
