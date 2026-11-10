// Importador del histórico de LaLiga desde transfermarkt-datasets (paso 3 del plan del back-end).
//
//   npm run import:history
//
// Carga TODAS las temporadas de LaLiga del dataset (2012/13 → 2025/26):
//   competición → temporadas → equipos (+ equipos por temporada) → árbitros → jugadores
//   → partidos → participaciones (appearances) → eventos (goles, tarjetas, cambios)
// y después calcula: estadísticas por jugador y temporada, por árbitro y temporada, y clasificaciones.
//
// Se puede repetir: todo se inserta con ON CONFLICT (tm_id, claves compuestas…), así que
// una segunda ejecución actualiza en lugar de duplicar. No pisa lo que haya puesto un editor
// (estadísticas con source distinto de TRANSFERMARKT) ni los datos de jugadores ya enlazados
// con football-data (fd_id).
//
// Convenciones de esta fuente:
//   · Transfermarkt solo da la FECHA del partido, no la hora → utc_date = ese día a las 12:00 UTC.
//     El front sabe que no hay hora real porque source = 'TRANSFERMARKT'.
//   · Gol en propia (OWN_GOAL): team_id = equipo beneficiado (el que suma el gol).
//   · Eventos con minuto desconocido (-1 en el dataset) no se importan.
//   · Penaltis del árbitro = penaltis marcados (el dataset no tiene los fallados).

import { join } from 'node:path';
import { readCsvGz } from '../csv.js';
import { createPool, bulkUpsert } from '../pg.js';
import { ensureFiles } from './download.js';
import {
  CLUBS, crestUrl, text, int, date, seasonLabel, matchday,
  positionGroup, detailedPosition, foot, height, eventType,
} from './mappers.js';

const LEAGUE = 'ES1';
const DATA_DIR = process.env.TRANSFERMARKT_DIR
  ?? join(import.meta.dirname, '..', '..', 'data', 'transfermarkt');
const file = (name) => join(DATA_DIR, `${name}.csv.gz`);

const log = (msg) => console.log(`[${new Date().toLocaleTimeString('es-ES')}] ${msg}`);

// =====================================================================
// 1. Lectura de los CSV (solo lo que es de LaLiga)
// =====================================================================

async function readSource() {
  const games = [];
  const gameIds = new Set();
  for await (const g of readCsvGz(file('games'), (r) => r.competition_id === LEAGUE)) {
    games.push(g);
    gameIds.add(g.game_id);
  }
  log(`games: ${games.length} partidos de LaLiga`);

  const clubIds = new Set(games.flatMap((g) => [g.home_club_id, g.away_club_id]));
  const unknownClubs = [...clubIds].filter((id) => !CLUBS[id]);
  if (unknownClubs.length) {
    throw new Error(`Clubes sin entrada en CLUBS (mappers.js): ${unknownClubs.join(', ')}`);
  }

  // Participaciones: una por jugador y partido (por si el dataset trae alguna repetida)
  const appearances = new Map();
  for await (const a of readCsvGz(file('appearances'), (r) => gameIds.has(r.game_id))) {
    appearances.set(`${a.game_id}_${a.player_id}`, a);
  }
  log(`appearances: ${appearances.size}`);

  const events = [];
  for await (const e of readCsvGz(file('game_events'), (r) => gameIds.has(r.game_id))) {
    events.push(e);
  }
  log(`game_events: ${events.length}`);

  // Jugadores: todos los que aparecen en participaciones o en eventos (goleador, asistente, el que entra)
  const playerIds = new Set();
  for (const a of appearances.values()) playerIds.add(a.player_id);
  for (const e of events) {
    for (const id of [e.player_id, e.player_in_id, e.player_assist_id]) if (text(id)) playerIds.add(id);
  }
  const players = new Map();
  for await (const p of readCsvGz(file('players'), (r) => playerIds.has(r.player_id))) {
    players.set(p.player_id, p);
  }
  // Los que no están en players.csv: se crean con el nombre de su participación
  const namesFromAppearances = new Map();
  for (const a of appearances.values()) namesFromAppearances.set(a.player_id, a.player_name);
  for (const id of playerIds) {
    if (!players.has(id) && text(namesFromAppearances.get(id))) {
      players.set(id, { player_id: id, name: namesFromAppearances.get(id) });
    }
  }
  log(`players: ${players.size} (sin ficha ni nombre: ${playerIds.size - players.size})`);

  const clubs = new Map();
  for await (const c of readCsvGz(file('clubs'), (r) => clubIds.has(r.club_id))) clubs.set(c.club_id, c);

  return { games, appearances, events, players, clubs, clubIds };
}

