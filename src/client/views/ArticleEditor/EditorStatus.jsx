import { WORDS_PER_MINUTE } from '../../../shared/validation/article.js';
import { numericDate, shortTime } from '../../services/format.js';

// Pie del editor: estado de guardado y recuento de palabras.
//   saveState: 'new' (sin guardar nunca) · 'saved' (como está en la BD) · 'changed' (cambios sin guardar) · 'saving'
export default function EditorStatus({ saveState, savedAt, words }) {
  const minutes = words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  const texts = {
    new: 'Artículo nuevo sin guardar',
    saved: savedAt ? `Guardado el ${numericDate(savedAt).slice(0, 5)} a las ${shortTime(savedAt)}` : 'Guardado',
    changed: 'Cambios sin guardar',
    saving: 'Guardando…',
  };
  return (
    <div className="article-editor__status">
      <span className={`article-editor__saved${saveState !== 'saved' ? ' article-editor__saved--new' : ''}`}>
        {saveState === 'saved' && <span className="article-editor__check" aria-hidden="true" />}
        {texts[saveState]}
      </span>
      <span className="article-editor__count">
        {words} {words === 1 ? 'palabra' : 'palabras'} · {minutes} min
      </span>
    </div>
  );
}
