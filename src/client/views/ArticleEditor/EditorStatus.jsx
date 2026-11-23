const WORDS_PER_MINUTE = 200;

const SAVE_TEXTS = {
  new: 'Artículo nuevo sin guardar',
  'saved-before': 'Guardado automáticamente hace 1 min',
  saving: 'Guardando…',
  saved: 'Guardado automáticamente',
};

// Pie del editor: estado de guardado y recuento de palabras
export default function EditorStatus({ saveState, words }) {
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return (
    <div className="article-editor__status">
      <span className={`article-editor__saved${saveState === 'new' ? ' article-editor__saved--new' : ''}`}>
        {saveState !== 'new' && saveState !== 'saving' && <span className="article-editor__check" aria-hidden="true" />}
        {SAVE_TEXTS[saveState]}
      </span>
      <span className="article-editor__count">
        {words} {words === 1 ? 'palabra' : 'palabras'} · {minutes} min
      </span>
    </div>
  );
}
