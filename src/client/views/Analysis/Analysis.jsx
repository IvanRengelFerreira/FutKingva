import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Button from '../../components/Button/Button.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import Illustration from '../../components/Illustration/Illustration.jsx';
import ArticleCard from '../../components/ArticleCard/ArticleCard.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import usePagedList from '../../hooks/usePagedList.js';
import { useApi } from '../../services/useApi.js';
import { getArticles } from '../../services/articles.js';
import { numericDate } from '../../services/format.js';
import { cardProps, readingLabel } from '../../components/ArticleCard/cardProps.js';
import { coverProps } from '../../components/Illustration/coverProps.js';
import searchIcon from '../../assets/icon-search-small.svg';
import './Analysis.css';

// 08 · Análisis: artículos publicados por los editores (GET /api/articles).
// Arriba, el destacado (el último publicado con la etiqueta «Destacado»); debajo, «Últimos análisis»
// (los demás publicados, del más reciente al más antiguo), que se filtran con los chips y el buscador.
// Los borradores y los programados no salen: solo se ven en el Panel de editor (17).
// Diseño: Figma › Mockups › 08 · Análisis
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-489

// Chips de categoría: el texto del chip y la categoría que enseña (null = todas)
const CATEGORIES = [
  { label: 'Todos', category: null },
  { label: 'Previas', category: 'Previa' },
  { label: 'Crónicas', category: 'Crónica' },
  { label: 'Táctica', category: 'Táctica' },
  { label: 'Datos', category: 'Datos' },
];

const PER_PAGE = 6;
const MOBILE_STEP = 5; // En móvil se enseñan 5 y «Cargar más» añade otros 5 (como en Figma)
const MAX_ARTICLES = 100; // Se piden todos de una vez (pocos): la paginación y «Cargar más» van en el navegador
const SEARCH_DELAY_MS = 250; // Espera a que se deje de escribir para no pedir en cada letra

export default function Analysis() {
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [searchText, setSearchText] = useState(''); // `query` tras la espera

  useEffect(() => {
    const timer = setTimeout(() => setSearchText(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Sin filtros, el destacado va arriba y no se repite en la lista. Al buscar o elegir categoría, el destacado
  // se oculta y entra en los resultados como uno más (si no, buscar «Pedri» decía «No hay análisis»).
  const filtering = Boolean(category || searchText);
  const { data, error, loading, reload } = useApi(
    (signal) =>
      getArticles(
        { category, q: searchText, excludeFeatured: filtering ? undefined : 'true', limit: MAX_ARTICLES },
        { signal },
      ),
    [category, searchText, filtering],
  );
  const featured = filtering ? null : data?.featured;
  const results = data?.items ?? [];

  const {
    page,
    setPage,
    totalPages,
    pageItems: visible,
    mobileItems,
    hasMore,
    loadMore,
    resetPaging,
  } = usePagedList(results, { perPage: PER_PAGE, mobileStep: MOBILE_STEP });

  // Al cambiar el filtro o la búsqueda se vuelve a la primera página
  function changeCategory(value) {
    setCategory(value);
    resetPaging();
  }

  function changeQuery(event) {
    setQuery(event.target.value);
    resetPaging();
  }

  return (
    <section className="page analysis">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">Artículos de los editores</p>
          <h1 className="page-header__title">Análisis</h1>
          <p className="page-header__subtitle">Artículos y contenido publicado por los editores de FutKingva.</p>
        </div>
      </header>

      <div className="analysis__toolbar">
        <div className="analysis__chips" role="group" aria-label="Filtrar por categoría">
          {CATEGORIES.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`analysis__chip${item.category === category ? ' analysis__chip--active' : ''}`}
              aria-pressed={item.category === category}
              onClick={() => changeCategory(item.category)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <TextField
          className="analysis__search"
          size="sm"
          type="search"
          label="Buscar análisis"
          hideLabel
          placeholder="Buscar análisis…"
          icon={searchIcon}
          value={query}
          onChange={changeQuery}
        />
      </div>

      {featured && (
        <article className="analysis__featured">
          <Illustration
            className="analysis__featured-illustration"
            type={featured.category}
            {...coverProps(featured)}
          />
          <div className="analysis__featured-body">
            <div className="analysis__featured-tags">
              <Tag featured>Destacado</Tag>
              <Tag category={featured.category} />
            </div>
            <h2 className="analysis__featured-title">
              <Link className="analysis__featured-link" to={`/analisis/${featured.id}`}>
                {featured.title}
              </Link>
            </h2>
            <p className="analysis__featured-excerpt">{featured.summary}</p>
            <p className="analysis__featured-meta">
              {featured.author?.name}
              {/* En móvil, sin la fecha (como en Figma) */}
              <span className="analysis__desktop-only"> · {numericDate(featured.publishedAt)}</span>
              {featured.readingMinutes > 0 && ` · ${readingLabel(featured.readingMinutes)}`}
            </p>
            <Button className="analysis__featured-button" to={`/analisis/${featured.id}`}>
              Leer análisis
            </Button>
          </div>
        </article>
      )}

      <div className="analysis__latest">
        <div className="analysis__latest-header">
          <h2 className="analysis__latest-title">Últimos análisis</h2>
          <p className="analysis__sort">Ordenar: más recientes</p>
        </div>

        {error ? (
          <ErrorState error={error} title="No se han podido cargar los análisis" onRetry={reload} />
        ) : loading && !data ? (
          <LoadingState label="Cargando análisis…" />
        ) : visible.length > 0 ? (
          <>
            {/* Escritorio: rejilla de 3 columnas con paginación */}
            <div className="analysis__grid">
              {visible.map((article) => (
                <ArticleCard key={article.id} {...cardProps(article)} />
              ))}
            </div>

            {/* Móvil: lista compacta con «Cargar más» */}
            <div className="analysis__list">
              {mobileItems.map((article) => (
                <ArticleCard key={article.id} {...cardProps(article)} layout="compact" />
              ))}
              {hasMore && (
                <Button variant="tertiary" className="analysis__more" onClick={loadMore}>
                  Cargar más
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="analysis__empty">
            {filtering ? 'No hay análisis que coincidan con tu búsqueda.' : 'Todavía no hay análisis publicados.'}
          </p>
        )}

        <div className="analysis__desktop-only">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} label="Páginas de análisis" />
        </div>
      </div>
    </section>
  );
}
