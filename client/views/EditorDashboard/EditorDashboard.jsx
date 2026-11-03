import { useState } from 'react';
import { Link } from 'react-router';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import Button from '../../components/Button/Button.jsx';
import StatCard from '../../components/StatCard/StatCard.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import { ARTICLES, EDITOR_STATS } from '../../data/mockData.js';
import syncIcon from '../../assets/icon-sync.svg';
import plusIcon from '../../assets/icon-plus-dark.svg';
import searchIcon from '../../assets/icon-search-small.svg';
import './EditorDashboard.css';

// 17 · Panel de editor (RF7): indicadores y tabla «Mis artículos» con buscador, filtro de estado,
// acciones (editar, ver, eliminar) y paginación. Solo para el rol editor (RequireRole en App.jsx).
// Escritorio: tabla. Móvil: una tarjeta por artículo (como en Figma).
// Sin servidor: eliminar quita el artículo de la lista hasta que se recarga la página.
// Diseño: Figma › Mockups › 17 · Panel de editor
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=61-1128

const PER_PAGE = 8;

const STATUS_FILTER = [
  { value: 'all', label: 'Estado: Todos' },
  { value: 'published', label: 'Publicado' },
  { value: 'scheduled', label: 'Programado' },
  { value: 'draft', label: 'Borrador' },
];

export default function EditorDashboard() {
  const [articles, setArticles] = useState(ARTICLES);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');

  // Publicados y borradores: se cuentan en la lista de artículos (así cuadran con la tabla y bajan al eliminar)
  const stats = {
    published: articles.filter((a) => a.status === 'published').length,
    drafts: articles.filter((a) => a.status === 'draft').length,
  };

  const search = normalize(query);
  const results = articles.filter(
    (article) => (status === 'all' || article.status === status) && (!search || normalize(article.title).includes(search))
  );
  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages); // Si se borra el último de una página, se vuelve a la anterior
  const visible = results.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function changeQuery(event) {
    setQuery(event.target.value);
    setPage(1);
  }

  function changeStatus(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  function remove(article) {
    setArticles((list) => list.filter((item) => item.id !== article.id));
    setMessage(`Artículo eliminado: «${article.title}».`);
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
          <Button variant="tertiary" to="/editor/datos" className="editor-dashboard__button editor-dashboard__button--data">
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
        <StatCard value={stats.published} label={<><span className="editor-dashboard__more">Artículos </span>publicados</>} tone="gold" />
        <StatCard value={stats.drafts} label="Borradores" />
        <StatCard
          value={formatNumber(EDITOR_STATS.monthlyVisits)}
          label={
            <>
              Visitas<span className="editor-dashboard__more"> este mes</span>
              <span className="editor-dashboard__less"> / mes</span>
              <span className="editor-dashboard__trend">{EDITOR_STATS.visitsChange}</span>
            </>
          }
        />
        <StatCard value={EDITOR_STATS.comments} label="Comentarios" />
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

        <p className="editor-dashboard__message" role="status">{message}</p>

        {visible.length === 0 ? (
          <p className="editor-dashboard__empty">Ningún artículo coincide con la búsqueda.</p>
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
                    <th scope="col" className="editor-dashboard__end">Visitas</th>
                    <th scope="col" className="editor-dashboard__end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((article) => (
                    <tr key={article.id}>
                      <td className="editor-dashboard__article-title">{article.title}</td>
                      <td><Tag category={article.category} /></td>
                      <td><StatusBadge status={article.status} /></td>
                      <td className="editor-dashboard__date">{article.date ?? '—'}</td>
                      <td className="editor-dashboard__end editor-dashboard__visits">{formatNumber(article.visits)}</td>
                      <td className="editor-dashboard__end">
                        <Actions article={article} onRemove={remove} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: una tarjeta por artículo */}
            <ul className="editor-dashboard__cards">
              {visible.map((article) => (
                <li key={article.id} className="editor-dashboard__card">
                  <div className="editor-dashboard__card-top">
                    <Tag category={article.category} />
                    <StatusBadge status={article.status} />
                    <Link
                      className="editor-dashboard__action editor-dashboard__action--edit editor-dashboard__card-edit"
                      to={`/editor/articulo/${article.id}`}
                      aria-label={`Editar «${article.title}»`}
                    />
                    <button
                      type="button"
                      className="editor-dashboard__action editor-dashboard__action--delete"
                      onClick={() => remove(article)}
                      aria-label={`Eliminar «${article.title}»`}
                      title="Eliminar"
                    />
                  </div>
                  <p className="editor-dashboard__article-title">{article.title}</p>
                  <p className="editor-dashboard__card-meta">
                    {article.date ?? '—'} · {formatNumber(article.visits)} visitas
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} label="Páginas de mis artículos" />
      </div>
    </section>
  );
}

// Editar, ver (solo los publicados se pueden leer) y eliminar
function Actions({ article, onRemove }) {
  const published = article.status === 'published';
  return (
    <div className="editor-dashboard__actions">
      <Link
        className="editor-dashboard__action editor-dashboard__action--edit"
        to={`/editor/articulo/${article.id}`}
        aria-label={`Editar «${article.title}»`}
        title="Editar"
      />
      {published ? (
        <Link
          className="editor-dashboard__action editor-dashboard__action--view"
          to={`/analisis/${article.id}`}
          aria-label={`Ver «${article.title}»`}
          title="Ver"
        />
      ) : (
        <button
          type="button"
          className="editor-dashboard__action editor-dashboard__action--view"
          disabled
          aria-label={`Ver «${article.title}» (todavía no está publicado)`}
          title="Todavía no está publicado"
        />
      )}
      <button
        type="button"
        className="editor-dashboard__action editor-dashboard__action--delete"
        onClick={() => onRemove(article)}
        aria-label={`Eliminar «${article.title}»`}
        title="Eliminar"
      />
    </div>
  );
}

// 4812 → «4.812» · null → «—»
function formatNumber(value) {
  return value == null ? '—' : value.toLocaleString('es-ES', { useGrouping: 'always' });
}

// Quita tildes y mayúsculas para buscar
function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
