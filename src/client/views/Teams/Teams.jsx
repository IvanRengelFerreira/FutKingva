import { useState } from 'react';
import { useUserData } from '../../context/UserDataContext.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import LeagueSeasonFilters from '../../components/LeagueSeasonFilters/LeagueSeasonFilters.jsx';
import Button from '../../components/Button/Button.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import usePagedList from '../../hooks/usePagedList.js';
import { SEASON } from '../../data/mockData.js';
import { TEAM_SORTS, PLAYER_SORTS, getTeamRows, getPlayerRows } from './teamsData.js';
import TeamGrid from './TeamGrid.jsx';
import PlayerList from './PlayerList.jsx';
import './Teams.css';

// 02 · Equipos y jugadores: buscador y fichas de equipos y jugadores (RF2).
// Pestaña Equipos: rejilla de tarjetas (escudo, puesto, puntos, forma, «Ver ficha») con paginación;
// en móvil, lista con «Cargar más». Pestaña Jugadores: tabla (tarjetas en móvil).
// El buscador filtra mientras se escribe (sin tildes ni mayúsculas). Solo hay datos de LaLiga 2026/27,
// así que los desplegables de liga y temporada tienen una sola opción.
// La estrella marca un equipo como favorito (sale en Mi perfil); sin sesión lleva a Acceso y al entrar vuelve aquí.
// Diseño: Figma › Mockups › 02 · Equipos y jugadores
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-87

const TABS = [
  { id: 'teams', label: 'Equipos' },
  { id: 'players', label: 'Jugadores' },
];

const PER_PAGE = { teams: 12, players: 10 };
const MOBILE_STEP = 7; // «Cargar más» en móvil

export default function Teams() {
  const [tab, setTab] = useState('teams');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ teams: TEAM_SORTS[0].value, players: PLAYER_SORTS[0].value });
  const { favoriteTeams: favorites, toggleFavoriteTeam } = useUserData();

  const rows = tab === 'teams' ? getTeamRows(query, sort.teams) : getPlayerRows(query, sort.players);
  const {
    page,
    setPage,
    totalPages,
    pageItems: pageRows,
    mobileItems: mobileRows,
    hasMore,
    loadMore,
    resetPaging,
  } = usePagedList(rows, { perPage: PER_PAGE[tab], mobileStep: MOBILE_STEP });

  // Al cambiar de pestaña, de búsqueda o de orden se vuelve al principio (resetPaging)
  function changeTab(value) {
    setTab(value);
    setQuery('');
    resetPaging();
  }

  function changeQuery(value) {
    setQuery(value);
    resetPaging();
  }

  function changeSort(event) {
    setSort({ ...sort, [tab]: event.target.value });
    resetPaging();
  }

  const nouns = tab === 'teams' ? ['equipo', 'equipos'] : ['jugador', 'jugadores'];
  const noun = rows.length === 1 ? nouns[0] : nouns[1];

  let results;
  if (rows.length === 0) {
    results = (
      <p className="teams__empty">
        No hay {tab === 'teams' ? 'equipos' : 'jugadores'} que coincidan con «{query}».
      </p>
    );
  } else if (tab === 'teams') {
    results = (
      <TeamGrid rows={pageRows} mobileRows={mobileRows} favorites={favorites} onToggleFavorite={toggleFavoriteTeam} />
    );
  } else {
    results = <PlayerList rows={pageRows} mobileRows={mobileRows} />;
  }

  return (
    <section className="page teams">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            Temporada {SEASON}
            <span className="teams__desktop"> · LaLiga · 20 equipos</span>
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
        sortOptions={(tab === 'teams' ? TEAM_SORTS : PLAYER_SORTS).map((item) => ({
          value: item.value,
          label: `Ordenar: ${item.label}`,
        }))}
        sortValue={sort[tab]}
        onSortChange={changeSort}
      />

      <div className="teams__summary">
        <p className="teams__count" aria-live="polite">
          {rows.length} {noun} en LaLiga
        </p>
        {query.trim() && (
          <button
            type="button"
            className="teams__chip"
            onClick={() => changeQuery('')}
            aria-label={`Quitar la búsqueda «${query}»`}
          >
            «{query}» ×
          </button>
        )}
      </div>

      {results}

      <Pagination className="teams__desktop-flex" page={page} totalPages={totalPages} onChange={setPage} />

      {hasMore && (
        <Button variant="tertiary" className="teams__more teams__mobile-flex" onClick={loadMore}>
          Cargar más
        </Button>
      )}
    </section>
  );
}
