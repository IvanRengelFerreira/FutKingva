import { getArticleExtras } from '../Analysis/articleExtras.js';
import { getArticleContent } from '../Article/articleContent.js';
import { getArticleDraft } from './editorDrafts.js';
import { blocksToHtml } from './blockHtml.js';

export const CATEGORIES = ['Táctica', 'Crónica', 'Previa', 'Datos'];

export const STATUSES = [
  { value: 'draft', label: 'Borrador' },
  { value: 'scheduled', label: 'Programado' },
  { value: 'published', label: 'Publicado' },
];

// Fecha de publicación: «24/10/2026 · 18:00» (la hora es opcional)
const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}( · \d{2}:\d{2})?$/;

// Valores iniciales: vacío (nuevo) o los datos del artículo
export function getInitialValues(article) {
  if (!article) {
    return {
      title: '',
      excerpt: '',
      status: 'draft',
      publishAt: '',
      category: 'Táctica',
      tags: [],
      related: [],
      cover: {},
      bodyHtml: '',
    };
  }
  const extras = getArticleExtras(article.id);
  const content = getArticleContent(article.id);
  const draft = getArticleDraft(article.id);
  const mentions = content.body?.find((block) => block.type === 'mentions')?.items ?? [];

  return {
    title: article.title,
    excerpt: draft.excerpt ?? content.lead ?? extras.excerpt ?? '',
    status: article.status,
    publishAt: draft.publishAt ?? article.date ?? '',
    category: article.category,
    tags: draft.tags ?? [],
    related: draft.related ?? mentions.map(({ type, id }) => ({ type, id })),
    cover: draft.cover ?? extras.illustration ?? {},
    // Si el artículo no tiene más texto que la entradilla (como en su página pública), el texto empieza con ella
    bodyHtml: blocksToHtml(
      draft.body ?? content.body ?? [{ type: 'paragraph', text: content.lead ?? extras.excerpt ?? '' }],
    ),
  };
}

// La fecha solo se exige si el artículo está programado
function publishAtError(form) {
  if (form.status !== 'scheduled') return null;
  const publishAt = form.publishAt.trim();
  if (!publishAt) return 'Indica cuándo se publica';
  if (!DATE_PATTERN.test(publishAt)) return 'Usa el formato dd/mm/aaaa · hh:mm';
  return null;
}

// Un mensaje por campo con problema (null si está bien)
export function getFormErrors(form, words) {
  return {
    title: !form.title.trim() ? 'Escribe el título' : null,
    excerpt: !form.excerpt.trim() ? 'Escribe la entradilla' : null,
    publishAt: publishAtError(form),
    body: words === 0 ? 'Escribe el texto del artículo' : null,
  };
}

// Portada automática: en las previas, los dos primeros equipos relacionados (o los del borrador)
export function coverProps(form) {
  const teams = form.related.filter((item) => item.type === 'team').map((item) => item.id);
  if (form.category === 'Previa') {
    return {
      home: form.cover.home ?? teams[0] ?? 'real-madrid',
      away: form.cover.away ?? teams[1] ?? 'barcelona',
    };
  }
  return form.cover;
}
