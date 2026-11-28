import { useState } from 'react';
import './Avatar.css';

// A partir de este diámetro pedimos la variante «big» (300×390) en retratos de Transfermarkt para evitar pixelado
const HIGH_RES_MIN_SIZE = 64;

// Avatar de un jugador o de un usuario: muestra su retrato si tiene `src` válido y, si no existe o falla
// la carga de la imagen, cae automáticamente en el círculo con sus iniciales.
// Diseño: Figma › Mockups › 03 · Ficha de equipo › Avatar KM (32 px en la tabla, 44 px en la lista de móvil)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-359
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-556
// Uso:
//   <Avatar name={player.name} src={player.photoUrl} />             → retrato (o «KM» si no tiene foto)
//   <Avatar name="Pedri" size={44} />                               → un solo nombre → PE
//   <Avatar initials={user.initials} name={user.name} size={36} />  → iniciales que ya vienen en los datos
//   <Avatar name={player.name} src={player.photoUrl} color={team.color} size={34} /> → borde del club
// Va al lado del nombre, así que los lectores de pantalla lo saltan.
export default function Avatar({ name = '', initials, src, size = 32, color, className = '' }) {
  const [failedUrls, setFailedUrls] = useState([]);
  const preferredSrc = upgradePortraitUrl(src, size);
  const activeSrc = [preferredSrc, src].find((url) => url && !failedUrls.includes(url)) ?? null;

  const style = {
    '--avatar-size': `${size}px`,
    '--avatar-font-size': `${Math.round(size * 0.41)}px`,
  };
  if (color) style['--avatar-border'] = color; // Color del club (viene de los datos, no de colors.css)

  function handleError() {
    if (activeSrc) setFailedUrls((prev) => (prev.includes(activeSrc) ? prev : [...prev, activeSrc]));
  }

  return (
    <span className={`avatar ${className}`.trim()} style={style} title={name || undefined} aria-hidden="true">
      {activeSrc ? (
        <img
          className="avatar__img"
          src={activeSrc}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      ) : (
        (initials ?? getInitials(name))
      )}
    </span>
  );
}

function upgradePortraitUrl(url, size) {
  if (!url || size < HIGH_RES_MIN_SIZE) return url;
  return url.includes('/portrait/header/') ? url.replace('/portrait/header/', '/portrait/big/') : url;
}

// «Kylian Mbappé» → «KM» · «Trent Alexander-Arnold» → «TA» · «Pedri» → «PE»
function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
