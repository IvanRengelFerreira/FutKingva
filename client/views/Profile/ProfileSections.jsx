import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Rating from '../../components/Rating/Rating.jsx';
import { getTeam, getPlayer, STANDINGS_LALIGA } from '../../data/mockData.js';
import starFilledIcon from '../../assets/icon-star-filled.svg';
import editIcon from '../../assets/icon-edit-gold.svg';
import ballIcon from '../../assets/icon-ball.svg';
import trendIcon from '../../assets/icon-trend.svg';
import pitchLines from '../../assets/pitch-lines.svg';

// Bloques de 12 · Mi perfil: favoritos, comparativas guardadas, notificaciones y miniatura del equipo ideal.
// Diseño: Figma › Mockups › 12 · Mi perfil
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=56-781

// Colores de los jugadores de una comparativa (los mismos del Comparador: serie 1, 2, 3 y 4)
const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];

// Icono y color de cada tipo de aviso (como en el panel de la campana)
const NOTIFICATION_TYPES = {
  goal: { icon: ballIcon, tone: 'gold' },
  standings: { icon: trendIcon, tone: 'win' },
  rival: { icon: trendIcon, tone: 'loss' },
};

// Sitio de cada puesto del 4-3-3 en la miniatura del campo (en %; el ataque, arriba)
const PITCH_SPOTS = {
  DC: [50, 15], EI: [20, 20], ED: [80, 20],
  MC1: [28, 45], MC2: [50, 50], MC3: [72, 45],
  LI: [14, 70], DFC2: [38, 72], DFC1: [62, 72], LD: [86, 70],
  POR: [50, 88],
};

// Título de cada bloque, con un enlace o botón opcional a la derecha
export function SectionHeader({ id, title, children }) {
  return (
    <div className="profile__section-header">
      <h2 id={id} className="profile__section-title">{title}</h2>
      {children}
    </div>
  );
}

