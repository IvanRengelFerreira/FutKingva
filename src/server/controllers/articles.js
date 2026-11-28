// Artículos de los editores (RF7). Responsable: Carlota.
//   Públicas (08 · Análisis y 09 · Artículo)
//     GET    /api/articles?category=&q=&excludeFeatured=&limit=&offset= → publicados (y el destacado aparte)
//     GET    /api/articles/:id              → artículo publicado completo; suma una visita del día
//   Solo editores, y solo sus artículos (17 · Panel de editor y 18 · Editor de artículo)
//     GET    /api/articles/mine?status=&q=&limit=&offset= → «Mis artículos» con los indicadores
//     GET    /api/articles/:id/edit         → artículo propio en cualquier estado, para editarlo
//     POST   /api/articles                  → crear (201)
//     PATCH  /api/articles/:id              → guardar (se envía el artículo entero, como al crear)
//     DELETE /api/articles/:id              → eliminar (204); no si tiene denuncias (409)
//
// Estado en la API: 'draft' (DRAFT) · 'scheduled' (PUBLISHED con fecha futura) · 'published'.
// Visitas: solo en article_daily_views (una fila por artículo y día, hora de Madrid). Se suman sin
// tocar `articles`, para que el trigger no cambie updated_at con cada lectura.
// Formato del cuerpo y de la portada: shared/validation/article.js.

import { Prisma } from '../generated/prisma/client.ts';
import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { readId, readPagination } from '../utils/params.js';
import { readNameFilter } from '../utils/search.js';
import { resolveSeason } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from '../utils/teams.js';
import { aggregateSeasonStats, playerSummary } from '../utils/players.js';
import { CATEGORIES, FEATURED_TAG, readingMinutes } from '../../shared/validation/article.js';

const RELATED_COUNT = 3;
const TIME_ZONE = 'Europe/Madrid';
const STATUS_FILTERS = ['draft', 'scheduled', 'published'];

const ARTICLE_FIELDS = {
  id: true,
  title: true,
  summary: true,
  body: true,
  category: true,
  cover: true,
  tags: true,
  status: true,
  published_at: true,
  created_at: true,
  updated_at: true,
  author_id: true,
  users: { select: { name: true, title: true } },
};

// --- Públicas --------------------------------------------------------------

/** GET /api/articles?category=Táctica&q=pedri&excludeFeatured=true&limit=6&offset=0 */
export async function list(req, res) {
  const { limit, offset } = readPagination(req.query);
  const category = readCategory(req.query.category);
  const matches = readNameFilter(req.query.q);
  const excludeFeatured = req.query.excludeFeatured === 'true';

  const rows = await prisma.articles.findMany({
    where: { ...publishedNow(), ...(category ? { category } : {}) },
    orderBy: [{ published_at: 'desc' }, { id: 'desc' }],
    select: ARTICLE_FIELDS,
  });
  const featured = await findFeatured();
  const filtered = rows.filter(
    (row) => matches(row.title, row.summary) && !(excludeFeatured && featured && row.id === featured.id),
  );
  const page = filtered.slice(offset, offset + limit);
  const teams = await loadTeams(coverTeamIds([...page, featured].filter(Boolean)));

  res.json({
    items: page.map((row) => articleCard(row, teams)),
    total: filtered.length,
    limit,
    offset,
    featured: featured ? articleCard(featured, teams) : null,
  });
}

/** GET /api/articles/:id (suma una visita) */
export async function detail(req, res) {
  const id = readId(req.params.id, 'id del artículo');
  const article = await prisma.articles.findFirst({ where: { id, ...publishedNow() }, select: ARTICLE_FIELDS });
  if (!article) throw AppError.notFound('No existe ese artículo');

  await countVisit(article.id);
  const [refs, related, saved] = await Promise.all([
    loadRefs([article]),
    findRelated(article),
    req.user ? isSaved(req.user.id, article.id) : false,
  ]);
  const relatedTeams = await loadTeams(coverTeamIds(related));

  res.json({
    ...articleCard(article, refs.teamsById),
    body: article.body,
    players: [...refs.playersById.values()],
    teams: [...refs.teamsById.values()],
    related: related.map((row) => articleCard(row, relatedTeams)),
    saved,
  });
}

