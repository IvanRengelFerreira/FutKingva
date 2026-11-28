// Rutas del simulador de partidos (20 · Administración, RF9). Todas exigen rol de administrador.

import { Router } from 'express';
import * as simulator from '../controllers/simulator.js';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateSimulatorGoal, validateSimulatorStart } from '../../shared/validation/simulator.js';

export const simulatorRouter = Router();
simulatorRouter.get('/', requireRole('admin'), simulator.list);
simulatorRouter.post('/', requireRole('admin'), validate(validateSimulatorStart), simulator.start);
simulatorRouter.post('/:id/goal', requireRole('admin'), validate(validateSimulatorGoal), simulator.goal);
simulatorRouter.post('/:id/finish', requireRole('admin'), simulator.finish);
simulatorRouter.delete('/:id', requireRole('admin'), simulator.remove);
