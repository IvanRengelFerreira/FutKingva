import { useEffect, useState } from 'react';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import Button from '../../components/Button/Button.jsx';
import StatCard from '../../components/StatCard/StatCard.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useApi } from '../../services/useApi.js';
import { deleteArticle, getMyArticles } from '../../services/articles.js';
import syncIcon from '../../assets/icon-sync.svg';
import plusIcon from '../../assets/icon-plus-dark.svg';
import searchIcon from '../../assets/icon-search-small.svg';
import './EditorDashboard.css';
import ArticleRow from './ArticleRow.jsx';
import ArticleCard from './ArticleCard.jsx';
import { formatNumber, visitsTrend } from './formatNumber.js';

// 17 · Panel de editor (RF7): indicadores y tabla «Mis artículos» del editor de la sesión
// (GET /api/articles/mine), con buscador, filtro de estado, acciones (editar, ver, eliminar) y paginación.
// Solo para el rol editor (RequireRole en App.jsx; el servidor también lo comprueba).
// Escritorio: tabla. Móvil: una tarjeta por artículo (como en Figma).
// «Comentarios» se queda con «—»: todavía no hay comentarios en la BD.
// Diseño: Figma › Mockups › 17 · Panel de editor
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1128

const PER_PAGE = 8;
const SEARCH_DELAY_MS = 250; // Espera a que se deje de escribir para no pedir en cada letra

const STATUS_FILTER = [
  { value: 'all', label: 'Estado: Todos' },
  { value: 'published', label: 'Publicado' },
  { value: 'scheduled', label: 'Programado' },
  { value: 'draft', label: 'Borrador' },
];

export default function EditorDashboard() {
  const [query, setQuery] = useState('');
  const [searchText, setSearchText] = useState(''); // `query` tras la espera
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState(null); // { text, error? }

  useEffect(() => {
    const timer = setTimeout(() => setSearchText(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, error, loading, reload } = useApi(
    (signal) =>
      getMyArticles(
        {
          q: searchText,
          status: status === 'all' ? undefined : status,
          limit: PER_PAGE,
          offset: (page - 1) * PER_PAGE,
        },
        { signal },
      ),
    [searchText, status, page],
  );
  const stats = data?.stats;
  const articles = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE));

  function changeQuery(event) {
    setQuery(event.target.value);
    setPage(1);
  }

  function changeStatus(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  async function remove(article) {
    if (!window.confirm(`¿Eliminar «${article.title}»? No se puede deshacer.`)) return;
    try {
      await deleteArticle(article.id);
      setMessage({ text: `Artículo eliminado: «${article.title}».` });
      // Si era el último de su página, se vuelve a la anterior (eso ya vuelve a pedir la lista)
      if (articles.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (deleteError) {
      setMessage({ text: deleteError.message, error: true });
    }
  }

  return (
    <section className="page editor-dashboard">
      <RoleNotice role="editor" />

      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">Zona de editor</p>
          <h1 className="page-header__title">Panel de editor</h1>
          <p className="page-header__subtitle">
            Gestiona tus análisis y los datos<span className="editor-dashboard__more"> de los jugadores</span>.
          </p>
        </div>
        <div className="page-header__actions editor-dashboard__buttons">
          <Button
            variant="tertiary"
            to="/editor/datos"
            className="editor-dashboard__button editor-dashboard__button--data"
          >
            <img src={syncIcon} alt="" width="16" height="16" />
            Actualizar datos de jugadores
          </Button>
          <Button to="/editor/articulo" className="editor-dashboard__button editor-dashboard__button--new">
            <img src={plusIcon} alt="" width="16" height="16" />
            Nuevo artículo
          </Button>
        </div>
      </header>

      <div className="editor-dashboard__stats">
        <StatCard
          value={formatNumber(stats?.published)}
          label={
            <>
              <span className="editor-dashboard__more">Artículos </span>publicados
            </>
          }
          tone="gold"
        />
        <StatCard value={formatNumber(stats?.drafts)} label="Borradores" />
        <StatCard
          value={formatNumber(stats?.monthViews)}
          label={
            <>
              Visitas<span className="editor-dashboard__more"> este mes</span>
              <span className="editor-dashboard__less"> / mes</span>
              <span className="editor-dashboard__trend">{stats ? visitsTrend(stats) : ''}</span>
            </>
          }
        />
        <StatCard value={formatNumber(stats?.comments)} label="Comentarios" />
      </div>

      <div className="editor-dashboard__articles">
        <div className="editor-dashboard__toolbar">
          <h2 className="editor-dashboard__title">Mis artículos</h2>
          <TextField
            className="editor-dashboard__search"
            size="sm"
            type="search"
            label="Buscar artículo"
            hideLabel
            placeholder="Buscar artículo…"
            icon={searchIcon}
            value={query}
            onChange={changeQuery}
          />
          <Select
            className="editor-dashboard__status"
            size="sm"
            label="Filtrar por estado"
            hideLabel
            options={STATUS_FILTER}
            value={status}
            onChange={changeStatus}
          />
        </div>

        <p
          className={`editor-dashboard__message${message?.error ? ' editor-dashboard__message--error' : ''}`}
          role="status"
        >
          {message?.text}
        </p>

        {error ? (
          <ErrorState error={error} title="No se han podido cargar tus artículos" onRetry={reload} />
        ) : loading && !data ? (
          <LoadingState label="Cargando tus artículos…" />
        ) : articles.length === 0 ? (
          <p className="editor-dashboard__empty">
            {searchText || status !== 'all'
              ? 'Ningún artículo coincide con la búsqueda.'
              : 'Todavía no has escrito ningún artículo.'}
          </p>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="editor-dashboard__table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Título</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Fecha</th>
                    <th scope="col" className="editor-dashboard__end">
                      Visitas
                    </th>
                    <th scope="col" className="editor-dashboard__end">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <ArticleRow key={article.id} article={article} onRemove={remove} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: una tarjeta por artículo */}
            <ul className="editor-dashboard__cards">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} onRemove={remove} />
              ))}
            </ul>
          </>
        )}

        <Pagination
          page={Math.min(page, totalPages)}
          totalPages={totalPages}
          onChange={setPage}
          label="Páginas de mis artículos"
        />
      </div>
    </section>
  );
}