// Equipos favoritos: escudo, nombre, «LaLiga · 1.º · 24 pts» y estrella para quitarlo
export function FavoriteTeams({ teamIds, onRemove, limit }) {
  if (teamIds.length === 0) {
    return <p className="profile__empty">No sigues a ningún equipo. Márcalos con la estrella en <Link to="/equipos">Equipos y jugadores</Link>.</p>;
  }

  return (
    <ul className="profile__cards">
      {teamIds.slice(0, limit).map((teamId) => {
        const team = getTeam(teamId);
        const row = STANDINGS_LALIGA.find((item) => item.teamId === teamId);
        return (
          <li key={teamId} className="profile-card">
            <Crest teamId={teamId} size={44} />
            <Link className="profile-card__text" to={`/equipos/${teamId}`}>
              <span className="profile-card__name">{team?.name}</span>
              <span className="profile-card__meta">
                {[team?.competition, row && `${row.position}.º`, row && `${row.points} pts`].filter(Boolean).join(' · ')}
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
export function FavoritePlayers({ playerIds, onRemove, limit }) {
  if (playerIds.length === 0) {
    return <p className="profile__empty">No sigues a ningún jugador.</p>;
  }

  return (
    <ul className="profile__cards">
      {playerIds.slice(0, limit).map((playerId) => {
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

// Avatares de los jugadores de una comparativa, montados uno sobre otro con el color de su serie
function ComparisonPlayers({ playerIds }) {
  return (
    <span className="profile-comparison__players">
      {playerIds.map((playerId, i) => (
        <Avatar key={playerId} name={getPlayer(playerId)?.name} size={30} color={SERIES[i]} />
      ))}
    </span>
  );
}

// Comparativas guardadas: tabla en escritorio y tarjetas en móvil. «Abrir» lleva al Comparador.
export function SavedComparisons({ comparisons, onRemove, limit }) {
  if (comparisons.length === 0) {
    return <p className="profile__empty">No tienes comparativas guardadas. <Link to="/comparador">Crea una</Link>.</p>;
  }

  const visible = comparisons.slice(0, limit);
  return (
    <>
      <div className="profile-comparisons profile__desktop-block">
        <table className="profile-comparisons__table">
          <caption className="profile__sr-only">Comparativas guardadas</caption>
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col" className="profile-comparisons__players-col">Jugadores</th>
              <th scope="col" className="profile-comparisons__date">Fecha</th>
              <th scope="col" className="profile-comparisons__actions"><span className="profile__sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((comparison) => (
              <tr key={comparison.id}>
                <th scope="row">{comparison.name}</th>
                <td className="profile-comparisons__players-col">
                  <ComparisonPlayers playerIds={comparison.playerIds} />
                </td>
                <td className="profile-comparisons__date">{comparison.date}</td>
                <td className="profile-comparisons__actions">
                  <Link className="profile__action" to="/comparador">Abrir</Link>
                  <button type="button" className="profile__action profile__action--danger" onClick={() => onRemove(comparison.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="profile__list profile__mobile-flex">
        {visible.map((comparison) => (
          <li key={comparison.id} className="profile-card">
            <ComparisonPlayers playerIds={comparison.playerIds} />
            <span className="profile-card__text">
              <span className="profile-card__name">{comparison.name}</span>
              <span className="profile-card__meta">{comparison.date}</span>
            </span>
            <Link className="profile__action" to="/comparador">Abrir</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

// Notificaciones: icono según el tipo, texto, hora y punto rojo si no se ha leído
export function NotificationList({ notifications, limit }) {
  if (notifications.length === 0) {
    return <p className="profile__empty">No tienes notificaciones.</p>;
  }

  return (
    <ul className="profile-notifications">
      {notifications.slice(0, limit).map((notification) => {
        const type = NOTIFICATION_TYPES[notification.type] ?? NOTIFICATION_TYPES.goal;
        return (
          <li
            key={notification.id}
            className={`profile-notifications__item${notification.unread ? ' profile-notifications__item--unread' : ''}`}
          >
            <span
              className={`profile-notifications__icon profile-notifications__icon--${type.tone}`}
              style={{ '--icon': `url("${type.icon}")` }}
              aria-hidden="true"
            >
              <span />
            </span>
            <span className="profile-notifications__text">
              <span className="profile-notifications__title">
                {notification.title} <span className="profile-notifications__detail">{notification.detail}</span>
              </span>
              <span className="profile-notifications__time">{notification.time}</span>
            </span>
            {notification.unread && (
              <span className="profile-notifications__dot" role="img" aria-label="Sin leer" />
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Miniatura del equipo ideal: campo con un punto oro por jugador (discontinuo si el puesto está vacío)
export function IdealTeamCard({ team }) {
  const filled = team.players.filter((slot) => slot.playerId).length;
  return (
    <div className="profile-ideal">
      <div className="profile-ideal__pitch" style={{ backgroundImage: `url("${pitchLines}")` }}>
        {team.players.map((slot) => {
          const [x, y] = PITCH_SPOTS[slot.slot] ?? [50, 50];
          const player = slot.playerId ? getPlayer(slot.playerId) : null;
          return (
            <span
              key={slot.slot}
              className={`profile-ideal__dot${player ? '' : ' profile-ideal__dot--empty'}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              title={player ? `${slot.slot} · ${player.name}` : `${slot.slot} · vacío`}
            />
          );
        })}
      </div>
      <div className="profile-ideal__summary">
        <span className="profile-ideal__text">
          <span className="profile-ideal__name">
            {team.name}<span className="profile__mobile"> · {team.formation}</span>
          </span>
          <span className="profile-ideal__meta profile__desktop">
            {team.formation} · {filled}/{team.players.length} jugadores · {team.totals.goals} goles
          </span>
        </span>
        <Rating value={team.totals.averageRating} size="md" className="profile__desktop-flex" />
      </div>
      <Link className="profile__outline-button" to="/equipo-ideal">
        <img src={editIcon} alt="" width="16" height="16" />
        Editar equipo ideal
      </Link>
    </div>
  );
}
