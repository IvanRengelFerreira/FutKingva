// Clasificación de LaLiga (05 · Clasificaciones, RF6). Responsable: Angel.
//   GET /api/standings            → temporada actual
//   GET /api/standings?season=2025 → la 2025/26

import { prisma } from '../db.js';
import { resolveSeason, listSeasons, seasonSummary } from '../utils/seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from '../utils/teams.js';

// La BD guarda la forma en inglés (W/D/L); la web la enseña en español (V/E/D)
const FORM_LETTERS = { W: 'V', D: 'E', L: 'D' };

export function toSpanishForm(form) {
  return (form ?? '').split('').map((letter) => FORM_LETTERS[letter] ?? '').join('');
}

export function standingRow(row) {
  return {
    position: row.position,
    teamId: row.team_id,
    team: teamSummary(row.teams),
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    goalDifference: row.goals_for - row.goals_against,
    points: row.points,
    form: toSpanishForm(row.form),
  };
}

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

  // Última vez que se actualizó la tabla (la fila más reciente)
  const updatedAt = rows.reduce((latest, row) => (row.updated_at > latest ? row.updated_at : latest), new Date(0));

  res.json({
    season: { ...seasonSummary(season), isCurrent },
    seasons,
    updatedAt: rows.length ? updatedAt : null,
    table: rows.map(standingRow),
  });
}
