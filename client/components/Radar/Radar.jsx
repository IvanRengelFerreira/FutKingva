import './Radar.css';

// Gráfico radar hexagonal: un área de color por jugador (oro, azul y violeta, como en el comparador).
// Diseño: Figma › Mockups › 10 · Comparador › Gráfico radar
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=54-623
// Uso:
//   <Radar
//     label="Comparativa de Pedri, Bellingham y Yamal"
//     axes={[{ id: 'goals', label: 'Goles', max: 6 }, { id: 'assists', label: 'Asistencias', max: 6 }, …]}
//     series={[{ name: 'Pedri', values: { goals: 2, assists: 4, … } }, …]}
//   />
// Cada eje va de su «min» (centro, 0 si no se indica) a su «max» (borde). El primer eje va arriba y el resto en el sentido del reloj.
// Los colores salen del orden de los jugadores: --series-1 a --series-4 (máximo 4, como en el comparador).

const SIZE = 400;          // El dibujo se hace en 400 × 400 y se escala al ancho disponible
const CENTER = SIZE / 2;
const RADIUS = 136;        // Radio del hexágono exterior
const LABEL_RADIUS = 158;  // Distancia de los nombres de los ejes
const RINGS = 4;           // Hexágonos de guía

// Punto a una distancia del centro sobre el eje «index» (el 0 arriba)
function pointAt(index, count, distance) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return [CENTER + distance * Math.cos(angle), CENTER + distance * Math.sin(angle)];
}

const toPoints = (points) => points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

export default function Radar({ axes, series, label, className = '' }) {
  const count = axes.length;

  const rings = Array.from({ length: RINGS }, (_, i) => (RADIUS * (RINGS - i)) / RINGS);

  const areas = series.map((player) =>
    axes.map((axis, i) => {
      const min = axis.min ?? 0;
      const ratio = Math.min(Math.max(((player.values[axis.id] ?? min) - min) / (axis.max - min), 0), 1);
      return pointAt(i, count, RADIUS * ratio);
    }),
  );

  // Texto para lectores de pantalla: «Pedri: Goles 2, Asistencias 4…»
  const summary = [
    label,
    ...series.map((player) => `${player.name}: ${axes.map((axis) => `${axis.label} ${(player.values[axis.id] ?? 0).toLocaleString('es-ES')}`).join(', ')}`),
  ].filter(Boolean).join('. ');

  return (
    <figure className={`radar ${className}`.trim()}>
      <svg className="radar__chart" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={summary}>
        {/* Guía: hexágonos y ejes */}
        {rings.map((distance, i) => (
          <polygon
            key={distance}
            className={`radar__ring${i === 0 ? ' radar__ring--outer' : ''}`}
            points={toPoints(axes.map((_, axisIndex) => pointAt(axisIndex, count, distance)))}
          />
        ))}
        {axes.map((axis, i) => {
          const [x, y] = pointAt(i, count, RADIUS);
          return <line key={axis.id} className="radar__axis" x1={CENTER} y1={CENTER} x2={x} y2={y} />;
        })}

        {/* Nombres de los ejes */}
        {axes.map((axis, i) => {
          const [x, y] = pointAt(i, count, LABEL_RADIUS);
          return (
            <text key={axis.id} className="radar__label" x={x} y={y}>
              {axis.label}
            </text>
          );
        })}

        {/* Un área por jugador, con un punto en cada eje */}
        {areas.map((points, i) => (
          <g key={series[i].name} className={`radar__series radar__series--${i + 1}`}>
            <polygon className="radar__area" points={toPoints(points)} />
            {points.map(([x, y], axisIndex) => (
              <circle key={axes[axisIndex].id} className="radar__dot" cx={x} cy={y} r="3.5" />
            ))}
          </g>
        ))}
      </svg>

      {/* Leyenda: qué color es cada jugador */}
      <figcaption className="radar__legend">
        {series.map((player, i) => (
          <span key={player.name} className={`radar__legend-item radar__series--${i + 1}`}>
            {player.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
