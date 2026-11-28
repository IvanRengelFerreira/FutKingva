// Rutas de los avisos del usuario (campana, menú móvil y 12 · Mi perfil, RF9). Todas con sesión.

import { Router } from 'express';
import * as notifications from '../controllers/notifications.js';
import { requireAuth } from '../middleware/auth.js';

export const notificationsRouter = Router();
notificationsRouter.get('/', requireAuth, notifications.list);
notificationsRouter.patch('/read', requireAuth, notifications.markAllRead);
