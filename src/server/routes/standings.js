import { Router } from 'express';
import * as standings from '../controllers/standings.js';

export const standingsRouter = Router();
standingsRouter.get('/', standings.list);
