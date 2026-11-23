import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { SEASON, getTeam } from '../../data/mockData.js';
import searchIcon from '../../assets/icon-search-small.svg';
import { getSuggestions, teamsWithPlayers } from './playerDataFields.js';

const TEAM_FILTER_OPTIONS = [{ value: 'all', label: 'Equipo: Todos' }, ...teamsWithPlayers()];
const SEASON_OPTIONS = [{ value: SEASON, label: `Temporada ${SEASON}` }];

export default function PlayerPicker({ currentPlayer, onSelectPlayer }) {
  const [query, setQuery] = useState('');
  const [teamId, setTeamId] = useState('all');
  const [listOpen, setListOpen] = useState(false); // Lista de jugadores para elegir (al buscar o filtrar por equipo)

  const suggestions = listOpen ? getSuggestions(query, teamId, currentPlayer.id) : [];

  function handleSelect(id) {
    setQuery('');
    setListOpen(false);
    onSelectPlayer(id);
  }

  function handleSearchBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setListOpen(false);
    }
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') {
      setListOpen(false);
    }
  }

  function handleQueryChange(event) {
    setQuery(event.target.value);
    setListOpen(true);
  }

  function handleTeamChange(event) {
    setTeamId(event.target.value);
    setListOpen(true);
  }

  return (
    <div className="player-data__filters">
      <div className="player-data__search" onBlur={handleSearchBlur} onKeyDown={handleSearchKeyDown}>
        <TextField
          size="sm"
          label="Buscar jugador"
          hideLabel
          placeholder={currentPlayer.name}
          icon={searchIcon}
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setListOpen(true)}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul className="player-data__suggestions">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button type="button" className="player-data__suggestion" onClick={() => handleSelect(item.id)}>
                  <Avatar name={item.name} size={24} />
                  {item.name}
                  <span className="player-data__suggestion-team">{getTeam(item.teamId)?.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Select
        size="sm"
        label="Filtrar por equipo"
        hideLabel
        options={TEAM_FILTER_OPTIONS}
        value={teamId}
        onChange={handleTeamChange}
      />
      <Select size="sm" label="Temporada" hideLabel options={SEASON_OPTIONS} value={SEASON} onChange={() => {}} />
    </div>
  );
}
