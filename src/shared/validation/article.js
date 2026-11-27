// Reglas de los artículos de los editores (RF7): 18 · Editor de artículo. Las usan los dos lados con el mismo código:
//   cliente:  views/ArticleEditor (enseña el error junto al campo antes de guardar)
//   servidor: routes/articles.js con validate() (400 con los mismos mensajes)
// Además, el formato del cuerpo y de la portada que se guarda en la BD (articles.body y articles.cover, jsonb).
//
// JavaScript puro, sin dependencias, para que funcione en Node y en el navegador.
//
// Cuerpo de la petición (crear y editar):
//   { title, summary, category, status: 'draft' | 'scheduled' | 'published', publishAt?, tags, cover, body }
//   publishAt: fecha ISO («2026-12-04T17:00:00.000Z»), solo para los programados (tiene que ser futura)
//
// body: lista de bloques, sin HTML (la web los pinta con React, nunca con innerHTML)
//   { type: 'paragraph', spans: [span] }               span = { text, bold?, italic?, href? }
//   { type: 'list', items: [{ spans: [span] }] }
//   { type: 'heading', text } · { type: 'quote', text }
//   { type: 'stats', items: [{ value, label }] }        → recuadro «Dato destacado»
//   { type: 'mentions', items: [{ type: 'player' | 'team', id }] }
//   { type: 'chart', title, playerId, source? }        → acierto en el pase por jornada de un jugador
//   { type: 'player', playerId }                       → ficha de jugador insertada
//   { type: 'image', caption? } · { type: 'figure', caption? } → huecos de imagen o gráfico
//   href: solo http://, https:// o #/… (enlaces internos, la web usa HashRouter)
//
// cover: portada dibujada según su categoría, o null (el dibujo sin datos)
//   { type: 'stat', value }                                      → Táctica: cifra en el hexágono
//   { type: 'match', score, caption?, homeTeamId?, awayTeamId? } → Crónica: marcador
//   { type: 'teams', homeTeamId, awayTeamId }                    → Previa: escudos enfrentados
//   { type: 'bars', values: [números] }                          → Datos: barras
//   Los ids de dentro no tienen clave ajena: si falta el equipo, la portada se pinta sin él.

import { onlyErrors, text } from './common.js';

export const CATEGORIES = ['Táctica', 'Crónica', 'Previa', 'Datos'];
export const ARTICLE_STATUSES = ['draft', 'scheduled', 'published'];
export const FEATURED_TAG = 'Destacado'; // La etiqueta del artículo grande de Análisis (y de Inicio)

export const TITLE_MIN = 5; // Los mismos límites que el CHECK de la BD
export const TITLE_MAX = 120;
export const SUMMARY_MAX = 300;
export const TAG_MAX = 30;
export const TAGS_MAX = 8;
export const WORDS_PER_MINUTE = 200; // Tiempo de lectura

const BODY_BLOCKS_MAX = 200;
const BODY_TEXT_MAX = 30000; // Caracteres de texto en todo el artículo
const SPANS_MAX = 200;
const LIST_ITEMS_MAX = 50;
const STATS_MAX = 4;
const MENTIONS_MAX = 12;
const BARS_MIN = 2;
const BARS_MAX = 12;
const HREF_MAX = 500;
const SHORT_MAX = 40; // Cifras y rótulos («91 %», «Acierto en el pase»)
const LINE_MAX = 200; // Títulos de sección, pies, fuentes
const QUOTE_MAX = 500;

// --- Ayudas ----------------------------------------------------------------

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

// Que el objeto no traiga claves que no se conocen (las «marcas desconocidas»)
function onlyKeys(value, allowed) {
  return Object.keys(value).every((key) => allowed.includes(key));
}

