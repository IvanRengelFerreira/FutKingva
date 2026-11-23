import { useState } from 'react';
import { useUserData } from '../../context/UserDataContext.jsx';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import { getPlayer, getTeam } from '../../data/mockData.js';
import { CURRENT_EDITOR, PEDRI_REPORT } from './changeHistory.js';
import {
  TODAY_SHORT_DATE,
  fieldName,
  getChangedFields,
  originalValues,
  pick,
  validatePlayerValues,
} from './playerDataFields.js';
import SyncStatus from './SyncStatus.jsx';
import PlayerPicker from './PlayerPicker.jsx';
import PlayerDataForm from './PlayerDataForm.jsx';
import ChangeHistoryTable from './ChangeHistoryTable.jsx';
import './PlayerDataEditor.css';

// 19 · Actualizar datos de jugadores (RF11): corregir las estadísticas que llegan del proveedor.
// Se abre como en Figma: Pedri con las amarillas cambiadas de 2 a 3 por el aviso que llegó desde Contacto (16).
// «Guardar cambios» añade cada campo cambiado al historial y corrige el dato en toda la web (ficha del jugador,
// comparador…); «Cancelar» vuelve a los datos guardados. Sin servidor, se guarda en el navegador (useUserData).
// Diseño: Figma › Mockups › 19 · Actualizar datos de jugadores
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=62-1286

const BREADCRUMBS = [
  { label: 'Panel de editor', to: '/editor' },
  { label: 'Actualizar datos de jugadores', shortLabel: 'Actualizar datos' },
];

export default function PlayerDataEditor() {
  // Datos ya corregidos ({ playerId: { campo: valor } }) e historial de cambios, guardados en el navegador
  const { playerCorrections: saved, dataHistory: history, savePlayerCorrection } = useUserData();
  const [playerId, setPlayerId] = useState(PEDRI_REPORT.playerId);
  const [values, setValues] = useState(() => ({
    ...originalValues(PEDRI_REPORT.playerId, {}),
    ...PEDRI_REPORT.changes,
  }));
  const [reason, setReason] = useState(PEDRI_REPORT.reason);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const player = getPlayer(playerId);
  const team = getTeam(player.teamId);
  const original = originalValues(playerId, saved);
  const changedFields = getChangedFields(values, original);
  const errors = validatePlayerValues(values, changedFields, reason);
  const visibleErrors = submitted ? errors : {};

  function handleFieldChange(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setMessage('');
  }

  function handleReasonChange(value) {
    setReason(value);
    setMessage('');
  }

  function handleSelectPlayer(id) {
    const discarded = changedFields.length > 0;
    setPlayerId(id);
    setValues(originalValues(id, saved));
    setReason('');
    setSubmitted(false);
    setMessage(discarded ? `Se han descartado los cambios sin guardar de ${player.name}.` : '');
  }

  function handleCancel() {
    setValues(original);
    setReason('');
    setSubmitted(false);
    setMessage('Cambios descartados.');
  }

  function handleSave() {
    if (changedFields.length === 0) {
      setMessage('No hay cambios que guardar.');
      return;
    }
    if (Object.values(errors).some(Boolean)) {
      setSubmitted(true);
      return;
    }
    const entries = changedFields.map((key, index) => ({
      id: Date.now() + index,
      date: TODAY_SHORT_DATE,
      playerId,
      field: fieldName(key),
      from: original[key],
      to: values[key],
      by: CURRENT_EDITOR.initials,
    }));
    savePlayerCorrection(playerId, pick(values, changedFields), entries);
    setReason('');
    setSubmitted(false);
    const summary = entries.map((entry) => `${entry.field} ${entry.from} → ${entry.to}`).join(', ');
    setMessage(`Cambios guardados: ${summary}.`);
  }

  const originNote = playerId === PEDRI_REPORT.playerId && !saved[playerId] ? PEDRI_REPORT.origin : null;

  return (
    <section className="page player-data">
      <RoleNotice role="editor" />
      <Breadcrumbs items={BREADCRUMBS} />

      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            Zona de editor<span className="player-data__more"> · RF11</span>
          </p>
          <h1 className="page-header__title">Actualizar datos de jugadores</h1>
          <p className="page-header__subtitle player-data__more">
            Corrige o completa las estadísticas recibidas del proveedor de datos.
          </p>
        </div>

        <SyncStatus />
      </header>

      <PlayerPicker currentPlayer={player} onSelectPlayer={handleSelectPlayer} />

      <div className="player-data__layout">
        <PlayerDataForm
          player={player}
          teamName={team?.name}
          values={values}
          originalValues={original}
          changedFields={changedFields}
          errors={visibleErrors}
          originNote={originNote}
          reason={reason}
          message={message}
          onFieldChange={handleFieldChange}
          onReasonChange={handleReasonChange}
          onCancel={handleCancel}
          onSubmit={handleSave}
        />

        <ChangeHistoryTable entries={history} />
      </div>
    </section>
  );
}
