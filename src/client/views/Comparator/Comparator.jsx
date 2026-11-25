import { useState } from 'react';
import { useLocation } from 'react-router';
import { useUserData } from '../../context/UserDataContext.jsx';
import { useApi } from '../../services/useApi.js';
import { useFormSubmit } from '../../services/useFormSubmit.js';
import { listPlayers } from '../../services/players.js';
import { getStandings } from '../../services/standings.js';
import { validateComparison } from '../../../shared/validation/comparisons.js';
import Button from '../../components/Button/Button.jsx';
import Select from '../../components/Select/Select.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import Radar from '../../components/Radar/Radar.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import PlayerSearch from './PlayerSearch.jsx';
import StatsTable from './StatsTable.jsx';
import {
  MODES,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MISSING,
  compactName,
  playerMeta,
  radarAxesFor,
  radarValues,
} from './stats.js';
import plusIcon from '../../assets/icon-plus-light.svg';
import plusGoldIcon from '../../assets/icon-plus.svg';
import saveIcon from '../../assets/icon-save.svg';
import removeIcon from '../../assets/icon-remove.svg';
import './Comparator.css';

// 10 · Comparador (RF4): comparar de 2 a 4 jugadores lado a lado y en un gráfico radar.
// Cada jugador tiene su color (serie 1–4) en la tarjeta, la tabla y el radar; al quitar uno, los siguientes cambian de color.
// Si se llega con jugadores (desde la ficha de un jugador o al abrir una comparativa de Mi perfil), empieza con ellos;
// si no, empieza vacío invitando a buscar. «Guardar comparativa» guarda en la API (/api/me/comparisons).
// Diseño: Figma › Mockups › 10 · Comparador
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=54-623
export default function Comparator() {
  const { state } = useLocation();
  const { saveComparison } = useUserData();
  const [playerIds, setPlayerIds] = useState(() => initialPlayers(state?.playerIds));
  const [season, setSeason] = useState(); // undefined = temporada actual (la elige el servidor)
  const [mode, setMode] = useState('totals');
  const [saved, setSaved] = useState(Boolean(state?.saved));
  const [searchOpen, setSearchOpen] = useState(false); // Solo en móvil: buscador debajo de las tarjetas
  const { sending: saving, serverFields, message: saveMessage, clearServerError, submit } = useFormSubmit();

  const { data: standingsData } = useApi((signal) => getStandings(undefined, { signal }), []);
  const idsKey = playerIds.join(',');
  const {
    data: playersData,
    error: playersError,
    loading: playersLoading,
    reload: reloadPlayers,
  } = useApi(
    (signal) =>
      playerIds.length > 0 ? listPlayers({ ids: playerIds, season }, { signal }) : Promise.resolve({ items: [] }),
    [idsKey, season],
  );

  const isLoadingPlayers = playerIds.length > 0 && playersLoading;
  const players = playerIds.length > 0 && !isLoadingPlayers && !playersError ? (playersData?.items ?? []) : [];
  const activeIds = players.map((player) => player.id);
  const saveError = serverFields.playerIds || saveMessage;

  function change(ids) {
    setPlayerIds(ids);
    setSaved(false);
    clearServerError('playerIds');
  }

  function add(id) {
    change([...activeIds, id]);
    setSearchOpen(false);
  }

  function remove(id) {
    change(activeIds.filter((currentId) => currentId !== id));
  }

  function reset() {
    change([]);
    setSearchOpen(false);
  }

  function save() {
    submit(
      async () => {
        await saveComparison(activeIds);
        setSaved(true);
      },
      validateComparison({ playerIds: activeIds }),
    );
  }

  return (
    <section className="page comparator">
      <ComparatorHeader
        saved={saved}
        saving={saving}
        canSave={!isLoadingPlayers && !playersError && players.length >= MIN_PLAYERS}
        onNew={reset}
        onSave={save}
      />

      {saveError && (
        <div className="comparator__save-error">
          <FieldError>{saveError}</FieldError>
        </div>
      )}

      <ComparatorFilters
        standingsData={standingsData}
        season={season}
        onSeasonChange={setSeason}
        mode={mode}
        onModeChange={setMode}
      />

      {isLoadingPlayers ? (
        <LoadingState label="Cargando jugadores…" />
      ) : playersError ? (
        <ErrorState error={playersError} title="No se han podido cargar los jugadores" onRetry={reloadPlayers} />
      ) : (
        <ComparatorBody
          players={players}
          selectedIds={activeIds}
          season={season}
          mode={mode}
          searchOpen={searchOpen}
          onToggleSearch={() => setSearchOpen((open) => !open)}
          onAdd={add}
          onRemove={remove}
        />
      )}
    </section>
  );
}

