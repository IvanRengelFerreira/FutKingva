import { getTeam } from '../../data/mockData.js';
import './Crest.css';

// Escudo de un equipo: círculo con las siglas y el borde del color del club (la web no usa escudos reales).
// El fondo es el color del club al 16 %. Sirve para cualquier tamaño: las siglas crecen con el círculo.
// Diseño: Figma › Mockups › 03 · Ficha de equipo (escudo grande) y 05 · Clasificaciones (escudo de la tabla)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-194
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-367
// Uso: se le pasa el id del equipo tal cual viene en mockData.js
//   <Crest teamId="real-madrid" />              → 28 px (tablas)
//   <Crest teamId={match.homeId} size={36} />   → tarjetas de partido, próximos partidos
//   <Crest teamId="real-madrid" size={128} />   → cabecera de la ficha de equipo
// Va al lado del nombre del equipo, así que los lectores de pantalla lo saltan.
// Si va solo (sin el nombre al lado), pasa labelled para que lean el nombre del equipo.
export default function Crest({ teamId, size = 28, labelled = false, className = '' }) {
  const team = getTeam(teamId);
  const code = team?.code ?? '?';

  const style = {
    '--crest-size': `${size}px`,
    '--crest-font-size': `${Math.round(size * 0.38)}px`,
    '--crest-border': size >= 64 ? '2px' : '1.5px',
  };
  if (team) style['--crest-color'] = team.color; // Color del club (viene de los datos, no de colors.css)

  return (
    <span
      className={`crest ${className}`.trim()}
      style={style}
      title={team?.name}
      {...(labelled ? { role: 'img', 'aria-label': team?.name ?? 'Equipo desconocido' } : { 'aria-hidden': true })}
    >
      {code}
    </span>
  );
}