// --- Editor ----------------------------------------------------------------

/** GET /api/articles/mine?status=draft&q=&limit=8&offset=0 */
export async function mine(req, res) {
  const { limit, offset } = readPagination(req.query);
  const status = readStatusFilter(req.query.status);
  const matches = readNameFilter(req.query.q);
  const authorId = req.user.id;

  const rows = await prisma.articles.findMany({
    where: { author_id: authorId },
    orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
    select: { ...ARTICLE_FIELDS, body: false },
  });
  const now = new Date();
  const filtered = rows.filter((row) => (!status || statusOf(row, now) === status) && matches(row.title, row.summary));
  const page = filtered.slice(offset, offset + limit);
  const [views, stats] = await Promise.all([totalViews(page.map((row) => row.id)), editorStats(authorId, rows, now)]);

  res.json({
    items: page.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      status: statusOf(row, now),
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      views: views.get(row.id) ?? 0,
    })),
    total: filtered.length,
    limit,
    offset,
    stats,
  });
}

/** GET /api/articles/:id/edit */
export async function edit(req, res) {
  const article = await findOwnArticle(req);
  res.json(await editorArticle(article));
}

/** POST /api/articles */
export async function create(req, res) {
  const article = await prisma.articles.create({
    data: { author_id: req.user.id, ...articleData(req.body, null) },
    select: ARTICLE_FIELDS,
  });
  res.status(201).json(await editorArticle(article));
}

/** PATCH /api/articles/:id */
export async function update(req, res) {
  const current = await findOwnArticle(req);
  const article = await prisma.articles.update({
    where: { id: current.id },
    data: articleData(req.body, current),
    select: ARTICLE_FIELDS,
  });
  res.json(await editorArticle(article));
}

/** DELETE /api/articles/:id */
export async function remove(req, res) {
  const article = await findOwnArticle(req);
  // reports.article_id lleva ON DELETE CASCADE: borrar el artículo borraría su historial de moderación
  const reports = await prisma.reports.count({ where: { article_id: article.id } });
  if (reports > 0) {
    throw AppError.conflict('Este artículo tiene denuncias: pásalo a borrador en vez de eliminarlo');
  }
  await prisma.articles.delete({ where: { id: article.id } });
  res.status(204).end();
}

// --- Ayudas: lectura de parámetros ------------------------------------------

function readCategory(value) {
  if (value === undefined || value === '') return null;
  if (!CATEGORIES.includes(value)) {
    throw AppError.badRequest('La categoría no es válida', { category: `Usa una de: ${CATEGORIES.join(', ')}` });
  }
  return value;
}

function readStatusFilter(value) {
  if (value === undefined || value === '') return null;
  if (!STATUS_FILTERS.includes(value)) {
    throw AppError.badRequest('El estado no es válido', { status: `Usa uno de: ${STATUS_FILTERS.join(', ')}` });
  }
  return value;
}

// --- Ayudas: consultas -------------------------------------------------------

// Publicado y con la fecha ya pasada (un programado no se ve hasta su hora)
function publishedNow() {
  return { status: 'PUBLISHED', published_at: { lte: new Date() } };
}

// El último publicado con la etiqueta «Destacado» (el grande de Análisis)
function findFeatured() {
  return prisma.articles.findFirst({
    where: { ...publishedNow(), tags: { has: FEATURED_TAG } },
    orderBy: [{ published_at: 'desc' }, { id: 'desc' }],
    select: ARTICLE_FIELDS,
  });
}

// Un artículo del editor de la sesión; si no es suyo, 404 (no se revela que existe)
async function findOwnArticle(req) {
  const id = readId(req.params.id, 'id del artículo');
  const article = await prisma.articles.findFirst({ where: { id, author_id: req.user.id }, select: ARTICLE_FIELDS });
  if (!article) throw AppError.notFound('No existe ese artículo');
  return article;
}