// Texto obligatorio con longitud máxima
function isLine(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

// Texto opcional (si viene, con longitud máxima)
function isOptionalLine(value, max) {
  return value === undefined || (typeof value === 'string' && value.length <= max);
}

/** Enlace permitido en el texto: http://, https:// o interno con HashRouter (#/…) */
export function isSafeHref(href) {
  if (typeof href !== 'string' || href.length === 0 || href.length > HREF_MAX) return false;
  if (href.startsWith('#/')) return true;
  try {
    const url = new URL(href);
    return (url.protocol === 'http:' || url.protocol === 'https:') && href.startsWith(`${url.protocol}//`);
  } catch {
    return false;
  }
}

// --- Cuerpo ----------------------------------------------------------------

function isSpan(span) {
  if (!isObject(span) || !onlyKeys(span, ['text', 'bold', 'italic', 'href'])) return false;
  if (typeof span.text !== 'string' || span.text.length === 0) return false;
  if (span.bold !== undefined && typeof span.bold !== 'boolean') return false;
  if (span.italic !== undefined && typeof span.italic !== 'boolean') return false;
  return span.href === undefined || isSafeHref(span.href);
}

function isSpans(spans) {
  return Array.isArray(spans) && spans.length > 0 && spans.length <= SPANS_MAX && spans.every(isSpan);
}

// Cada tipo de bloque: sus claves y si están bien
const BLOCKS = {
  paragraph: { keys: ['spans'], valid: (block) => isSpans(block.spans) },
  list: {
    keys: ['items'],
    valid: (block) =>
      Array.isArray(block.items) &&
      block.items.length > 0 &&
      block.items.length <= LIST_ITEMS_MAX &&
      block.items.every((item) => isObject(item) && onlyKeys(item, ['spans']) && isSpans(item.spans)),
  },
  heading: { keys: ['text'], valid: (block) => isLine(block.text, LINE_MAX) },
  quote: { keys: ['text'], valid: (block) => isLine(block.text, QUOTE_MAX) },
  stats: {
    keys: ['items'],
    valid: (block) =>
      Array.isArray(block.items) &&
      block.items.length > 0 &&
      block.items.length <= STATS_MAX &&
      block.items.every(
        (item) =>
          isObject(item) &&
          onlyKeys(item, ['value', 'label']) &&
          isLine(item.value, SHORT_MAX) &&
          isLine(item.label, SHORT_MAX),
      ),
  },
  mentions: {
    keys: ['items'],
    valid: (block) =>
      Array.isArray(block.items) &&
      block.items.length <= MENTIONS_MAX &&
      block.items.every(
        (item) =>
          isObject(item) &&
          onlyKeys(item, ['type', 'id']) &&
          (item.type === 'player' || item.type === 'team') &&
          isPositiveInt(item.id),
      ),
  },
  chart: {
    keys: ['title', 'playerId', 'source'],
    valid: (block) =>
      isLine(block.title, LINE_MAX) && isPositiveInt(block.playerId) && isOptionalLine(block.source, LINE_MAX),
  },
  player: { keys: ['playerId'], valid: (block) => isPositiveInt(block.playerId) },
  image: { keys: ['caption'], valid: (block) => isOptionalLine(block.caption, LINE_MAX) },
  figure: { keys: ['caption'], valid: (block) => isOptionalLine(block.caption, LINE_MAX) },
};

/** ¿El bloque tiene un tipo conocido, solo sus claves y bien rellenas? */
export function isValidBlock(block) {
  const rule = isObject(block) ? BLOCKS[block.type] : undefined;
  return Boolean(rule) && onlyKeys(block, ['type', ...rule.keys]) && rule.valid(block);
}

/** Texto que se lee del artículo (párrafos, listas, títulos y citas; las fichas y los datos no cuentan) */
export function bodyText(body) {
  if (!Array.isArray(body)) return '';
  const spansText = (spans) => (Array.isArray(spans) ? spans.map((span) => text(span?.text)).join('') : '');
  return body
    .map((block) => {
      if (block?.type === 'paragraph') return spansText(block.spans);
      if (block?.type === 'list') return (block.items ?? []).map((item) => spansText(item?.spans)).join('\n');
      if (block?.type === 'heading' || block?.type === 'quote') return text(block.text);
      return '';
    })
    .join('\n');
}

/** Palabras del texto del artículo */
export function wordCount(body) {
  return bodyText(body).split(/\s+/).filter(Boolean).length;
}

/** Minutos de lectura (al menos 1 si hay texto; 0 si no hay) */
export function readingMinutes(body) {
  const words = wordCount(body);
  return words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function bodyError(body, publishing) {
  if (!Array.isArray(body)) return 'El texto del artículo no es válido';
  if (body.length > BODY_BLOCKS_MAX) return `El artículo no puede tener más de ${BODY_BLOCKS_MAX} bloques`;
  const wrong = body.findIndex((block) => !isValidBlock(block));
  if (wrong !== -1) return `El bloque ${wrong + 1} del texto no es válido`;
  if (body.filter((block) => block.type === 'mentions').length > 1) {
    return 'Solo puede haber una lista de jugadores y equipos mencionados';
  }
  const content = bodyText(body);
  if (content.length > BODY_TEXT_MAX) return `El texto no puede tener más de ${BODY_TEXT_MAX} caracteres`;
  if (publishing && wordCount(body) === 0) return 'Escribe el texto del artículo';
  return null;
}

// --- Portada ---------------------------------------------------------------

const COVERS = {
  stat: { keys: ['value'], valid: (cover) => isLine(cover.value, SHORT_MAX) },
  match: {
    keys: ['score', 'caption', 'homeTeamId', 'awayTeamId'],
    valid: (cover) =>
      isLine(cover.score, SHORT_MAX) &&
      isOptionalLine(cover.caption, SHORT_MAX) &&
      (cover.homeTeamId === undefined || isPositiveInt(cover.homeTeamId)) &&
      (cover.awayTeamId === undefined || isPositiveInt(cover.awayTeamId)),
  },
  teams: {
    keys: ['homeTeamId', 'awayTeamId'],
    valid: (cover) =>
      isPositiveInt(cover.homeTeamId) && isPositiveInt(cover.awayTeamId) && cover.homeTeamId !== cover.awayTeamId,
  },
  bars: {
    keys: ['values'],
    valid: (cover) =>
      Array.isArray(cover.values) &&
      cover.values.length >= BARS_MIN &&
      cover.values.length <= BARS_MAX &&
      cover.values.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0),
  },
};

/** ¿La portada es null o un dibujo conocido con solo sus datos? */
export function isValidCover(cover) {
  if (cover === null) return true;
  const rule = isObject(cover) ? COVERS[cover.type] : undefined;
  return Boolean(rule) && onlyKeys(cover, ['type', ...rule.keys]) && rule.valid(cover);
}

// --- Campos del formulario -------------------------------------------------

function titleError(title) {
  const value = text(title).trim();
  if (!value) return 'Escribe el título';
  if (value.length < TITLE_MIN) return `El título tiene que tener al menos ${TITLE_MIN} caracteres`;
  if (value.length > TITLE_MAX) return `El título no puede tener más de ${TITLE_MAX} caracteres`;
  return null;
}

function summaryError(summary, publishing) {
  if (summary !== undefined && summary !== null && typeof summary !== 'string') return 'La entradilla no es válida';
  const value = text(summary).trim();
  if (publishing && !value) return 'Escribe la entradilla';
  if (value.length > SUMMARY_MAX) return `La entradilla no puede tener más de ${SUMMARY_MAX} caracteres`;
  return null;
}

function categoryError(category) {
  return CATEGORIES.includes(category) ? null : 'Elige una categoría de la lista';
}

function statusError(status) {
  return ARTICLE_STATUSES.includes(status) ? null : 'Elige un estado de la lista';
}

function publishAtError(status, publishAt, now) {
  if (status !== 'scheduled') return null;
  if (!publishAt) return 'Indica cuándo se publica';
  const date = typeof publishAt === 'string' ? new Date(publishAt) : null;
  if (!date || Number.isNaN(date.getTime())) return 'La fecha de publicación no es válida';
  if (date <= now) return 'La fecha de publicación tiene que ser futura';
  return null;
}

function tagsError(tags) {
  if (!Array.isArray(tags)) return 'Las etiquetas no son válidas';
  if (tags.length > TAGS_MAX) return `No puede tener más de ${TAGS_MAX} etiquetas`;
  const seen = new Set();
  for (const tag of tags) {
    if (typeof tag !== 'string' || !tag.trim()) return 'Hay una etiqueta vacía';
    if (tag.trim().length > TAG_MAX) return `Cada etiqueta puede tener como mucho ${TAG_MAX} caracteres`;
    const key = tag.trim().toLowerCase();
    if (seen.has(key)) return `La etiqueta «${tag.trim()}» está repetida`;
    seen.add(key);
  }
  return null;
}

function coverError(cover) {
  return cover === undefined || isValidCover(cover) ? null : 'La portada no es válida';
}

/**
 * Guardar artículo (crear o editar). Un borrador solo necesita título y categoría;
 * para publicarlo o programarlo hacen falta también la entradilla y el texto.
 * `now` se puede pasar para las pruebas.
 */
export function validateArticle(
  { title, summary, category, status, publishAt, tags = [], cover, body = [] } = {},
  now = new Date(),
) {
  const publishing = status === 'published' || status === 'scheduled';
  return onlyErrors({
    title: titleError(title),
    summary: summaryError(summary, publishing),
    category: categoryError(category),
    status: statusError(status),
    publishAt: publishAtError(status, publishAt, now),
    tags: tagsError(tags),
    cover: coverError(cover),
    body: bodyError(body, publishing),
  });
}
