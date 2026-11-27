import Tag from '../../components/Tag/Tag.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import ArticleActions from './ArticleActions.jsx';
import { formatNumber } from './formatNumber.js';
import { numericDate } from '../../services/format.js';

// Fila de la tabla de escritorio. Fecha: la de publicación (o la programada); visitas solo de los publicados
export default function ArticleRow({ article, onRemove }) {
  return (
    <tr>
      <td className="editor-dashboard__article-title">{article.title}</td>
      <td>
        <Tag category={article.category} />
      </td>
      <td>
        <StatusBadge status={article.status} />
      </td>
      <td className="editor-dashboard__date">{numericDate(article.publishedAt) || '—'}</td>
      <td className="editor-dashboard__end editor-dashboard__visits">
        {article.status === 'published' ? formatNumber(article.views) : '—'}
      </td>
      <td className="editor-dashboard__end">
        <ArticleActions article={article} onRemove={onRemove} />
      </td>
    </tr>
  );
}
