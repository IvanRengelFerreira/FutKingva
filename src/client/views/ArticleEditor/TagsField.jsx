import { useRef, useState } from 'react';

// Etiquetas del artículo: lista con × y botón «+ Añadir» que abre un campo de texto
export default function TagsField({ tags, onChange }) {
  const [newTag, setNewTag] = useState(null); // null = no se está escribiendo una etiqueta
  const cancelled = useRef(false); // Esc al escribir una etiqueta: no se añade al perder el foco

  function addTag(event) {
    event.preventDefault();
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const tag = newTag?.trim();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setNewTag(null);
  }

  function cancelOnEscape(event) {
    if (event.key !== 'Escape') return;
    cancelled.current = true;
    setNewTag(null);
  }

  return (
    <div className="article-editor__group">
      <span className="article-editor__label" id="tags-label">
        Etiquetas
      </span>
      <ul className="article-editor__chips" aria-labelledby="tags-label">
        {tags.map((tag) => (
          <li key={tag} className="article-editor__chip">
            {tag}
            <button
              type="button"
              className="article-editor__chip-remove"
              aria-label={`Quitar la etiqueta ${tag}`}
              onClick={() => onChange(tags.filter((item) => item !== tag))}
            />
          </li>
        ))}
        <li>
          {newTag === null ? (
            <button type="button" className="article-editor__add" onClick={() => setNewTag('')}>
              + Añadir
            </button>
          ) : (
            <form className="article-editor__add-form" onSubmit={addTag}>
              <input
                className="article-editor__add-input"
                aria-label="Nueva etiqueta"
                placeholder="Etiqueta + Enter"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onBlur={addTag}
                onKeyDown={cancelOnEscape}
                autoFocus
              />
            </form>
          )}
        </li>
      </ul>
    </div>
  );
}
