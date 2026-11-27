// Rutas de los artículos (08 · Análisis, 09 · Artículo, 17 · Panel de editor y 18 · Editor de artículo).
// Leer es público; escribir, solo editores y solo sus propios artículos (RF7).

import { Router } from 'express';
import * as articles from '../controllers/articles.js';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateArticle } from '../../shared/validation/article.js';

const editorOnly = requireRole('editor');

export const articlesRouter = Router();
articlesRouter.get('/', articles.list);
articlesRouter.get('/mine', editorOnly, articles.mine); // Antes que /:id
articlesRouter.get('/:id/edit', editorOnly, articles.edit);
articlesRouter.get('/:id', articles.detail);
articlesRouter.post('/', editorOnly, validate(validateArticle), articles.create);
articlesRouter.patch('/:id', editorOnly, validate(validateArticle), articles.update);
articlesRouter.delete('/:id', editorOnly, articles.remove);
