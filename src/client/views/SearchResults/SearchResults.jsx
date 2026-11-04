import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import { getTeam } from '../../data/mockData.js';
import { searchTeams, searchPlayers, splitMatch } from './search.js';
import searchIcon from '../../assets/icon-search-gold.svg';
import clearIcon from '../../assets/icon-clear.svg';
import chevronIcon from '../../assets/icon-chevron-right-lg.svg';
import './SearchResults.css';

// 13 · Resultados de búsqueda (RF10): equipos y jugadores cuyo nombre contiene el texto buscado,
// con la parte que coincide en oro. El texto va en la dirección (/buscar?q=ra): llega desde el buscador
// de la navbar y se puede cambiar aquí. Pestañas: Todos · Equipos · Jugadores (con cuántos hay).
// En móvil, equipos y jugadores van en tarjetas con flecha en vez de en tabla.
// Diseño: Figma › Mockups › 13 · Resultados de búsqueda
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-860
export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const [text, setText] = useState(query);
  const [tab, setTab] = useState('all');
  const inputRef = useRef(null);

  // Si se busca otra cosa desde la navbar, el campo y la pestaña se ponen al día
  useEffect(() => {
    setText(query);
    setTab('all');
  }, [query]);

  const teams = searchTeams(query);
  const players = searchPlayers(query);
  const total = teams.length + players.length;

  function handleSubmit(event) {
    event.preventDefault();
    const value = text.trim();
    setSearchParams(value ? { q: value } : {});
  }

  function handleClear() {
    setText('');
    inputRef.current?.focus();
  }

  const tabs = [
    { id: 'all', label: `Todos (${total})` },
    { id: 'teams', label: `Equipos (${teams.length})` },
    { id: 'players', label: `Jugadores (${players.length})` },
  ];
  const showTeams = tab !== 'players';
  const showPlayers = tab !== 'teams';

  return (
    <section className="page search-results">
      <form className="search-results__form" role="search" onSubmit={handleSubmit}>
        <div className="search-results__field">
          <img src={searchIcon} alt="" width="17" height="17" />
          <input
            ref={inputRef}
            type="search"
            className="search-results__input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Buscar equipos y jugadores…"
            aria-label="Buscar equipos y jugadores"
          />
          {text && (
            <button type="button" className="search-results__clear" onClick={handleClear} aria-label="Borrar búsqueda">
              <img src={clearIcon} alt="" width="16" height="16" />
            </button>
          )}
        </div>
        <button type="submit" className="search-results__submit">Buscar</button>
      </form>

      {!query ? (
        <header className="page-header">
          <div className="page-header__text">
            <p className="page-header__eyebrow">Búsqueda</p>
            <h1 className="page-header__title">Buscar</h1>
            <p className="page-header__subtitle">Escribe el nombre de un equipo o de un jugador.</p>
          </div>
        </header>
      ) : (
        <>
          <header className="page-header">
            <div className="page-header__text">
              <p className="page-header__eyebrow search-results__desktop">Búsqueda</p>
              <h1 className="page-header__title search-results__title">
                <span className="search-results__desktop">
                  Resultados para «{query}» · {total} {total === 1 ? 'coincidencia' : 'coincidencias'}
                </span>
                <span className="search-results__mobile">
                  «{query}» · {total} {total === 1 ? 'resultado' : 'resultados'}
                </span>
              </h1>
            </div>
          </header>

          {total === 0 ? (
            <div className="search-results__empty">
              <p>No hay equipos ni jugadores que coincidan con «{query}».</p>
              <p>
                Prueba con otro nombre o busca en <Link to="/arbitros">árbitros</Link> y <Link to="/analisis">análisis</Link>.
              </p>
            </div>
          ) : (
            <>
              <Tabs label="Filtrar resultados" tabs={tabs} active={tab} onChange={setTab} />

              {showTeams && teams.length > 0 && (
                <section className="search-results__section" aria-labelledby="search-teams-title">
                  <h2 id="search-teams-title" className="search-results__section-title">Equipos</h2>
                  <ul className="search-results__teams">
                    {teams.map((team) => (
                      <li key={team.id}>
                        <Link className="search-results__card" to={`/equipos/${team.id}`}>
                          <Crest teamId={team.id} size={48} className="search-results__desktop-flex" />
                          <Crest teamId={team.id} size={40} className="search-results__mobile-flex" />
                          <span className="search-results__card-text">
                            <Highlighted name={team.name} query={query} className="search-results__card-name" />
                            <span className="search-results__card-meta">
                              {team.competition} · España · {team.position}.º
                            </span>
                          </span>
                          <span className="search-results__see search-results__desktop">Ver ficha →</span>
                          <img className="search-results__mobile-flex" src={chevronIcon} alt="" width="18" height="18" />
                        </Link>
                      </li>
                    ))}
                    <li className="search-results__also search-results__desktop-flex">
                      Busca también en&nbsp;<Link to="/arbitros">árbitros</Link>&nbsp;y&nbsp;<Link to="/analisis">análisis</Link>&nbsp;→
                    </li>
                  </ul>
                </section>
              )}

              {showPlayers && players.length > 0 && (
                <section className="search-results__section" aria-labelledby="search-players-title">
                  <div className="search-results__section-header">
                    <h2 id="search-players-title" className="search-results__section-title">Jugadores</h2>
                    <span className="search-results__order search-results__desktop">Ordenar: relevancia</span>
                  </div>

                  <div className="search-results__table-wrapper search-results__desktop-block">
                    <table className="search-results__table">
                      <caption className="search-results__sr-only">Jugadores que coinciden con «{query}»</caption>
                      <thead>
                        <tr>
                          <th scope="col">Jugador</th>
                          <th scope="col" className="search-results__team-col">Equipo</th>
                          <th scope="col" className="search-results__position-col">Posición</th>
                          <th scope="col" className="search-results__num">Goles</th>
                          <th scope="col" className="search-results__num search-results__num--wide">Asistencias</th>
                          <th scope="col" className="search-results__link-col"><span className="search-results__sr-only">Ficha</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((player) => {
                          const team = getTeam(player.teamId);
                          return (
                            <tr key={player.id}>
                              <th scope="row">
                                <span className="search-results__player">
                                  <Avatar name={player.name} size={34} color={team?.color} />
                                  <Highlighted name={player.name} query={query} className="search-results__player-name" />
                                </span>
                              </th>
                              <td className="search-results__team-col">
                                <Link className="search-results__team" to={`/equipos/${player.teamId}`}>
                                  <Crest teamId={player.teamId} size={22} />
                                  {team?.name}
                                </Link>
                              </td>
                              <td className="search-results__position-col">{player.position}</td>
                              <td className="search-results__num search-results__big">{player.goals ?? 0}</td>
                              <td className="search-results__num search-results__num--wide search-results__big">{player.assists ?? 0}</td>
                              <td className="search-results__link-col">
                                <Link className="search-results__see" to={`/jugadores/${player.id}`} aria-label={`Ver ficha de ${player.name}`}>
                                  Ver ficha →
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <ul className="search-results__list search-results__mobile-block">
                    {players.map((player) => {
                      const team = getTeam(player.teamId);
                      return (
                        <li key={player.id}>
                          <Link className="search-results__card" to={`/jugadores/${player.id}`}>
                            <Avatar name={player.name} size={40} color={team?.color} />
                            <span className="search-results__card-text">
                              <Highlighted name={player.name} query={query} className="search-results__card-name" />
                              <span className="search-results__card-meta">
                                {team?.code} · {player.position} · {player.goals ?? 0} G · {player.assists ?? 0} A
                              </span>
                            </span>
                            <img src={chevronIcon} alt="" width="18" height="18" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

// Nombre con la parte que coincide con la búsqueda en oro
function Highlighted({ name, query, className }) {
  return (
    <span className={className}>
      {splitMatch(name, query).map((part, i) =>
        part.match ? <mark key={i} className="search-results__match">{part.text}</mark> : <span key={i}>{part.text}</span>
      )}
    </span>
  );
}
