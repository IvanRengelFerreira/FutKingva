import './StatusBadge.css';

// Estado de un artículo (Publicado, Programado, Borrador) o de una cuenta (Activo, Bloqueado),
// con un punto de color delante.
// Diseño: Figma › Mockups › 17 · Panel de editor y 20 · Panel de administración › «Estado PUBLICADO»…
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1226
// Uso: se le pasa el «status» tal cual viene en mockData.js
//   <StatusBadge status={article.status} />   → 'published' | 'scheduled' | 'draft'
//   <StatusBadge status={user.status} />      → 'active' | 'blocked'
const STATUSES = {
  published: { label: 'Publicado', tone: 'win' },
  scheduled: { label: 'Programado', tone: 'info' },
  draft: { label: 'Borrador', tone: 'draw' },
  active: { label: 'Activo', tone: 'win' },
  blocked: { label: 'Bloqueado', tone: 'loss' },
};

export default function StatusBadge({ status, className = '' }) {
  const { label, tone } = STATUSES[status] ?? { label: status, tone: 'draw' };

  return (
    <span className={`status-badge status-badge--${tone} ${className}`.trim()}>
      <span className="status-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
