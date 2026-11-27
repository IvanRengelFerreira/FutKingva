import { Link } from 'react-router';
import Tag from '../../components/Tag/Tag.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import { formatNumber } from './formatNumber.js';
import { numericDate } from '../../services/format.js';

// Tarjeta móvil: sin botón «Ver»
export default function ArticleCard({ article, onRemove }) {
  return (
    <li className="editor-dashboard__card">
      <div className="editor-dashboard__card-top">
        <Tag category={article.category} />
        <StatusBadge status={article.status} />
        <Link
          className="editor-dashboard__action editor-dashboard__action--edit editor-dashboard__card-edit"
          to={`/editor/articulo/${article.id}`}
          aria-label={`Editar «${article.title}»`}
        />
        <button
          type="button"
          className="editor-dashboard__action editor-dashboard__action--delete"
          onClick={() => onRemove(article)}
          aria-label={`Eliminar «${article.title}»`}
          title="Eliminar"
        />
      </div>
      <p className="editor-dashboard__article-title">{article.title}</p>
      <p className="editor-dashboard__card-meta">
        {numericDate(article.publishedAt) || '—'} · {article.status === 'published' ? formatNumber(article.views) : '—'}{' '}
        visitas
      </p>
    </li>
  );
}
