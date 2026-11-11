// Importador de la temporada actual de LaLiga desde football-data.org (paso 4 del plan del back-end).
//
//   npm run import:current
//
// 5 peticiones (≈ 30 s por el límite del plan gratuito): competición, equipos con plantilla,
// los 380 partidos, goleadores y clasificación (esta última solo para comprobar la nuestra).
// Las respuestas se guardan en src/server/data/football-data/ (ignorado por git).
//
// Enlaza con el histórico de Transfermarkt para no duplicar nada:
//   · equipos: tabla fija FD_TO_TM (mappers.js)
//   · jugadores: por fd_id si ya se enlazaron; si no, misma fecha de nacimiento + alguna palabra
//     del nombre en común. Si hay dudas (dos candidatos, o dos de la API para el mismo jugador)
//     no se enlaza: se crea aparte y se avisa por consola.
//   · árbitros: por fd_id o por nombre (sin tildes ni mayúsculas)
//
// Plantilla actual (decisión del 10/11/2026): en los equipos de la temporada actual manda
// football-data (plantillas + goleadores). Los jugadores que Transfermarkt ponía en esos equipos
// y que la API no trae se quedan sin equipo actual (team_id = NULL); su histórico no se toca.
//
// Se puede repetir: todo se actualiza por fd_id. No pisa estadísticas corregidas por un editor
// (las que tienen ese campo en field_sources).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createPool, bulkUpsert } from '../pg.js';
import { recalculateStandings } from '../standings.js';
import { normalizeName, namesOverlap, nameScore } from '../names.js';
import { createFootballDataClient } from './client.js';
import { FD_TO_TM, NEW_CLUBS, PLAYER_ALIASES, REFEREE_ALIASES, coachName, positionGroup, text } from './mappers.js';
import { CLUBS, seasonLabel } from '../transfermarkt/mappers.js';

const COMPETITION = 'PD';
const RAW_DIR = join(import.meta.dirname, '..', '..', 'data', 'football-data');

const log = (msg) => console.log(`[${new Date().toLocaleTimeString('es-ES')}] ${msg}`);

// =====================================================================
// 1. Descarga
// =====================================================================

async function download(api) {
  mkdirSync(RAW_DIR, { recursive: true });
  const save = (name, body) => writeFileSync(join(RAW_DIR, `${name}.json`), JSON.stringify(body, null, 2));

  const competition = await api.get(`/competitions/${COMPETITION}`);
  save('competition', competition);
  const year = Number(competition.currentSeason.startDate.slice(0, 4));
  log(`competición: ${competition.name}, temporada ${seasonLabel(year)}, jornada ${competition.currentSeason.currentMatchday}`);

  // La temporada va explícita: si la API cambia de temporada, no se mezclan datos
  const result = { competition, year };
  for (const [name, path] of [
    ['teams', `/competitions/${COMPETITION}/teams?season=${year}`],
    ['matches', `/competitions/${COMPETITION}/matches?season=${year}`],
    ['scorers', `/competitions/${COMPETITION}/scorers?season=${year}&limit=100`],
    ['standings', `/competitions/${COMPETITION}/standings?season=${year}`],
  ]) {
    result[name] = await api.get(path);
    save(name, result[name]);
  }
  log(`descargado: ${result.teams.teams.length} equipos, ${result.matches.matches.length} partidos, `
    + `${result.scorers.scorers.length} goleadores (${api.requestCount()} peticiones)`);
  return result;
}

// =====================================================================
// 2. Carga
// =====================================================================

