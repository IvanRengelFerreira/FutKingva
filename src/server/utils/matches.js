// Formato de un partido visto desde un equipo (próximos partidos y últimos resultados de la ficha de equipo).

import { TEAM_SUMMARY_FIELDS, teamSummary } from './teams.js';

/** Para el include de Prisma: los dos equipos del partido con los campos de teamSummary */
export const MATCH_TEAMS = {
  teams_matches_home_team_idToteams: { select: TEAM_SUMMARY_FIELDS },
  teams_matches_away_team_idToteams: { select: TEAM_SUMMARY_FIELDS },
};

/** V / E / D según los goles del equipo y los del rival */
function matchResult(goalsFor, goalsAgainst) {
  if (goalsFor > goalsAgainst) return 'V';
  if (goalsFor < goalsAgainst) return 'D';
  return 'E';
}

/**
 * Partido visto desde teamId: rival, en casa (C) o fuera (F) y, si ya se ha jugado,
 * el marcador con los goles del equipo primero y su resultado (V/E/D).
 * La fila de Prisma ha de incluir MATCH_TEAMS.
 */
export function teamMatch(match, teamId) {
  const isHome = match.home_team_id === teamId;
  const home = match.teams_matches_home_team_idToteams;
  const away = match.teams_matches_away_team_idToteams;
  const isPlayed = match.home_goals != null && match.away_goals != null;
  const score = isHome ? [match.home_goals, match.away_goals] : [match.away_goals, match.home_goals];

  return {
    id: match.id,
    date: match.utc_date,
    round: match.matchday,
    homeTeam: teamSummary(home),
    awayTeam: teamSummary(away),
    opponent: teamSummary(isHome ? away : home),
    venue: isHome ? 'C' : 'F',
    score: isPlayed ? score : null,
    result: isPlayed ? matchResult(...score) : null,
  };
}
