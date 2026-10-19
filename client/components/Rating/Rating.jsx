import './Rating.css';

// Valoración de un jugador dentro de un hexágono (como el logo).
// Color según la nota: oro ≥ 8 · verde 7–8 · gris 6–7 · rojo < 6.
// Diseño: Figma › Guía de estilo › 3. Componentes › Indicadores › Valoración
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-79
// Uso: se le pasa «rating» tal cual viene en PLAYERS (mockData.js); se escribe con coma (8,1)
//   <Rating value={8.1} />              → md: 37 px de alto (lista de móvil, tarjetas)
//   <Rating value={player.rating} size="sm" />   → 32 px (tablas, como la plantilla de la ficha de equipo)
//   <Rating value={9.1} size="lg" />    → 52 px (destacados, guía de estilo)
// Si el jugador no tiene valoración (undefined), no pinta nada.
export default function Rating({ value, size = 'md', className = '' }) {
  if (value == null) return null;

  const text = value.toFixed(1).replace('.', ',');

  return (
    <span
      className={`rating rating--${size} rating--${getTone(value)} ${className}`.trim()}
      role="img"
      aria-label={`Valoración ${text}`}
    >
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

function getTone(value) {
  if (value >= 8) return 'gold';
  if (value >= 7) return 'win';
  if (value >= 6) return 'draw';
  return 'loss';
}
