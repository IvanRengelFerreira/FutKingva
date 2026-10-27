import { useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import Select from '../../components/Select/Select.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Pitch, { POSITION_NAMES, slotPosition } from '../../components/Pitch/Pitch.jsx';
import CandidateList from './CandidateList.jsx';
import TeamSummary from './TeamSummary.jsx';
import {
  FORMATION_NAMES, MAX_NAME_LENGTH, lineupOf, slotsOf, toAssigned,
  assignPlayer, removePlayer, changeFormation,
} from './team.js';
import { SEASON, IDEAL_TEAM_EXAMPLE, getPlayer } from '../../data/mockData.js';
import saveIcon from '../../assets/icon-save.svg';
import removeIcon from '../../assets/icon-remove.svg';
import './IdealTeam.css';

// 11 · Mi equipo ideal (RF5): el usuario arma su once sobre el campo con jugadores de cualquier club.
// Empieza con el equipo de ejemplo (Los Coronados, 4-3-3, con el extremo izquierdo libre).
// Reglas de negocio: cada posición del campo lleva un solo jugador (no se repite posición), un jugador no puede
// estar dos veces y solo vale en las posiciones donde encaja (ver fitsSlot en team.js).
// Cambio de formación: los jugadores cuyas posiciones desaparecen se reubican en un hueco libre donde encajen
// y, si no lo hay, salen del once (se avisa de qué ha pasado con cada uno).
// «Guardar equipo» lo marca como guardado (sin servidor no se guarda en ningún sitio).
// Diseño: Figma › Mockups › 11 · Mi equipo ideal
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=55-702
export default function IdealTeam() {
  const [name, setName] = useState(IDEAL_TEAM_EXAMPLE.name);
  const [formation, setFormation] = useState(IDEAL_TEAM_EXAMPLE.formation);
  const [assigned, setAssigned] = useState(() => toAssigned(IDEAL_TEAM_EXAMPLE.players));
  const [activeSlot, setActiveSlot] = useState(() => firstEmpty(IDEAL_TEAM_EXAMPLE.formation, toAssigned(IDEAL_TEAM_EXAMPLE.players)));
  const [notice, setNotice] = useState(null);
  const [saved, setSaved] = useState(false);

  const lineup = lineupOf(formation, assigned);
  const count = lineup.filter((l) => l.playerId).length;
  const activePlayer = activeSlot ? getPlayer(assigned[activeSlot]) : undefined;
  const activePosition = activeSlot ? slotPosition(activeSlot) : null;

  function edit(nextAssigned, nextActive) {
    setAssigned(nextAssigned);
    setActiveSlot(nextActive);
    setSaved(false);
    setNotice(null);
  }

  function add(playerId) {
    const next = assignPlayer(assigned, formation, activeSlot, playerId);
    if (next) edit(next, firstEmpty(formation, next, activeSlot));
  }

  function remove() {
    edit(removePlayer(assigned, activeSlot), activeSlot);
  }

  function selectFormation(value) {
    if (value === formation) return;
    const result = changeFormation(assigned, formation, value);
    setFormation(value);
    setAssigned(result.assigned);
    setActiveSlot(firstEmpty(value, result.assigned));
    setSaved(false);
    setNotice(describeChange(value, result));
  }

  const saveButton = (
    <Button onClick={() => setSaved(true)} disabled={count === 0 || saved}>
      <img src={saveIcon} alt="" width="16" height="16" />
      {saved ? 'Equipo guardado' : 'Guardar equipo'}
    </Button>
  );

  return (
    <section className="page ideal-team">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow" aria-live="polite">
            <span className="ideal-team__desktop">Temporada {SEASON} · </span>
            {saved ? 'Guardado' : 'Borrador'}
          </p>
          <h1 className="page-header__title">Mi equipo ideal</h1>
          <p className="page-header__subtitle">
            <span className="ideal-team__desktop">Arma tu once con jugadores de cualquier club según sus estadísticas reales.</span>
            <span className="ideal-team__mobile">Arma tu once con jugadores de cualquier club.</span>
          </p>
        </div>

        <div className="page-header__actions ideal-team__controls">
          <TextField
            size="sm"
            label="Nombre del equipo"
            hideLabel
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            className="ideal-team__name"
          />
          <Select
            size="sm"
            label="Formación"
            hideLabel
            options={FORMATION_NAMES.map((f) => ({ value: f, label: `Formación ${f}` }))}
            value={formation}
            onChange={(e) => selectFormation(e.target.value)}
            className="ideal-team__formation ideal-team__desktop-block"
          />
          <Select
            size="sm"
            label="Formación"
            hideLabel
            options={FORMATION_NAMES}
            value={formation}
            onChange={(e) => selectFormation(e.target.value)}
            className="ideal-team__formation ideal-team__mobile-block"
          />
          <div className="ideal-team__save ideal-team__desktop-block">{saveButton}</div>
        </div>
      </header>

      {notice && <p className="ideal-team__notice" role="status">{notice}</p>}

      <div className="ideal-team__main">
        <Pitch
          formation={formation}
          players={lineup}
          activeSlot={activeSlot}
          onSlotClick={setActiveSlot}
          className="ideal-team__pitch"
        />

        <section className="ideal-team__search" aria-labelledby="ideal-team-search-title">
          <h2 id="ideal-team-search-title" className="ideal-team__section-title">Añadir jugadores</h2>

          <div className="ideal-team__choosing" aria-live="polite">
            {activeSlot ? (
              <>
                <span>
                  Eligiendo para: {POSITION_NAMES[activePosition]} ({activePosition})
                  {activePlayer && <> · ahora: {activePlayer.shortName ?? activePlayer.name}</>}
                </span>
                {activePlayer && (
                  <button type="button" className="ideal-team__remove" onClick={remove} aria-label={`Quitar a ${activePlayer.name}`}>
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

// Primera posición libre de la formación (empezando después de la actual, si se indica); null si está completa
function firstEmpty(formation, assigned, after) {
  const slots = slotsOf(formation);
  const start = after ? slots.indexOf(after) + 1 : 0;
  const ordered = [...slots.slice(start), ...slots.slice(0, start)];
  return ordered.find((slot) => !assigned[slot]) ?? null;
}

// Aviso tras cambiar de formación: qué jugadores se han movido y cuáles han salido del once
function describeChange(to, { moved, dropped }) {
  const label = (id) => getPlayer(id)?.shortName ?? getPlayer(id)?.name ?? id;
  const parts = [`Formación ${to}.`];
  moved.filter(({ from, to: slot }) => slotPosition(from) !== slotPosition(slot)).forEach(({ playerId, from, to: slot }) => parts.push(`${label(playerId)} pasa de ${slotPosition(from)} a ${slotPosition(slot)}.`));
  dropped.forEach(({ playerId, from }) => parts.push(`${label(playerId)} (${slotPosition(from)}) sale del once: no hay hueco para su posición.`));
  return parts.join(' ');
}
