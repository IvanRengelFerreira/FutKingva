// Configuración de Prisma 7 (la leen los comandos `npx prisma ...` lanzados desde src/server).
// Prisma no está instalado en el proyecto, así que no se importa `prisma/config`:
// se exporta un objeto simple con la misma forma.
// Prisma 7 no carga el .env por su cuenta → lo carga Node (process.loadEnvFile).
try {
  process.loadEnvFile('.env');
} catch {
  // Sin .env (p. ej. en Docker): DATABASE_URL tiene que venir del entorno.
}

export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
