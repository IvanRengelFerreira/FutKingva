// Rutas del equipo ideal del usuario (/api/me/ideal-team). Responsable: Ivan.

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateIdealTeam } from '../../shared/validation/idealTeam.js';
import * as idealTeam from '../controllers/idealTeam.js';

export const idealTeamRouter = Router();

idealTeamRouter.get('/', requireAuth, idealTeam.detail);
idealTeamRouter.put('/', requireAuth, validate(validateIdealTeam), idealTeam.save);
