import { Link } from 'react-router';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Button from '../../components/Button/Button.jsx';
import { STATUSES } from './articleForm.js';
import calendarIcon from '../../assets/icon-calendar.svg';

// Caja «Publicación»: estado, fecha, botones y aviso del resultado
export default function PublishBox({ form, onChange, publishAtError, notice, onSaveDraft, onPublish }) {
  return (
    <div className="article-editor__box">
      <h2 className="article-editor__box-title">Publicación</h2>
      <Select
        label="Estado"
        options={STATUSES}
        value={form.status}
        onChange={(e) => onChange('status', e.target.value)}
      />
      <TextField
        label="Fecha de publicación"
        placeholder="dd/mm/aaaa · hh:mm"
        icon={calendarIcon}
        value={form.publishAt}
        onChange={(e) => onChange('publishAt', e.target.value)}
        error={publishAtError}
      />
      <div className="article-editor__buttons">
        <Button
          variant="tertiary"
          className="article-editor__button article-editor__button--draft"
          onClick={onSaveDraft}
        >
          Guardar borrador
        </Button>
        <Button className="article-editor__button" onClick={onPublish}>
          Publicar
        </Button>
      </div>
      {notice && (
        <p className={`article-editor__notice article-editor__notice--${notice.tone}`} role="status">
          {notice.text}
          {notice.tone === 'win' && (
            <>
              {' '}
              <Link to="/editor">Volver al panel</Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
