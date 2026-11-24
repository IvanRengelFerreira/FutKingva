// Ruta del perfil del usuario autenticado (12 · Mi perfil, RF3).

import { Router } from 'express';
import * as profile from '../controllers/profile.js';
import { requireAuth } from '../middleware/auth.js';

export const profileRouter = Router();
profileRouter.get('/', requireAuth, profile.detail);
