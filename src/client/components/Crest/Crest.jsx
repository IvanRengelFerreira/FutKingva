import { useState } from 'react';
import './Crest.css';

// Escudo de un equipo: muestra la imagen oficial del club (`crestUrl`) si está disponible y, como respaldo,
// pinta el círculo con las siglas y el borde del color del club.
// Diseño: Figma › Mockups › 03 · Ficha de equipo (escudo grande) y 05 · Clasificaciones (escudo de la tabla)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-194
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-367
// Uso:
//   <Crest team={row.team} />                   → equipo de la API ({ name, code, color, crestUrl }), 28 px
//   <Crest team={team} size={128} />            → cabecera de la ficha de equipo
// Va al lado del nombre del equipo, así que los lectores de pantalla lo saltan.
// Si va solo (sin el nombre al lado), pasa labelled para que lean el nombre del equipo.
export default function Crest({ team, size = 28, labelled = false, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const code = team?.code ?? '?';
  const src = team?.crestUrl ?? null;
  const showImage = Boolean(src) && failedSrc !== src;

  const style = {
    '--crest-size': `${size}px`,
    '--crest-font-size': `${Math.round(size * 0.38)}px`,
    '--crest-border': size >= 64 ? '2px' : '1.5px',
  };
  if (team?.color) style['--crest-color'] = team.color; // Color del club (viene de los datos, no de colors.css)

  const classes = ['crest', showImage && 'crest--image', className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      style={style}
      title={team?.name}
      {...(labelled ? { role: 'img', 'aria-label': team?.name ?? 'Equipo desconocido' } : { 'aria-hidden': true })}
    >
      {showImage ? (
        <img
          className="crest__img"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        code
      )}
    </span>
  );
}
