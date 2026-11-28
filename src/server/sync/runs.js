// TEMPORAL: control de concurrencia y ciclo de vida en sync_runs para las ejecuciones de sincronización.
// La sincronización automática periódica reutilizará esta lógica en otra tarea.

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { FOOTBALL_DATA_SOURCE, createFootballDataClient } from './footballData.js';
import { syncMatches } from './matches.js';
import { syncScorers } from './scorers.js';
import { emitToAll } from '../realtime/socket.js';

// Evita lanzar dos ejecuciones solapadas del mismo recurso (y deja caducar bloqueos huérfanos tras un reinicio)
const RUNNING_LOCK_MINUTES = 5;
const RUNNING_LOCK_MS = RUNNING_LOCK_MINUTES * 60 * 1000;
const CONFLICT_MESSAGE = 'Ya hay una sincronización en curso para este recurso. Espera a que termine.';
const UNEXPECTED_SYNC_ERROR = 'Error inesperado al sincronizar.';

// Map evita resolver claves heredadas de Object.prototype (toString, constructor, __proto__)
const RUNNERS = new Map([
  ['matches', syncMatches],
  ['scorers', syncScorers],
]);

export const SYNC_RESOURCES = [...RUNNERS.keys()];

// Bloqueo inmediato en memoria dentro del mismo proceso, complementado por la comprobación en sync_runs
const inFlightResources = new Set();

function safeFinishedAt(startedAt) {
  // Evita violar CHECK (finished_at >= started_at) ante pequeñas diferencias de reloj entre Node y PostgreSQL
  return new Date(Math.max(Date.now(), startedAt.getTime()));
}

async function assertNoRecentRunningRow(resource) {
  const lockSince = new Date(Date.now() - RUNNING_LOCK_MS);
  const activeRun = await prisma.sync_runs.findFirst({
    where: { source: FOOTBALL_DATA_SOURCE, resource, status: 'RUNNING', started_at: { gte: lockSince } },
    select: { id: true },
  });
  if (activeRun) throw AppError.conflict(CONFLICT_MESSAGE);
}

async function startRun(resource, seasonId) {
  await assertNoRecentRunningRow(resource);
  return prisma.sync_runs.create({
    data: { source: FOOTBALL_DATA_SOURCE, resource, season_id: seasonId, status: 'RUNNING' },
  });
}

function finishRun(run, result) {
  return prisma.sync_runs.update({
    where: { id: run.id },
    data: {
      status: 'OK',
      records: result.records,
      requests: result.requests,
      finished_at: safeFinishedAt(run.started_at),
    },
  });
}

async function markRunError(run, requests, error) {
  // Solo guardamos mensajes de AppError para no exponer detalles internos (SQL, Prisma…) al panel
  const message = error instanceof AppError ? error.message : UNEXPECTED_SYNC_ERROR;
  try {
    await prisma.sync_runs.update({
      where: { id: run.id },
      data: { status: 'ERROR', requests, error: message, finished_at: safeFinishedAt(run.started_at) },
    });
  } catch (updateError) {
    console.warn(
      `[sync] No se ha podido marcar la ejecución ${run.id} como ERROR:`,
      updateError?.code ?? updateError?.name,
    );
  }
}

/**
 * Ejecuta la sincronización de un recurso y registra su estado en sync_runs (RUNNING → OK / ERROR).
 */
export async function executeSync(resource, season) {
  const runner = RUNNERS.get(resource);
  if (!runner) {
    throw AppError.badRequest('El recurso de sincronización no es válido', {
      resource: 'Tiene que ser matches o scorers',
    });
  }
  if (inFlightResources.has(resource)) throw AppError.conflict(CONFLICT_MESSAGE);

  inFlightResources.add(resource);
  let run = null;
  let api = null;

  try {
    run = await startRun(resource, season.id);
    api = createFootballDataClient();
    const result = await runner(season, api);
    const finished = await finishRun(run, result);
    // «Última actualización» al momento en las páginas abiertas
    emitToAll('sync:done', { resource, finishedAt: finished.finished_at });
    return { run: finished, skipped: result.skipped };
  } catch (error) {
    if (run) await markRunError(run, api ? api.requestCount() : 0, error);
    throw error;
  } finally {
    inFlightResources.delete(resource);
  }
}
