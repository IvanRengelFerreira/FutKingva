// Rutas de 19 · Actualizar datos de jugadores (RF11). Solo para editores.
// Van aparte de /api/players (04 · Ficha de jugador, de Ivan) para no mezclar lo público con la zona de editor.

import { Router } from 'express';
import * as playerData from '../controllers/playerData.js';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validatePlayerData } from '../../shared/validation/playerData.js';

export const playerDataRouter = Router();
playerDataRouter.use(requireRole('editor'));

playerDataRouter.get('/', playerData.overview);
playerDataRouter.get('/players', playerData.search);
playerDataRouter.get('/players/:id', playerData.detail);
playerDataRouter.patch('/players/:id', validate(validatePlayerData), playerData.update);
playerDataRouter.get('/history', playerData.history);
