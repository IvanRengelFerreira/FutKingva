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
  // ---------------------------------------------------------------------------

  // Cualquier otra ruta de la API → 404 en el formato común
  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
