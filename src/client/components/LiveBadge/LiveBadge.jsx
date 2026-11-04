import './LiveBadge.css';

// Etiqueta roja «EN DIRECTO» con punto que late; si se pasa el minuto: «EN DIRECTO · 67'».
// Diseño: Figma › Guía de estilo › 3. Componentes › Indicadores › Badge/En directo
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-65
// Uso: <LiveBadge />  o  <LiveBadge minute={match.minute} />
export default function LiveBadge({ minute, className = '' }) {
  return (
    <span className={`live-badge ${className}`.trim()}>
      <span className="live-badge__dot" aria-hidden="true" />
      En directo{minute != null && ` · ${minute}'`}
    </span>
  );
}
