// Clasificación de LaLiga (05 · Clasificaciones, RF6). Responsable: Angel.
//   GET /api/standings            → temporada actual
//   GET /api/standings?season=2025 → la 2025/26

import { prisma } from '../db.js';
import { resolveSeason, listSeasons, seasonSummary } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS } from '../utils/teams.js';
import { standingRow, latestUpdate } from '../utils/standings.js';

export async function list(req, res) {
  const { season, isCurrent } = await resolveSeason(req.query.season);

  const [rows, seasons] = await Promise.all([
    prisma.standings.findMany({
      where: { season_id: season.id },
      orderBy: { position: 'asc' },
      include: { teams: { select: TEAM_SUMMARY_FIELDS } },
    }),
    listSeasons(),
  ]);

  res.json({
    season: { ...seasonSummary(season), isCurrent },
    seasons,
    updatedAt: latestUpdate(rows),
    table: rows.map(standingRow),
  });
}
