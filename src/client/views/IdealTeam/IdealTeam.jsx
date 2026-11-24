import { useState } from 'react';
import { useUserData } from '../../context/UserDataContext.jsx';
import Button from '../../components/Button/Button.jsx';
import Select from '../../components/Select/Select.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import Pitch from '../../components/Pitch/Pitch.jsx';
import { FORMATION_NAMES, POSITION_NAMES, slotPosition } from '../../../shared/formations.js';
import { IDEAL_TEAM_NAME_MAX, validateIdealTeam } from '../../../shared/validation/idealTeam.js';
import { useFormSubmit } from '../../services/useFormSubmit.js';
import CandidateList from './CandidateList.jsx';
import TeamSummary from './TeamSummary.jsx';
import {
  lineupOf,
  filledPlayersOf,
  toAssigned,
  assignPlayer,
  removePlayer,
  changeFormation,
  firstEmpty,
  describeChange,
} from './team.js';
import saveIcon from '../../assets/icon-save.svg';
import removeIcon from '../../assets/icon-remove.svg';
import './IdealTeam.css';

// 11 · Mi equipo ideal (RF5): el usuario arma su once sobre el campo con jugadores de cualquier club.
// Carga el equipo guardado del servidor (GET /api/me/ideal-team) y lo guarda con PUT /api/me/ideal-team.
// Reglas de negocio: cada posición del campo lleva un solo jugador (no se repite posición), un jugador no puede
// estar dos veces y solo vale en las posiciones donde encaja (ver fitsSlot en shared/positions.js).
// Cambio de formación: los jugadores cuyas posiciones desaparecen se reubican en un hueco libre donde encajen
// y, si no lo hay, salen del once (se avisa de qué ha pasado con cada uno).
// Diseño: Figma › Mockups › 11 · Mi equipo ideal
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=55-702
export default function IdealTeam() {
  const { idealTeam, idealTeamLoading, idealTeamError, reloadIdealTeam, saveIdealTeam } = useUserData();

  if (idealTeamLoading) return <LoadingState label="Cargando equipo ideal…" />;
  if (idealTeamError) {
    return (
      <ErrorState error={idealTeamError} title="No se ha podido cargar tu equipo ideal" onRetry={reloadIdealTeam} />
    );
  }

  return <IdealTeamEditor idealTeam={idealTeam} onSave={saveIdealTeam} />;
}

