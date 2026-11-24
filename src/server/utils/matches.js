// Formato de partidos en las respuestas de la API (inicio y ficha de equipo).

import { LALIGA } from './seasons.js';
import { TEAM_SUMMARY_FIELDS, teamSummary } from './teams.js';

/** Para el include de Prisma: los dos equipos del partido con los campos de teamSummary */
export const MATCH_TEAMS = {
  teams_matches_home_team_idToteams: { select: TEAM_SUMMARY_FIELDS },
  teams_matches_away_team_idToteams: { select: TEAM_SUMMARY_FIELDS },
};

/**
 * Partido sin equipo de referencia (inicio, resultados recientes y próximos partidos).
 * La fila de Prisma ha de incluir MATCH_TEAMS.
 */
export function matchSummary(match) {
  const home = match.teams_matches_home_team_idToteams;
  const away = match.teams_matches_away_team_idToteams;
  const hasScore = match.home_goals != null && match.away_goals != null;

  return {
    id: match.id,
    date: match.utc_date,
    round: match.matchday,
    status: match.status,
    minute: match.minute,
    competition: LALIGA,
    homeTeam: teamSummary(home),
    awayTeam: teamSummary(away),
    score: hasScore ? [match.home_goals, match.away_goals] : null,
  };
}

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
  const base = matchSummary(match);
  const isHome = match.home_team_id === teamId;
  const score = base.score ? (isHome ? base.score : [base.score[1], base.score[0]]) : null;

  return {
    id: base.id,
    date: base.date,
    round: base.round,
    homeTeam: base.homeTeam,
    awayTeam: base.awayTeam,
    opponent: isHome ? base.awayTeam : base.homeTeam,
    venue: isHome ? 'C' : 'F',
    score,
    result: score ? matchResult(...score) : null,
  };
}
