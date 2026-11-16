// Variables de entorno del servidor, leídas y comprobadas al arrancar.
// En local salen de src/server/.env (copia de .env.example); en Docker, del entorno.

try {
  process.loadEnvFile(new URL('./.env', import.meta.url));
} catch {
  // Sin .env: las variables tienen que venir del entorno.
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name} (copia .env.example como .env en src/server).`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: required('DATABASE_URL'),
  isProduction: process.env.NODE_ENV === 'production',
};