function IdealTeamEditor({ idealTeam, onSave }) {
  const [name, setName] = useState(idealTeam.name);
  const [formation, setFormation] = useState(idealTeam.formation);
  const [assigned, setAssigned] = useState(() => toAssigned(idealTeam.players));
  const [activeSlot, setActiveSlot] = useState(() => firstEmpty(idealTeam.formation, toAssigned(idealTeam.players)));
  const [notice, setNotice] = useState(null);
  const [saved, setSaved] = useState(Boolean(idealTeam.updatedAt));
  const { submitted, sending, serverFields, message, clearServerError, submit } = useFormSubmit();

  const lineup = lineupOf(formation, assigned);
  const filledPlayers = filledPlayersOf(formation, assigned);
  const errors = validateIdealTeam({ name, formation, players: filledPlayers });
  const shown = (field) => (submitted ? errors[field] : null) ?? serverFields[field];
  const saveError = shown('players') ?? message;

  const count = filledPlayers.length;
  const activePlayer = activeSlot ? assigned[activeSlot] : undefined;
  const activePosition = activeSlot ? slotPosition(activeSlot) : null;

  // Aplica un cambio en el once: lo deja como borrador y borra el aviso anterior
  function edit(nextAssigned, nextActive) {
    setAssigned(nextAssigned);
    setActiveSlot(nextActive);
    setSaved(false);
    setNotice(null);
    clearServerError('players');
  }

  function add(player) {
    const next = assignPlayer(assigned, formation, activeSlot, player);
    if (next) edit(next, firstEmpty(formation, next, activeSlot));
  }

  function remove() {
    edit(removePlayer(assigned, activeSlot), activeSlot);
  }

  function selectFormation(value) {
    if (value === formation) return;
    const result = changeFormation(assigned, formation, value);
    setFormation(value);
    clearServerError('formation');
    edit(result.assigned, firstEmpty(value, result.assigned));
    setNotice(describeChange(value, result));
  }

  function save() {
    submit(async () => {
      const updated = await onSave({ name: name.trim(), formation, players: filledPlayers });
      setName(updated.name);
      setAssigned(toAssigned(updated.players));
      setSaved(true);
    }, errors);
  }

  const saveLabel = sending ? 'Guardando…' : saved ? 'Equipo guardado' : 'Guardar equipo';
  const saveButton = (
    <Button onClick={save} disabled={sending || count === 0 || saved}>
      <img src={saveIcon} alt="" width="16" height="16" />
      {saveLabel}
    </Button>
  );

  return (
    <section className="page ideal-team">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow" aria-live="polite">
            {idealTeam.season && <span className="ideal-team__desktop">Temporada {idealTeam.season} · </span>}
            {saved ? 'Guardado' : 'Borrador'}
          </p>
          <h1 className="page-header__title">Mi equipo ideal</h1>
          <p className="page-header__subtitle">
            <span className="ideal-team__desktop">
              Arma tu once con jugadores de cualquier club según sus estadísticas reales.
            </span>
            <span className="ideal-team__mobile">Arma tu once con jugadores de cualquier club.</span>
          </p>
        </div>

        <div className="page-header__actions ideal-team__controls">
          <TextField
            size="sm"
            label="Nombre del equipo"
            hideLabel
            value={name}
            maxLength={IDEAL_TEAM_NAME_MAX}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
              clearServerError('name');
            }}
            error={shown('name')}
            className="ideal-team__name"
          />
          <Select
            size="sm"
            label="Formación"
            hideLabel
            options={FORMATION_NAMES.map((item) => ({ value: item, label: `Formación ${item}` }))}
            value={formation}
            onChange={(e) => selectFormation(e.target.value)}
            error={shown('formation')}
            className="ideal-team__formation ideal-team__desktop-block"
          />
          <Select
            size="sm"
            label="Formación"
            hideLabel
            options={FORMATION_NAMES}
            value={formation}
            onChange={(e) => selectFormation(e.target.value)}
            error={shown('formation')}
            className="ideal-team__formation ideal-team__mobile-block"
          />
          <div className="ideal-team__save ideal-team__desktop-block">{saveButton}</div>
        </div>
      </header>

      <FieldError>{saveError}</FieldError>

      {notice && (
        <p className="ideal-team__notice" role="status">
          {notice}
        </p>
      )}

      <div className="ideal-team__main">
        <Pitch
          formation={formation}
          players={lineup}
          activeSlot={activeSlot}
          onSlotClick={setActiveSlot}
          className="ideal-team__pitch"
        />

        <section className="ideal-team__search" aria-labelledby="ideal-team-search-title">
          <h2 id="ideal-team-search-title" className="ideal-team__section-title">
            Añadir jugadores
          </h2>

          <div className="ideal-team__choosing" aria-live="polite">
            {activeSlot ? (
              <>
                <span>
                  Eligiendo para: {POSITION_NAMES[activePosition]} ({activePosition})
                  {activePlayer && <> · ahora: {activePlayer.name}</>}
                </span>
                {activePlayer && (
                  <button
                    type="button"
                    className="ideal-team__remove"
                    onClick={remove}
                    aria-label={`Quitar a ${activePlayer.name}`}
                  >
                    <img src={removeIcon} alt="" width="14" height="14" />
                    Quitar
                  </button>
                )}
              </>
            ) : (
              <span>Once completo: pulsa una posición del campo para cambiar a su jugador.</span>
            )}
          </div>

          <CandidateList slot={activeSlot} assigned={assigned} onAdd={add} />
        </section>
      </div>

      <TeamSummary assigned={assigned} />

      <div className="ideal-team__save-mobile ideal-team__mobile-block">{saveButton}</div>
    </section>
  );
}
