import './BarChart.css';

// Gráfico de barras por jornada, con líneas de guía y línea de media opcionales.
// Diseño: Figma › Mockups › 04 · Ficha de jugador (rendimiento), 07 · Ficha de árbitro (tarjetas)
// y 09 · Artículo (pase por jornada)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=45-221
//
// Cada barra: { label: 'J1', value: 7.4, tone: 'gold' }
//   tone (color): 'gold' (oro), 'gold-soft' (oro suave), 'win' (verde), 'yellow-card', 'red-card'
//   Barra apilada: { label: 'J3', segments: [{ value: 4, tone: 'yellow-card' }, { value: 1, tone: 'red-card' }] }
//   (los segmentos van de abajo arriba; encima se escribe el total)
//
// Uso (ficha de Pedri):
//   <BarChart
//     label="Valoración de Pedri por jornada"
//     data={[{ label: 'J1', value: 7.4, tone: 'win' }, { label: 'J2', value: 8.2, tone: 'gold-soft' }, …]}
//     min={6} max={9} gridSteps={3} average={8.1} decimals={1}
//   />
//
// Props:
//   min, max     Valores del borde inferior y superior del gráfico (max: por defecto, el mayor valor)
//   height       Alto de la zona de barras en px (240 por defecto)
//   gridSteps    Número de tramos entre líneas de guía (0 = sin líneas)
//   average      Valor de la línea de media discontinua; averageTone: 'gold' o 'neutral'
//   decimals     Decimales de las cifras (8 → «8,0» con decimals={1})
//   barWidth     Ancho máximo de cada barra en px (56 por defecto)
export default function BarChart({
  data,
  label,
  min = 0,
  max,
  height = 240,
  gridSteps = 0,
  average,
  averageTone = 'gold',
  decimals,
  barWidth = 56,
  className = '',
}) {
  const bars = data.map((item) => {
    const segments = item.segments ?? [{ value: item.value, tone: item.tone }];
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    return { ...item, segments, total };
  });
  const top = max ?? Math.max(...bars.map((bar) => bar.total));
  const range = top - min || 1;

  // Altura en % de la zona de barras (recortada para no salirse)
  const percent = (value) => Math.min(Math.max(((value - min) / range) * 100, 0), 100);
  const format = (value) =>
    value.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals ?? 2 });

  const gridLines = Array.from({ length: gridSteps > 0 ? gridSteps + 1 : 0 }, (_, i) => (i / gridSteps) * 100);

  // Texto para lectores de pantalla: «J1: 7,4; J2: 8,2…»
  const summary = `${label ? `${label}. ` : ''}${bars.map((bar) => `${bar.label}: ${format(bar.total)}`).join('; ')}`;

  return (
    <div
      className={`bar-chart ${className}`.trim()}
      role="img"
      aria-label={summary}
      style={{ '--bar-chart-height': `${height}px`, '--bar-chart-bar-width': `${barWidth}px` }}
    >
      <div className="bar-chart__plot">
        {gridLines.map((position) => (
          <span key={position} className="bar-chart__grid-line" style={{ bottom: `${position}%` }} />
        ))}

        {average != null && (
          <span
            className={`bar-chart__average bar-chart__average--${averageTone}`}
            style={{ bottom: `${percent(average)}%` }}
          />
        )}

        {bars.map((bar) => (
          <div key={bar.label} className="bar-chart__column">
            <div className="bar-chart__bar" style={{ height: `${percent(bar.total)}%` }}>
              <span className="bar-chart__value">{format(bar.total)}</span>
              <div className="bar-chart__fill">
                {bar.segments.map((segment, i) => (
                  <span
                    key={i}
                    className={`bar-chart__segment bar-chart__segment--${segment.tone ?? 'gold'}`}
                    style={{ flexGrow: segment.value }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bar-chart__labels" aria-hidden="true">
        {bars.map((bar) => (
          <span key={bar.label}>{bar.label}</span>
        ))}
      </div>
    </div>
  );
}
