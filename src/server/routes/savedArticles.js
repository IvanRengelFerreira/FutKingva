// Rutas de los artículos guardados del usuario de la sesión (09 · Artículo, botón «Guardar»).

import { Router } from 'express';
import * as savedArticles from '../controllers/savedArticles.js';
import { requireAuth } from '../middleware/auth.js';

export const savedArticlesRouter = Router();
savedArticlesRouter.use(requireAuth);
savedArticlesRouter.get('/', savedArticles.list);
savedArticlesRouter.put('/:id', savedArticles.save);
savedArticlesRouter.delete('/:id', savedArticles.remove);