// «Análisis relacionados»: primero los de la misma categoría y luego los más recientes
async function findRelated(article) {
  const others = { ...publishedNow(), id: { not: article.id } };
  const order = [{ published_at: 'desc' }, { id: 'desc' }];
  const sameCategory = await prisma.articles.findMany({
    where: { ...others, category: article.category },
    orderBy: order,
    take: RELATED_COUNT,
    select: ARTICLE_FIELDS,
  });
  if (sameCategory.length >= RELATED_COUNT) return sameCategory;
  const recent = await prisma.articles.findMany({
    where: { ...others, id: { notIn: [article.id, ...sameCategory.map((row) => row.id)] } },
    orderBy: order,
    take: RELATED_COUNT - sameCategory.length,
    select: ARTICLE_FIELDS,
  });
  return [...sameCategory, ...recent];
}

// Una visita más en el día de hoy (hora de Madrid)
function countVisit(articleId) {
  return prisma.$executeRaw`
    INSERT INTO article_daily_views (article_id, day, views)
    VALUES (${articleId}, (now() AT TIME ZONE ${TIME_ZONE})::date, 1)
    ON CONFLICT (article_id, day) DO UPDATE SET views = article_daily_views.views + 1
  `;
}

async function isSaved(userId, articleId) {
  const row = await prisma.saved_articles.findUnique({
    where: { user_id_article_id: { user_id: userId, article_id: articleId } },
    select: { user_id: true },
  });
  return Boolean(row);
}

// Visitas totales de cada artículo: Map(id → número)
async function totalViews(ids) {
  if (ids.length === 0) return new Map();
  const rows = await prisma.article_daily_views.groupBy({
    by: ['article_id'],
    where: { article_id: { in: ids } },
    _sum: { views: true },
  });
  return new Map(rows.map((row) => [row.article_id, row._sum.views ?? 0]));
}

// Indicadores del panel: publicados, programados, borradores y visitas (total, este mes y el anterior)
async function editorStats(authorId, rows, now) {
  const count = (status) => rows.filter((row) => statusOf(row, now) === status).length;
  const [views] = await prisma.$queryRaw`
    WITH today AS (SELECT (now() AT TIME ZONE ${TIME_ZONE})::date AS day)
    SELECT
      COALESCE(SUM(v.views), 0)::int AS total,
      COALESCE(SUM(v.views) FILTER (WHERE v.day >= date_trunc('month', today.day)), 0)::int AS month,
      COALESCE(SUM(v.views) FILTER (
        WHERE v.day >= date_trunc('month', today.day) - interval '1 month'
          AND v.day < date_trunc('month', today.day)
      ), 0)::int AS previous_month
    FROM today
    LEFT JOIN article_daily_views v
      ON v.article_id IN (SELECT id FROM articles WHERE author_id = ${authorId})
    GROUP BY today.day
  `;
  return {
    published: count('published'),
    scheduled: count('scheduled'),
    drafts: count('draft'),
    views: views.total,
    monthViews: views.month,
    previousMonthViews: views.previous_month,
    comments: null, // Todavía no hay comentarios en la BD: la tarjeta del mockup se queda con «—»
  };
}

// Equipos por id: Map(id → teamSummary)
async function loadTeams(ids) {
  if (ids.length === 0) return new Map();
  const rows = await prisma.teams.findMany({
    where: { id: { in: ids.map(BigInt) } },
    select: TEAM_SUMMARY_FIELDS,
  });
  return new Map(rows.map((row) => [Number(row.id), teamSummary(row)]));
}

