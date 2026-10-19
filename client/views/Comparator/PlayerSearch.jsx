import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { PLAYERS, getTeam } from '../../data/mockData.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Buscador «Buscar jugador…» del comparador: al escribir salen hasta 5 jugadores que coinciden
// (sin tildes ni mayúsculas) y que todavía no están en la comparativa. Al elegir uno se añade.
const MAX_RESULTS = 5;

function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export default function PlayerSearch({ selectedIds, onSelect, autoFocus = false, className = '' }) {
  const [query, setQuery] = useState('');

  const search = normalize(query);
  const results = search
    ? Object.values(PLAYERS)
        .filter((player) => !selectedIds.includes(player.id) && normalize(player.name).includes(search))
        .slice(0, MAX_RESULTS)
    : [];

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
      {search && (
        <ul className="comparator-search__results" aria-label="Jugadores encontrados" aria-live="polite">
          {results.length === 0 && <li className="comparator-search__empty">No hay jugadores con ese nombre</li>}
          {results.map((player) => (
            <li key={player.id}>
              <button type="button" className="comparator-search__result" onClick={() => choose(player)}>
                <Avatar name={player.name} size={32} />
                <span className="comparator-search__text">
                  <span className="comparator-search__name">{player.name}</span>
                  <span className="comparator-search__meta">{getTeam(player.teamId)?.name} · {player.position}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
