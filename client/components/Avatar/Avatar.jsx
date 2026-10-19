import './Avatar.css';

// Avatar de un jugador o de un usuario: círculo con sus iniciales (la web no usa fotos).
// Diseño: Figma › Mockups › 03 · Ficha de equipo › Avatar KM (32 px en la tabla, 44 px en la lista de móvil)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-359
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-556
// Uso:
//   <Avatar name={player.name} />               → «Kylian Mbappé» → KM (32 px)
//   <Avatar name="Pedri" size={44} />            → un solo nombre → PE
//   <Avatar initials={user.initials} name={user.name} size={36} />   → iniciales que ya vienen en los datos
// Va al lado del nombre, así que los lectores de pantalla lo saltan.
export default function Avatar({ name = '', initials, size = 32, className = '' }) {
  const style = {
    '--avatar-size': `${size}px`,
    '--avatar-font-size': `${Math.round(size * 0.41)}px`,
  };

  return (
    <span className={`avatar ${className}`.trim()} style={style} title={name || undefined} aria-hidden="true">
      {initials ?? getInitials(name)}
    </span>
  );
}

// «Kylian Mbappé» → «KM» · «Trent Alexander-Arnold» → «TA» · «Pedri» → «PE»
function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
