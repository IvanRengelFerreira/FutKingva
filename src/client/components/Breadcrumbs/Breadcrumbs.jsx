import { Link } from 'react-router';
import './Breadcrumbs.css';

// Migas de pan: ruta hasta la página actual («Equipos y jugadores / LaLiga / Real Madrid»).
// Todas son enlaces menos la última, que es la página en la que estás.
// Diseño: Figma › Mockups › 03 · Ficha de equipo › Migas
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-187
// Uso:
//   <Breadcrumbs
//     items={[
//       { label: 'Equipos y jugadores', to: '/equipos' },
//       { label: 'LaLiga', to: '/clasificaciones' },
//       { label: team.name },                        → la última, sin «to»
//     ]}
//   />
// En móvil el mockup acorta la ruta («Equipos / Real Madrid»): la página pasa la lista que quiera,
// o usa «shortLabel» en un elemento para que en móvil salga ese texto: { label: 'Equipos y jugadores', shortLabel: 'Equipos', to: '/equipos' }
// y «hideOnMobile: true» para quitar un paso en móvil.
export default function Breadcrumbs({ items, className = '' }) {
  return (
    <nav className={`breadcrumbs ${className}`.trim()} aria-label="Migas de pan">
      <ol className="breadcrumbs__list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const text = item.shortLabel ? (
            <>
              <span className="breadcrumbs__long">{item.label}</span>
              <span className="breadcrumbs__short">{item.shortLabel}</span>
            </>
          ) : (
            item.label
          );

          return (
            <li
              key={`${item.label}-${i}`}
              className={`breadcrumbs__item ${item.hideOnMobile ? 'breadcrumbs__item--desktop' : ''}`.trim()}
            >
              {isLast || !item.to ? (
                <span className={isLast ? 'breadcrumbs__current' : undefined} aria-current={isLast ? 'page' : undefined}>
                  {text}
                </span>
              ) : (
                <Link className="breadcrumbs__link" to={item.to}>{text}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
