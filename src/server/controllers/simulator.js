// Simulador de partidos de la demo (20 · Administración, RF9). Responsable: Ivan.
//   GET    /api/admin/simulator             → partidos simulados recientes
//   POST   /api/admin/simulator             → empieza uno { homeTeamId, awayTeamId } (201)
//   POST   /api/admin/simulator/:id/goal    → gol ahora { side?: 'home' | 'away' }
//   POST   /api/admin/simulator/:id/finish  → termina el partido
//   DELETE /api/admin/simulator/:id         → lo borra (204)
// Los partidos simulados nunca cuentan en la clasificación ni en ninguna estadística.
// La lógica del partido está en realtime/matchSimulator.js; aquí solo se lee la petición y se responde.

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { readId } from '../utils/params.js';
import { resolveSeason } from '../utils/seasons.js';
import { matchSummary } from '../utils/matches.js';
import {
  deleteSimulatedMatch,
  finishSimulatedMatch,
  listSimulatedMatches,
  scoreGoal,
  startSimulatedMatch,
} from '../realtime/matchSimulator.js';

export async function list(req, res) {
  const { items, total, limit } = await listSimulatedMatches();
  // Formato de listado de CONVENCIONES §3 (sin paginar: el panel solo enseña los últimos)
  res.json({ items: items.map(matchSummary), total, limit, offset: 0 });
}

export async function start(req, res) {
  const { season } = await resolveSeason();
  const homeTeamId = BigInt(req.body.homeTeamId);
  const awayTeamId = BigInt(req.body.awayTeamId);

  // Solo equipos que juegan esta temporada
  const inSeason = await prisma.season_teams.count({
    where: { season_id: season.id, team_id: { in: [homeTeamId, awayTeamId] } },
  });
  if (inSeason !== 2) {
    throw AppError.badRequest('Los dos equipos tienen que jugar esta temporada', {
      homeTeamId: 'Elige equipos de la temporada actual',
    });
  }

  const match = await startSimulatedMatch(season, homeTeamId, awayTeamId);
  res.status(201).json(matchSummary(match));
}

export async function goal(req, res) {
  const match = await scoreGoal(readId(req.params.id, 'id del partido'), req.body.side);
  res.json(matchSummary(match));
}

export async function finish(req, res) {
  const match = await finishSimulatedMatch(readId(req.params.id, 'id del partido'));
  res.json(matchSummary(match));
}

export async function remove(req, res) {
  await deleteSimulatedMatch(readId(req.params.id, 'id del partido'));
  res.status(204).end();
}
