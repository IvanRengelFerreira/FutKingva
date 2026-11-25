import { useEffect, useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { useApi } from '../../services/useApi.js';
import { searchPlayers } from '../../services/playerData.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Buscador de jugadores (GET /api/player-data/players): por nombre y/o equipo, solo plantillas de la temporada actual
const MAX_SUGGESTIONS = 6;
const SEARCH_DELAY_MS = 250; // Espera a que se deje de escribir para no pedir en cada letra
const NO_RESULTS = { items: [] };

export default function PlayerPicker({ currentPlayer, teams, season, onSelectPlayer }) {
  const [query, setQuery] = useState('');
  const [searchText, setSearchText] = useState(''); // `query` tras la espera
  const [teamId, setTeamId] = useState('all');
  const [listOpen, setListOpen] = useState(false); // Lista de jugadores para elegir (al buscar o filtrar por equipo)

  useEffect(() => {
    const timer = setTimeout(() => setSearchText(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const wantsResults = listOpen && (searchText !== '' || teamId !== 'all');
  const { data } = useApi(
    (signal) =>
      wantsResults
        ? searchPlayers(
            { q: searchText, teamId: teamId === 'all' ? undefined : teamId, limit: MAX_SUGGESTIONS + 1 },
            { signal },
          )
        : Promise.resolve(NO_RESULTS),
    [wantsResults, searchText, teamId],
  );
  const suggestions = wantsResults
    ? (data?.items ?? []).filter((item) => item.id !== currentPlayer.id).slice(0, MAX_SUGGESTIONS)
    : [];

  const teamOptions = [
    { value: 'all', label: 'Equipo: Todos' },
    ...teams.map((team) => ({ value: String(team.id), label: team.name })),
  ];
  const seasonOptions = [{ value: season.label, label: `Temporada ${season.label}` }];

  function handleSelect(id) {
    setQuery('');
    setSearchText('');
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
                  <span className="player-data__suggestion-team">{item.team?.name}</span>
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
        options={teamOptions}
        value={teamId}
        onChange={handleTeamChange}
      />
      <Select size="sm" label="Temporada" hideLabel options={seasonOptions} value={season.label} onChange={() => {}} />
    </div>
  );
}
