import './Footer.css';
import logo from '../../assets/logo-footer.svg';

// Pie de página de escritorio.
// Diseño: Figma › Mockups › Componentes de mockup › Pie (en Figma se llama así)
export default function Footer() {
  return (
    <footer className="footer">
      <a className="footer__brand" href="#/" aria-label="FutKingva, ir a Inicio">
        <img className="footer__logo" src={logo} alt="" width="28" height="28" />
        <span className="footer__name">FUTKINGVA</span>
      </a>

      <p className="footer__copyright">© 2026 FutKingva · Sistemas Web I · Datos: football-data.org</p>

      <nav className="footer__links" aria-label="Enlaces del pie">
        <a className="footer__link" href="#/sobre-nosotros">Sobre nosotros</a>
        <a className="footer__link" href="#/contacto">Contacto</a>
      </nav>
    </footer>
  );
}
