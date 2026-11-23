import { Router } from 'express';
import * as teams from '../controllers/teams.js';

export const teamsRouter = Router();
teamsRouter.get('/:id', teams.detail);
