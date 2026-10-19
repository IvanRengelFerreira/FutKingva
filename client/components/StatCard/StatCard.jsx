import './StatCard.css';

// Indicador: cifra grande con su etiqueta debajo, dentro de una tarjeta.
// Diseño: Figma › Mockups › 03 · Ficha de equipo › Indicadores (4.º POSICIÓN, 18 PUNTOS, 19 GOLES A FAVOR…)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-231
// Uso (la página los pone en una rejilla: 6 en fila en escritorio, de 2 en 2 en móvil):
//   <StatCard value="4º" label="Posición" tone="gold" />
//   <StatCard value={18} label="Puntos" />
//   <StatCard value="6-0-2" label="V - E - D" />
//   <StatCard value={team.goalsFor} label="Goles a favor" tone="win" />
//   <StatCard value={team.goalsAgainst} label="Goles en contra" tone="loss" />
// tone (color de la cifra): 'default' (blanco), 'gold', 'win' (verde), 'loss' (rojo), 'info' (azul)
export default function StatCard({ value, label, tone = 'default', className = '' }) {
  return (
    <div className={`stat-card stat-card--${tone} ${className}`.trim()}>
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  );
}
