import { Router } from 'express';
import * as referees from '../controllers/referees.js';

export const refereesRouter = Router();
refereesRouter.get('/', referees.list);
refereesRouter.get('/:id', referees.detail);
