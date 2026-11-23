import { Link } from 'react-router';

// Editar, ver (solo los publicados se pueden leer) y eliminar
export default function ArticleActions({ article, onRemove }) {
  const published = article.status === 'published';
  return (
    <div className="editor-dashboard__actions">
      <Link
        className="editor-dashboard__action editor-dashboard__action--edit"
        to={`/editor/articulo/${article.id}`}
        aria-label={`Editar «${article.title}»`}
        title="Editar"
      />
      {published ? (
        <Link
          className="editor-dashboard__action editor-dashboard__action--view"
          to={`/analisis/${article.id}`}
          aria-label={`Ver «${article.title}»`}
          title="Ver"
        />
      ) : (
        <button
          type="button"
          className="editor-dashboard__action editor-dashboard__action--view"
          disabled
          aria-label={`Ver «${article.title}» (todavía no está publicado)`}
          title="Todavía no está publicado"
        />
      )}
      <button
        type="button"
        className="editor-dashboard__action editor-dashboard__action--delete"
        onClick={() => onRemove(article)}
        aria-label={`Eliminar «${article.title}»`}
        title="Eliminar"
      />
    </div>
  );
}
