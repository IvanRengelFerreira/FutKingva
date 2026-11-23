import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Tabs from '../../components/Tabs/Tabs.jsx';
import { searchTeams, searchPlayers } from './search.js';
import TeamResults from './TeamResults.jsx';
import PlayerResults from './PlayerResults.jsx';
import searchIcon from '../../assets/icon-search-gold.svg';
import clearIcon from '../../assets/icon-clear.svg';
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

  // Si se busca otra cosa desde la navbar, el campo y la pestaña se ponen al día en este mismo render
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setText(query);
    setTab('all');
  }

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
        <button type="submit" className="search-results__submit">
          Buscar
        </button>
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
                Prueba con otro nombre o busca en <Link to="/arbitros">árbitros</Link> y{' '}
                <Link to="/analisis">análisis</Link>.
              </p>
            </div>
          ) : (
            <>
              <Tabs label="Filtrar resultados" tabs={tabs} active={tab} onChange={setTab} />

              {showTeams && teams.length > 0 && <TeamResults teams={teams} query={query} />}
              {showPlayers && players.length > 0 && <PlayerResults players={players} query={query} />}
            </>
          )}
        </>
      )}
    </section>
  );
}
