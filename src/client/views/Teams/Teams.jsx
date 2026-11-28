import { useState } from 'react';
import { useUserData } from '../../context/UserDataContext.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import LeagueSeasonFilters from '../../components/LeagueSeasonFilters/LeagueSeasonFilters.jsx';
import Button from '../../components/Button/Button.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useTeamsResults } from './useTeamsResults.js';
import { useDebouncedSearch } from './useDebouncedSearch.js';
import TeamGrid from './TeamGrid.jsx';
import PlayerList from './PlayerList.jsx';
import './Teams.css';

// 02 · Equipos y jugadores: buscador y fichas de equipos y jugadores (RF2).
// Pestaña Equipos: rejilla de tarjetas (escudo, puesto, puntos, forma, «Ver ficha») con paginación;
// en móvil, lista con «Cargar más». Pestaña Jugadores: tabla (tarjetas en móvil).
// Los datos son de la API (GET /api/teams y /api/players): el servidor busca, ordena y pagina. El buscador
// pide mientras se escribe (sin tildes ni mayúsculas). Solo hay datos de LaLiga, así que el desplegable de liga
// tiene una sola opción; el de temporada trae las de la API (por defecto la actual) y se mantiene al cambiar
// de pestaña. En Jugadores salen solo los de la plantilla de esa temporada.
// La estrella marca un equipo como favorito (sale en Mi perfil); sin sesión lleva a Acceso y al entrar vuelve aquí.
// Diseño: Figma › Mockups › 02 · Equipos y jugadores
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-87

const TABS = [
  { id: 'teams', label: 'Equipos' },
  { id: 'players', label: 'Jugadores' },
];

// Los valores son los de ?sort= en la API; el primero de cada lista es el de partida
const SORTS = {
  teams: [
    { value: 'standings', label: 'Clasificación' },
    { value: 'name', label: 'Nombre' },
    { value: 'goals', label: 'Goles a favor' },
  ],
  players: [
    { value: 'rating', label: 'Valoración' },
    { value: 'goals', label: 'Goles' },
    { value: 'assists', label: 'Asistencias' },
    { value: 'name', label: 'Nombre' },
  ],
};

const NOUNS = {
  teams: { one: 'equipo', many: 'equipos' },
  players: { one: 'jugador', many: 'jugadores' },
};

const LALIGA_TEAMS = 20;

export default function Teams() {
  const [tab, setTab] = useState('teams');
  const [sort, setSort] = useState({ teams: SORTS.teams[0].value, players: SORTS.players[0].value });
  const [season, setSeason] = useState(''); // '' = la que elija la API (la actual)
  const { query, search, changeQuery, clearQuery } = useDebouncedSearch();
  const results = useTeamsResults({ tab, season, search, sort: sort[tab] });
  const { data } = results;

  // Cada pestaña empieza sin búsqueda
  function changeTab(value) {
    setTab(value);
    clearQuery();
  }

  function changeSort(event) {
    setSort({ ...sort, [tab]: event.target.value });
  }

  return (
    <section className="page teams">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            {data ? `Temporada ${data.season.label}` : 'LaLiga'}
            {data && <span className="teams__desktop"> · LaLiga · {LALIGA_TEAMS} equipos</span>}
          </p>
          <h1 className="page-header__title">Equipos y jugadores</h1>
          <p className="page-header__subtitle">
            <span className="teams__desktop">Busca y consulta las fichas de los equipos y jugadores de LaLiga.</span>
            <span className="teams__mobile">Busca y consulta las fichas de equipos y jugadores.</span>
          </p>
        </div>
      </header>

      <Tabs label="Equipos o jugadores" tabs={TABS} active={tab} onChange={changeTab} />

      <LeagueSeasonFilters
        classPrefix="teams"
        searchLabel="Buscar por nombre"
        query={query}
        onQueryChange={changeQuery}
        seasons={data?.seasons ?? []}
        shownSeason={data?.season}
        season={season}
        onSeasonChange={setSeason}
        sortOptions={SORTS[tab].map((item) => ({ value: item.value, label: `Ordenar: ${item.label}` }))}
        sortValue={sort[tab]}
        onSortChange={changeSort}
      />

      <div className="teams__summary">
        <p className="teams__count" aria-live="polite">
          {data && `${data.total} ${data.total === 1 ? NOUNS[tab].one : NOUNS[tab].many} en LaLiga`}
        </p>
        {query.trim() && (
          <button
            type="button"
            className="teams__chip"
            onClick={clearQuery}
            aria-label={`Quitar la búsqueda «${query}»`}
          >
            «{query}» ×
          </button>
        )}
      </div>

      <Results tab={tab} results={results} />

      <Pagination
        className="teams__desktop-flex"
        page={results.page}
        totalPages={results.totalPages}
        onChange={results.setPage}
      />

      {results.hasMore && (
        <Button
          variant="tertiary"
          className="teams__more teams__mobile-flex"
          onClick={results.loadMore}
          disabled={results.loading}
        >
          Cargar más
        </Button>
      )}
    </section>
  );
}

// La lista de la pestaña, con los avisos de carga, de error y de «sin resultados».
// Si falla un «Cargar más», lo ya cargado se queda y el aviso sale debajo.
function Results({ tab, results }) {
  const { data, items, error, loading, reload } = results;
  const { favoriteTeams, toggleFavoriteTeam } = useUserData();
  const noun = NOUNS[tab].many;

  if (loading && items.length === 0) return <LoadingState label={`Cargando ${noun}…`} />;
  if (!error && items.length === 0) {
    return (
      <p className="teams__empty">
        {data?.search ? `No hay ${noun} que coincidan con «${data.search}».` : `Todavía no hay ${noun}.`}
      </p>
    );
  }

  return (
    <>
      {items.length > 0 &&
        (tab === 'teams' ? (
          <TeamGrid teams={items} favorites={favoriteTeams} onToggleFavorite={toggleFavoriteTeam} />
        ) : (
          <PlayerList players={items} />
        ))}
      {error && <ErrorState error={error} title={`No se han podido cargar los ${noun}`} onRetry={reload} />}
    </>
  );
}