function ComparatorHeader({ saved, saving, canSave, onNew, onSave }) {
  const saveLabel = saving ? 'Guardando…' : saved ? 'Comparativa guardada' : 'Guardar comparativa';
  return (
    <header className="page-header">
      <div className="page-header__text">
        <p className="page-header__eyebrow" aria-live="polite">
          {saved ? 'Comparativa guardada' : 'Comparativa sin guardar'}
        </p>
        <h1 className="page-header__title">
          Comparador<span className="comparator__desktop"> de jugadores</span>
        </h1>
        <p className="page-header__subtitle">
          <span className="comparator__desktop">
            Elige dos o más jugadores y compara sus estadísticas de la temporada.
          </span>
          <span className="comparator__mobile">Compara dos o más jugadores.</span>
        </p>
      </div>
      <div className="page-header__actions comparator__actions">
        <Button variant="tertiary" className="comparator__new" onClick={onNew}>
          <img src={plusIcon} alt="" width="16" height="16" />
          Nueva comparativa
        </Button>
        <Button className="comparator__save" onClick={onSave} disabled={!canSave || saved || saving}>
          <img src={saveIcon} alt="" width="16" height="16" />
          {saveLabel}
        </Button>
      </div>
    </header>
  );
}

function ComparatorFilters({ standingsData, season, onSeasonChange, mode, onModeChange }) {
  const seasons = standingsData?.seasons ?? [];
  const selectedYear = season ?? standingsData?.season?.year ?? '';
  const desktopSeasons = seasons.length
    ? seasons.map((item) => ({ value: item.year, label: `Temporada ${item.label}` }))
    : [{ value: '', label: 'Temporada' }];
  const mobileSeasons = seasons.length
    ? seasons.map((item) => ({ value: item.year, label: item.label }))
    : [{ value: '', label: 'Temporada' }];

  return (
    <div className="comparator__filters">
      {/* Temporadas disponibles en la BD (desde /api/standings) y competición única: LaLiga */}
      <Select
        size="sm"
        label="Temporada"
        hideLabel
        options={desktopSeasons}
        value={selectedYear}
        onChange={(e) => onSeasonChange(Number(e.target.value))}
        disabled={!seasons.length}
        className="comparator__desktop-block"
      />
      <Select
        size="sm"
        label="Competición"
        hideLabel
        options={['Competición: LaLiga']}
        value="Competición: LaLiga"
        onChange={() => {}}
        className="comparator__desktop-block"
      />
      <Select
        size="sm"
        label="Temporada"
        hideLabel
        options={mobileSeasons}
        value={selectedYear}
        onChange={(e) => onSeasonChange(Number(e.target.value))}
        disabled={!seasons.length}
        className="comparator__mobile-block"
      />
      <Select
        size="sm"
        label="Competición"
        hideLabel
        options={['LaLiga']}
        value="LaLiga"
        onChange={() => {}}
        className="comparator__mobile-block"
      />
      <Select
        size="sm"
        label="Totales o por partido"
        hideLabel
        options={MODES}
        value={mode}
        onChange={(e) => onModeChange(e.target.value)}
        className="comparator__mode"
      />
    </div>
  );
}

