import { useEffect, useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { listPlayers } from '../../services/players.js';
import { playerMeta } from './stats.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Buscador «Buscar jugador…» del comparador: pide hasta 5 jugadores al servidor (con debounce y
// cancelando peticiones en vuelo) y oculta los que ya están en la comparativa. Al elegir uno se añade.
const MAX_RESULTS = 5;
const DEBOUNCE_MS = 250;
const NO_TEAM_LABEL = 'Sin equipo';

export default function PlayerSearch({ selectedIds, season, onSelect, autoFocus = false, className = '' }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ term: '', items: [], error: null, loading: false });
  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState((current) => ({ ...current, loading: true, error: null }));
      listPlayers({ search: trimmed, limit: MAX_RESULTS, season }, { signal: controller.signal })
        .then((data) => {
          if (!controller.signal.aborted) {
            setState({ term: trimmed, items: data.items, error: null, loading: false });
          }
        })
        .catch((error) => {
          if (controller.signal.aborted || error.name === 'AbortError') return;
          setState({ term: trimmed, items: [], error, loading: false });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, season]);

  const isSearching = Boolean(trimmed) && (state.loading || state.term !== trimmed);
  const results = state.term === trimmed ? state.items.filter((player) => !selectedIds.includes(player.id)) : [];

  function choose(player) {
    onSelect(player.id);
    setQuery('');
  }

  return (
    <div className={`comparator-search ${className}`.trim()}>
      <TextField
        size="sm"
        label="Buscar jugador"
        hideLabel
        placeholder="Buscar jugador…"
        icon={searchIcon}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      {trimmed && (
        <ul className="comparator-search__results" aria-label="Jugadores encontrados" aria-live="polite">
          {isSearching && <li className="comparator-search__empty">Buscando…</li>}
          {!isSearching && state.error && <li className="comparator-search__empty">{state.error.message}</li>}
          {!isSearching && !state.error && results.length === 0 && (
            <li className="comparator-search__empty">No hay jugadores con ese nombre</li>
          )}
          {!isSearching &&
            !state.error &&
            results.map((player) => (
              <li key={player.id}>
                <button type="button" className="comparator-search__result" onClick={() => choose(player)}>
                  <Avatar name={player.name} src={player.photoUrl} size={32} />
                  <span className="comparator-search__text">
                    <span className="comparator-search__name">{player.name}</span>
                    <span className="comparator-search__meta">{playerMeta(player) || NO_TEAM_LABEL}</span>
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
