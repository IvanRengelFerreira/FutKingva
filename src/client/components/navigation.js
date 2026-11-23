// Enlaces del menú principal, compartidos por la Navbar y el MobileMenu (mismo orden que en Figma).
// Las rutas están definidas en App.jsx.
// «also»: otras rutas que también marcan el enlace como activo (la ficha de jugador es de esa sección).

// Secciones públicas
export const MAIN_LINKS = [
  { label: 'Inicio', path: '/' },
  { label: 'Equipos y jugadores', path: '/equipos', also: '/jugadores' },
  { label: 'Clasificaciones', path: '/clasificaciones' },
  { label: 'Árbitros', path: '/arbitros' },
  { label: 'Análisis', path: '/analisis' },
];

// Secciones de «Mi zona»
export const MY_ZONE_LINKS = [
  { label: 'Comparador', path: '/comparador' },
  { label: 'Mi equipo ideal', path: '/equipo-ideal' },
];

// Clase de un enlace de navegación: «<base>» o «<base> <base>--active» si es la página actual.
// Se usa como className de NavLink: className={navLinkClass('navbar__link', link, pathname)}
export function navLinkClass(base, link, pathname) {
  return ({ isActive }) =>
    isActive || (link.also && pathname.startsWith(link.also)) ? `${base} ${base}--active` : base;
}
