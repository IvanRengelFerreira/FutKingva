import ballIcon from '../../assets/icon-ball.svg';
import trendIcon from '../../assets/icon-trend.svg';

// Icono y color de cada tipo de aviso (como en el panel de la campana)
const NOTIFICATION_TYPES = {
  goal: { icon: ballIcon, tone: 'gold' },
  standings: { icon: trendIcon, tone: 'win' },
  rival: { icon: trendIcon, tone: 'loss' },
};

// Notificaciones: icono según el tipo, texto, hora y punto rojo si no se ha leído
export default function NotificationList({ notifications, limit }) {
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
            {notification.unread && <span className="profile-notifications__dot" role="img" aria-label="Sin leer" />}
          </li>
        );
      })}
    </ul>
  );
}
