// TEMPORAL: recálculo de la clasificación (RF6) tras la sincronización manual de partidos.
// La sincronización automática periódica se implementará en otra tarea.
//
// Criterios de LaLiga:
//   1. Puntos.
//   2. Entre empatados a puntos, enfrentamientos directos (puntos y diferencia de goles),
//      solo si ya se han jugado todos los partidos de ida y vuelta entre ellos.
//   3. Diferencia de goles general.
//   4. Goles a favor.

const POINTS_WIN = 3;
const POINTS_DRAW = 1;
const FORM_LENGTH = 5;

function createTeamRow(teamId) {
  return {
    teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    results: [],
    h2hPoints: 0,
    h2hGoalDiff: 0,
  };
}

function applyMatch(table, match) {
  const home = table.get(match.homeTeamId);
  const away = table.get(match.awayTeamId);
  if (!home || !away) return;

  home.played++;
  away.played++;
  home.goalsFor += match.homeGoals;
  home.goalsAgainst += match.awayGoals;
  away.goalsFor += match.awayGoals;
  away.goalsAgainst += match.homeGoals;

  if (match.homeGoals > match.awayGoals) {
    home.won++;
    away.lost++;
    home.points += POINTS_WIN;
    home.results.push('W');
    away.results.push('L');
  } else if (match.homeGoals < match.awayGoals) {
    away.won++;
    home.lost++;
    away.points += POINTS_WIN;
    home.results.push('L');
    away.results.push('W');
  } else {
    home.drawn++;
    away.drawn++;
    home.points += POINTS_DRAW;
    away.points += POINTS_DRAW;
    home.results.push('D');
    away.results.push('D');
  }
}

function applyHeadToHead(table, group, matches) {
  if (group.length < 2) return;

  const ids = new Set(group.map((row) => row.teamId));
  const between = matches.filter((match) => ids.has(match.homeTeamId) && ids.has(match.awayTeamId));
  // Solo aplica cuando cada equipo ha jugado en casa contra todos los demás del grupo empatado
  const complete = new Set(between.map((m) => `${m.homeTeamId}>${m.awayTeamId}`)).size === ids.size * (ids.size - 1);
  if (!complete) return;

  for (const match of between) {
    const home = table.get(match.homeTeamId);
    const away = table.get(match.awayTeamId);
    const diff = match.homeGoals - match.awayGoals;
    home.h2hGoalDiff += diff;
    away.h2hGoalDiff -= diff;

    if (diff > 0) home.h2hPoints += POINTS_WIN;
    else if (diff < 0) away.h2hPoints += POINTS_WIN;
    else {
      home.h2hPoints += POINTS_DRAW;
      away.h2hPoints += POINTS_DRAW;
    }
  }
}

function compareRows(a, b) {
  return (
    b.points - a.points ||
    b.h2hPoints - a.h2hPoints ||
    b.h2hGoalDiff - a.h2hGoalDiff ||
    b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
    b.goalsFor - a.goalsFor ||
    Number(a.teamId - b.teamId)
  );
}

/**
 * Calcula la tabla ordenada a partir de los partidos terminados en orden cronológico.
 * @param {Array<{ homeTeamId: bigint, awayTeamId: bigint, homeGoals: number, awayGoals: number }>} matches
 * @param {bigint[]} teamIds
 */
export function computeTable(matches, teamIds) {
  const table = new Map(teamIds.map((id) => [id, createTeamRow(id)]));
  for (const match of matches) applyMatch(table, match);

  const byPoints = Map.groupBy(table.values(), (row) => row.points);
  for (const group of byPoints.values()) applyHeadToHead(table, group, matches);

  const sorted = [...table.values()].sort(compareRows);
  return sorted.map((row, index) => ({
    ...row,
    position: index + 1,
    form: row.results.slice(-FORM_LENGTH).join(''),
  }));
}

async function persistTable(tx, seasonId, table) {
  const teamIds = table.map((row) => row.teamId);

  for (const row of table) {
    const values = {
      position: row.position,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goals_for: row.goalsFor,
      goals_against: row.goalsAgainst,
      points: row.points,
      form: row.form,
    };

    await tx.standings.upsert({
      where: { season_id_team_id: { season_id: seasonId, team_id: row.teamId } },
      create: { season_id: seasonId, team_id: row.teamId, ...values },
      update: values,
    });
  }

  // Limpia equipos que ya no figuren en season_teams para esta temporada
  await tx.standings.deleteMany({
    where: { season_id: seasonId, team_id: { notIn: teamIds } },
  });
}

/**
 * Recalcula y guarda la clasificación de una temporada con sus partidos FINISHED dentro de `tx`.
 * Los partidos del simulador de la demo (is_simulated) nunca cuentan.
 */
export async function recalculateStandings(seasonId, tx) {
  const seasonTeams = await tx.season_teams.findMany({ where: { season_id: seasonId }, select: { team_id: true } });
  // Si no hay equipos registrados en la temporada, salimos sin tocar standings para no vaciarla por error
  if (!seasonTeams.length) return [];

  const finishedMatches = await tx.matches.findMany({
    where: { season_id: seasonId, status: 'FINISHED', is_simulated: false },
    orderBy: [{ utc_date: 'asc' }, { matchday: 'asc' }, { id: 'asc' }],
    select: { home_team_id: true, away_team_id: true, home_goals: true, away_goals: true },
  });

  const matches = finishedMatches.map((m) => ({
    homeTeamId: m.home_team_id,
    awayTeamId: m.away_team_id,
    homeGoals: m.home_goals,
    awayGoals: m.away_goals,
  }));
  const table = computeTable(
    matches,
    seasonTeams.map((row) => row.team_id),
  );

  await persistTable(tx, seasonId, table);
  return table;
}
