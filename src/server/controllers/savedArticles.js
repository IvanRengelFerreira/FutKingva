// Artículos guardados por el usuario de la sesión (botón «Guardar» de 09 · Artículo). Responsable: Carlota.
//   GET    /api/me/saved-articles       → ids de los artículos guardados (los más recientes primero)
//   PUT    /api/me/saved-articles/:id   → guardar (204; si ya estaba guardado, no pasa nada)
//   DELETE /api/me/saved-articles/:id   → quitar (204; si no estaba guardado, no pasa nada)
// Solo se pueden guardar artículos publicados.

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { readId } from '../utils/params.js';

/** GET /api/me/saved-articles */
export async function list(req, res) {
  const rows = await prisma.saved_articles.findMany({
    where: { user_id: req.user.id },
    orderBy: { created_at: 'desc' },
    select: { article_id: true },
  });
  res.json({ items: rows.map((row) => row.article_id) });
}

/** PUT /api/me/saved-articles/:id */
export async function save(req, res) {
  const articleId = readId(req.params.id, 'id del artículo');
  const article = await prisma.articles.findFirst({
    where: { id: articleId, status: 'PUBLISHED', published_at: { lte: new Date() } },
    select: { id: true },
  });
  if (!article) throw AppError.notFound('No existe ese artículo');

  await prisma.saved_articles.upsert({
    where: { user_id_article_id: { user_id: req.user.id, article_id: articleId } },
    create: { user_id: req.user.id, article_id: articleId },
    update: {},
  });
  res.status(204).end();
}

/** DELETE /api/me/saved-articles/:id */
export async function remove(req, res) {
  const articleId = readId(req.params.id, 'id del artículo');
  await prisma.saved_articles.deleteMany({ where: { user_id: req.user.id, article_id: articleId } });
  res.status(204).end();
}
