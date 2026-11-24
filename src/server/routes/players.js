import { Router } from 'express';
import * as players from '../controllers/players.js';

export const playersRouter = Router();
playersRouter.get('/', players.list);
playersRouter.get('/:id', players.detail);
