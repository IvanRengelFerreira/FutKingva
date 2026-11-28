import { useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useDebouncedSearch } from '../Teams/useDebouncedSearch.js';
import { useRefereesResults } from './useRefereesResults.js';
import RefereeFilters from './RefereeFilters.jsx';
import RefereeTable from './RefereeTable.jsx';
import RefereeList from './RefereeList.jsx';
import './Referees.css';

// 06 · Árbitros (RF11): árbitros de LaLiga con sus partidos, tarjetas por partido, rojas y penaltis.
// Escritorio: tabla con una barra de tarjetas por partido; móvil: tarjetas con «Cargar más».
// Los datos son de la API (GET /api/referees): el servidor busca, ordena y pagina. El buscador pide mientras
// se escribe (sin tildes ni mayúsculas). Se empieza en la última temporada con estadísticas de árbitros
// (la dice la cabecera) y se puede elegir otra. Solo hay datos de LaLiga: el desplegable de liga tiene una opción.
// Diseño: Figma › Mockups › 06 · Árbitros
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-355

// Los valores son los de ?sort= en la API; el primero es el de partida
const SORTS = [
  { value: 'cardsPerMatch', label: 'Tarjetas / partido' },
  { value: 'matches', label: 'Partidos' },
  { value: 'redCards', label: 'Rojas' },
  { value: 'penalties', label: 'Penaltis' },
  { value: 'name', label: 'Nombre' },
];

const SORT_OPTIONS = SORTS.map((item) => ({ value: item.value, label: `Ordenar: ${item.label}` }));

export default function Referees() {
  const [season, setSeason] = useState(''); // '' = la que elija la API
  const [sort, setSort] = useState(SORTS[0].value);
  const { query, search, changeQuery } = useDebouncedSearch();
  const results = useRefereesResults({ season, search, sort });
  const { data } = results;

  return (
    <section className="page referees">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            LaLiga
            {data && (
              <>
                {' '}
                · <span className="referees__desktop">Temporada </span>
                {data.season.label}
              </>
            )}
          </p>
          <h1 className="page-header__title">Árbitros</h1>
          <p className="page-header__subtitle">Estadísticas de los árbitros de cada competición.</p>
        </div>
      </header>

      <RefereeFilters
        query={query}
        onQueryChange={changeQuery}
        seasons={data?.seasons ?? []}
        shownSeason={data?.season}
        season={season}
        onSeasonChange={setSeason}
        sort={{ options: SORT_OPTIONS, value: sort, onChange: setSort }}
      />

      <Results results={results} />

      <Pagination
        className="referees__desktop-flex"
        page={results.page}
        totalPages={results.totalPages}
        onChange={results.setPage}
      />

      {results.hasMore && (
        <Button
          variant="tertiary"
          className="referees__more referees__mobile-flex"
          onClick={results.loadMore}
          disabled={results.loading}
        >
          Cargar más
        </Button>
      )}
    </section>
  );
}

// La lista, con los avisos de carga, de error y de «sin resultados».
// Si falla un «Cargar más», lo ya cargado se queda y el aviso sale debajo.
function Results({ results }) {
  const { data, items, error, loading, reload } = results;

  if (loading && items.length === 0) return <LoadingState label="Cargando árbitros…" />;
  if (!error && items.length === 0) {
    return (
      <p className="referees__empty">
        {data?.search
          ? `No hay árbitros que coincidan con «${data.search}».`
          : `Todavía no hay estadísticas de árbitros de la temporada ${data?.season.label}.`}
      </p>
    );
  }

  return (
    <>
      {items.length > 0 && (
        <>
          <RefereeTable referees={items} season={data?.season} />
          <RefereeList referees={items} season={data?.season} />
        </>
      )}
      {error && <ErrorState error={error} title="No se han podido cargar los árbitros" onRetry={reload} />}
    </>
  );
}
