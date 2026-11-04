import './CardCount.css';

// Tarjeta amarilla o roja dibujada (rectángulo un poco girado) con su número al lado: ▮ 5
// La usan 06 · Árbitros (móvil) y 07 · Ficha de árbitro (tabla de partidos).
// Diseño: Figma › Mockups › 07 · Ficha de árbitro › columna «Tarjetas»
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-867
// Uso: <CardCount color="yellow" value={5} />  ·  <CardCount color="red" value={1} />
//      <CardCount color="yellow" value="5,8/p" label="5,8 tarjetas por partido" />
export default function CardCount({ color, value, label }) {
  const text = label ?? `${value} ${color === 'yellow' ? 'amarillas' : 'rojas'}`;
  return (
    <span className="card-count" aria-label={text}>
      <span className={`card-count__card card-count__card--${color}`} aria-hidden="true" />
      <span aria-hidden="true">{value}</span>
    </span>
  );
}
