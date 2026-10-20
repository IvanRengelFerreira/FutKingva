import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import Illustration from '../../components/Illustration/Illustration.jsx';
import BarChart from '../../components/BarChart/BarChart.jsx';
import ArticleCard from '../../components/ArticleCard/ArticleCard.jsx';
import NotFound from '../NotFound/NotFound.jsx';
import { ARTICLES, getArticle, getPlayer, getTeam } from '../../data/mockData.js';
import { getArticleExtras } from '../Analysis/articleExtras.js';
import { AUTHOR_ROLES, getArticleContent } from './articleContent.js';
import arrowIcon from '../../assets/icon-arrow-right.svg';
import './Article.css';

// 09 · Artículo: un análisis completo en columna de lectura, con sus relacionados al final.
// Se llega desde las tarjetas de Análisis (08): /analisis/<id del artículo>.
// Solo se ven los artículos publicados; si el id no existe o es un borrador, sale «Página no encontrada».
// El texto de cada artículo está en articleContent.js (en Figma solo está escrito el de Pedri).
// «Guardar» y «Compartir»: guardar solo cambia el icono (sin servidor no se guarda en ningún sitio)
// y compartir copia la dirección del artículo.
// Diseño: Figma › Mockups › 09 · Artículo
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=53-556

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

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
          items={[
            { label: 'Análisis', to: '/analisis' },
            { label: article.category },
            { label: article.title },
          ]}
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
              {[AUTHOR_ROLES[article.author], toLongDate(article.date), extras.readingTime].filter(Boolean).join(' · ')}
            </p>
          </div>

          <div className="article__actions">
            <span className="article__share-message" role="status">{shareMessage}</span>
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

        {content.body?.map((block, index) => <Block key={index} block={block} />)}
      </div>

      {related.length > 0 && (
        <div className="article__related">
          <h2 className="article__related-title">Análisis relacionados</h2>
          <div className="article__related-grid">
            {related.map((item) => (
              <ArticleCard
                key={item.id}
                article={item}
                illustration={getArticleExtras(item.id).illustration}
                minimal
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// Un bloque del texto del artículo (ver los tipos en articleContent.js)
function Block({ block }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="article__paragraph">{block.text}</p>;

    case 'stats':
      return (
        <dl className="article__stats">
          {block.items.map((item) => (
            <div key={item.label} className="article__stat">
              <dt className="article__stat-label">{item.label}</dt>
              <dd className="article__stat-value">{item.value}</dd>
            </div>
          ))}
        </dl>
      );

    case 'mentions':
      return (
        <aside className="article__box">
          <h2 className="article__box-title">Jugadores y equipos mencionados</h2>
          <ul className="article__mentions">
            {block.items.map((item) => (
              <li key={item.id}>
                <Mention item={item} />
              </li>
            ))}
          </ul>
        </aside>
      );

    case 'chart': {
      const player = getPlayer(block.playerId);
      const data = player.passAccuracyByRound.map((value, i) => ({
        label: `J${i + 1}`,
        value,
        tone: value >= 90 ? 'gold' : 'win', // En oro, las jornadas por encima del 90 %
      }));
      return (
        <figure className="article__box article__figure">
          <figcaption className="article__box-title">{block.title}</figcaption>
          <BarChart label={block.title} data={data} min={80} max={95} height={170} />
          <p className="article__source">{block.source}</p>
        </figure>
      );
    }

    case 'quote':
      return <blockquote className="article__quote">«{block.text}»</blockquote>;

    default:
      return null;
  }
}

// Píldora con enlace a la ficha del jugador o del equipo
function Mention({ item }) {
  if (item.type === 'team') {
    const team = getTeam(item.id);
    return (
      <Link className="article__mention" to={`/equipos/${item.id}`}>
        <Crest teamId={item.id} size={26} />
        {item.label ?? team?.name}
        <img src={arrowIcon} alt="" width="14" height="14" />
      </Link>
    );
  }

  const player = getPlayer(item.id);
  return (
    <Link className="article__mention" to={`/jugadores/${item.id}`}>
      <Avatar name={player?.name} size={26} />
      {item.label ?? player?.name}
      <img src={arrowIcon} alt="" width="14" height="14" />
    </Link>
  );
}

// Relacionados: los que diga articleContent.js o, si no, 3 publicados
// (primero los de la misma categoría y después los más recientes)
function getRelated(article, ids) {
  if (ids) return ids.map(getArticle).filter(Boolean);

  return ARTICLES
    .filter((item) => item.status === 'published' && item.id !== article.id)
    .sort((a, b) =>
      Number(b.category === article.category) - Number(a.category === article.category) ||
      toTime(b.date) - toTime(a.date)
    )
    .slice(0, 3);
}

// Copia un texto al portapapeles. Si el navegador no deja usar el portapapeles moderno,
// lo intenta a la antigua (un cuadro de texto oculto + «copiar»). Devuelve si lo ha conseguido.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  }
}

// «15/10/2026» → «15 de octubre de 2026»
function toLongDate(date) {
  if (!date) return null;
  const [day, month, year] = date.split('/').map(Number);
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}

// «15/10/2026» → número para poder ordenar por fecha
function toTime(date) {
  const [day, month, year] = date.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}
