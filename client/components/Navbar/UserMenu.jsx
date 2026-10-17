import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ROLE_PANELS, useSession } from '../../context/SessionContext.jsx';
import { DESKTOP_QUERY } from './breakpoints.js';
import chevronDownIcon from '../../assets/icon-chevron-down.svg';

// Usuario de la navbar de escritorio (avatar + nombre + ▾) con su desplegable.
// Diseño del botón: Figma › Componentes de mockup › Cabecera › Sesión=Sí › Usuario.
// El desplegable no está en Figma: sigue el estilo del panel de notificaciones.
export default function UserMenu({ user }) {
  const { logout } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const panel = ROLE_PANELS[user.role];

  // Mientras está abierto, se cierra al pulsar fuera, con Esc o al pasar a móvil
  // (si no, al volver a escritorio aparecería abierto sin haberlo pulsado).
  useEffect(() => {
    if (!open) return;

    const desktop = window.matchMedia(DESKTOP_QUERY);
    function handleBreakpoint(e) {
      if (!e.matches) setOpen(false);
    }

    function handleClickOutside(e) {
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    desktop.addEventListener('change', handleBreakpoint);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      desktop.removeEventListener('change', handleBreakpoint);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/');
  }

  return (
    <div className="user-menu navbar__desktop-only" ref={menuRef}>
      <button
        className="user-menu__button"
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="navbar__avatar">{user.initials}</span>
        <span className="user-menu__name">{user.name}</span>
        <img src={chevronDownIcon} alt="" width="14" height="14" />
      </button>

      {open && (
        <div className="user-menu__dropdown" role="menu">
          <Link className="user-menu__item" to="/perfil" role="menuitem" onClick={() => setOpen(false)}>Mi perfil</Link>
          {panel && (
            <Link className="user-menu__item" to={panel.path} role="menuitem" onClick={() => setOpen(false)}>{panel.label}</Link>
          )}
          <button className="user-menu__item user-menu__item--danger" type="button" role="menuitem" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