// =====================================================================
// 2. Clasificación final de cada temporada
// =====================================================================
// Criterios de LaLiga: puntos → enfrentamientos directos entre los empatados (puntos y
// diferencia de goles) → diferencia de goles general → goles a favor.

function computeStandings(seasonGames) {
  const table = new Map();
  const row = (id) => {
    if (!table.has(id)) {
      table.set(id, { teamId: id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, results: [] });
    }
    return table.get(id);
  };

  const ordered = [...seasonGames].sort((a, b) => a.date.localeCompare(b.date) || matchday(a.round) - matchday(b.round));
  for (const g of ordered) {
    const home = row(g.home_club_id);
    const away = row(g.away_club_id);
    const hg = int(g.home_club_goals);
    const ag = int(g.away_club_goals);
    home.played++; away.played++;
    home.gf += hg; home.ga += ag;
    away.gf += ag; away.ga += hg;
    if (hg > ag) {
      home.won++; away.lost++; home.points += 3;
      home.results.push('W'); away.results.push('L');
    } else if (hg < ag) {
      away.won++; home.lost++; away.points += 3;
      home.results.push('L'); away.results.push('W');
    } else {
      home.drawn++; away.drawn++; home.points++; away.points++;
      home.results.push('D'); away.results.push('D');
    }
  }

  // Mini-liga entre los equipos empatados a puntos
  const byPoints = new Map();
  for (const r of table.values()) {
    if (!byPoints.has(r.points)) byPoints.set(r.points, []);
    byPoints.get(r.points).push(r);
  }
  for (const group of byPoints.values()) {
    const ids = new Set(group.map((r) => r.teamId));
    for (const r of group) { r.h2hPoints = 0; r.h2hGd = 0; }
    if (group.length < 2) continue;
    for (const g of seasonGames) {
      if (!ids.has(g.home_club_id) || !ids.has(g.away_club_id)) continue;
      const home = table.get(g.home_club_id);
      const away = table.get(g.away_club_id);
      const diff = int(g.home_club_goals) - int(g.away_club_goals);
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

  // Comprobación con el puesto que da Transfermarkt en el último partido de cada equipo
  const lastPosition = new Map();
  for (const g of ordered) {
    if (text(g.home_club_position)) lastPosition.set(g.home_club_id, int(g.home_club_position));
    if (text(g.away_club_position)) lastPosition.set(g.away_club_id, int(g.away_club_position));
  }
  const disagreements = sorted.filter((r) => lastPosition.has(r.teamId) && lastPosition.get(r.teamId) !== r.position);

  return { rows: sorted, checked: lastPosition.size, disagreements };
}

// =====================================================================
// 3. Carga en la base de datos
// =====================================================================

async function load(client, src) {
  // --- Competición ----------------------------------------------------
  const { rows: [competition] } = await client.query(`
    INSERT INTO competitions (name, country, tm_code, fd_id, af_id)
    VALUES ('LaLiga', 'España', $1, 2014, 140)
    ON CONFLICT (tm_code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id`, [LEAGUE]);
  const competitionId = competition.id;

  // --- Temporadas -----------------------------------------------------
  const seasonInfo = new Map(); // start_year → { first, last, maxMatchday }
  for (const g of src.games) {
    const y = int(g.season);
    const s = seasonInfo.get(y) ?? { first: g.date, last: g.date, maxMatchday: 0 };
    if (g.date < s.first) s.first = g.date;
    if (g.date > s.last) s.last = g.date;
    s.maxMatchday = Math.max(s.maxMatchday, matchday(g.round) ?? 0);
    seasonInfo.set(y, s);
  }
  const seasonRows = await bulkUpsert(client, {
    table: 'seasons',
    columns: [['competition_id', 'bigint'], ['start_year', 'smallint'], ['label', 'text'],
      ['starts_on', 'date'], ['ends_on', 'date'], ['current_matchday', 'smallint']],
    rows: [...seasonInfo].map(([y, s]) => [competitionId, y, seasonLabel(y), s.first, s.last, s.maxMatchday]),
    onConflict: `ON CONFLICT (competition_id, start_year) DO UPDATE SET
      label = EXCLUDED.label, starts_on = EXCLUDED.starts_on, ends_on = EXCLUDED.ends_on,
      current_matchday = EXCLUDED.current_matchday`,
    returning: 'id, start_year',
  });
  const seasonId = new Map(seasonRows.map((r) => [Number(r.start_year), r.id]));
  log(`temporadas: ${seasonRows.length}`);

  // --- Equipos --------------------------------------------------------
  const teamRows = await bulkUpsert(client, {
    table: 'teams',
    columns: [['tm_id', 'bigint'], ['name', 'text'], ['short_name', 'text'], ['tla', 'bpchar'],
      ['city', 'text'], ['venue', 'text'], ['venue_capacity', 'integer'], ['crest_url', 'text']],
    rows: [...src.clubIds].map((id) => {
      const fixed = CLUBS[id];
      const club = src.clubs.get(id) ?? {};
      const seats = int(club.stadium_seats);
      return [id, fixed.name, fixed.shortName, fixed.tla, fixed.city,
        text(club.stadium_name), seats > 0 ? seats : null, crestUrl(id)];
    }),
    // Lo que ya haya puesto otra fuente (football-data) no se pisa: COALESCE con lo que hay
    onConflict: `ON CONFLICT (tm_id) DO UPDATE SET
      name = EXCLUDED.name, short_name = EXCLUDED.short_name, tla = EXCLUDED.tla,
      city = COALESCE(teams.city, EXCLUDED.city),
      venue = COALESCE(teams.venue, EXCLUDED.venue),
      venue_capacity = COALESCE(teams.venue_capacity, EXCLUDED.venue_capacity),
      crest_url = COALESCE(teams.crest_url, EXCLUDED.crest_url)`,
    returning: 'id, tm_id',
  });
  const teamId = new Map(teamRows.map((r) => [String(r.tm_id), r.id]));
  log(`equipos: ${teamRows.length}`);

  // Equipos de cada temporada, con el entrenador del último partido (el que acabó la temporada)
  const coachBySeasonTeam = new Map();
  for (const g of [...src.games].sort((a, b) => a.date.localeCompare(b.date))) {
    coachBySeasonTeam.set(`${g.season}_${g.home_club_id}`, text(g.home_club_manager_name));
    coachBySeasonTeam.set(`${g.season}_${g.away_club_id}`, text(g.away_club_manager_name));
  }
  await bulkUpsert(client, {
    table: 'season_teams',
    columns: [['season_id', 'bigint'], ['team_id', 'bigint'], ['coach_name', 'text']],
    rows: [...coachBySeasonTeam].map(([key, coach]) => {
      const [season, club] = key.split('_');
      return [seasonId.get(Number(season)), teamId.get(club), coach];
    }),
    onConflict: 'ON CONFLICT (season_id, team_id) DO UPDATE SET coach_name = EXCLUDED.coach_name',
  });

  // --- Árbitros (Transfermarkt no tiene id: se emparejan por nombre) ----
  const { rows: existingReferees } = await client.query('SELECT id, name FROM referees');
  const refereeId = new Map(existingReferees.map((r) => [text(r.name), r.id]));
  const newReferees = [...new Set(src.games.map((g) => text(g.referee)).filter(Boolean))]
    .filter((name) => !refereeId.has(name));
  const insertedReferees = await bulkUpsert(client, {
    table: 'referees',
    columns: [['name', 'text'], ['short_name', 'text'], ['nationality', 'text']],
    // Nombre corto = los dos apellidos ('Jesús Gil Manzano' → 'Gil Manzano')
    rows: newReferees.map((name) => [name, name.split(' ').slice(-2).join(' '), 'Spain']),
    returning: 'id, name',
  });
  for (const r of insertedReferees) refereeId.set(r.name, r.id);
  log(`árbitros: ${refereeId.size} (${insertedReferees.length} nuevos)`);

  // --- Jugadores ------------------------------------------------------
  const playerRows = await bulkUpsert(client, {
    table: 'players',
    columns: [['tm_id', 'bigint'], ['name', 'text'], ['first_name', 'text'], ['last_name', 'text'],
      ['date_of_birth', 'date'], ['nationality', 'text'], ['position', 'position_group'],
      ['detailed_position', 'text'], ['foot', 'preferred_foot'], ['height_cm', 'smallint'],
      ['photo_url', 'text'], ['market_value_eur', 'bigint'], ['team_id', 'bigint']],
    rows: [...src.players.values()].map((p) => {
      const value = int(p.market_value_in_eur);
      return [p.player_id, text(p.name), text(p.first_name), text(p.last_name),
        date(p.date_of_birth), text(p.country_of_citizenship), positionGroup(p.position),
        detailedPosition(p.sub_position), foot(p.foot), height(p.height_in_cm),
        text(p.image_url), value != null && value >= 0 ? value : null,
        // Equipo actual solo si es uno de LaLiga; la temporada actual (paso 4) lo corrige
        teamId.get(text(p.current_club_id)) ?? null];
    }),
    // Si el jugador ya está enlazado con football-data (fd_id), su nombre y equipo mandan
    onConflict: `ON CONFLICT (tm_id) DO UPDATE SET
      name          = CASE WHEN players.fd_id IS NULL THEN EXCLUDED.name ELSE players.name END,
      team_id       = CASE WHEN players.fd_id IS NULL THEN EXCLUDED.team_id ELSE players.team_id END,
      first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
      date_of_birth = EXCLUDED.date_of_birth, nationality = EXCLUDED.nationality,
      position = COALESCE(EXCLUDED.position, players.position),
      detailed_position = COALESCE(EXCLUDED.detailed_position, players.detailed_position),
      foot = EXCLUDED.foot, height_cm = EXCLUDED.height_cm, photo_url = EXCLUDED.photo_url,
      market_value_eur = EXCLUDED.market_value_eur`,
    returning: 'id, tm_id',
  });
  const playerId = new Map(playerRows.map((r) => [String(r.tm_id), r.id]));
  log(`jugadores: ${playerRows.length}`);

  // --- Partidos -------------------------------------------------------
  const matchRows = await bulkUpsert(client, {
    table: 'matches',
    columns: [['tm_id', 'bigint'], ['season_id', 'bigint'], ['matchday', 'smallint'], ['utc_date', 'timestamptz'],
      ['status', 'match_status'], ['home_team_id', 'bigint'], ['away_team_id', 'bigint'],
      ['home_goals', 'smallint'], ['away_goals', 'smallint'], ['referee_id', 'bigint'],
      ['venue', 'text'], ['attendance', 'integer'], ['home_formation', 'text'], ['away_formation', 'text'],
      ['home_coach', 'text'], ['away_coach', 'text'], ['source', 'data_source']],
    rows: src.games.map((g) => [g.game_id, seasonId.get(int(g.season)), matchday(g.round),
      `${g.date}T12:00:00Z`, 'FINISHED', teamId.get(g.home_club_id), teamId.get(g.away_club_id),
      int(g.home_club_goals), int(g.away_club_goals), refereeId.get(text(g.referee)) ?? null,
      text(g.stadium), int(g.attendance), text(g.home_club_formation), text(g.away_club_formation),
      text(g.home_club_manager_name), text(g.away_club_manager_name), 'TRANSFERMARKT']),
    onConflict: `ON CONFLICT (tm_id) DO UPDATE SET
      season_id = EXCLUDED.season_id, matchday = EXCLUDED.matchday, utc_date = EXCLUDED.utc_date,
      status = EXCLUDED.status, home_team_id = EXCLUDED.home_team_id, away_team_id = EXCLUDED.away_team_id,
      home_goals = EXCLUDED.home_goals, away_goals = EXCLUDED.away_goals, referee_id = EXCLUDED.referee_id,
      venue = EXCLUDED.venue, attendance = EXCLUDED.attendance,
      home_formation = EXCLUDED.home_formation, away_formation = EXCLUDED.away_formation,
      home_coach = EXCLUDED.home_coach, away_coach = EXCLUDED.away_coach`,
    returning: 'id, tm_id',
  });
  const matchId = new Map(matchRows.map((r) => [String(r.tm_id), r.id]));
  log(`partidos: ${matchRows.length}`);

  // --- Participaciones ------------------------------------------------
  // Titular = el que no entra desde el banquillo en ese partido (no hay alineaciones en el dataset)
  const cameOn = new Set();
  const gamesWithSubs = new Set();
  for (const e of src.events) {
    if (e.type === 'Substitutions') {
      gamesWithSubs.add(e.game_id);
      if (text(e.player_in_id)) cameOn.add(`${e.game_id}_${e.player_in_id}`);
    }
  }
  const appearanceRows = [];
  let skippedAppearances = 0;
  for (const [key, a] of src.appearances) {
    const player = playerId.get(a.player_id);
    const team = teamId.get(a.player_club_id);
    if (!player || !team) { skippedAppearances++; continue; }
    appearanceRows.push([matchId.get(a.game_id), player, team,
      gamesWithSubs.has(a.game_id) ? !cameOn.has(key) : null,
      Math.min(Math.max(int(a.minutes_played) ?? 0, 0), 130),
      int(a.goals) ?? 0, int(a.assists) ?? 0,
      Math.min(int(a.yellow_cards) ?? 0, 2), Math.min(int(a.red_cards) ?? 0, 1), 'TRANSFERMARKT']);
  }
  await bulkUpsert(client, {
    table: 'appearances',
    columns: [['match_id', 'bigint'], ['player_id', 'bigint'], ['team_id', 'bigint'], ['is_starter', 'boolean'],
      ['minutes', 'smallint'], ['goals', 'smallint'], ['assists', 'smallint'],
      ['yellow_cards', 'smallint'], ['red_cards', 'smallint'], ['source', 'data_source']],
    rows: appearanceRows,
    onConflict: `ON CONFLICT (match_id, player_id) DO UPDATE SET
      team_id = EXCLUDED.team_id, is_starter = EXCLUDED.is_starter, minutes = EXCLUDED.minutes,
      goals = EXCLUDED.goals, assists = EXCLUDED.assists,
      yellow_cards = EXCLUDED.yellow_cards, red_cards = EXCLUDED.red_cards, source = EXCLUDED.source`,
  });
  log(`participaciones: ${appearanceRows.length} (saltadas: ${skippedAppearances})`);

  // --- Eventos --------------------------------------------------------
  const eventRows = [];
  const skippedEvents = { minute: 0, type: 0, team: 0 };
  const playerName = (id) => text(src.players.get(id)?.name) ?? (text(id) ? `Jugador ${id} (Transfermarkt)` : null);
  for (const e of src.events) {
    const minute = int(e.minute);
    if (minute == null || minute < 0) { skippedEvents.minute++; continue; }
    const mapped = eventType(e.type, e.description);
    if (!mapped) { skippedEvents.type++; continue; }
    const team = teamId.get(e.club_id);
    if (!team) { skippedEvents.team++; continue; }

    const related = mapped.type === 'SUBSTITUTION' ? text(e.player_in_id) : text(e.player_assist_id);
    const mainPlayer = playerId.get(e.player_id) ?? null;
    const relatedPlayer = related ? playerId.get(related) ?? null : null;
    eventRows.push([matchId.get(e.game_id), Math.min(minute, 130), mapped.type, team,
      mainPlayer, mainPlayer ? null : playerName(e.player_id),
      relatedPlayer, related && !relatedPlayer ? playerName(related) : null,
      mapped.detail, 'TRANSFERMARKT', e.game_event_id]);
  }
  await bulkUpsert(client, {
    table: 'match_events',
    columns: [['match_id', 'bigint'], ['minute', 'smallint'], ['type', 'match_event_type'], ['team_id', 'bigint'],
      ['player_id', 'bigint'], ['player_name', 'text'], ['related_player_id', 'bigint'],
      ['related_player_name', 'text'], ['detail', 'text'], ['source', 'data_source'], ['external_key', 'text']],
    rows: eventRows,
    onConflict: `ON CONFLICT (source, external_key) DO UPDATE SET
      match_id = EXCLUDED.match_id, minute = EXCLUDED.minute, type = EXCLUDED.type, team_id = EXCLUDED.team_id,
      player_id = EXCLUDED.player_id, player_name = EXCLUDED.player_name,
      related_player_id = EXCLUDED.related_player_id, related_player_name = EXCLUDED.related_player_name,
      detail = EXCLUDED.detail`,
  });
  log(`eventos: ${eventRows.length} (saltados: minuto desconocido ${skippedEvents.minute}, `
    + `tipo desconocido ${skippedEvents.type}, equipo desconocido ${skippedEvents.team})`);

  const seasonIds = [...seasonId.values()];

  // --- Estadísticas por jugador y temporada (desde las participaciones) --
  const { rowCount: playerStats } = await client.query(`
    INSERT INTO player_season_stats
      (season_id, player_id, team_id, played, starts, minutes, goals, assists, penalties,
       yellow_cards, red_cards, source)
    SELECT m.season_id, a.player_id, a.team_id,
           count(*),
           count(*) FILTER (WHERE a.is_starter),
           sum(a.minutes),
           sum(a.goals),
           sum(a.assists),
           LEAST(COALESCE(max(p.penalties), 0), sum(a.goals)),  -- penalties <= goals (lo exige la BD)
           sum(a.yellow_cards),
           sum(a.red_cards),
           'TRANSFERMARKT'
    FROM appearances a
    JOIN matches m ON m.id = a.match_id
    LEFT JOIN (
      SELECT m2.season_id, e.player_id, e.team_id, count(*) AS penalties
      FROM match_events e JOIN matches m2 ON m2.id = e.match_id
      WHERE e.type = 'PENALTY_GOAL' AND e.player_id IS NOT NULL
      GROUP BY 1, 2, 3
    ) p ON p.season_id = m.season_id AND p.player_id = a.player_id AND p.team_id = a.team_id
    WHERE m.season_id = ANY($1) AND a.source = 'TRANSFERMARKT'
    GROUP BY m.season_id, a.player_id, a.team_id
    ON CONFLICT (season_id, player_id, team_id) DO UPDATE SET
      played = EXCLUDED.played, starts = EXCLUDED.starts, minutes = EXCLUDED.minutes,
      goals = EXCLUDED.goals, assists = EXCLUDED.assists, penalties = EXCLUDED.penalties,
      yellow_cards = EXCLUDED.yellow_cards, red_cards = EXCLUDED.red_cards
    WHERE player_season_stats.source = 'TRANSFERMARKT'`, [seasonIds]);
  log(`estadísticas de jugador por temporada: ${playerStats}`);

  // --- Estadísticas por árbitro y temporada ---------------------------
  const { rowCount: refereeStats } = await client.query(`
    INSERT INTO referee_season_stats (season_id, referee_id, matches, yellow_cards, red_cards, penalties, source)
    SELECT m.season_id, m.referee_id,
           count(*),
           COALESCE(sum(a.yellow_cards), 0),
           COALESCE(sum(a.red_cards), 0),
           COALESCE(sum(e.penalties), 0),
           'TRANSFERMARKT'
    FROM matches m
    LEFT JOIN (SELECT match_id, sum(yellow_cards) AS yellow_cards, sum(red_cards) AS red_cards
               FROM appearances GROUP BY match_id) a ON a.match_id = m.id
    LEFT JOIN (SELECT match_id, count(*) AS penalties
               FROM match_events WHERE type = 'PENALTY_GOAL' GROUP BY match_id) e ON e.match_id = m.id
    WHERE m.season_id = ANY($1) AND m.referee_id IS NOT NULL AND m.source = 'TRANSFERMARKT'
    GROUP BY m.season_id, m.referee_id
    ON CONFLICT (season_id, referee_id) DO UPDATE SET
      matches = EXCLUDED.matches, yellow_cards = EXCLUDED.yellow_cards,
      red_cards = EXCLUDED.red_cards, penalties = EXCLUDED.penalties
    WHERE referee_season_stats.source = 'TRANSFERMARKT'`, [seasonIds]);
  log(`estadísticas de árbitro por temporada: ${refereeStats}`);

  // --- Clasificaciones finales ----------------------------------------
  const gamesBySeason = Map.groupBy(src.games, (g) => int(g.season));
  const standingRows = [];
  for (const [year, seasonGames] of [...gamesBySeason].sort((a, b) => a[0] - b[0])) {
    const { rows, checked, disagreements } = computeStandings(seasonGames);
    const note = disagreements.length
      ? ` · distinto de Transfermarkt: ${disagreements.map((r) => `${CLUBS[r.teamId].shortName} (${r.position})`).join(', ')}`
      : '';
    log(`  ${seasonLabel(year)}: campeón ${CLUBS[rows[0].teamId].shortName} con ${rows[0].points} pts `
      + `(comprobados ${checked} puestos con Transfermarkt${note})`);
    for (const r of rows) {
      standingRows.push([seasonId.get(year), teamId.get(r.teamId), r.position, r.played, r.won, r.drawn,
        r.lost, r.gf, r.ga, r.points, r.form]);
    }
  }
  await bulkUpsert(client, {
    table: 'standings',
    columns: [['season_id', 'bigint'], ['team_id', 'bigint'], ['position', 'smallint'], ['played', 'smallint'],
      ['won', 'smallint'], ['drawn', 'smallint'], ['lost', 'smallint'], ['goals_for', 'smallint'],
      ['goals_against', 'smallint'], ['points', 'smallint'], ['form', 'varchar']],
    rows: standingRows,
    onConflict: `ON CONFLICT (season_id, team_id) DO UPDATE SET
      position = EXCLUDED.position, played = EXCLUDED.played, won = EXCLUDED.won, drawn = EXCLUDED.drawn,
      lost = EXCLUDED.lost, goals_for = EXCLUDED.goals_for, goals_against = EXCLUDED.goals_against,
      points = EXCLUDED.points, form = EXCLUDED.form`,
  });
  log(`clasificaciones: ${standingRows.length} filas`);

  return seasonRows.length + teamRows.length + insertedReferees.length + playerRows.length
    + matchRows.length + appearanceRows.length + eventRows.length + playerStats + refereeStats
    + standingRows.length;
}

// =====================================================================
// Programa principal
// =====================================================================

async function main() {
  log(`Importando el histórico de LaLiga desde ${DATA_DIR}`);
  await ensureFiles(DATA_DIR);
  const src = await readSource();

  const pool = createPool();
  // El registro de sync_runs va FUERA de la transacción: si la carga falla, el error queda apuntado
  const { rows: [run] } = await pool.query(
    "INSERT INTO sync_runs (source, resource) VALUES ('TRANSFERMARKT', 'history') RETURNING id");

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const records = await load(client, src);
    await client.query('COMMIT');
    await pool.query(
      "UPDATE sync_runs SET status = 'OK', records = $2, finished_at = now() WHERE id = $1",
      [run.id, records]);
    log(`Hecho: ${records} filas creadas o actualizadas.`);
  } catch (error) {
    await client.query('ROLLBACK');
    await pool.query(
      "UPDATE sync_runs SET status = 'ERROR', error = $2, finished_at = now() WHERE id = $1",
      [run.id, String(error.stack ?? error)]);
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
