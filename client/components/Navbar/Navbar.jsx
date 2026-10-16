import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import './Navbar.css';
import logo from '../../assets/logo.svg';
import searchIcon from '../../assets/icon-search.svg';

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

// Navbar de escritorio (Sesión=No).
// Diseño: Figma › Mockups › Componentes de mockup › Cabecera (en Figma se llama así) › Sesión=No
export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Al pulsar Enter en el buscador se va a Resultados de búsqueda con el texto en la dirección (?q=…).
  function handleSearch(e) {
    e.preventDefault();
    const query = e.currentTarget.elements.q.value.trim();
    if (query) navigate(`/buscar?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="navbar">
      <Link className="navbar__brand" to="/" aria-label="FutKingva, ir a Inicio">
        <img className="navbar__logo" src={logo} alt="" width="36" height="36" />
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
        <form className="navbar__search" role="search" onSubmit={handleSearch}>
          <img src={searchIcon} alt="" width="18" height="18" />
          <input type="search" name="q" placeholder="Buscar…" aria-label="Buscar equipos y jugadores" />
        </form>
        <Link className="navbar__button navbar__button--secondary" to="/acceso">Iniciar sesión</Link>
        <Link className="navbar__button navbar__button--primary" to="/acceso?registro">Registrarse</Link>
      </div>
    </header>
  );
}
