import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import './Navbar.css';
import MobileMenu from '../MobileMenu/MobileMenu.jsx';
import UserMenu from './UserMenu.jsx';
import { DESKTOP_QUERY } from './breakpoints.js';
import { useSession } from '../../context/SessionContext.jsx';
import logo from '../../assets/logo.svg';
import logoMobile from '../../assets/logo-mobile.svg';
import searchIcon from '../../assets/icon-search.svg';
import searchIconLight from '../../assets/icon-search-light.svg';
import menuIcon from '../../assets/icon-menu.svg';
import bellIcon from '../../assets/icon-bell.svg';

// Enlaces del menú principal (mismo orden que en Figma).
// Las rutas están definidas en App.jsx.
// «also»: otras rutas que también marcan el enlace como activo (la ficha de jugador es de esa sección).
const LINKS = [
  { label: 'Inicio', path: '/' },
  { label: 'Equipos y jugadores', path: '/equipos', also: '/jugadores' },
  { label: 'Clasificaciones', path: '/clasificaciones' },
  { label: 'Árbitros', path: '/arbitros' },
  { label: 'Análisis', path: '/analisis' },
  { label: 'Comparador', path: '/comparador' },
  { label: 'Mi equipo ideal', path: '/equipo-ideal' },
];

// Navbar: versión de escritorio y, por debajo de 1440 px, versión móvil con ☰.
// Sin sesión: «Iniciar sesión» y «Registrarse». Con sesión: campana y usuario (sesión simulada, ver SessionContext).
// Diseño: Figma › Mockups › Componentes de mockup › Cabecera y Cabecera móvil (en Figma se llaman así) › Sesión=No / Sesión=Sí
export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // Al cerrar el menú, el foco vuelve al botón ☰.
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Si la ventana se agranda hasta el tamaño de escritorio con el menú abierto, se cierra.
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    function handleChange(e) {
      if (e.matches) setMenuOpen(false);
    }
    desktop.addEventListener('change', handleChange);
    return () => desktop.removeEventListener('change', handleChange);
  }, []);

  // Al pulsar Enter en el buscador se va a Resultados de búsqueda con el texto en la dirección (?q=…).
  function handleSearch(e) {
    e.preventDefault();
    const query = e.currentTarget.elements.q.value.trim();
    if (query) navigate(`/buscar?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="navbar">
      {/* Solo en móvil: abre el menú lateral */}
      <button
        ref={menuButtonRef}
        className="navbar__menu-button"
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
      >
        <img src={menuIcon} alt="" width="22" height="22" />
      </button>

      <Link className="navbar__brand" to="/" aria-label="FutKingva, ir a Inicio">
        {/* En móvil el logo es el de 30 px */}
        <picture>
          <source media="(max-width: 1439px)" srcSet={logoMobile} />
          <img className="navbar__logo" src={logo} alt="" width="36" height="36" />
        </picture>
        <span className="navbar__name">
          <span className="navbar__title">FUTKINGVA</span>
          <span className="navbar__subtitle">FOOTBALL STATS</span>
        </span>
      </Link>

      <nav className="navbar__menu" aria-label="Menú principal">
        {/* NavLink marca el enlace de la página actual («end» en Inicio para que no se marque siempre) */}
        {LINKS.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/'}
            className={({ isActive }) =>
              isActive || (link.also && pathname.startsWith(link.also))
                ? 'navbar__link navbar__link--active'
                : 'navbar__link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="navbar__actions">
        <form className={user ? 'navbar__search navbar__search--wide' : 'navbar__search'} role="search" onSubmit={handleSearch}>
          <img src={searchIcon} alt="" width="18" height="18" />
          <input type="search" name="q" placeholder="Buscar…" aria-label="Buscar equipos y jugadores" />
        </form>

        {/* Solo en móvil: lupa (lleva a Resultados de búsqueda) */}
        <Link className="navbar__search-link" to="/buscar" aria-label="Buscar">
          <img src={searchIconLight} alt="" width="18" height="18" />
        </Link>

        {user ? (
          <>
            {/* El panel de avisos se abrirá aquí cuando esté el componente Notifications */}
            <button className="navbar__bell" type="button" aria-label={`Notificaciones: ${user.notifications} nuevas`}>
              <img src={bellIcon} alt="" width="28" height="28" />
            </button>
            <UserMenu user={user} />
            {/* Solo en móvil: el avatar lleva a Mi perfil */}
            <Link className="navbar__avatar navbar__mobile-only" to="/perfil" aria-label="Mi perfil">{user.initials}</Link>
          </>
        ) : (
          <>
            <Link className="navbar__button navbar__button--secondary navbar__desktop-only" to="/acceso">Iniciar sesión</Link>
            <Link className="navbar__button navbar__button--primary navbar__desktop-only" to="/acceso?registro">Registrarse</Link>
            {/* Solo en móvil */}
            <Link className="navbar__button navbar__button--secondary navbar__mobile-only" to="/acceso">Entrar</Link>
          </>
        )}
      </div>

      <MobileMenu open={menuOpen} onClose={closeMenu} user={user} />
    </header>
  );
}
