import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import SearchMatches from './SearchMatches.jsx';
import searchIcon from '../../assets/icon-search-gold.svg';
import clearIcon from '../../assets/icon-clear.svg';
import './SearchResults.css';

// 13 · Resultados de búsqueda (RF10): equipos y jugadores cuyo nombre contiene el texto buscado,
// con la parte que coincide en oro. El texto va en la dirección (/buscar?q=ra): llega desde el buscador
// de la navbar y se puede cambiar aquí. Pestañas: Todos · Equipos · Jugadores (con cuántos hay).
// Los datos son de la API (GET /api/teams y /api/players), que busca sin tildes ni mayúsculas. Los equipos
// salen todos, por puesto; los jugadores, por valoración y paginados («Cargar más» en móvil).
// En móvil, equipos y jugadores van en tarjetas con flecha en vez de en tabla.
// Diseño: Figma › Mockups › 13 · Resultados de búsqueda
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-860
export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const [text, setText] = useState(query);
  const inputRef = useRef(null);

  // Si se busca otra cosa desde la navbar, el campo se pone al día en este mismo render
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setText(query);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const value = text.trim();
    setSearchParams(value ? { q: value } : {});
  }

  function handleClear() {
    setText('');
    inputRef.current?.focus();
  }

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

      {query ? (
        <SearchMatches key={query} query={query} />
      ) : (
        <header className="page-header">
          <div className="page-header__text">
            <p className="page-header__eyebrow">Búsqueda</p>
            <h1 className="page-header__title">Buscar</h1>
            <p className="page-header__subtitle">Escribe el nombre de un equipo o de un jugador.</p>
          </div>
        </header>
      )}
    </section>
  );
}
