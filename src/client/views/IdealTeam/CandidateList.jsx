import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Rating from '../../components/Rating/Rating.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { slotPosition } from '../../../shared/formations.js';
import { fitsSlot } from '../../../shared/positions.js';
import { SORTS, sortCandidates } from './team.js';
import { useCandidates } from './useCandidates.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Buscador y lista de candidatos para la posición activa (11 · Mi equipo ideal).
// El primero que encaja va resaltado como en el mockup. Un jugador que no encaja sale deshabilitado.
// Diseño: Figma › Mockups › 11 · Mi equipo ideal › Candidato Vinícius Jr.
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=55-892
const PAGE_SIZE_MOBILE = 3;

function moreLabel(isLoadingMore) {
  return isLoadingMore ? 'Cargando más…' : 'Ver más jugadores';
}

export default function CandidateList({ slot, assigned, onAdd }) {
  const [query, setQuery] = useState('');
  const [onlySlot, setOnlySlot] = useState('slot');
  const [sort, setSort] = useState('goals');

  const { items, error, isInitialLoading, isLoadingMore, canLoadMore, expanded, loadMore, reload } = useCandidates({
    slot,
    onlySlot: onlySlot === 'slot',
    query,
  });

  const position = slot ? slotPosition(slot) : null;
  const usedIds = new Set(Object.values(assigned).map((player) => player.id));
  const candidates = sortCandidates(
    items.filter((player) => !usedIds.has(player.id)),
    sort,
  );

  return (
    <>
      <TextField
        size="sm"
        label="Buscar jugador"
        hideLabel
        placeholder="Buscar jugador…"
        icon={searchIcon}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />

      <div className="ideal-team__filters">
        <Select
          size="sm"
          label="Posición"
          hideLabel
          options={[
            { value: 'slot', label: `Posición: ${position ?? '—'}` },
            { value: 'all', label: 'Todas' },
          ]}
          value={onlySlot}
          onChange={(e) => setOnlySlot(e.target.value)}
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

      {isInitialLoading ? (
        <LoadingState label="Cargando jugadores…" />
      ) : error ? (
        <ErrorState error={error} title="No se han podido cargar los jugadores" onRetry={reload} />
      ) : (
        <CandidateItems
          slot={slot}
          position={position}
          candidates={candidates}
          canLoadMore={canLoadMore}
          expanded={expanded}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
          onAdd={onAdd}
        />
      )}
    </>
  );
}

function CandidateItems({ slot, position, candidates, canLoadMore, expanded, isLoadingMore, onLoadMore, onAdd }) {
  const showMore = canLoadMore || isLoadingMore || (!expanded && candidates.length > PAGE_SIZE_MOBILE);
  const mobileOnly = !canLoadMore && !isLoadingMore;

  return (
    <>
      <ul className="ideal-team__candidates" aria-label="Jugadores disponibles">
        {candidates.length === 0 && (
          <li className="ideal-team__empty">
            {slot
              ? 'No hay jugadores disponibles con estos filtros'
              : 'Pulsa una posición del campo para ver sus jugadores'}
          </li>
        )}
        {candidates.map((player, index) => {
          const fits = slot ? fitsSlot(player, slot) : false;
          return (
            <Candidate
              key={player.id}
              player={player}
              fits={fits}
              position={position}
              highlighted={index === 0 && fits}
              mobileExtra={!expanded && index >= PAGE_SIZE_MOBILE}
              onAdd={onAdd}
            />
          );
        })}
      </ul>

      {showMore && (
        <button
          type="button"
          className={`ideal-team__more${mobileOnly ? ' ideal-team__more--mobile-only' : ''}`}
          onClick={onLoadMore}
          disabled={isLoadingMore}
        >
          {moreLabel(isLoadingMore)}
        </button>
      )}
    </>
  );
}

// Fila de un candidato: «fits» indica si encaja en la posición activa; si no, sale deshabilitado
function Candidate({ player, fits, position, highlighted, mobileExtra, onAdd }) {
  const team = player.team;
  const goals = player.goals ?? '—';
  const classes = [
    'ideal-team-candidate',
    highlighted && 'ideal-team-candidate--first',
    !fits && 'ideal-team-candidate--disabled',
    mobileExtra && 'ideal-team-candidate--extra',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={classes}>
      <Avatar name={player.name} src={player.photoUrl} size={44} className="ideal-team-candidate__avatar" />
      <div className="ideal-team-candidate__text">
        <p className="ideal-team-candidate__name">{player.name}</p>
        <p className="ideal-team-candidate__meta">
          <span className="ideal-team__desktop">{team?.name ?? '—'}</span>
          <span className="ideal-team__mobile">{team?.code ?? '—'}</span>
          {' · '}
          {fits ? position : (player.position ?? 'Sin posición')} · {goals} {goals === 1 ? 'gol' : 'goles'}
        </p>
      </div>
      <Rating value={player.rating} />
      <button
        type="button"
        className="ideal-team-candidate__add"
        onClick={() => onAdd(player)}
        disabled={!fits}
        aria-label={fits ? `Añadir a ${player.name}` : `${player.name} no encaja en esta posición`}
      >
        <span className="ideal-team-candidate__plus ideal-team__desktop" aria-hidden="true" />
        <span className="ideal-team__mobile">+ Añadir</span>
      </button>
    </li>
  );
}
