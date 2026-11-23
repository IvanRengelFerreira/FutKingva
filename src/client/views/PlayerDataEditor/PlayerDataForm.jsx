import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Button from '../../components/Button/Button.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import { SEASON } from '../../data/mockData.js';
import saveIcon from '../../assets/icon-save.svg';
import { FIELDS, POSITIONS } from './playerDataFields.js';

export default function PlayerDataForm({
  player,
  teamName,
  values,
  originalValues,
  changedFields,
  errors,
  originNote,
  reason,
  message,
  onFieldChange,
  onReasonChange,
  onCancel,
  onSubmit,
}) {
  const changedSet = new Set(changedFields);
  const changedLabel = changedFields.length === 1 ? 'campo modificado' : 'campos modificados';
  const positionClassName = changedSet.has('position')
    ? 'player-data__field player-data__field--position player-data__field--changed'
    : 'player-data__field player-data__field--position';

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="player-data__card" onSubmit={handleSubmit} noValidate>
      <div className="player-data__who">
        <span className="player-data__badge">
          <Avatar className="player-data__avatar" name={player.name} size={68} />
          <Crest className="player-data__crest" teamId={player.teamId} size={24} />
        </span>
        <div className="player-data__who-text">
          <h2 className="player-data__name">{player.name}</h2>
          <p className="player-data__meta">
            {teamName} · {values.position} · Temporada {SEASON}
          </p>
        </div>
        {changedFields.length > 0 && (
          <span className="player-data__changed">
            {changedFields.length} {changedLabel}
          </span>
        )}
      </div>

      <div className="player-data__fields">
        {FIELDS.map((field) => {
          const isChanged = changedSet.has(field.key);
          const fieldClassName = isChanged ? 'player-data__field player-data__field--changed' : 'player-data__field';
          return (
            <div key={field.key} className={fieldClassName}>
              <TextField
                label={field.label}
                inputMode={field.decimal ? 'decimal' : 'numeric'}
                value={values[field.key]}
                onChange={(event) => onFieldChange(field.key, event.target.value)}
                error={errors[field.key] ?? null}
              />
              {isChanged && <span className="player-data__before">antes {originalValues[field.key]}</span>}
            </div>
          );
        })}
        <div className={positionClassName}>
          <Select
            label="Posición"
            options={POSITIONS}
            value={values.position}
            onChange={(event) => onFieldChange('position', event.target.value)}
          />
        </div>
      </div>

      {originNote && (
        <p className="player-data__origin">
          <span className="player-data__mail" aria-hidden="true" />
          {originNote}
        </p>
      )}

      <TextField
        label="Motivo del cambio"
        placeholder="Por qué se corrige el dato (partido, minuto…)"
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
        error={errors.reason ?? null}
      />

      <div className="player-data__actions">
        <Button variant="tertiary" className="player-data__button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="player-data__button">
          <img src={saveIcon} alt="" width="16" height="16" />
          Guardar cambios
        </Button>
        <p className="player-data__message" role="status">
          {message}
        </p>
      </div>
    </form>
  );
}
