import { Link } from 'react-router';
import './Footer.css';
import logo from '../../assets/logo-footer.svg';

// Pie de página de escritorio.
// Diseño: Figma › Mockups › Componentes de mockup › Pie (en Figma se llama así)
export default function Footer() {
  return (
    <footer className="footer">
      <Link className="footer__brand" to="/" aria-label="FutKingva, ir a Inicio">
        <img className="footer__logo" src={logo} alt="" width="28" height="28" />
        <span className="footer__name">FUTKINGVA</span>
      </Link>

      <p className="footer__copyright">© 2026 FutKingva · Sistemas Web I · Datos: football-data.org</p>

      <nav className="footer__links" aria-label="Enlaces del pie">
        <Link className="footer__link" to="/sobre-nosotros">Sobre nosotros</Link>
        <Link className="footer__link" to="/contacto">Contacto</Link>
      </nav>
    </footer>
  );
}
