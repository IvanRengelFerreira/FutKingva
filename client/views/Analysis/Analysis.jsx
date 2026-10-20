import { useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import Illustration from '../../components/Illustration/Illustration.jsx';
import ArticleCard from '../../components/ArticleCard/ArticleCard.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import { ARTICLES, getArticle } from '../../data/mockData.js';
import { FEATURED_ARTICLE_ID, getArticleExtras } from './articleExtras.js';
import searchIcon from '../../assets/icon-search-small.svg';
import './Analysis.css';

// 08 · Análisis: artículos publicados por los editores.
// Arriba, el artículo destacado; debajo, «Últimos análisis» (los demás publicados, del más reciente
// al más antiguo), que se filtran con los chips de categoría y con el buscador.
// Los borradores y los programados no salen: solo se ven en el Panel de editor (17).
// Diseño: Figma › Mockups › 08 · Análisis
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-489

// Chips de categoría: el texto del chip y la categoría de ARTICLES que enseña (null = todas)
const CATEGORIES = [
  { label: 'Todos', category: null },
  { label: 'Previas', category: 'Previa' },
  { label: 'Crónicas', category: 'Crónica' },
  { label: 'Táctica', category: 'Táctica' },
  { label: 'Datos', category: 'Datos' },
];

const PER_PAGE = 6;

export default function Analysis() {
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const featured = getArticle(FEATURED_ARTICLE_ID);
  const featuredExtras = getArticleExtras(FEATURED_ARTICLE_ID);

  const latest = ARTICLES
    .filter((article) => article.status === 'published' && article.id !== FEATURED_ARTICLE_ID)
    .sort((a, b) => toTime(b.date) - toTime(a.date));

  const results = latest.filter((article) =>
    (!category || article.category === category) && matches(article, query)
  );
  const totalPages = Math.ceil(results.length / PER_PAGE);
  const visible = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Al cambiar el filtro o la búsqueda se vuelve a la primera página
  function changeCategory(value) {
    setCategory(value);
    setPage(1);
  }

  function changeQuery(event) {
    setQuery(event.target.value);
    setPage(1);
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

      <article className="analysis__featured">
        <Illustration
          className="analysis__featured-illustration"
          type={featured.category}
          {...featuredExtras.illustration}
        />
        <div className="analysis__featured-body">
          <div className="analysis__featured-tags">
            <Tag featured>Destacado</Tag>
            <Tag category={featured.category} />
          </div>
          <h2 className="analysis__featured-title">{featured.title}</h2>
          <p className="analysis__featured-excerpt">{featuredExtras.excerpt}</p>
          <p className="analysis__featured-meta">
            {[featured.author, featured.date, featuredExtras.readingTime].filter(Boolean).join(' · ')}
          </p>
          <Button className="analysis__featured-button" to={`/analisis/${featured.id}`}>Leer análisis</Button>
        </div>
      </article>

      <div className="analysis__latest">
        <div className="analysis__latest-header">
          <h2 className="analysis__latest-title">Últimos análisis</h2>
          <p className="analysis__sort">Ordenar: más recientes</p>
        </div>

        {visible.length > 0 ? (
          <div className="analysis__grid">
            {visible.map((article) => {
              const extras = getArticleExtras(article.id);
              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  excerpt={extras.excerpt}
                  illustration={extras.illustration}
                />
              );
            })}
          </div>
        ) : (
          <p className="analysis__empty">No hay análisis que coincidan con tu búsqueda.</p>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          label="Páginas de análisis"
        />
      </div>
    </section>
  );
}

// «15/10/2026» → número para poder ordenar por fecha
function toTime(date) {
  const [day, month, year] = date.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

// Busca en el titular y la entradilla, sin distinguir mayúsculas ni tildes
function matches(article, query) {
  const text = normalize(query.trim());
  if (!text) return true;
  return normalize(`${article.title} ${getArticleExtras(article.id).excerpt ?? ''}`).includes(text);
}

function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
