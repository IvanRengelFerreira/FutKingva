// TEMPORAL: rutas de sincronización manual con football-data.org (20 · Administración).
// Todas exigen rol de administrador. La sincronización automática periódica es otra tarea.

import { Router } from 'express';
import * as sync from '../controllers/sync.js';
import { requireRole } from '../middleware/auth.js';

export const syncRouter = Router();
syncRouter.get('/', requireRole('admin'), sync.list);
syncRouter.post('/:resource', requireRole('admin'), sync.run);
