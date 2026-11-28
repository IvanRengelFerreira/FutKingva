// Tiempo real (RF9): Socket.IO en el mismo servidor HTTP y con la misma cookie de sesión.
//
// Al conectarse, cada navegador con sesión entra en su sala «user:<id>» (avisos personales);
// los invitados también se conectan y reciben lo público (marcadores y clasificación).
//
//   emitToAll('match:update', { match, lastEvent });     // a todos los conectados
//   emitToUser(userId, 'notification:new', aviso);         // solo a las pestañas de ese usuario
//
// Eventos que envía el servidor (los recibe src/client/services/realtime.js):
//   match:update     { match, lastEvent }     marcador o minuto nuevo
//   match:finished   { match, simulated }     final del partido (simulated: no es un resultado real)
//   match:removed    { matchId }              se ha borrado un partido simulado
//   standings:update { standings }            clasificación nueva de la temporada
//   notification:new { aviso }                aviso para el usuario (campana y aviso emergente)
//   sync:done        { resource, finishedAt } ha terminado una sincronización con football-data

import { Server } from 'socket.io';
import { prisma } from '../db.js';
import { sessionMiddleware } from '../middleware/session.js';

let io = null;

const userRoom = (userId) => `user:${userId}`;

// Los ids de la BD son BigInt y Socket.IO no sabe enviarlos: salen como número, igual que en la API (app.js)
const toPlain = (data) =>
  JSON.parse(JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? Number(value) : value)));

/** Id del usuario de la sesión si puede entrar (existe y no está bloqueado), o null */
async function activeUserId(session) {
  const userId = session?.userId;
  if (userId == null) return null;
  const user = await prisma.users.findUnique({ where: { id: BigInt(userId) }, select: { id: true, status: true } });
  return user && user.status !== 'BLOCKED' ? user.id : null;
}

/**
 * Solo conexiones desde la propia web: el Origin del navegador tiene que ser el mismo sitio que sirve la
 * página (Host). Sin Origin (herramientas, pruebas) se acepta: la sesión sigue haciendo falta para los avisos.
 */
function sameOrigin(req, callback) {
  const { origin, host } = req.headers;
  let allowed = !origin;
  try {
    allowed ||= new URL(origin).host === host;
  } catch {
    allowed = false;
  }
  callback(null, allowed);
}

/** Arranca Socket.IO sobre el servidor HTTP de Express (lo llama server.js) */
export function createRealtime(httpServer) {
  // El cliente de Socket.IO va en el JS de la web (socket.io-client): no hace falta servirlo
  io = new Server(httpServer, { serveClient: false, allowRequest: sameOrigin });

  // La misma sesión que las rutas de la API: socket.request.session
  io.engine.use(sessionMiddleware);

  io.on('connection', async (socket) => {
    try {
      const userId = await activeUserId(socket.request.session);
      // Si se ha desconectado mientras se consultaba la BD (p. ej. otra pestaña cerró sesión), no entra
      if (userId != null && socket.connected) await socket.join(userRoom(userId));
    } catch (error) {
      // Un fallo al conectar un navegador nunca tumba el servidor: sigue recibiendo lo público
      console.error('[realtime] Error al conectar un navegador:', error?.code ?? error?.message);
    }
  });

  return io;
}

/** Envía un evento a todos los navegadores conectados (sin Socket.IO arrancado no hace nada) */
export function emitToAll(event, data) {
  io?.emit(event, toPlain(data));
}

/** Envía un evento solo a las pestañas abiertas por ese usuario */
export function emitToUser(userId, event, data) {
  io?.to(userRoom(userId)).emit(event, toPlain(data));
}

/**
 * Desconecta todas las pestañas de ese usuario (al cerrar sesión o al bloquearlo): dejan de recibir sus
 * avisos. El cliente vuelve a conectarse solo, ya con la sesión que tenga en ese momento.
 */
export function disconnectUser(userId) {
  io?.in(userRoom(userId)).disconnectSockets(true);
}

/** Cierra las conexiones abiertas para que el servidor HTTP pueda terminar (cierre ordenado) */
export function closeRealtime() {
  if (!io) return;
  io.disconnectSockets(true);
  io.engine.close();
  io = null;
}
