import { Link } from 'react-router';

// Cabecera de cada bloque de Inicio: título, (opcional) etiqueta, línea que rellena el hueco y enlace «Ver todos →».
// En móvil algunos enlaces se acortan («Ver clasificación completa →» → «Ver →»): se pasa mobileLabel.
// Diseño: Figma › Mockups › 01 · Inicio › «Cabecera Partidos en juego» y similares
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20
export default function SectionHeader({ id, title, badge, to, linkLabel, mobileLabel }) {
  return (
    <div className="home-section-header">
      <h2 id={id} className="home-section-header__title">{title}</h2>
      {badge}
      <span className="home-section-header__line" aria-hidden="true" />
      {to && (
        <Link to={to} className="home-section-header__link">
          <span className={mobileLabel ? 'home__desktop' : undefined}>{linkLabel}</span>
          {mobileLabel && <span className="home__mobile">{mobileLabel}</span>}
        </Link>
      )}
    </div>
  );
}
