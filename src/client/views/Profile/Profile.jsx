import { useState } from 'react';
import { Link } from 'react-router';
import Tabs from '../../components/Tabs/Tabs.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useLogout, useSession } from '../../context/SessionContext.jsx';
import { useNotifications } from '../../context/NotificationsContext.jsx';
import { useUserData } from '../../context/UserDataContext.jsx';
import { useApi } from '../../services/useApi.js';
import { getProfile } from '../../services/profile.js';
import { monthYear } from '../../services/format.js';
import SectionHeader from './SectionHeader.jsx';
import { FavoriteTeams, FavoritePlayers } from './FavoriteCards.jsx';
import SavedComparisons from './SavedComparisons.jsx';
import NotificationList from './NotificationList.jsx';
import IdealTeamCard from './IdealTeamCard.jsx';
import editIcon from '../../assets/icon-edit-gold.svg';
import logoutIcon from '../../assets/icon-logout-light.svg';
import './Profile.css';

const ROLE_LABELS = {
  user: 'Usuario registrado',
  editor: 'Editor',
  admin: 'Administrador',
};

// 12 · Mi perfil (RF3): datos del usuario, favoritos, comparativas guardadas, equipo ideal y notificaciones.
// Solo con sesión (RequireRole en App.jsx). Los datos del perfil llegan de GET /api/me/profile y los favoritos
// de GET /api/me/favorites (a través de UserDataContext).
// Pestaña Favoritos: el resumen del mockup (todo); las demás enseñan solo su bloque.
// Diseño: Figma › Mockups › 12 · Mi perfil
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=56-781
export default function Profile() {
  const { user } = useSession();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const handleLogout = useLogout();
  const [tab, setTab] = useState('favorites');
  const {
    favoriteTeams,
    favoritePlayers,
    favoriteTeamItems,
    favoritePlayerItems,
    favoritesLoading,
    favoritesError,
    reloadFavorites,
    savedComparisons: comparisons,
    idealTeam,
    toggleFavoriteTeam,
    toggleFavoritePlayer,
    removeComparison,
  } = useUserData();
  const {
    data: profile,
    error: profileError,
    loading: profileLoading,
    reload: reloadProfile,
  } = useApi((signal) => getProfile({ signal }), [user.id]);
  const [editNotice, setEditNotice] = useState(false);

  if (profileLoading || favoritesLoading) {
    return <LoadingState label="Cargando perfil…" />;
  }

  if (profileError || favoritesError) {
    const retry = () => {
      if (profileError) reloadProfile();
      if (favoritesError) reloadFavorites();
    };
    return (
      <ErrorState error={profileError ?? favoritesError} title="No se ha podido cargar tu perfil" onRetry={retry} />
    );
  }

  const tabs = [
    { id: 'favorites', label: 'Favoritos' },
    { id: 'comparisons', label: <Short long="Comparativas guardadas" short="Comparativas" /> },
    { id: 'ideal', label: <Short long="Mi equipo ideal" short="Equipo ideal" /> },
    {
      id: 'notifications',
      label: (
        <>
          Notificaciones
          {unreadCount > 0 && (
            <span className="profile__badge" aria-label={`${unreadCount} sin leer`}>
              {unreadCount}
            </span>
          )}
        </>
      ),
    },
  ];

  const hasIdealTeam = idealTeam.players.some((slot) => slot.playerId);

  return (
    <section className="page profile">
      <header className="profile-hero">
        <Avatar
          name={profile.name}
          initials={profile.initials}
          size={96}
          className="profile-hero__avatar profile__desktop-flex"
        />
        <Avatar
          name={profile.name}
          initials={profile.initials}
          size={80}
          className="profile-hero__avatar profile__mobile-flex"
        />
        <div className="profile-hero__text">
          <p className="profile-hero__eyebrow">{ROLE_LABELS[profile.role] ?? 'Usuario registrado'}</p>
          <h1 className="profile-hero__name">{profile.name}</h1>
          <p className="profile-hero__meta">
            {profile.email} · Miembro desde {monthYear(profile.memberSince)}
          </p>
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
            <dd>{hasIdealTeam ? 1 : 0}</dd>
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
            La edición de perfil todavía no está disponible.
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
            <FavoriteTeams teams={favoriteTeamItems} onRemove={toggleFavoriteTeam} />
          </section>

          <section className="profile__section" aria-labelledby="profile-players-title">
            <SectionHeader id="profile-players-title" title="Jugadores favoritos">
              <ManageLink to="/equipos" />
            </SectionHeader>
            <FavoritePlayers players={favoritePlayerItems} onRemove={toggleFavoritePlayer} />
          </section>

          <div className="profile__columns">
            <div className="profile__main">
              <section className="profile__section" aria-labelledby="profile-comparisons-title">
                <SectionHeader
                  id="profile-comparisons-title"
                  title={<Short long="Comparativas guardadas" short="Comparativas" />}
                >
                  <NewComparisonLink />
                </SectionHeader>
                <SavedComparisons comparisons={comparisons} onRemove={removeComparison} />
              </section>

              <section
                className="profile__section profile__desktop-block"
                aria-labelledby="profile-notifications-title"
              >
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
              <IdealTeamCard team={idealTeam} />
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
          <IdealTeamCard team={idealTeam} />
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
