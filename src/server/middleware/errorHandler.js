// Último middleware de la cadena: convierte cualquier error en el formato común
//   { "error": { "code", "message", "fields"? } }
// Los errores inesperados responden 500 con un mensaje genérico; el detalle solo va al log.

import { AppError } from '../errors/AppError.js';

// Códigos de error de conexión (llegan en error.code o en error.cause.code).
// P1008 = tiempo de espera agotado, P2037 = demasiadas conexiones abiertas.
const CONNECTION_CODES = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'P1001', 'P1002', 'P1008', 'P1017', 'P2037',
]);
// Con el adaptador pg, un fallo de conexión en $queryRaw llega como P2010 con el motivo en
// error.meta.driverAdapterError.cause (p. ej. con 127.0.0.1 o el host «db» de Docker)
const ADAPTER_CONNECTION_KINDS = new Set(['DatabaseNotReachable', 'ConnectionClosed', 'SocketTimeout', 'TooManyConnections']);
// PostgreSQL apagándose o arrancando (admin_shutdown, crash_shutdown, cannot_connect_now)
const POSTGRES_UNAVAILABLE_CODES = new Set(['57P01', '57P02', '57P03']);

function isDatabaseDown(error) {
  const adapterCause = error?.meta?.driverAdapterError?.cause;
  return CONNECTION_CODES.has(error?.code)
    || CONNECTION_CODES.has(error?.cause?.code)
    || ADAPTER_CONNECTION_KINDS.has(adapterCause?.kind)
    || POSTGRES_UNAVAILABLE_CODES.has(adapterCause?.originalCode)
    || error?.name === 'PrismaClientInitializationError';
}

function send(res, status, code, message, fields) {
  res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } });
}

/** Ruta de la API que no existe → 404 en el mismo formato */
export function notFound(req, res) {
  send(res, 404, 'NOT_FOUND', `No existe la ruta ${req.method} ${req.originalUrl}`);
}

export function errorHandler(error, req, res, next) {
  // La respuesta ya se estaba enviando: no se puede cambiar; Express cierra la conexión
  if (res.headersSent) {
    return next(error);
  }
  if (error instanceof AppError) {
    return send(res, error.status, error.code, error.message, error.fields);
  }
  // JSON mal formado en el cuerpo de la petición (express.json)
  if (error?.type === 'entity.parse.failed') {
    return send(res, 400, 'VALIDATION_ERROR', 'El cuerpo de la petición no es un JSON válido');
  }
  // Cuerpo mayor que el límite de express.json (app.js)
  if (error?.type === 'entity.too.large') {
    return send(res, 413, 'PAYLOAD_TOO_LARGE', 'Los datos enviados son demasiado grandes');
  }
  if (isDatabaseDown(error)) {
    console.error(`[BD] Sin conexión con la base de datos (${error.code ?? error.cause?.code ?? error.name})`);
    return send(res, 503, 'SERVICE_UNAVAILABLE', 'No se ha podido conectar con la base de datos. Inténtalo de nuevo en un momento.');
  }
  // Errores conocidos de Prisma
  if (error?.code === 'P2002') {
    return send(res, 409, 'CONFLICT', 'Ya existe un registro con esos datos');
  }
  if (error?.code === 'P2025') {
    return send(res, 404, 'NOT_FOUND', 'No se ha encontrado lo que buscas');
  }

  console.error(`[500] ${req.method} ${req.originalUrl}`, error);
  return send(res, 500, 'INTERNAL_ERROR', 'Ha ocurrido un error inesperado en el servidor');
}
