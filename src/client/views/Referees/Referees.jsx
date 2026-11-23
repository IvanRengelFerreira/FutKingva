import { useState } from 'react';
import LeagueSeasonFilters from '../../components/LeagueSeasonFilters/LeagueSeasonFilters.jsx';
import Button from '../../components/Button/Button.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import usePagedList from '../../hooks/usePagedList.js';
import { SEASON } from '../../data/mockData.js';
import { SORTS, getRefereeRows } from './refereesData.js';
import RefereeTable from './RefereeTable.jsx';
import RefereeList from './RefereeList.jsx';
import './Referees.css';

// 06 · Árbitros (RF11): árbitros de LaLiga con sus partidos, tarjetas por partido, rojas y penaltis.
// Escritorio: tabla con una barra de tarjetas por partido; móvil: tarjetas con «Cargar más».
// El buscador filtra mientras se escribe (sin tildes ni mayúsculas) y «Ordenar» cambia el orden.
// Solo hay datos de LaLiga 2026/27: los desplegables de liga y temporada tienen una sola opción.
// Diseño: Figma › Mockups › 06 · Árbitros
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-355

const PER_PAGE = 10;
const MOBILE_STEP = 6;

export default function Referees() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(SORTS[0].value);

  const referees = getRefereeRows(query, sort);
  const {
    page,
    setPage,
    totalPages,
    pageItems: pageRows,
    mobileItems: mobileRows,
    hasMore,
    loadMore,
    resetPaging,
    resetPage,
  } = usePagedList(referees, { perPage: PER_PAGE, mobileStep: MOBILE_STEP });

  function changeQuery(value) {
    setQuery(value);
    resetPaging();
  }

  // Al ordenar solo se vuelve a la primera página (el «Cargar más» del móvil se conserva)
  function changeSort(event) {
    setSort(event.target.value);
    resetPage();
  }

  return (
    <section className="page referees">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            LaLiga · <span className="referees__desktop">Temporada </span>
            {SEASON}
          </p>
          <h1 className="page-header__title">Árbitros</h1>
          <p className="page-header__subtitle">Estadísticas de los árbitros de cada competición.</p>
        </div>
      </header>

      <LeagueSeasonFilters
        classPrefix="referees"
        searchLabel="Buscar árbitro"
        query={query}
        onQueryChange={changeQuery}
        sortOptions={SORTS.map((item) => ({ value: item.value, label: `Ordenar: ${item.label}` }))}
        sortValue={sort}
        onSortChange={changeSort}
      />

      {referees.length === 0 ? (
        <p className="referees__empty">No hay árbitros que coincidan con «{query}».</p>
      ) : (
        <>
          <RefereeTable referees={pageRows} />
          <RefereeList referees={mobileRows} />
        </>
      )}

      <Pagination className="referees__desktop-flex" page={page} totalPages={totalPages} onChange={setPage} />

      {hasMore && (
        <Button variant="tertiary" className="referees__more referees__mobile-flex" onClick={loadMore}>
          Cargar más
        </Button>
      )}
    </section>
  );
}
