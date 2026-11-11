// Clasificación de una temporada (RF6), calculada con los partidos FINISHED de la BD.
// La usan los importadores y la usará el tiempo real cada vez que cambie un resultado.
//
// Criterios de LaLiga:
//   1. Puntos.
//   2. Entre los empatados a puntos, enfrentamientos directos (puntos y después diferencia de goles),
//      pero SOLO si ya se han jugado todos los partidos entre ellos; si no, se salta este criterio.
//   3. Diferencia de goles general.
//   4. Goles a favor.

/**
 * @param {Array<{ home: string, away: string, homeGoals: number, awayGoals: number }>} matches
 *        partidos terminados, en orden cronológico
 * @param {string[]} teamIds todos los equipos de la temporada (también los que aún no han jugado)
 */
export function computeTable(matches, teamIds) {
  const table = new Map(teamIds.map((id) => [id, {
    teamId: id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, results: [],
  }]));

  for (const m of matches) {
    const home = table.get(m.home);
    const away = table.get(m.away);
    if (!home || !away) continue;
    home.played++; away.played++;
    home.gf += m.homeGoals; home.ga += m.awayGoals;
    away.gf += m.awayGoals; away.ga += m.homeGoals;
    if (m.homeGoals > m.awayGoals) {
      home.won++; away.lost++; home.points += 3;
      home.results.push('W'); away.results.push('L');
    } else if (m.homeGoals < m.awayGoals) {
      away.won++; home.lost++; away.points += 3;
      home.results.push('L'); away.results.push('W');
    } else {
      home.drawn++; away.drawn++; home.points++; away.points++;
      home.results.push('D'); away.results.push('D');
    }
  }

  // Enfrentamientos directos entre los empatados a puntos
  const byPoints = Map.groupBy(table.values(), (r) => r.points);
  for (const group of byPoints.values()) {
    for (const r of group) { r.h2hPoints = 0; r.h2hGd = 0; }
    if (group.length < 2) continue;

    const ids = new Set(group.map((r) => r.teamId));
    const between = matches.filter((m) => ids.has(m.home) && ids.has(m.away));
    // Completos = cada equipo ha jugado en casa contra cada uno de los demás
    const complete = new Set(between.map((m) => `${m.home}>${m.away}`)).size === ids.size * (ids.size - 1);
    if (!complete) continue;

    for (const m of between) {
      const home = table.get(m.home);
      const away = table.get(m.away);
      const diff = m.homeGoals - m.awayGoals;
      home.h2hGd += diff; away.h2hGd -= diff;
      if (diff > 0) home.h2hPoints += 3;
      else if (diff < 0) away.h2hPoints += 3;
      else { home.h2hPoints++; away.h2hPoints++; }
    }
  }

  const sorted = [...table.values()].sort((a, b) =>
    b.points - a.points
    || b.h2hPoints - a.h2hPoints
    || b.h2hGd - a.h2hGd
    || (b.gf - b.ga) - (a.gf - a.ga)
    || b.gf - a.gf);
  sorted.forEach((r, i) => {
    r.position = i + 1;
    r.form = r.results.slice(-5).join(''); // los últimos 5, el más reciente al final
  });
  return sorted;
}

/**
 * Recalcula y guarda la clasificación de una temporada.
 * Los equipos salen de season_teams; los partidos, de matches (solo FINISHED).
 * @returns {Promise<ReturnType<typeof computeTable>>} la tabla calculada (teamId = id de teams)
 */
export async function recalculateStandings(client, seasonId) {
  const { rows: teams } = await client.query(
    'SELECT team_id FROM season_teams WHERE season_id = $1', [seasonId]);
  const { rows: matches } = await client.query(`
    SELECT home_team_id AS home, away_team_id AS away, home_goals AS "homeGoals", away_goals AS "awayGoals"
    FROM matches
    WHERE season_id = $1 AND status = 'FINISHED'
    ORDER BY utc_date, matchday, id`, [seasonId]);

  const table = computeTable(matches, teams.map((t) => t.team_id));

  await client.query(`
    INSERT INTO standings (season_id, team_id, position, played, won, drawn, lost,
                           goals_for, goals_against, points, form)
    SELECT $1, * FROM unnest($2::bigint[], $3::smallint[], $4::smallint[], $5::smallint[], $6::smallint[],
                             $7::smallint[], $8::smallint[], $9::smallint[], $10::smallint[], $11::varchar[])
    ON CONFLICT (season_id, team_id) DO UPDATE SET
      position = EXCLUDED.position, played = EXCLUDED.played, won = EXCLUDED.won, drawn = EXCLUDED.drawn,
      lost = EXCLUDED.lost, goals_for = EXCLUDED.goals_for, goals_against = EXCLUDED.goals_against,
      points = EXCLUDED.points, form = EXCLUDED.form`,
  [seasonId, ...['teamId', 'position', 'played', 'won', 'drawn', 'lost', 'gf', 'ga', 'points', 'form']
    .map((key) => table.map((r) => r[key]))]);

  // Equipos que ya no son de la temporada (si se corrigió season_teams)
  await client.query(
    'DELETE FROM standings WHERE season_id = $1 AND NOT (team_id = ANY($2::bigint[]))',
    [seasonId, table.map((r) => r.teamId)]);

  return table;
}
