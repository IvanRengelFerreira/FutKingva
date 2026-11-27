// Artículo de la API (GET /api/articles…) → props de <ArticleCard>:
//   <ArticleCard key={article.id} {...cardProps(article)} />
//   <ArticleCard {...cardProps(article)} layout="compact" />
import { numericDate } from '../../services/format.js';
import { coverProps } from '../Illustration/coverProps.js';

export function cardProps(article) {
  return {
    article: {
      id: article.id,
      title: article.title,
      category: article.category,
      author: article.author?.name,
      date: numericDate(article.publishedAt),
    },
    excerpt: article.summary,
    illustration: coverProps(article),
  };
}

/** «6 min de lectura» (o '' si el artículo no tiene texto) */
export function readingLabel(minutes) {
  return minutes > 0 ? `${minutes} min de lectura` : '';
}
