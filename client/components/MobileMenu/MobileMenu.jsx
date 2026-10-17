import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import './MobileMenu.css';
import logo from '../../assets/logo-menu.svg';
import closeIcon from '../../assets/icon-close.svg';
import chevronIcon from '../../assets/icon-chevron-right.svg';
import homeIcon from '../../assets/icon-home.svg';
import usersIcon from '../../assets/icon-users.svg';
import tableIcon from '../../assets/icon-table.svg';
import whistleIcon from '../../assets/icon-whistle.svg';
import docIcon from '../../assets/icon-doc.svg';
import compareIcon from '../../assets/icon-compare.svg';
import pitchIcon from '../../assets/icon-pitch.svg';
import userIcon from '../../assets/icon-user.svg';
import logoutIcon from '../../assets/icon-logout.svg';

// Opciones del menú (mismo orden que en Figma). «also»: igual que en la Navbar.
const MAIN_LINKS = [
  { label: 'Inicio', path: '/', icon: homeIcon },
  { label: 'Equipos y jugadores', path: '/equipos', also: '/jugadores', icon: usersIcon },
  { label: 'Clasificaciones', path: '/clasificaciones', icon: tableIcon },
  { label: 'Árbitros', path: '/arbitros', icon: whistleIcon },
  { label: 'Análisis', path: '/analisis', icon: docIcon },
];

const MY_ZONE_LINKS = [
  { label: 'Comparador', path: '/comparador', icon: compareIcon },
  { label: 'Mi equipo ideal', path: '/equipo-ideal', icon: pitchIcon },
];

// Cajón lateral que se abre con ☰ en móvil.
// Diseño: Figma › Mockups › 00 · Componentes interactivos › Menú móvil abierto (Sesión=Sí)
// Sin sesión (user = null) no se muestran el bloque del perfil, «Mi perfil» ni «Cerrar sesión».
// user: { name, initials, notifications } cuando esté la sesión simulada.
export default function MobileMenu({ open, onClose, user = null }) {
  const { pathname } = useLocation();
  const closeButtonRef = useRef(null);

  // Mientras está abierto: Esc lo cierra, la página de detrás no hace scroll y el foco va a la X.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Opción del menú: icono + texto + flecha (o el número de avisos en «Mi perfil»).
  // El icono se pinta con máscara para que cambie a oro en la opción activa.
  function renderLink(link, badge) {
    return (
      <NavLink
        key={link.path}
        to={link.path}
        end={link.path === '/'}
        onClick={onClose}
        className={({ isActive }) =>
          isActive || (link.also && pathname.startsWith(link.also))
            ? 'mobile-menu__link mobile-menu__link--active'
            : 'mobile-menu__link'
        }
      >
        <span className="mobile-menu__icon" style={{ '--icon': `url("${link.icon}")` }} aria-hidden="true" />
        <span className="mobile-menu__label">{link.label}</span>
        {badge ? (
          <span className="mobile-menu__badge" aria-label={`${badge} avisos nuevos`}>{badge}</span>
        ) : (
          <img src={chevronIcon} alt="" width="14" height="14" />
        )}
      </NavLink>
    );
  }

  return (
    <div className="mobile-menu">
      {/* Velo: oscurece la página y al pulsarlo se cierra el menú */}
      <div className="mobile-menu__overlay" onClick={onClose} />

      <div className="mobile-menu__drawer" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menú">
        <div className="mobile-menu__header">
          <Link className="mobile-menu__brand" to="/" onClick={onClose} aria-label="FutKingva, ir a Inicio">
            <img src={logo} alt="" width="30" height="30" />
            <span className="mobile-menu__title">FUTKINGVA</span>
          </Link>
          <button ref={closeButtonRef} className="mobile-menu__close" type="button" onClick={onClose} aria-label="Cerrar menú">
            <img src={closeIcon} alt="" width="22" height="22" />
          </button>
        </div>

        {user && (
          <Link className="mobile-menu__profile" to="/perfil" onClick={onClose}>
            <span className="mobile-menu__avatar">{user.initials}</span>
            <span className="mobile-menu__user">
              <span className="mobile-menu__user-name">{user.name}</span>
              <span className="mobile-menu__user-link">Ver mi perfil</span>
            </span>
          </Link>
        )}

        <nav className="mobile-menu__nav" aria-label="Menú principal">
          <div className="mobile-menu__group">
            {MAIN_LINKS.map((link) => renderLink(link))}
          </div>

          <p className="mobile-menu__heading">MI ZONA</p>
          <div className="mobile-menu__group mobile-menu__group--my-zone">
            {MY_ZONE_LINKS.map((link) => renderLink(link))}
            {user && renderLink({ label: 'Mi perfil', path: '/perfil', icon: userIcon }, user.notifications)}
          </div>
        </nav>

        <div className="mobile-menu__footer">
          {/* Cerrar sesión: pendiente de la sesión simulada */}
          {user && (
            <button className="mobile-menu__logout" type="button">
              <img src={logoutIcon} alt="" width="18" height="18" />
              Cerrar sesión
            </button>
          )}
          <div className="mobile-menu__extra-links">
            <Link className="mobile-menu__extra-link" to="/sobre-nosotros" onClick={onClose}>Sobre nosotros</Link>
            <Link className="mobile-menu__extra-link" to="/contacto" onClick={onClose}>Contacto</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
