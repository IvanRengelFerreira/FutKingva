// Crea la aplicación Express sin ponerla a escuchar (eso lo hace server.js).
// Base común: middlewares, comprobación de estado y formato de errores.
// Las rutas de cada página se montan en la zona marcada más abajo.

import express from 'express';
import { prisma } from './db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { sessionMiddleware } from './middleware/session.js';
import { loadUser } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { homeRouter } from './routes/home.js';
import { standingsRouter } from './routes/standings.js';
import { teamsRouter } from './routes/teams.js';
import { adminRouter } from './routes/admin.js';
import { syncRouter } from './routes/sync.js';
import { contactRouter } from './routes/contact.js';
import { playerDataRouter } from './routes/playerData.js';
import { playersRouter } from './routes/players.js';
import { favoritesRouter } from './routes/favorites.js';
import { profileRouter } from './routes/profile.js';
import { comparisonsRouter } from './routes/comparisons.js';
import { idealTeamRouter } from './routes/idealTeam.js';
import { articlesRouter } from './routes/articles.js';
import { savedArticlesRouter } from './routes/savedArticles.js';
import { notificationsRouter } from './routes/notifications.js';
import { simulatorRouter } from './routes/simulator.js';
import { refereesRouter } from './routes/referees.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Los ids de la BD son bigint: en JSON salen como número (JSON.stringify no sabe convertir BigInt)
  app.set('json replacer', (key, value) => (typeof value === 'bigint' ? Number(value) : value));
  app.use(express.json({ limit: '100kb' }));

  // Comprueba que el servidor y la base de datos responden (Docker, demo)
  app.get('/api/health', async (req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
  });

  // Sesión (cookie) y usuario de la sesión en req.user para todas las rutas de abajo.
  // Para proteger una ruta: requireAuth / requireRole('editor') (middleware/auth.js)
  app.use('/api', sessionMiddleware, loadUser);

  // --- Rutas de la API ------------------------------------------------------
  // Aquí se montan los routers de cada recurso, p. ej.: app.use('/api/teams', teamsRouter);
  app.use('/api/auth', authRouter); // Ivan · 14 Acceso
  app.use('/api/home', homeRouter); // Ivan · 01 Inicio
  app.use('/api/standings', standingsRouter); // Angel · 05 Clasificaciones
  app.use('/api/teams', teamsRouter); // Angel · 03 Ficha de equipo
  app.use('/api/admin', adminRouter); // Ivan · 20 Administración
  app.use('/api/admin/sync', syncRouter); // Ivan · 20 Administración (TEMPORAL: botones de sincronización)
  app.use('/api/contact', contactRouter); // Carlota · 16 Contacto
  app.use('/api/player-data', playerDataRouter); // Carlota · 19 Actualizar datos
  app.use('/api/players', playersRouter); // Ivan · 04 Ficha de jugador
  app.use('/api/me/favorites', favoritesRouter); // Ivan · 12 Mi perfil
  app.use('/api/me/profile', profileRouter); // Ivan · 12 Mi perfil
  app.use('/api/me/comparisons', comparisonsRouter); // Ivan · 10 Comparador
  app.use('/api/me/ideal-team', idealTeamRouter); // Ivan · 11 Mi equipo ideal
  app.use('/api/articles', articlesRouter); // Carlota · 08 Análisis, 09 Artículo, 17 Panel de editor, 18 Editor
  app.use('/api/me/saved-articles', savedArticlesRouter); // Carlota · 09 Artículo (guardar)
  app.use('/api/me/notifications', notificationsRouter); // Ivan · tiempo real (campana, 12 Mi perfil)
  app.use('/api/admin/simulator', simulatorRouter); // Ivan · tiempo real (20 Administración, demo)
  app.use('/api/referees', refereesRouter); // Angel · 06 Árbitros y 07 Ficha de árbitro
  // ---------------------------------------------------------------------------

  // Cualquier otra ruta de la API → 404 en el formato común
  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
