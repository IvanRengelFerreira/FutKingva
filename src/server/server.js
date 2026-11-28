// Arranca el servidor HTTP y el tiempo real (Socket.IO):   npm start   (o npm run dev para reiniciar al guardar)

import { config } from './config.js';
import { prisma } from './db.js';
import { createApp } from './app.js';
import { sessionStore } from './middleware/session.js';
import { closeRealtime, createRealtime } from './realtime/socket.js';
import { resumeSimulator, stopSimulator } from './realtime/matchSimulator.js';

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`FutKingva API escuchando en http://localhost:${config.port}/api`);
});

// Socket.IO comparte el servidor HTTP (y el puerto) con la API
createRealtime(server);
// Si al cerrar quedaron partidos simulados a medias, siguen jugándose
resumeSimulator().catch((error) => {
  console.error('[simulador] No se han podido reanudar los partidos simulados:', error?.code ?? error?.message);
});

// Cierre ordenado: para el simulador, cierra las conexiones en directo, deja de aceptar peticiones,
// termina las que hay y cierra Prisma y las sesiones
let closing = false;
async function shutdown(reason, exitCode = 0) {
  if (closing) return;
  closing = true;
  console.log(`\nCerrando el servidor (${reason})…`);
  const force = setTimeout(() => process.exit(exitCode || 1), 5000).unref();
  const simulatorStopped = stopSimulator(); // El reloj se para ya; el minuto en marcha termina solo
  closeRealtime();
  server.close(async () => {
    try {
      // Antes de cerrar la BD, el minuto simulado que esté en marcha tiene que terminar
      await simulatorStopped;
      await Promise.all([prisma.$disconnect(), sessionStore.close()]);
    } catch (error) {
      console.error('Error al cerrar la conexión con la base de datos:', error);
    } finally {
      clearTimeout(force);
      process.exit(exitCode);
    }
  });
}

process.on('SIGINT', () => shutdown('Ctrl+C'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => {
  console.error('Promesa rechazada sin capturar:', error);
  shutdown('error inesperado', 1);
});
process.on('uncaughtException', (error) => {
  console.error('Excepción sin capturar:', error);
  shutdown('error inesperado', 1);
});
