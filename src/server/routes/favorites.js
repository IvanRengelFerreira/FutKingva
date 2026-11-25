// Rutas de favoritos del usuario autenticado (12 · Mi perfil, 02 · Equipos, 03 · Ficha de equipo, 04 · Ficha de jugador).

import { Router } from 'express';
import * as favorites from '../controllers/favorites.js';
import { requireAuth } from '../middleware/auth.js';

export const favoritesRouter = Router();
favoritesRouter.use(requireAuth);
favoritesRouter.get('/', favorites.list);
favoritesRouter.put('/teams/:id', favorites.addTeam);
favoritesRouter.delete('/teams/:id', favorites.removeTeam);
favoritesRouter.put('/players/:id', favorites.addPlayer);
favoritesRouter.delete('/players/:id', favorites.removePlayer);