async function load(client, data) {
  const { competition: comp, year } = data;
  let records = 0;

  // --- Competición y temporada ---------------------------------------
  const { rows: [competition] } = await client.query(`
    INSERT INTO competitions (name, country, tm_code, fd_id, af_id, emblem_url)
    VALUES ('LaLiga', 'España', 'ES1', $1, 140, $2)
    ON CONFLICT (tm_code) DO UPDATE SET fd_id = EXCLUDED.fd_id, emblem_url = EXCLUDED.emblem_url
    RETURNING id`, [comp.id, text(comp.emblem)]);

  const { rows: [season] } = await client.query(`
    INSERT INTO seasons (competition_id, start_year, label, starts_on, ends_on, current_matchday, fd_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (competition_id, start_year) DO UPDATE SET
      label = EXCLUDED.label, starts_on = EXCLUDED.starts_on, ends_on = EXCLUDED.ends_on,
      current_matchday = EXCLUDED.current_matchday, fd_id = EXCLUDED.fd_id
    RETURNING id`,
  [competition.id, year, seasonLabel(year), comp.currentSeason.startDate, comp.currentSeason.endDate,
    comp.currentSeason.currentMatchday, comp.currentSeason.id]);
  await client.query('UPDATE competitions SET current_season_id = $2 WHERE id = $1', [competition.id, season.id]);

  // --- Equipos: por fd_id → por la tabla fija con Transfermarkt → nuevo ---
  const teamId = new Map(); // fd_id → id
  for (const t of data.teams.teams) {
    const tmId = FD_TO_TM[t.id];
    if (tmId === undefined) throw new Error(`Equipo ${t.id} (${t.name}) sin entrada en FD_TO_TM (mappers.js)`);
    const fixed = tmId ? CLUBS[tmId] : NEW_CLUBS[t.id];

    const { rows: [found] } = await client.query(
      'SELECT id FROM teams WHERE fd_id = $1 OR ($2::bigint IS NOT NULL AND tm_id = $2) ORDER BY fd_id NULLS LAST LIMIT 1',
      [t.id, tmId]);
    const values = [fixed.name, fixed.shortName, fixed.tla, fixed.city, t.id,
      text(t.crest), t.founded ?? null, text(t.clubColors), text(t.website), fixed.venue ?? text(t.venue)];

    if (found) {
      // El estadio de Transfermarkt es más reciente («Wanda Metropolitano» en la API): se mantiene
      await client.query(`
        UPDATE teams SET name = $2, short_name = $3, tla = $4, city = COALESCE(city, $5), fd_id = $6,
          crest_url = COALESCE($7, crest_url), founded = COALESCE($8, founded),
          club_colors = COALESCE($9, club_colors), website = COALESCE($10, website),
          venue = COALESCE(venue, $11)
        WHERE id = $1`, [found.id, ...values]);
      teamId.set(t.id, found.id);
    } else {
      const { rows: [inserted] } = await client.query(`
        INSERT INTO teams (name, short_name, tla, city, fd_id, crest_url, founded, club_colors, website, venue)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`, values);
      teamId.set(t.id, inserted.id);
      log(`  equipo nuevo: ${fixed.name}`);
    }
  }
  const seasonTeamIds = [...teamId.values()];
  records += seasonTeamIds.length;

  await bulkUpsert(client, {
    table: 'season_teams',
    columns: [['season_id', 'bigint'], ['team_id', 'bigint'], ['coach_name', 'text']],
    rows: data.teams.teams.map((t) => [season.id, teamId.get(t.id), coachName(t.coach?.name)]),
    onConflict: 'ON CONFLICT (season_id, team_id) DO UPDATE SET coach_name = EXCLUDED.coach_name',
  });
  await client.query('DELETE FROM season_teams WHERE season_id = $1 AND NOT (team_id = ANY($2::bigint[]))',
    [season.id, seasonTeamIds]);
  log(`equipos: ${seasonTeamIds.length}`);

  // --- Árbitros: por fd_id → por nombre → nuevo ---------------------
  const { rows: dbReferees } = await client.query('SELECT id, name, fd_id FROM referees');
  const refByFd = new Map(dbReferees.filter((r) => r.fd_id).map((r) => [String(r.fd_id), r.id]));
  const refByName = new Map(dbReferees.map((r) => [normalizeName(r.name), r]));
  const refereeId = new Map(); // fd_id → id
  const newReferees = [];
  for (const m of data.matches.matches) {
    for (const r of m.referees ?? []) {
      if (r.type !== 'REFEREE' || refereeId.has(r.id)) continue;
      const byFd = refByFd.get(String(r.id));
      if (byFd) { refereeId.set(r.id, byFd); continue; }
      // Mismo nombre; si no, el más parecido con 2 palabras o más en común y sin empate
      // ('José Munuera Montero' = 'José Luis Munuera Montero')
      const wanted = REFEREE_ALIASES[text(r.name)] ?? r.name;
      let byName = refByName.get(normalizeName(wanted));
      if (!byName) {
        const scored = dbReferees.filter((c) => !c.fd_id)
          .map((c) => ({ c, score: nameScore(c.name, wanted) }))
          .filter((x) => x.score >= 2)
          .sort((a, b) => b.score - a.score);
        if (scored.length && (scored.length === 1 || scored[0].score > scored[1].score)) byName = scored[0].c;
      }
      if (byName && !byName.fd_id) {
        await client.query('UPDATE referees SET fd_id = $2 WHERE id = $1', [byName.id, r.id]);
        byName.fd_id = r.id;
        refereeId.set(r.id, byName.id);
        continue;
      }
      const name = text(r.name);
      const { rows: [inserted] } = await client.query(`
        INSERT INTO referees (name, short_name, nationality, fd_id) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, name.split(' ').slice(-2).join(' '), text(r.nationality), r.id]);
      refereeId.set(r.id, inserted.id);
      newReferees.push(name);
    }
  }
  log(`árbitros: ${refereeId.size} (nuevos: ${newReferees.length ? newReferees.join(', ') : 'ninguno'})`);
  records += refereeId.size;

  // --- Jugadores ------------------------------------------------------
  // Entradas de la API: plantillas + goleadores. Hay goleadores que no están en la plantilla (manda su
  // equipo de goleadores) y personas repetidas con dos ids: uno en la plantilla y otro en goleadores
  // («Alejandro Baena» / «Álex Baena»). Se juntan en una persona si tienen la misma fecha de
  // nacimiento y un nombre parecido; su fd_id es el de goleadores (el que lleva las estadísticas).
  const entries = [];
  for (const t of data.teams.teams) {
    for (const p of t.squad ?? []) {
      entries.push({ fdId: p.id, name: text(p.name), dob: p.dateOfBirth, nationality: text(p.nationality),
        position: positionGroup(p.position), team: t.id });
    }
  }
  for (const s of data.scorers.scorers) {
    const p = s.player;
    entries.push({ fdId: p.id, name: text(p.name), dob: p.dateOfBirth, nationality: text(p.nationality),
      position: positionGroup(p.section), team: s.team.id, scorer: true,
      shirt: p.shirtNumber >= 1 && p.shirtNumber <= 99 ? p.shirtNumber : null,
      firstName: text(p.firstName), lastName: text(p.lastName) });
  }
  const namesOf = (name) => [name, ...(PLAYER_ALIASES[name] ? [PLAYER_ALIASES[name]] : [])];

  const persons = [];
  for (const e of entries) {
    // Solo se junta un goleador con una entrada de plantilla (nunca dos de la plantilla entre sí)
    let person = persons.find((p) => p.fdIds.has(e.fdId)
      || (e.scorer && !p.entries.some((x) => x.scorer) && p.dob === e.dob
        && p.names.some((n) => namesOf(e.name).some((m) => namesOverlap(n, m)))));
    if (!person) {
      person = { fdIds: new Set(), names: [], dob: e.dob, entries: [] };
      persons.push(person);
    }
    person.fdIds.add(e.fdId);
    person.names.push(...namesOf(e.name));
    person.entries.push(e);
  }
  for (const p of persons) {
    const squad = p.entries.find((e) => !e.scorer);
    const scorer = p.entries.find((e) => e.scorer);
    Object.assign(p, {
      fdId: (scorer ?? squad).fdId,
      name: (squad ?? scorer).name,                      // el de la plantilla suele ser el completo
      nationality: (squad ?? scorer).nationality,
      position: squad?.position ?? scorer?.position ?? null,
      team: (scorer ?? squad).team,                      // goleadores está más al día que las plantillas
      shirt: scorer?.shirt ?? null,
      firstName: scorer?.firstName ?? null,
      lastName: scorer?.lastName ?? null,
    });
  }
  const repeated = persons.filter((p) => p.fdIds.size > 1);

  // Emparejado con la BD: por fd_id → misma fecha de nacimiento + nombre más parecido
  // last_team = equipo de su última temporada en el histórico (para la segunda pasada)
  const { rows: dbPlayers } = await client.query(`
    SELECT p.id, p.name, p.fd_id, to_char(p.date_of_birth, 'YYYY-MM-DD') AS dob,
      (SELECT ps.team_id FROM player_season_stats ps JOIN seasons s ON s.id = ps.season_id
       WHERE ps.player_id = p.id ORDER BY s.start_year DESC, ps.played DESC LIMIT 1) AS last_team
    FROM players p`);
  const byFd = new Map(dbPlayers.filter((p) => p.fd_id).map((p) => [String(p.fd_id), p]));
  const byDob = Map.groupBy(dbPlayers.filter((p) => p.dob), (p) => p.dob);

  const claims = new Map(); // id de la BD → personas que lo reclaman
  const sameDobNoName = [];
  for (const p of persons) {
    const linked = [...p.fdIds].map((id) => byFd.get(String(id))).find(Boolean);
    if (linked) { p.dbId = linked.id; continue; }
    // Candidatos: misma fecha y sin enlazar con otro jugador de la API
    const sameDob = (byDob.get(p.dob) ?? []).filter((c) => !c.fd_id || p.fdIds.has(Number(c.fd_id)));
    const scored = sameDob
      .map((c) => ({ c, score: Math.max(...p.names.map((n) => nameScore(c.name, n))) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    if (scored.length && (scored.length === 1 || scored[0].score > scored[1].score)) {
      p.candidate = scored[0].c;
      claims.set(p.candidate.id, [...(claims.get(p.candidate.id) ?? []), p]);
    } else if (scored.length) {
      p.ambiguous = `${p.name}: ${scored.length} candidatos igual de parecidos (${scored.map((x) => x.c.name).join(', ')})`;
    } else if (sameDob.length) {
      sameDobNoName.push(`${p.name} ↔ ${sameDob.map((c) => c.name).join(' / ')}`);
    }
  }

  // Segunda pasada: la API tiene algunas fechas de nacimiento mal (Júnior Firpo 10/05 en vez de 22/08).
  // Se acepta si coinciden el nombre completo, el año de nacimiento y el equipo de su última temporada.
  const wrongDob = [];
  const byExactName = Map.groupBy(dbPlayers.filter((c) => !c.fd_id && c.dob), (c) => normalizeName(c.name));
  for (const p of persons) {
    if (p.dbId || p.candidate || p.ambiguous) continue;
    const team = String(teamId.get(p.team));
    const found = [...new Set(p.names.flatMap((n) => byExactName.get(normalizeName(n)) ?? []))]
      .filter((c) => c.dob.slice(0, 4) === p.dob?.slice(0, 4) && String(c.last_team) === team);
    if (found.length !== 1) continue;
    p.candidate = found[0];
    claims.set(p.candidate.id, [...(claims.get(p.candidate.id) ?? []), p]);
    wrongDob.push(`${p.name} (API ${p.dob}, Transfermarkt ${found[0].dob})`);
  }

  for (const p of persons) {
    if (!p.candidate) continue;
    if (claims.get(p.candidate.id).length === 1) p.dbId = p.candidate.id;
    else p.ambiguous = `${p.name}: comparte jugador del histórico (${p.candidate.name}) con otro de la API`;
  }

  const toUpdate = persons.filter((p) => p.dbId);
  const toInsert = persons.filter((p) => !p.dbId);
  const ambiguous = toInsert.filter((p) => p.ambiguous).map((p) => p.ambiguous);

  // Enlazados: se queda el nombre de Transfermarkt (con tildes); la posición de la API solo si falta
  await client.query(`
    UPDATE players p SET
      fd_id = u.fd_id, team_id = u.team_id,
      position = COALESCE(p.position, u.position),
      nationality = COALESCE(p.nationality, u.nationality),
      shirt_number = COALESCE(u.shirt_number, p.shirt_number)
    FROM unnest($1::bigint[], $2::bigint[], $3::bigint[], $4::position_group[], $5::text[], $6::smallint[])
      AS u(id, fd_id, team_id, position, nationality, shirt_number)
    WHERE p.id = u.id`,
  [toUpdate.map((p) => p.dbId), toUpdate.map((p) => p.fdId), toUpdate.map((p) => teamId.get(p.team)),
    toUpdate.map((p) => p.position), toUpdate.map((p) => p.nationality), toUpdate.map((p) => p.shirt)]);

  const inserted = await bulkUpsert(client, {
    table: 'players',
    columns: [['fd_id', 'bigint'], ['name', 'text'], ['first_name', 'text'], ['last_name', 'text'],
      ['date_of_birth', 'date'], ['nationality', 'text'], ['position', 'position_group'],
      ['team_id', 'bigint'], ['shirt_number', 'smallint']],
    rows: toInsert.map((p) => [p.fdId, p.name, p.firstName, p.lastName, p.dob,
      p.nationality, p.position, teamId.get(p.team), p.shirt]),
    onConflict: `ON CONFLICT (fd_id) DO UPDATE SET team_id = EXCLUDED.team_id,
      position = COALESCE(players.position, EXCLUDED.position),
      shirt_number = COALESCE(EXCLUDED.shirt_number, players.shirt_number)`,
    returning: 'id, fd_id',
  });
  const insertedId = new Map(inserted.map((r) => [Number(r.fd_id), r.id]));
  for (const p of toInsert) p.dbId = insertedId.get(p.fdId);

  // Plantilla actual = la de la API: el resto de jugadores de estos equipos se queda sin equipo actual
  const { rowCount: detached } = await client.query(`
    UPDATE players SET team_id = NULL
    WHERE team_id = ANY($1::bigint[]) AND NOT (id = ANY($2::bigint[]))`,
  [seasonTeamIds, persons.map((p) => p.dbId)]);

  log(`jugadores: ${persons.length} de la API (${repeated.length} repetidos con dos ids) → `
    + `${toUpdate.filter((p) => p.candidate).length} enlazados ahora con el histórico, `
    + `${toUpdate.filter((p) => !p.candidate).length} ya enlazados, `
    + `${toInsert.length} nuevos (${ambiguous.length} dudosos); `
    + `${detached} del histórico sin equipo actual`);
  for (const p of repeated) log(`  repetido en la API: ${[...new Set(p.entries.map((e) => e.name))].join(' = ')}`);
  for (const w of wrongDob) log(`  fecha de nacimiento distinta (enlazado por nombre, año y equipo): ${w}`);
  for (const a of ambiguous) log(`  dudoso (creado aparte): ${a}`);
  for (const s of sameDobNoName) log(`  misma fecha, nombre distinto (creado aparte): ${s}`);
  records += persons.length + detached;

  // fd_id (también los repetidos) → id de la BD, para las estadísticas de goleadores
  const playerId = new Map(persons.flatMap((p) => [...p.fdIds].map((id) => [String(id), p.dbId])));

  // --- Partidos -------------------------------------------------------
  const matchRows = data.matches.matches.map((m) => {
    const referee = (m.referees ?? []).find((r) => r.type === 'REFEREE');
    return [m.id, season.id, m.matchday, m.utcDate, m.status,
      teamId.get(m.homeTeam.id), teamId.get(m.awayTeam.id),
      m.score?.fullTime?.home ?? null, m.score?.fullTime?.away ?? null,
      m.score?.halfTime?.home ?? null, m.score?.halfTime?.away ?? null,
      referee ? refereeId.get(referee.id) : null, 'FOOTBALL_DATA'];
  });
  await bulkUpsert(client, {
    table: 'matches',
    columns: [['fd_id', 'bigint'], ['season_id', 'bigint'], ['matchday', 'smallint'], ['utc_date', 'timestamptz'],
      ['status', 'match_status'], ['home_team_id', 'bigint'], ['away_team_id', 'bigint'],
      ['home_goals', 'smallint'], ['away_goals', 'smallint'], ['home_goals_ht', 'smallint'],
      ['away_goals_ht', 'smallint'], ['referee_id', 'bigint'], ['source', 'data_source']],
    rows: matchRows,
    // Los partidos del simulador de la demo no se tocan
    onConflict: `ON CONFLICT (fd_id) DO UPDATE SET
      season_id = EXCLUDED.season_id, matchday = EXCLUDED.matchday, utc_date = EXCLUDED.utc_date,
      status = EXCLUDED.status, home_team_id = EXCLUDED.home_team_id, away_team_id = EXCLUDED.away_team_id,
      home_goals = EXCLUDED.home_goals, away_goals = EXCLUDED.away_goals,
      home_goals_ht = EXCLUDED.home_goals_ht, away_goals_ht = EXCLUDED.away_goals_ht,
      referee_id = EXCLUDED.referee_id
    WHERE NOT matches.is_simulated`,
  });
  const byStatus = Map.groupBy(data.matches.matches, (m) => m.status);
  log(`partidos: ${matchRows.length} (${[...byStatus].map(([s, l]) => `${s} ${l.length}`).join(', ')})`);
  records += matchRows.length;

  // --- Estadísticas de la temporada (goleadores) ----------------------
  // Si un editor ha corregido un campo (está en field_sources), se respeta
  const keep = (field) => `${field} = CASE WHEN player_season_stats.field_sources ? '${field}'
      THEN player_season_stats.${field} ELSE EXCLUDED.${field} END`;
  await bulkUpsert(client, {
    table: 'player_season_stats',
    columns: [['season_id', 'bigint'], ['player_id', 'bigint'], ['team_id', 'bigint'], ['played', 'smallint'],
      ['goals', 'smallint'], ['assists', 'smallint'], ['penalties', 'smallint'], ['source', 'data_source']],
    rows: data.scorers.scorers.map((s) => [season.id, playerId.get(String(s.player.id)), teamId.get(s.team.id),
      s.playedMatches ?? 0, s.goals ?? 0, s.assists ?? 0, Math.min(s.penalties ?? 0, s.goals ?? 0),
      'FOOTBALL_DATA']),
    onConflict: `ON CONFLICT (season_id, player_id, team_id) DO UPDATE SET
      ${['played', 'goals', 'assists', 'penalties'].map(keep).join(',\n      ')}`,
  });
  log(`estadísticas de goleadores: ${data.scorers.scorers.length}`);
  records += data.scorers.scorers.length;

  // --- Clasificación (calculada) y comprobación con la de la API -------
  const table = await recalculateStandings(client, season.id);
  records += table.length;
  const official = new Map((data.standings.standings.find((s) => s.type === 'TOTAL')?.table ?? [])
    .map((r) => [String(teamId.get(r.team.id)), r]));
  const shortName = new Map(data.teams.teams.map((t) => [String(teamId.get(t.id)), t.shortName]));
  const differences = table.filter((r) => {
    const o = official.get(String(r.teamId));
    return !o || o.position !== r.position || o.points !== r.points || o.goalDifference !== r.gf - r.ga;
  });
  log(`clasificación: líder ${shortName.get(String(table[0].teamId))} con ${table[0].points} pts; `
    + (differences.length
      ? `distinta de la API en: ${differences.map((r) => `${shortName.get(String(r.teamId))} `
        + `(nuestra ${r.position}ª ${r.points} pts, API ${official.get(String(r.teamId))?.position}ª `
        + `${official.get(String(r.teamId))?.points} pts)`).join(', ')}`
      : 'igual que la de la API'));

  return { records, seasonId: season.id };
}

// =====================================================================
// Programa principal
// =====================================================================

async function main() {
  const api = createFootballDataClient();
  const pool = createPool();

  // Sin el histórico, los equipos, jugadores y árbitros se crearían solo con fd_id y el importador
  // del histórico (que empareja por tm_id) los duplicaría después. Se comprueba antes de gastar peticiones.
  const { rows: [history] } = await pool.query(
    "SELECT count(*)::int AS n FROM matches WHERE source = 'TRANSFERMARKT'");
  if (history.n === 0) {
    await pool.end();
    throw new Error('Falta el histórico: lanza antes `npm run import:history` (o `npm run import`).');
  }

  const { rows: [run] } = await pool.query(
    "INSERT INTO sync_runs (source, resource) VALUES ('FOOTBALL_DATA', 'current') RETURNING id");

  const client = await pool.connect();
  try {
    log('Importando la temporada actual de LaLiga desde football-data.org');
    const data = await download(api);
    await client.query('BEGIN');
    const { records, seasonId } = await load(client, data);
    await client.query('COMMIT');
    await pool.query(`UPDATE sync_runs SET status = 'OK', records = $2, requests = $3, season_id = $4,
      finished_at = now() WHERE id = $1`, [run.id, records, api.requestCount(), seasonId]);
    log(`Hecho: ${records} filas creadas o actualizadas (${api.requestCount()} peticiones).`);
  } catch (error) {
    await client.query('ROLLBACK');
    await pool.query(`UPDATE sync_runs SET status = 'ERROR', error = $2, requests = $3, finished_at = now()
      WHERE id = $1`, [run.id, String(error.stack ?? error), api.requestCount()]);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('\nLa importación ha fallado:', error.message);
  process.exitCode = 1;
});
