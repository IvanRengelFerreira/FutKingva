import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import './Notifications.css';
import { useSession } from '../../context/SessionContext.jsx';
import NotificationToast from './NotificationToast.jsx';
import bellIcon from '../../assets/icon-bell.svg';
import bellReadIcon from '../../assets/icon-bell-read.svg';
import ballIcon from '../../assets/icon-ball.svg';
import trendIcon from '../../assets/icon-trend.svg';
import settingsIcon from '../../assets/icon-settings.svg';

// Notificaciones en directo (RF9): campana de la navbar con su desplegable y el aviso emergente de gol.
// Diseño: Figma › Mockups › 00 · Componentes interactivos › Panel de notificaciones abierto
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=67-1582
// Va dentro de la Navbar solo cuando hay sesión: <Notifications />
// Los avisos salen de la sesión (useSession → notifications, unreadCount, markAllRead).

// Icono y color de cada tipo de aviso (data/mockData.js › NOTIFICATIONS)
const TYPES = {
  goal: { icon: ballIcon, tone: 'gold' },
  standings: { icon: trendIcon, tone: 'win' },
  rival: { icon: trendIcon, tone: 'loss' },
};

export default function Notifications() {
  const { notifications, unreadCount, markAllRead } = useSession();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Mientras está abierto, se cierra al pulsar fuera o con Esc
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (!wrapperRef.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Aviso emergente: el aviso más reciente sin leer que tenga texto para ello
  const toast = notifications.find((n) => n.toast && n.unread);

  return (
    <div className="notifications" ref={wrapperRef}>
      <button
        className="notifications__bell"
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount ? `Notificaciones: ${unreadCount} nuevas` : 'Notificaciones'}
      >
        {unreadCount ? (
          <img src={bellIcon} alt="" width="28" height="28" />
        ) : (
          <img src={bellReadIcon} alt="" width="20" height="20" />
        )}
      </button>

      {open && (
        <div className="notifications__panel" role="dialog" aria-label="Notificaciones">
          <header className="notifications__header">
            <h2>Notificaciones</h2>
            {unreadCount > 0 && <span className="notifications__count">{unreadCount} nuevas</span>}
            <button
              className="notifications__mark-read"
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Marcar como leídas
            </button>
          </header>

          <p className="notifications__live">
            <span className="notifications__live-dot" aria-hidden="true" />
            EN DIRECTO · equipos y jugadores que sigues
          </p>

          <ul className="notifications__list">
            {notifications.map((notification) => {
              const type = TYPES[notification.type] ?? TYPES.goal;
              return (
                <li
                  key={notification.id}
                  className={`notifications__item${notification.unread ? ' notifications__item--unread' : ''}`}
                >
                  <span className={`notifications__icon notifications__icon--${type.tone}`} aria-hidden="true">
                    <span style={{ '--icon': `url("${type.icon}")` }} />
                  </span>
                  <span className="notifications__text">
                    <strong>{notification.title}</strong>
                    <span>{notification.detail}</span>
                  </span>
                  <span className="notifications__meta">
                    <span>{notification.time}</span>
                    {notification.unread && <span className="notifications__unread-dot" aria-label="Sin leer" />}
                  </span>
                </li>
              );
            })}
          </ul>

          <footer className="notifications__footer">
            <Link className="notifications__settings" to="/perfil" onClick={() => setOpen(false)}>
              <img src={settingsIcon} alt="" width="16" height="16" />
              Preferencias de avisos
            </Link>
            <Link className="notifications__all" to="/perfil" onClick={() => setOpen(false)}>
              Ver todas →
            </Link>
          </footer>
        </div>
      )}

      {toast && <NotificationToast key={toast.id} {...toast.toast} />}
    </div>
  );
}
