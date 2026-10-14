import './Navbar.css';
import logo from '../../assets/logo.svg';
import iconoBuscar from '../../assets/icono-buscar.svg';

// Enlaces del menú principal (mismo orden que en Figma).
// Las rutas usan # para que funcionen sin servidor; se conectarán con el router más adelante.
const ENLACES = [
  { texto: 'Inicio', ruta: '#/' },
  { texto: 'Equipos y jugadores', ruta: '#/equipos' },
  { texto: 'Clasificaciones', ruta: '#/clasificaciones' },
  { texto: 'Árbitros', ruta: '#/arbitros' },
  { texto: 'Análisis', ruta: '#/analisis' },
  { texto: 'Comparador', ruta: '#/comparador' },
  { texto: 'Mi equipo ideal', ruta: '#/equipo-ideal' },
];

// Navbar de escritorio (Sesión=No).
// Diseño: Figma › Mockups › Componentes de mockup › Cabecera (en Figma se llama así) › Sesión=No
export default function Navbar() {
  return (
    <header className="navbar">
      <a className="navbar__marca" href="#/" aria-label="FutKingva, ir a Inicio">
        <img className="navbar__logo" src={logo} alt="" width="36" height="36" />
        <span className="navbar__nombre">
          <span className="navbar__titulo">FUTKINGVA</span>
          <span className="navbar__subtitulo">FOOTBALL STATS</span>
        </span>
      </a>

      <nav className="navbar__menu" aria-label="Menú principal">
        {ENLACES.map((enlace) => (
          <a key={enlace.ruta} className="navbar__enlace" href={enlace.ruta}>
            {enlace.texto}
          </a>
        ))}
      </nav>

      <div className="navbar__acciones">
        <form className="navbar__buscador" role="search" onSubmit={(e) => e.preventDefault()}>
          <img src={iconoBuscar} alt="" width="18" height="18" />
          <input type="search" placeholder="Buscar…" aria-label="Buscar equipos y jugadores" />
        </form>
        <a className="navbar__boton navbar__boton--secundario" href="#/acceso">Iniciar sesión</a>
        <a className="navbar__boton navbar__boton--primario" href="#/acceso?registro">Registrarse</a>
      </div>
    </header>
  );
}