function ComparatorBody({ players, selectedIds, season, mode, searchOpen, onToggleSearch, onAdd, onRemove }) {
  const canAdd = players.length < MAX_PLAYERS;
  return (
    <>
      <ul className="comparator__players" aria-label="Jugadores de la comparativa">
        {players.map((player, i) => (
          <PlayerCard key={player.id} player={player} index={i} onRemove={onRemove} />
        ))}
        {canAdd && (
          <li className="comparator-add">
            <button
              type="button"
              className="comparator-add__button"
              onClick={onToggleSearch}
              aria-expanded={searchOpen}
              aria-label="Añadir jugador"
            >
              <img src={plusGoldIcon} alt="" width="22" height="22" />
            </button>
            <p className="comparator-add__title" aria-hidden="true">
              <span className="comparator__desktop">Añadir jugador</span>
              <span className="comparator__mobile">Añadir</span>
            </p>
            <PlayerSearch
              selectedIds={selectedIds}
              season={season}
              onSelect={onAdd}
              className="comparator-add__search"
            />
            <p className="comparator-add__hint">Máx. {MAX_PLAYERS} jugadores</p>
          </li>
        )}
      </ul>

      {/* En móvil el buscador no cabe en la tarjeta: sale debajo al pulsar «+» */}
      {canAdd && searchOpen && (
        <PlayerSearch
          selectedIds={selectedIds}
          season={season}
          onSelect={onAdd}
          autoFocus
          className="comparator__search-mobile"
        />
      )}

      {players.length < MIN_PLAYERS && (
        <p className="comparator__empty">
          {players.length === 0
            ? `Busca y añade entre ${MIN_PLAYERS} y ${MAX_PLAYERS} jugadores para comparar sus estadísticas.`
            : 'Añade otro jugador para compararlo.'}
        </p>
      )}

      {players.length > 0 && <ComparisonResults players={players} mode={mode} />}
    </>
  );
}

function PlayerCard({ player, index, onRemove }) {
  const meta = playerMeta(player) || MISSING;
  return (
    <li className={`comparator-player comparator-series--${index + 1}`}>
      <div className="comparator-player__top">
        <span className="comparator-player__dot" aria-hidden="true" />
        <button
          type="button"
          className="comparator-player__remove"
          onClick={() => onRemove(player.id)}
          aria-label={`Quitar a ${player.name}`}
        >
          <img src={removeIcon} alt="" width="14" height="14" />
          <span className="comparator__desktop">Quitar</span>
        </button>
      </div>
      <Avatar name={player.name} size={84} className="comparator-player__avatar" />
      <p className="comparator-player__name">
        <span className="comparator__desktop">{player.name}</span>
        <span className="comparator__mobile">{compactName(player)}</span>
      </p>
      <p className="comparator-player__team">
        {player.team && <Crest team={player.team} size={20} className="comparator-player__crest" />}
        <span className="comparator__desktop">{meta}</span>
        <span className="comparator__mobile">{player.team?.code ?? MISSING}</span>
      </p>
    </li>
  );
}

function ComparisonResults({ players, mode }) {
  return (
    <div className="comparator__results">
      <section className="comparator__stats" aria-labelledby="comparator-stats-title">
        <h2 id="comparator-stats-title" className="comparator__section-title">
          <span className="comparator__desktop">Estadísticas lado a lado</span>
          <span className="comparator__mobile">Estadísticas</span>
        </h2>
        <StatsTable players={players} mode={mode} />
        <p className="comparator__legend">
          <span className="comparator-crown" aria-hidden="true" />
          Mejor valor de cada estadística
        </p>
      </section>

      <section className="comparator__radar" aria-labelledby="comparator-radar-title">
        <h2 id="comparator-radar-title" className="comparator__section-title">
          Gráfico radar
        </h2>
        <div className="comparator__radar-card">
          <Radar
            label={`Comparativa de ${players.map(compactName).join(', ')}`}
            axes={radarAxesFor(players)}
            series={players.map((player) => ({ name: compactName(player), values: radarValues(player) }))}
          />
        </div>
      </section>
    </div>
  );
}

// Jugadores con los que empieza: los ids numéricos que llegan en state (sin repetir y como mucho MAX_PLAYERS), o vacío
function initialPlayers(ids) {
  if (!Array.isArray(ids)) return [];
  const valid = ids.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0);
  return [...new Set(valid)].slice(0, MAX_PLAYERS);
}
