import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Illustration from '../../components/Illustration/Illustration.jsx';
import ArticleCard from '../../components/ArticleCard/ArticleCard.jsx';
import NotFound from '../NotFound/NotFound.jsx';
import { ARTICLES, getArticle } from '../../data/mockData.js';
import { getArticleExtras } from '../Analysis/articleExtras.js';
import { AUTHOR_ROLES, getArticleContent } from './articleContent.js';
import { toLongDate, toTime } from '../Analysis/dates.js';
import { copyText } from './clipboard.js';
import Block from './Block.jsx';
import './Article.css';

// 09 · Artículo: un análisis completo en columna de lectura, con sus relacionados al final.
// Se llega desde las tarjetas de Análisis (08): /analisis/<id del artículo>.
// Solo se ven los artículos publicados; si el id no existe o es un borrador, sale «Página no encontrada».
// El texto de cada artículo está en articleContent.js (en Figma solo está escrito el de Pedri).
// «Guardar» y «Compartir»: guardar solo cambia el icono (sin servidor no se guarda en ningún sitio)
// y compartir copia la dirección del artículo.
// Diseño: Figma › Mockups › 09 · Artículo
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=53-556

export default function Article() {
  const { articleId } = useParams();
  const article = getArticle(articleId);

  if (!article || article.status !== 'published') return <NotFound />;

  // «key»: al pasar de un artículo a otro, «Guardar» y el aviso de «Compartir» empiezan de cero
  return <ArticleView key={article.id} article={article} />;
}

function ArticleView({ article }) {
  const [saved, setSaved] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const extras = getArticleExtras(article.id);
  const content = getArticleContent(article.id);
  const related = getRelated(article, content.related);

  // El aviso de «Compartir» desaparece solo a los 2,5 segundos
  useEffect(() => {
    if (!shareMessage) return undefined;
    const timer = setTimeout(() => setShareMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [shareMessage]);

  async function share() {
    const copied = await copyText(window.location.href);
    setShareMessage(copied ? 'Enlace copiado' : 'No se ha podido copiar el enlace');
  }

  return (
    <section className="page article">
      <div className="article__column">
        <Breadcrumbs
          items={[{ label: 'Análisis', to: '/analisis' }, { label: article.category }, { label: article.title }]}
        />

        <header className="article__header">
          <Tag category={article.category} />
          <h1 className="article__title">{article.title}</h1>
          <p className="article__lead">{content.lead ?? extras.excerpt}</p>
        </header>

        <div className="article__byline">
          <Avatar className="article__author-avatar" name={article.author} size={44} />
          <div className="article__author">
            <p className="article__author-name">{article.author}</p>
            <p className="article__author-meta">
              {AUTHOR_ROLES[article.author]}
              {/* Escritorio: «15 de octubre de 2026 · 6 min de lectura» · Móvil: «15/10 · 6 min» (como en Figma) */}
              <span className="article__desktop-only"> · {toLongDate(article.date)}</span>
              <span className="article__mobile-only"> · {article.date?.slice(0, 5)}</span>
              {extras.readingTime && (
                <>
                  {' · '}
                  {extras.readingTime.replace(' de lectura', '')}
                  <span className="article__desktop-only"> de lectura</span>
                </>
              )}
            </p>
          </div>

          <div className="article__actions">
            <span className="article__share-message" role="status">
              {shareMessage}
            </span>
            <button
              type="button"
              className={`article__action article__action--bookmark${saved ? ' article__action--active' : ''}`}
              aria-label={saved ? 'Quitar de guardados' : 'Guardar artículo'}
              aria-pressed={saved}
              title={saved ? 'Guardado' : 'Guardar'}
              onClick={() => setSaved((value) => !value)}
            />
            <button
              type="button"
              className="article__action article__action--share"
              aria-label="Compartir: copiar el enlace del artículo"
              title="Compartir"
              onClick={share}
            />
          </div>
        </div>

        <Illustration className="article__illustration" type={article.category} {...extras.illustration} />

        {content.body?.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>

      {related.length > 0 && (
        <div className="article__related">
          <h2 className="article__related-title">Análisis relacionados</h2>
          <div className="article__related-grid">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} illustration={getArticleExtras(item.id).illustration} minimal />
            ))}
          </div>
          {/* Móvil: dos tarjetas compactas (miniatura a la izquierda) */}
          <div className="article__related-list">
            {related.slice(0, 2).map((item) => (
              <ArticleCard
                key={item.id}
                article={item}
                illustration={getArticleExtras(item.id).illustration}
                layout="compact"
                minimal
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// Relacionados: los que diga articleContent.js o, si no, 3 publicados
// (primero los de la misma categoría y después los más recientes)
function getRelated(article, ids) {
  if (ids) return ids.map(getArticle).filter(Boolean);

  return ARTICLES.filter((item) => item.status === 'published' && item.id !== article.id)
    .sort(
      (a, b) =>
        Number(b.category === article.category) - Number(a.category === article.category) ||
        toTime(b.date) - toTime(a.date),
    )
    .slice(0, 3);
}
