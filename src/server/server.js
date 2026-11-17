// Arranca el servidor HTTP:   npm start   (o npm run dev para reiniciar al guardar)

import { config } from './config.js';
import { prisma } from './db.js';
import { createApp } from './app.js';

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`FutKingva API escuchando en http://localhost:${config.port}/api`);
});

// Cierre ordenado: deja de aceptar conexiones, termina las que hay y cierra Prisma
let closing = false;
async function shutdown(reason, exitCode = 0) {
  if (closing) return;
  closing = true;
  console.log(`\nCerrando el servidor (${reason})…`);
  const force = setTimeout(() => process.exit(exitCode || 1), 5000).unref();
  server.close(async () => {
    try {
      await prisma.$disconnect();
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
