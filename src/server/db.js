// Instancia única de Prisma Client para todo el servidor.
// El cliente se genera (no está en git): `npx prisma@7.10.1 generate` desde src/server.
// Es TypeScript y Node (≥ 22.18) lo ejecuta sin compilar.

import { existsSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from './config.js';

if (!existsSync(new URL('./generated/prisma/client.ts', import.meta.url))) {
  throw new Error('Falta el cliente de Prisma: ejecuta `npx prisma@7.10.1 generate` en src/server.');
}

const { PrismaClient } = await import('./generated/prisma/client.ts');

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: config.databaseUrl,
    // La BD tiene la zona Europe/Madrid y el adaptador de Prisma lee la hora local de las columnas
    // timestamptz como si fuera UTC (un partido de las 20:00 UTC salía a las 21:00 UTC).
    // Con la sesión en UTC las fechas llegan bien; la web ya las muestra en hora de Madrid.
    options: '-c TimeZone=UTC',
  }),
});
