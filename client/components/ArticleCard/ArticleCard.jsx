import { Link } from 'react-router';
import './ArticleCard.css';
import Tag from '../Tag/Tag.jsx';
import Illustration from '../Illustration/Illustration.jsx';

// Tarjeta de artículo: ilustración + etiqueta + titular en serif + entradilla + autor, fecha y «Leer →».
// Toda la tarjeta lleva al artículo (el enlace está en el titular y se estira a toda la tarjeta).
// Dos formas:
//   layout="vertical" (por defecto) → rejilla de Análisis en escritorio, Inicio
//   layout="compact"                → lista de Análisis en móvil (miniatura a la izquierda)
// Diseño: Figma › Mockups › 08 · Análisis (tarjetas de «Últimos análisis», escritorio y móvil)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-575
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-762
// Uso: con un artículo de ARTICLES (mockData.js)
//   <ArticleCard article={getArticle('barca-ocho-de-ocho')} />
//   <ArticleCard article={article} excerpt="El 3 – 0 al Getafe…" illustration={{ score: '3 – 0', caption: "FINAL · 90+2'" }} />
//   <ArticleCard article={article} layout="compact" />
// illustration: lo que necesita <Illustration> según la categoría (score, home/away, stat, values…).
// to: dirección del artículo; por defecto /analisis/<id del artículo>.
export default function ArticleCard({
  article,
  excerpt,
  illustration = {},
  layout = 'vertical',
  to,
  className = '',
}) {
  const { id, title, category, author, date } = article;
  const href = to ?? `/analisis/${id}`;
  const compact = layout === 'compact';
  // En la lista de móvil la fecha va corta: 14/10/2026 → 14/10
  const shownDate = compact && date ? date.slice(0, 5) : date;

  return (
    <article className={`article-card article-card--${layout} ${className}`.trim()}>
      <Illustration
        className="article-card__illustration"
        type={category}
        size={compact ? 'thumb' : 'card'}
        {...illustration}
      />

      <div className="article-card__body">
        <Tag category={category} />
        <h3 className="article-card__title">
          <Link className="article-card__link" to={href}>{title}</Link>
        </h3>
        {!compact && excerpt && <p className="article-card__excerpt">{excerpt}</p>}
        <div className="article-card__footer">
          <span className="article-card__meta">
            {author}
            {shownDate && ` · ${shownDate}`}
          </span>
          {!compact && <span className="article-card__more" aria-hidden="true">Leer →</span>}
        </div>
      </div>
    </article>
  );
}
