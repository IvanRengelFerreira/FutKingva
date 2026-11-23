import Tag from '../../components/Tag/Tag.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import ArticleActions from './ArticleActions.jsx';
import { formatNumber } from './formatNumber.js';

// Fila de la tabla de escritorio
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
      <td className="editor-dashboard__date">{article.date ?? '—'}</td>
      <td className="editor-dashboard__end editor-dashboard__visits">{formatNumber(article.visits)}</td>
      <td className="editor-dashboard__end">
        <ArticleActions article={article} onRemove={onRemove} />
      </td>
    </tr>
  );
}
