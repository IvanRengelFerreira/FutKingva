// Sesión con cookie (RF1): express-session, guardada en la tabla «session» de PostgreSQL
// (connect-pg-simple). El navegador solo guarda una cookie con el id de la sesión; los datos
// (req.session.userId) se quedan en el servidor.
//
// Las rutas de acceso (página 14) son las que abren y cierran la sesión:
//   iniciar:   await regenerateSession(req); req.session.userId = user.id;
//              (+ req.session.cookie.maxAge = 7 días si marca «Recordarme»)
//   cerrar:    await destroySession(req, res);

import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { config } from '../config.js';

const PgStore = connectPgSimple(session);

export const SESSION_COOKIE = 'futkingva.sid';

// Conexión propia (pequeña) a la BD; la tabla la crea la migración 0_init, no connect-pg-simple
export const sessionStore = new PgStore({
  conString: config.databaseUrl,
  tableName: 'session',
  createTableIfMissing: false,
  pruneSessionInterval: 60 * 15, // Borra las sesiones caducadas cada 15 minutos
});

export const sessionMiddleware = session({
  name: SESSION_COOKIE,
  secret: config.sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false, // Los invitados no crean sesión ni cookie
  cookie: {
    httpOnly: true, // El JavaScript de la web no puede leerla
    sameSite: 'lax', // No se envía desde formularios de otras webs
    secure: config.isProduction, // Solo por HTTPS en producción
    // Sin maxAge: dura hasta cerrar el navegador. «Recordarme» lo cambia al iniciar sesión.
  },
});

/** Nueva sesión con id nuevo (al iniciar sesión, para evitar la fijación de sesión) */
export function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

/** Cierra la sesión: la borra de la BD y le dice al navegador que borre la cookie */
export function destroySession(req, res) {
  return new Promise((resolve, reject) => {
    if (!req.session) return resolve();
    req.session.destroy((error) => {
      if (error) return reject(error);
      res?.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: config.isProduction });
      resolve();
    });
  });
}