// Jugadores y equipos que salen en los artículos (mencionados, fichas, gráfico y portada)
async function loadRefs(articles) {
  const playerIds = new Set();
  const teamIds = new Set(coverTeamIds(articles));
  for (const article of articles) {
    for (const block of Array.isArray(article.body) ? article.body : []) {
      if (block.type === 'mentions') {
        for (const item of block.items) (item.type === 'player' ? playerIds : teamIds).add(item.id);
      }
      if ((block.type === 'player' || block.type === 'chart') && block.playerId) playerIds.add(block.playerId);
    }
  }
  const [players, teamsById] = await Promise.all([loadPlayers([...playerIds]), loadTeams([...teamIds])]);
  return { playersById: players, teamsById };
}

// Jugadores por id con su equipo y su valoración de la temporada actual: Map(id → jugador)
async function loadPlayers(ids) {
  if (ids.length === 0) return new Map();
  const { season } = await resolveSeason();
  const rows = await prisma.players.findMany({
    where: { id: { in: ids.map(BigInt) } },
    include: {
      teams: { select: TEAM_SUMMARY_FIELDS },
      player_season_stats: { where: { season_id: season.id } },
    },
  });
  return new Map(
    rows.map((row) => {
      const stats = aggregateSeasonStats(row.player_season_stats);
      const summary = playerSummary(row, stats);
      return [
        Number(row.id),
        {
          id: summary.id,
          name: summary.name,
          photoUrl: summary.photoUrl,
          position: summary.position,
          team: teamSummary(row.teams),
          rating: summary.rating,
        },
      ];
    }),
  );
}

// --- Ayudas: forma de las respuestas -----------------------------------------

function statusOf(article, now = new Date()) {
  if (article.status === 'DRAFT') return 'draft';
  return article.published_at > now ? 'scheduled' : 'published';
}

function coverTeamIds(articles) {
  return articles.flatMap((article) =>
    [article.cover?.homeTeamId, article.cover?.awayTeamId].filter((id) => Number.isInteger(id)),
  );
}

// Equipos de la portada ya resueltos (si alguno ya no está en la BD, se queda en null)
function coverTeams(cover, teamsById) {
  if (!cover || (cover.homeTeamId === undefined && cover.awayTeamId === undefined)) return null;
  return { home: teamsById.get(cover.homeTeamId) ?? null, away: teamsById.get(cover.awayTeamId) ?? null };
}

// Tarjeta de un artículo (listados, destacado, relacionados y cabecera de la página del artículo)
function articleCard(article, teamsById) {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    category: article.category,
    tags: article.tags,
    featured: article.tags.includes(FEATURED_TAG),
    status: statusOf(article),
    publishedAt: article.published_at,
    readingMinutes: readingMinutes(article.body),
    author: article.users ? { name: article.users.name, title: article.users.title } : null,
    cover: article.cover,
    coverTeams: coverTeams(article.cover, teamsById),
  };
}

// Artículo completo para el Editor de artículo (18), con los nombres de lo que menciona
async function editorArticle(article) {
  const refs = await loadRefs([article]);
  return {
    ...articleCard(article, refs.teamsById),
    publishAt: statusOf(article) === 'scheduled' ? article.published_at : null,
    body: article.body,
    updatedAt: article.updated_at,
    players: [...refs.playersById.values()],
    teams: [...refs.teamsById.values()],
  };
}

// Columnas de la BD a partir del cuerpo de la petición (ya validado con validateArticle)
function articleData(body, current) {
  return {
    title: body.title.trim(),
    summary: body.summary?.trim() || null,
    category: body.category,
    tags: (body.tags ?? []).map((tag) => tag.trim()),
    cover: body.cover ?? Prisma.DbNull, // NULL de SQL, no el null de JSON
    body: body.body ?? [],
    ...publication(body, current),
  };
}

// Estado y fecha: un borrador no tiene fecha; uno publicado conserva la suya si ya estaba publicado
function publication(body, current) {
  if (body.status === 'draft') return { status: 'DRAFT', published_at: null };
  if (body.status === 'scheduled') return { status: 'PUBLISHED', published_at: new Date(body.publishAt) };
  const keepDate = current && statusOf(current) === 'published';
  return { status: 'PUBLISHED', published_at: keepDate ? current.published_at : new Date() };
}
