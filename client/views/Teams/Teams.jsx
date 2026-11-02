import { useState } from 'react';
import Tabs from '../../components/Tabs/Tabs.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Button from '../../components/Button/Button.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import { SEASON } from '../../data/mockData.js';
import { TEAM_SORTS, PLAYER_SORTS, getTeamRows, getPlayerRows } from './teamsData.js';
import TeamGrid from './TeamGrid.jsx';
import PlayerList from './PlayerList.jsx';
import searchIcon from '../../assets/icon-search-small.svg';
import './Teams.css';

// 02 · Equipos y jugadores: buscador y fichas de equipos y jugadores (RF2).
// Pestaña Equipos: rejilla de tarjetas (escudo, puesto, puntos, forma, «Ver ficha») con paginación;
// en móvil, lista con «Cargar más». Pestaña Jugadores: tabla (tarjetas en móvil).
// El buscador filtra mientras se escribe (sin tildes ni mayúsculas). Solo hay datos de LaLiga 2026/27,
// así que los desplegables de liga y temporada tienen una sola opción.
// La estrella marca un equipo como favorito (sin sesión lleva a Acceso; no se guarda: no hay servidor).
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
  const [page, setPage] = useState(1);
  const [mobileCount, setMobileCount] = useState(MOBILE_STEP);
  const [favorites, setFavorites] = useState([]);

  const rows = tab === 'teams' ? getTeamRows(query, sort.teams) : getPlayerRows(query, sort.players);
  const totalPages = Math.ceil(rows.length / PER_PAGE[tab]);
  const pageRows = rows.slice((page - 1) * PER_PAGE[tab], page * PER_PAGE[tab]);
  const mobileRows = rows.slice(0, mobileCount);

  // Al cambiar de pestaña, de búsqueda o de orden se vuelve al principio
  function resetPaging() {
    setPage(1);
    setMobileCount(MOBILE_STEP);
  }

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

  function toggleFavorite(teamId) {
    setFavorites(favorites.includes(teamId) ? favorites.filter((id) => id !== teamId) : [...favorites, teamId]);
  }

  const noun = tab === 'teams' ? (rows.length === 1 ? 'equipo' : 'equipos') : (rows.length === 1 ? 'jugador' : 'jugadores');

  return (
    <section className="page teams">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            Temporada {SEASON}<span className="teams__desktop"> · LaLiga · 20 equipos</span>
          </p>
          <h1 className="page-header__title">Equipos y jugadores</h1>
          <p className="page-header__subtitle">
            <span className="teams__desktop">Busca y consulta las fichas de los equipos y jugadores de LaLiga.</span>
            <span className="teams__mobile">Busca y consulta las fichas de equipos y jugadores.</span>
          </p>
        </div>
      </header>

      <Tabs label="Equipos o jugadores" tabs={TABS} active={tab} onChange={changeTab} />

      <form className="teams__filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <TextField
          className="teams__search"
          size="sm"
          label="Buscar por nombre"
          hideLabel
          icon={searchIcon}
          placeholder="Buscar por nombre…"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
        />
        {/* Escritorio «Liga: LaLiga» / «Temporada 2026/27»; móvil, textos cortos como en el mockup */}
        <Select className="teams__filter teams__desktop-block" size="sm" label="Liga" hideLabel options={[{ value: 'laliga', label: 'Liga: LaLiga' }]} />
        <Select className="teams__filter teams__desktop-block" size="sm" label="Temporada" hideLabel options={[{ value: SEASON, label: `Temporada ${SEASON}` }]} />
        <Select className="teams__filter teams__mobile-flex" size="sm" label="Liga" hideLabel options={[{ value: 'laliga', label: 'LaLiga' }]} />
        <Select className="teams__filter teams__mobile-flex" size="sm" label="Temporada" hideLabel options={[{ value: SEASON, label: SEASON }]} />
        <Select
          className="teams__filter teams__filter--sort"
          size="sm"
          label="Ordenar"
          hideLabel
          options={(tab === 'teams' ? TEAM_SORTS : PLAYER_SORTS).map((item) => ({ value: item.value, label: `Ordenar: ${item.label}` }))}
          value={sort[tab]}
          onChange={changeSort}
        />
        <Button type="submit" className="teams__submit">Buscar</Button>
      </form>

      <div className="teams__summary">
        <p className="teams__count" aria-live="polite">
          {rows.length} {noun} en LaLiga
        </p>
        {query && (
          <button type="button" className="teams__chip" onClick={() => changeQuery('')} aria-label={`Quitar la búsqueda «${query}»`}>
            «{query}» ×
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="teams__empty">No hay {tab === 'teams' ? 'equipos' : 'jugadores'} que coincidan con «{query}».</p>
      ) : tab === 'teams' ? (
        <TeamGrid
          rows={pageRows}
          mobileRows={mobileRows}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      ) : (
        <PlayerList rows={pageRows} mobileRows={mobileRows} />
      )}

      <Pagination className="teams__desktop-flex" page={page} totalPages={totalPages} onChange={setPage} />

      {mobileCount < rows.length && (
        <Button variant="tertiary" className="teams__more teams__mobile-flex" onClick={() => setMobileCount(mobileCount + MOBILE_STEP)}>
          Cargar más
        </Button>
      )}
    </section>
  );
}
