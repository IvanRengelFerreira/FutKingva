import './FormGuide.css';

// Forma: los últimos resultados de un equipo en cuadraditos V (verde), E (gris) y D (rojo).
// Diseño: Figma › Guía de estilo › 3. Componentes › Indicadores › Forma
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-68
// Uso: se le pasa «form» tal cual viene en STANDINGS_LALIGA (mockData.js), el más reciente al final
//   <FormGuide form="VVEDV" />              → 24 px (cabecera de la ficha de equipo, guía de estilo)
//   <FormGuide form={row.form} size={22} /> → tabla de clasificación
//   <FormGuide form={row.form} size={20} /> → móvil
// Un solo resultado (p. ej. en «Últimos resultados»): <FormGuide form="V" size={20} />
const RESULTS = {
  V: { tone: 'win', label: 'Victoria' },
  E: { tone: 'draw', label: 'Empate' },
  D: { tone: 'loss', label: 'Derrota' },
};

export default function FormGuide({ form = '', size = 24, className = '' }) {
  const results = form.split('').map((letter) => ({ letter, ...(RESULTS[letter] ?? RESULTS.E) }));
  const label = results.length === 1
    ? results[0].label
    : `Últimos ${results.length} resultados: ${results.map((r) => r.label.toLowerCase()).join(', ')}`;

  const style = {
    '--form-size': `${size}px`,
    '--form-font-size': `${Math.max(9, Math.min(12, Math.round(size * 0.55)))}px`,
    '--form-radius': size >= 24 ? '6px' : '5px',
  };

  return (
    <span className={`form-guide ${className}`.trim()} style={style} role="img" aria-label={label}>
      {results.map((result, i) => (
        <span key={i} className={`form-guide__result form-guide__result--${result.tone}`} aria-hidden="true">
          {result.letter}
        </span>
      ))}
    </span>
  );
}
