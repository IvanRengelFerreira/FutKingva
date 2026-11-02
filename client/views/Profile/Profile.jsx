import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Tabs from '../../components/Tabs/Tabs.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { PROFILE_EXAMPLE, IDEAL_TEAM_EXAMPLE } from '../../data/mockData.js';
import {
  SectionHeader,
  FavoriteTeams,
  FavoritePlayers,
  SavedComparisons,
  NotificationList,
  IdealTeamCard,
} from './ProfileSections.jsx';
import editIcon from '../../assets/icon-edit-gold.svg';
import logoutIcon from '../../assets/icon-logout-light.svg';
import './Profile.css';

// 12 · Mi perfil (RF3): datos del usuario, favoritos, comparativas guardadas, equipo ideal y notificaciones.
// Solo con sesión (RequireRole en App.jsx). El nombre y las iniciales salen de la sesión simulada;
// el correo, los favoritos y las comparativas, de PROFILE_EXAMPLE (mockData.js).
// Quitar favoritos y eliminar comparativas solo dura hasta recargar (no hay servidor).
// Pestaña Favoritos: el resumen del mockup (todo); las demás enseñan solo su bloque.
// Diseño: Figma › Mockups › 12 · Mi perfil
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=56-781
export default function Profile() {
  const { user, logout, notifications, unreadCount, markAllRead } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState('favorites');
  const [favoriteTeams, setFavoriteTeams] = useState(PROFILE_EXAMPLE.favoriteTeams);
  const [favoritePlayers, setFavoritePlayers] = useState(PROFILE_EXAMPLE.favoritePlayers);
  const [comparisons, setComparisons] = useState(PROFILE_EXAMPLE.savedComparisons);
  const [editNotice, setEditNotice] = useState(false);

  const tabs = [
    { id: 'favorites', label: 'Favoritos' },
    { id: 'comparisons', label: <Short long="Comparativas guardadas" short="Comparativas" /> },
    { id: 'ideal', label: <Short long="Mi equipo ideal" short="Equipo ideal" /> },
    {
      id: 'notifications',
      label: (
        <>
          Notificaciones
          {unreadCount > 0 && <span className="profile__badge" aria-label={`${unreadCount} sin leer`}>{unreadCount}</span>}
        </>
      ),
    },
  ];

  // «Cerrar sesión»: primero se va a Inicio y la sesión se cierra cuando esta página ya se ha quitado.
  // Si se cerrara antes, RequireRole vería la página privada sin sesión y mandaría a Acceso.
  const loggingOut = useRef(false);
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  });
  useEffect(() => () => {
    if (loggingOut.current) logoutRef.current();
  }, []);

  function handleLogout() {
    loggingOut.current = true;
    navigate('/');
  }

  const removeTeam = (id) => setFavoriteTeams(favoriteTeams.filter((teamId) => teamId !== id));
  const removePlayer = (id) => setFavoritePlayers(favoritePlayers.filter((playerId) => playerId !== id));
  const removeComparison = (id) => setComparisons(comparisons.filter((comparison) => comparison.id !== id));

  return (
    <section className="page profile">
      <header className="profile-hero">
        <Avatar name={user.name} initials={user.initials} size={96} className="profile-hero__avatar profile__desktop-flex" />
        <Avatar name={user.name} initials={user.initials} size={80} className="profile-hero__avatar profile__mobile-flex" />
        <div className="profile-hero__text">
          <p className="profile-hero__eyebrow">{ROLE_LABELS[user.role] ?? 'Usuario registrado'}</p>
          <h1 className="profile-hero__name">{user.name}</h1>
          <p className="profile-hero__meta">{PROFILE_EXAMPLE.email} · Miembro desde {PROFILE_EXAMPLE.memberSince}</p>
        </div>
        <dl className="profile-hero__counts">
          <div>
            <dt>Favoritos</dt>
            <dd>{favoriteTeams.length + favoritePlayers.length}</dd>
          </div>
          <div>
            <dt>Comparativas</dt>
            <dd>{comparisons.length}</dd>
          </div>
          <div>
            <dt>Equipo ideal</dt>
            <dd>1</dd>
          </div>
        </dl>
        <div className="profile-hero__actions">
          <button type="button" className="profile__outline-button" onClick={() => setEditNotice(true)}>
            <img src={editIcon} alt="" width="16" height="16" />
            Editar perfil
          </button>
          <button type="button" className="profile__dark-button" onClick={handleLogout}>
            <img src={logoutIcon} alt="" width="16" height="16" />
            Cerrar sesión
          </button>
        </div>
        {editNotice && (
          <p className="profile-hero__notice" role="status">
            Podrás editar tu perfil cuando FutKingva tenga servidor. De momento, los datos son de ejemplo.
          </p>
        )}
      </header>

      <Tabs label="Secciones de mi perfil" tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'favorites' && (
        <>
          <section className="profile__section" aria-labelledby="profile-teams-title">
            <SectionHeader id="profile-teams-title" title="Equipos favoritos">
              <ManageLink to="/equipos" />
            </SectionHeader>
            <FavoriteTeams teamIds={favoriteTeams} onRemove={removeTeam} />
          </section>

          <section className="profile__section" aria-labelledby="profile-players-title">
            <SectionHeader id="profile-players-title" title="Jugadores favoritos">
              <ManageLink to="/equipos" />
            </SectionHeader>
            <FavoritePlayers playerIds={favoritePlayers} onRemove={removePlayer} />
          </section>

          <div className="profile__columns">
            <div className="profile__main">
              <section className="profile__section" aria-labelledby="profile-comparisons-title">
                <SectionHeader id="profile-comparisons-title" title={<Short long="Comparativas guardadas" short="Comparativas" />}>
                  <NewComparisonLink />
                </SectionHeader>
                <SavedComparisons comparisons={comparisons} onRemove={removeComparison} />
              </section>

              <section className="profile__section profile__desktop-block" aria-labelledby="profile-notifications-title">
                <SectionHeader id="profile-notifications-title" title="Notificaciones recientes">
                  <button type="button" className="profile__more" onClick={() => setTab('notifications')}>
                    Ver todas <span aria-hidden="true">→</span>
                  </button>
                </SectionHeader>
                <NotificationList notifications={notifications} limit={3} />
              </section>
            </div>

            <section className="profile__section" aria-labelledby="profile-ideal-title">
              <SectionHeader id="profile-ideal-title" title="Mi equipo ideal" />
              <IdealTeamCard team={IDEAL_TEAM_EXAMPLE} />
            </section>
          </div>
        </>
      )}

      {tab === 'comparisons' && (
        <section className="profile__section" aria-labelledby="profile-comparisons-tab-title">
          <SectionHeader id="profile-comparisons-tab-title" title="Comparativas guardadas">
            <NewComparisonLink />
          </SectionHeader>
          <SavedComparisons comparisons={comparisons} onRemove={removeComparison} />
        </section>
      )}

      {tab === 'ideal' && (
        <section className="profile__section profile__section--narrow" aria-labelledby="profile-ideal-tab-title">
          <SectionHeader id="profile-ideal-tab-title" title="Mi equipo ideal" />
          <IdealTeamCard team={IDEAL_TEAM_EXAMPLE} />
        </section>
      )}

      {tab === 'notifications' && (
        <section className="profile__section" aria-labelledby="profile-notifications-tab-title">
          <SectionHeader id="profile-notifications-tab-title" title="Notificaciones">
            {unreadCount > 0 && (
              <button type="button" className="profile__more" onClick={markAllRead}>
                Marcar todas como leídas
              </button>
            )}
          </SectionHeader>
          <NotificationList notifications={notifications} />
        </section>
      )}
    </section>
  );
}

const ROLE_LABELS = {
  user: 'Usuario registrado',
  editor: 'Editor',
  admin: 'Administrador',
};

// Texto largo en escritorio y corto en móvil
function Short({ long, short }) {
  return (
    <>
      <span className="profile__desktop">{long}</span>
      <span className="profile__mobile">{short}</span>
    </>
  );
}

function ManageLink({ to }) {
  return (
    <Link className="profile__more" to={to}>
      Gestionar <span aria-hidden="true">→</span>
    </Link>
  );
}

function NewComparisonLink() {
  return (
    <Link className="profile__more" to="/comparador">
      <Short long="Nueva comparativa" short="Nueva" /> <span aria-hidden="true">→</span>
    </Link>
  );
}
