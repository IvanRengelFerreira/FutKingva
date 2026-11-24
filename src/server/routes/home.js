// Rutas de 01 · Inicio. Pública: resumen del día de LaLiga.

import { Router } from 'express';
import * as home from '../controllers/home.js';

export const homeRouter = Router();
homeRouter.get('/', home.overview);
