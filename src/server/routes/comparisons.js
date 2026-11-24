// Rutas de comparativas guardadas del usuario (10 · Comparador, RF4). Todas privadas.

import { Router } from 'express';
import * as comparisons from '../controllers/comparisons.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateComparison } from '../../shared/validation/comparisons.js';

export const comparisonsRouter = Router();
comparisonsRouter.get('/', requireAuth, comparisons.list);
comparisonsRouter.post('/', requireAuth, validate(validateComparison), comparisons.create);
comparisonsRouter.delete('/:id', requireAuth, comparisons.remove);
