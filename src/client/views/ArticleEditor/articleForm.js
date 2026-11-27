import { CATEGORIES as ARTICLE_CATEGORIES, validateArticle } from '../../../shared/validation/article.js';
import { blocksToHtml } from './blockHtml.js';

// Datos del formulario del Editor de artículo (18) y paso a lo que espera la API (POST/PATCH /api/articles).
//
// form: { title, summary, status, publishAt, category, tags, related, cover, coverTeams, bodyHtml, updatedAt }
//   publishAt: texto «24/10/2026 · 18:00» (solo para los programados)
//   related:   [{ type: 'player', id, name, team } | { type: 'team', id, name, code, color }]
//              → al guardar es el bloque «mencionados» del texto
//   cover:     la portada guardada ({ type, … } o null); la de las previas sale de los equipos relacionados

export const CATEGORIES = ARTICLE_CATEGORIES;

export const STATUSES = [
  { value: 'draft', label: 'Borrador' },
  { value: 'scheduled', label: 'Programado' },
  { value: 'published', label: 'Publicado' },
];

// Fecha de publicación: «24/10/2026 · 18:00» (la hora es opcional; sin hora, a las 00:00)
const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})(?: · (\d{2}):(\d{2}))?$/;

// Dibujo de la portada que va con cada categoría (las previas usan los equipos relacionados)
const COVER_TYPES = { Táctica: 'stat', Crónica: 'match', Datos: 'bars', Previa: 'teams' };

const pad = (number) => String(number).padStart(2, '0');

/** ISO → «24/10/2026 · 18:00» (hora del navegador) */
export function toDateText(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** «24/10/2026 · 18:00» → ISO, o null si no es una fecha que exista */
export function parseDateText(text) {
  const match = DATE_PATTERN.exec(text.trim());
  if (!match) return null;
  const [, day, month, year, hours = '00', minutes = '00'] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
  const exists = date.getDate() === Number(day) && date.getMonth() === Number(month) - 1 && Number(hours) < 24;
  return exists ? date.toISOString() : null;
}

/** Valores iniciales: vacío (nuevo) o el artículo de GET /api/articles/:id/edit */
export function getInitialValues(article) {
  if (!article) {
    return {
      title: '',
      summary: '',
      status: 'draft',
      publishAt: '',
      category: 'Táctica',
      tags: [],
      related: [],
      cover: null,
      coverTeams: null,
      bodyHtml: '',
      updatedAt: null,
    };
  }
  const players = new Map(article.players.map((player) => [player.id, player]));
  const teams = new Map(article.teams.map((team) => [team.id, team]));
  const mentions = article.body.find((block) => block.type === 'mentions')?.items ?? [];

  return {
    title: article.title,
    summary: article.summary ?? '',
    status: article.status,
    publishAt: toDateText(article.publishAt),
    category: article.category,
    tags: article.tags,
    related: mentions
      .map((item) => {
        const found = item.type === 'team' ? teams.get(item.id) : players.get(item.id);
        return found ? { type: item.type, ...found } : null;
      })
      .filter(Boolean),
    cover: article.cover,
    coverTeams: article.coverTeams,
    bodyHtml: blocksToHtml(article.body, players),
    updatedAt: article.updatedAt,
  };
}

/** Portada que se guarda: en las previas, los dos primeros equipos relacionados; si no, la que ya tenía si va con la categoría */
export function coverFor(form) {
  const type = COVER_TYPES[form.category];
  const teams = form.related.filter((item) => item.type === 'team');
  if (type === 'teams' && teams.length >= 2) return { type, homeTeamId: teams[0].id, awayTeamId: teams[1].id };
  return form.cover?.type === type ? form.cover : null;
}

/** Lo que necesita la portada de la columna lateral (coverProps de Illustration) */
export function coverPreview(form) {
  const cover = coverFor(form);
  const known = [...form.related, form.coverTeams?.home, form.coverTeams?.away].filter(Boolean);
  const team = (id) => known.find((item) => item.id === id && item.code) ?? null;
  return {
    category: form.category,
    cover,
    coverTeams: cover?.type === 'teams' ? { home: team(cover.homeTeamId), away: team(cover.awayTeamId) } : null,
  };
}

/** Cuerpo de la petición para guardar con `status` ('draft', 'scheduled' o 'published') */
export function buildPayload(form, blocks, status) {
  const mentions = form.related.map(({ type, id }) => ({ type, id }));
  let body = blocks.flatMap((block) => {
    if (block.type !== 'mentions') return [block];
    return mentions.length ? [{ type: 'mentions', items: mentions }] : [];
  });
  if (mentions.length && !body.some((block) => block.type === 'mentions')) {
    body = [...body, { type: 'mentions', items: mentions }];
  }
  return {
    title: form.title,
    summary: form.summary,
    category: form.category,
    status,
    publishAt: status === 'scheduled' ? (parseDateText(form.publishAt) ?? form.publishAt) : undefined,
    tags: form.tags,
    cover: coverFor(form),
    body,
  };
}

/** Errores del formulario: las mismas reglas que el servidor y, además, el formato de la fecha */
export function getFormErrors(form, payload) {
  const errors = validateArticle(payload);
  if (payload.status === 'scheduled' && form.publishAt.trim() && !parseDateText(form.publishAt)) {
    errors.publishAt = 'Usa el formato dd/mm/aaaa · hh:mm';
  }
  return errors;
}
