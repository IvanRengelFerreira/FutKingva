import { Link } from 'react-router';
import './Footer.css';
import logo from '../../assets/logo-footer.svg';
import logoMobile from '../../assets/logo-footer-mobile.svg';

// Pie de página: versión de escritorio y, por debajo de 800 px, versión móvil (en columna y centrada).
// Diseño: Figma › Mockups › Componentes de mockup › Pie y Pie móvil (en Figma se llaman así)
export default function Footer() {
  return (
    <footer className="footer">
      <Link className="footer__brand" to="/" aria-label="FutKingva, ir a Inicio">
        {/* En móvil el logo es el de 26 px */}
        <picture>
          <source media="(max-width: 799px)" srcSet={logoMobile} />
          <img className="footer__logo" src={logo} alt="" width="28" height="28" />
        </picture>
        <span className="footer__name">FUTKINGVA</span>
      </Link>

      <p className="footer__copyright">
        © 2026 FutKingva · Sistemas Web I<span className="footer__data-source"> · Datos: football-data.org</span>
      </p>

      <nav className="footer__links" aria-label="Enlaces del pie">
        <Link className="footer__link" to="/sobre-nosotros">Sobre nosotros</Link>
        <Link className="footer__link" to="/contacto">Contacto</Link>
      </nav>
    </footer>
  );
}
