import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Rating from '../../components/Rating/Rating.jsx';
import { slotPosition } from '../../components/Pitch/Pitch.jsx';
import { SORTS, candidatesFor, fitsSlot } from './team.js';
import { getTeam } from '../../data/mockData.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Buscador y lista de candidatos para la posición activa (11 · Mi equipo ideal).
// Filtra por nombre y por posición («Posición: EI» o todas) y ordena por goles, asistencias o valoración.
// El primero que encaja va resaltado como en el mockup. Un jugador que no encaja en la posición sale deshabilitado.
// Diseño: Figma › Mockups › 11 · Mi equipo ideal › Candidato Vinícius Jr.
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=55-892
const PAGE_SIZE = 5;
const PAGE_SIZE_MOBILE = 3;

export default function CandidateList({ slot, assigned, onAdd }) {
  const [query, setQuery] = useState('');
  const [onlySlot, setOnlySlot] = useState('slot');
  const [sort, setSort] = useState('goals');
  const [showAll, setShowAll] = useState(false);

  const position = slot ? slotPosition(slot) : null;
  const candidates = candidatesFor({ slot, assigned, query, onlySlotPosition: onlySlot === 'slot', sort });
  const visible = showAll ? candidates : candidates.slice(0, PAGE_SIZE);

  return (
    <>
      <TextField
        size="sm"
        label="Buscar jugador"
        hideLabel
        placeholder="Buscar jugador…"
        icon={searchIcon}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowAll(false); }}
        autoComplete="off"
      />

      <div className="ideal-team__filters">
        <Select
          size="sm"
          label="Posición"
          hideLabel
          options={[{ value: 'slot', label: `Posición: ${position ?? '—'}` }, { value: 'all', label: 'Todas' }]}
          value={onlySlot}
          onChange={(e) => { setOnlySlot(e.target.value); setShowAll(false); }}
        />
        <Select
          size="sm"
          label="Ordenar"
          hideLabel
          options={SORTS}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        />
      </div>

      <ul className="ideal-team__candidates" aria-label="Jugadores disponibles">
        {candidates.length === 0 && (
          <li className="ideal-team__empty">No hay jugadores disponibles con estos filtros</li>
        )}
        {visible.map((player, i) => {
          const team = getTeam(player.teamId);
          const fits = slot ? fitsSlot(player, slot) : false;
          const goals = player.goals ?? '—';
          const classes = [
            'ideal-team-candidate',
            i === 0 && fits && 'ideal-team-candidate--first',
            !fits && 'ideal-team-candidate--disabled',
            !showAll && i >= PAGE_SIZE_MOBILE && 'ideal-team-candidate--extra',
          ].filter(Boolean).join(' ');
          return (
            <li key={player.id} className={classes}>
              <Avatar name={player.name} size={44} className="ideal-team-candidate__avatar" />
              <div className="ideal-team-candidate__text">
                <p className="ideal-team-candidate__name">{player.name}</p>
                <p className="ideal-team-candidate__meta">
                  <span className="ideal-team__desktop">{team?.name ?? '—'}</span>
                  <span className="ideal-team__mobile">{team?.code ?? '—'}</span>
                  {' · '}{fits ? position : player.position} · {goals} {goals === 1 ? 'gol' : 'goles'}
                </p>
              </div>
              <Rating value={player.rating} />
              <button
                type="button"
                className="ideal-team-candidate__add"
                onClick={() => onAdd(player.id)}
                disabled={!fits}
                aria-label={fits ? `Añadir a ${player.name}` : `${player.name} no encaja en esta posición`}
              >
                <span className="ideal-team-candidate__plus ideal-team__desktop" aria-hidden="true" />
                <span className="ideal-team__mobile">+ Añadir</span>
              </button>
            </li>
          );
        })}
      </ul>

      {candidates.length > PAGE_SIZE_MOBILE && (
        <button
          type="button"
          className={`ideal-team__more${candidates.length <= PAGE_SIZE ? ' ideal-team__more--mobile-only' : ''}`}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Ver menos' : `Ver todos (${candidates.length})`}
        </button>
      )}
    </>
  );
}
