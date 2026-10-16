import './Navbar.css';
import logo from '../../assets/logo.svg';
import searchIcon from '../../assets/icon-search.svg';

// Enlaces del menú principal (mismo orden que en Figma).
// Las rutas usan # para que funcionen sin servidor; se conectarán con el router más adelante.
const LINKS = [
  { label: 'Inicio', path: '#/' },
  { label: 'Equipos y jugadores', path: '#/equipos' },
  { label: 'Clasificaciones', path: '#/clasificaciones' },
  { label: 'Árbitros', path: '#/arbitros' },
  { label: 'Análisis', path: '#/analisis' },
  { label: 'Comparador', path: '#/comparador' },
  { label: 'Mi equipo ideal', path: '#/equipo-ideal' },
];

// Navbar de escritorio (Sesión=No).
// Diseño: Figma › Mockups › Componentes de mockup › Cabecera (en Figma se llama así) › Sesión=No
export default function Navbar() {
  return (
    <header className="navbar">
      <a className="navbar__brand" href="#/" aria-label="FutKingva, ir a Inicio">
        <img className="navbar__logo" src={logo} alt="" width="36" height="36" />
        <span className="navbar__name">
          <span className="navbar__title">FUTKINGVA</span>
          <span className="navbar__subtitle">FOOTBALL STATS</span>
        </span>
      </a>

      <nav className="navbar__menu" aria-label="Menú principal">
        {LINKS.map((link) => (
          <a key={link.path} className="navbar__link" href={link.path}>
            {link.label}
          </a>
        ))}
      </nav>

      <div className="navbar__actions">
        <form className="navbar__search" role="search" onSubmit={(e) => e.preventDefault()}>
          <img src={searchIcon} alt="" width="18" height="18" />
          <input type="search" placeholder="Buscar…" aria-label="Buscar equipos y jugadores" />
        </form>
        <a className="navbar__button navbar__button--secondary" href="#/acceso">Iniciar sesión</a>
        <a className="navbar__button navbar__button--primary" href="#/acceso?registro">Registrarse</a>
      </div>
    </header>
  );
}
