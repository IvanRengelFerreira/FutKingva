// TEMPORAL: controlador de sincronización manual con football-data.org (20 · Administración).
// La sincronización automática periódica se implementará en otra tarea.

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { resolveSeason } from '../utils/seasons.js';
import { FOOTBALL_DATA_SOURCE, currentQuota } from '../sync/footballData.js';
import { SYNC_RESOURCES, executeSync } from '../sync/runs.js';

const SYNC_RUN_FIELDS = {
  resource: true,
  status: true,
  records: true,
  requests: true,
  error: true,
  started_at: true,
  finished_at: true,
};

function formatSyncRun(run, extra = {}) {
  return {
    resource: run.resource,
    status: run.status,
    records: run.records,
    requests: run.requests,
    error: run.error,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    ...extra,
  };
}

/** GET /api/admin/sync → últimas ejecuciones por recurso y última cuota conocida */
export async function list(req, res) {
  const runs = await Promise.all(
    SYNC_RESOURCES.map((resource) =>
      prisma.sync_runs.findFirst({
        where: { source: FOOTBALL_DATA_SOURCE, resource },
        orderBy: [{ started_at: 'desc' }, { id: 'desc' }],
        select: SYNC_RUN_FIELDS,
      }),
    ),
  );

  res.json({ items: runs.filter(Boolean).map((run) => formatSyncRun(run)), quota: currentQuota() });
}

/** POST /api/admin/sync/:resource → ejecuta 'matches' o 'scorers' y devuelve el resultado y la cuota */
export async function run(req, res) {
  const { resource } = req.params;
  if (!SYNC_RESOURCES.includes(resource)) {
    throw AppError.badRequest('El recurso de sincronización no es válido', {
      resource: 'Tiene que ser matches o scorers',
    });
  }

  const { season } = await resolveSeason();
  const { run: finished, skipped } = await executeSync(resource, season);
  res.json(formatSyncRun(finished, { ...(skipped !== undefined && { skipped }), quota: currentQuota() }));
}
