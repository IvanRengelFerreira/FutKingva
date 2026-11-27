import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Illustration from '../../components/Illustration/Illustration.jsx';
import ArticleCard from '../../components/ArticleCard/ArticleCard.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import NotFound from '../NotFound/NotFound.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useApi } from '../../services/useApi.js';
import { getArticle, saveArticle, unsaveArticle } from '../../services/articles.js';
import { numericDate } from '../../services/format.js';
import { cardProps } from '../../components/ArticleCard/cardProps.js';
import { coverProps } from '../../components/Illustration/coverProps.js';
import { longDate } from '../Analysis/dates.js';
import { copyText } from './clipboard.js';
import Block from './Block.jsx';
import './Article.css';

// 09 · Artículo: un análisis completo en columna de lectura, con sus relacionados al final (GET /api/articles/:id).
// Se llega desde las tarjetas de Análisis (08): /analisis/<id del artículo>.
// Solo se ven los artículos publicados; si el id no existe, es un borrador o está programado, «Página no encontrada».
// «Guardar» lo guarda en la cuenta (PUT/DELETE /api/me/saved-articles/:id); sin sesión lleva a Acceso.
// «Compartir» copia la dirección del artículo.
// Diseño: Figma › Mockups › 09 · Artículo
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=53-556

const DEFAULT_AUTHOR_TITLE = 'Editor'; // Si el autor no tiene cargo (users.title)

export default function Article() {
  const { articleId } = useParams();
  const { data, error, loading, reload } = useApi((signal) => getArticle(articleId, { signal }), [articleId]);

  if (error?.status === 404 || error?.status === 400) return <NotFound />;
  if (error) {
    return (
      <section className="page article">
        <ErrorState error={error} title="No se ha podido cargar el análisis" onRetry={reload} />
      </section>
    );
  }
  if (loading || !data) {
    return (
      <section className="page article">
        <LoadingState label="Cargando análisis…" />
      </section>
    );
  }

  // «key»: al pasar de un artículo a otro, «Guardar» y el aviso de «Compartir» empiezan de cero
  return <ArticleView key={data.id} article={data} />;
}

function ArticleView({ article }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(article.saved);
  const [message, setMessage] = useState('');

  // Jugadores y equipos que salen en el texto, por id
  const refs = {
    players: new Map(article.players.map((player) => [player.id, player])),
    teams: new Map(article.teams.map((team) => [team.id, team])),
  };
  const authorName = article.author?.name ?? 'Redacción';
  const date = article.publishedAt;
  const minutes = article.readingMinutes;

  // El aviso («Enlace copiado», «Guardado»…) desaparece solo a los 2,5 segundos
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  async function share() {
    const copied = await copyText(window.location.href);
    setMessage(copied ? 'Enlace copiado' : 'No se ha podido copiar el enlace');
  }

  async function toggleSaved() {
    if (!user) {
      navigate('/acceso');
      return;
    }
    const next = !saved;
    setSaved(next); // Se cambia ya y, si falla, se deshace
    try {
      await (next ? saveArticle(article.id) : unsaveArticle(article.id));
      setMessage(next ? 'Guardado en tu perfil' : 'Quitado de guardados');
    } catch (error) {
      setSaved(!next);
      setMessage(error.message);
    }
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
          {article.summary && <p className="article__lead">{article.summary}</p>}
        </header>

        <div className="article__byline">
          <Avatar className="article__author-avatar" name={authorName} size={44} />
          <div className="article__author">
            <p className="article__author-name">{authorName}</p>
            <p className="article__author-meta">
              {article.author?.title ?? DEFAULT_AUTHOR_TITLE}
              {/* Escritorio: «15 de octubre de 2026 · 6 min de lectura» · Móvil: «15/10 · 6 min» (como en Figma) */}
              <span className="article__desktop-only"> · {longDate(date)}</span>
              <span className="article__mobile-only"> · {numericDate(date).slice(0, 5)}</span>
              {minutes > 0 && (
                <>
                  {` · ${minutes} min`}
                  <span className="article__desktop-only"> de lectura</span>
                </>
              )}
            </p>
          </div>

          <div className="article__actions">
            <span className="article__share-message" role="status">
              {message}
            </span>
            <button
              type="button"
              className={`article__action article__action--bookmark${saved ? ' article__action--active' : ''}`}
              aria-label={saved ? 'Quitar de guardados' : 'Guardar artículo'}
              aria-pressed={saved}
              title={user ? (saved ? 'Guardado' : 'Guardar') : 'Inicia sesión para guardar'}
              onClick={toggleSaved}
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

        <Illustration className="article__illustration" type={article.category} {...coverProps(article)} />

        {article.body.map((block, index) => (
          <Block key={index} block={block} refs={refs} />
        ))}
      </div>

      {article.related.length > 0 && (
        <div className="article__related">
          <h2 className="article__related-title">Análisis relacionados</h2>
          <div className="article__related-grid">
            {article.related.map((item) => (
              <ArticleCard key={item.id} {...cardProps(item)} minimal />
            ))}
          </div>
          {/* Móvil: dos tarjetas compactas (miniatura a la izquierda) */}
          <div className="article__related-list">
            {article.related.slice(0, 2).map((item) => (
              <ArticleCard key={item.id} {...cardProps(item)} layout="compact" minimal />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
