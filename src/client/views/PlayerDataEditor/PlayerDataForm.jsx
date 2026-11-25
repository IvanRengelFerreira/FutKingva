import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Button from '../../components/Button/Button.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import { useFormSubmit } from '../../services/useFormSubmit.js';
import { savePlayerData } from '../../services/playerData.js';
import { fieldLabel, validatePlayerData } from '../../../shared/validation/playerData.js';
import saveIcon from '../../assets/icon-save.svg';
import { PEDRI_REPORT_ORIGIN } from './changeHistory.js';
import {
  FORM_FIELDS,
  POSITION_OPTIONS,
  displayValue,
  getChangedFields,
  toFormValues,
  toPayload,
} from './playerDataFields.js';

// Ficha de corrección de un jugador (PATCH /api/player-data/players/:id).
// La página la vuelve a montar (key) al elegir otro jugador, así que siempre empieza con sus datos guardados.
// Los errores salen al pulsar «Guardar cambios» y desaparecen al corregir el campo (como en Acceso).
//   initialData   lo que devuelve GET /api/player-data/players/:id
//   showReport    enseñar el aviso de Contacto (jugador de ejemplo de Figma)
//   onDirtyChange avisa a la página de si hay cambios sin guardar
//   onSaved       se ha guardado: la página recarga el historial
export default function PlayerDataForm({ initialData, showReport, onDirtyChange, onSaved }) {
  const [data, setData] = useState(initialData);
  const original = toFormValues(data);
  const [values, setValues] = useState(original);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const { submitted, sending, serverFields, message, clearServerError, submit } = useFormSubmit();

  const { player, season } = data;
  const changedFields = getChangedFields(values, original);
  const changedSet = new Set(changedFields);
  const payload = { values: toPayload(values, changedFields), reason };
  const errors = changedFields.length ? validatePlayerData(payload) : {};
  const shown = (field) => (submitted ? errors[field] : null) ?? serverFields[field] ?? null;

  const changedLabel = changedFields.length === 1 ? 'campo modificado' : 'campos modificados';
  const positionClassName = changedSet.has('position')
    ? 'player-data__field player-data__field--position player-data__field--changed'
    : 'player-data__field player-data__field--position';

  function handleFieldChange(key, value) {
    const next = { ...values, [key]: value };
    setValues(next);
    setNotice('');
    clearServerError(key);
    onDirtyChange(getChangedFields(next, original).length > 0);
  }

  function handleReasonChange(value) {
    setReason(value);
    setNotice('');
    clearServerError('reason');
  }

  function handleCancel() {
    setValues(original);
    setReason('');
    setNotice('Cambios descartados.');
    onDirtyChange(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (changedFields.length === 0) {
      setNotice('No hay cambios que guardar.');
      return;
    }
    const summary = changedFields
      .map((key) => `${fieldLabel(key)} ${displayValue(original[key])} → ${values[key].trim()}`)
      .join(', ');
    submit(async () => {
      const saved = await savePlayerData(player.id, payload);
      setData(saved);
      setValues(toFormValues(saved));
      setReason('');
      setNotice(`Cambios guardados: ${summary}.`);
      onDirtyChange(false);
      onSaved();
    }, errors);
  }

  const showOrigin = showReport && !data.edited.yellowCards;

  return (
    <form className="player-data__card" onSubmit={handleSubmit} noValidate>
      <div className="player-data__who">
        <span className="player-data__badge">
          <Avatar className="player-data__avatar" name={player.name} size={68} />
          <Crest className="player-data__crest" team={player.team} size={24} />
        </span>
        <div className="player-data__who-text">
          <h2 className="player-data__name">{player.name}</h2>
          <p className="player-data__meta">
            {[player.team?.name, values.position || null, `Temporada ${season.label}`].filter(Boolean).join(' · ')}
          </p>
        </div>
        {changedFields.length > 0 && (
          <span className="player-data__changed">
            {changedFields.length} {changedLabel}
          </span>
        )}
      </div>

      <div className="player-data__fields">
        {FORM_FIELDS.map((field) => {
          if (field.readOnly) {
            return (
              <div key={field.key} className="player-data__field">
                <TextField label={field.label} placeholder="—" value="" hint={field.hint} disabled readOnly />
              </div>
            );
          }
          const isChanged = changedSet.has(field.key);
          const fieldClassName = isChanged ? 'player-data__field player-data__field--changed' : 'player-data__field';
          return (
            <div key={field.key} className={fieldClassName}>
              <TextField
                label={field.label}
                inputMode="numeric"
                placeholder="—"
                value={values[field.key]}
                onChange={(event) => handleFieldChange(field.key, event.target.value)}
                error={shown(field.key)}
              />
              {isChanged && <span className="player-data__before">antes {displayValue(original[field.key])}</span>}
            </div>
          );
        })}
        <div className={positionClassName}>
          <Select
            label="Posición"
            placeholder="Sin posición"
            options={POSITION_OPTIONS}
            value={values.position}
            onChange={(event) => handleFieldChange('position', event.target.value)}
            error={shown('position')}
          />
        </div>
      </div>

      {showOrigin && (
        <p className="player-data__origin">
          <span className="player-data__mail" aria-hidden="true" />
          {PEDRI_REPORT_ORIGIN}
        </p>
      )}

      <TextField
        label="Motivo del cambio"
        placeholder="Por qué se corrige el dato (partido, minuto…)"
        value={reason}
        onChange={(event) => handleReasonChange(event.target.value)}
        error={shown('reason')}
      />

      <FieldError>{message}</FieldError>
      <div className="player-data__actions">
        <Button variant="tertiary" className="player-data__button" onClick={handleCancel} disabled={sending}>
          Cancelar
        </Button>
        <Button type="submit" className="player-data__button" disabled={sending}>
          <img src={saveIcon} alt="" width="16" height="16" />
          {sending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <p className="player-data__message" role="status">
          {notice}
        </p>
      </div>
    </form>
  );
}
