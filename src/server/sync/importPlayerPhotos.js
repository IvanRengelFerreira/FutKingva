// Importador de retratos de futbolistas desde FotMob para cubrir los jugadores sin imagen en `players`.
// Conserva las fotos reales ya existentes (p. ej. Transfermarkt o correcciones de un editor), enlaza `fm_id`
// mediante plantillas y buscador de FotMob cuando falta, y verifica con HEAD que cada URL devuelva imagen real.
//
// Reglas para no corromper datos:
// - Un fm_id del buscador solo se acepta si el nombre coincide (nunca solo por el club).
// - Un fm_id nuevo solo se guarda junto con su retrato verificado: importPlayerStats empareja por fm_id
//   y un enlace dudoso sin foto metería las estadísticas de un jugador en otro.
// - Un fallo de red en una plantilla o una búsqueda no para la importación: se cuenta y se sigue.
//
// Uso (desde src/server):
//   npm run import:photos:dry   → simulación sin tocar la BD
//   npm run import:photos       → enlaza fm_id pendientes, verifica retratos y guarda photo_url + photo_source

import { pathToFileURL } from 'node:url';
import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { resolveSeason } from '../utils/seasons.js';
import {
  checkFotmobPhotoExists,
  fetchFotmobTeamSquad,
  fotmobPlayerPhotoUrl,
  suggestFotmobPlayers,
} from './fotmobClient.js';
import { buildTeamMaps, createPlayerMatcher, normalizeText } from './playerMatcher.js';

const FOTMOB_SOURCE = 'FOTMOB';
const RESOURCE_NAME = 'player_photos';
const SQUAD_CONCURRENCY = 4;
// El buscador (apigw.fotmob.com) no está documentado: pocas peticiones a la vez y una pausa entre ellas
const SUGGEST_CONCURRENCY = 2;
const SUGGEST_PAUSE_MS = 250;
const HEAD_CONCURRENCY = 16;
const MAX_SMALLINT = 32767;
// Muchos updates uno a uno: más margen que el de la sincronización con football-data
const PHOTO_TX_TIMEOUT_MS = 120000;
const UNEXPECTED_ERROR = 'Error inesperado al importar los retratos.';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Ejecuta una petición a FotMob; si falla, devuelve `fallback` y suma uno a failures.count */
async function tolerant(request, fallback, failures) {
  try {
    return await request();
  } catch {
    failures.count++;
    return fallback;
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(runners);
  return results;
}

async function loadReferenceData() {
  const [teams, players, pastSeasons] = await Promise.all([
    prisma.teams.findMany({ select: { id: true, fd_id: true, tm_id: true, fm_id: true } }),
    prisma.players.findMany({
      select: {
        id: true,
        name: true,
        first_name: true,
        last_name: true,
        date_of_birth: true,
        team_id: true,
        fm_id: true,
        photo_url: true,
        photo_source: true,
      },
    }),
    prisma.player_season_stats.findMany({
      select: { player_id: true, team_id: true },
      distinct: ['player_id', 'team_id'],
    }),
  ]);

  const clubHistory = new Map();
  for (const row of pastSeasons) {
    const list = clubHistory.get(row.player_id) ?? [];
    list.push(row.team_id);
    clubHistory.set(row.player_id, list);
  }
  return { teams, players, clubHistory };
}

function playerClubs(player, clubHistory) {
  const clubs = new Set(clubHistory.get(player.id) ?? []);
  if (player.team_id != null) clubs.add(player.team_id);
  return clubs;
}

function neededSquadFmIds(missingPlayers, clubHistory, teamIdByFmId) {
  const neededTeamIds = new Set();
  for (const player of missingPlayers) {
    if (player.fm_id != null) continue;
    for (const clubId of playerClubs(player, clubHistory)) neededTeamIds.add(clubId);
  }

  const fmTeamIds = [];
  for (const [fmTeamId, teamId] of teamIdByFmId.entries()) {
    if (neededTeamIds.has(teamId)) fmTeamIds.push(fmTeamId);
  }
  return fmTeamIds;
}

/** Nombres aceptados de un jugador de la BD (apodo y nombre completo), normalizados */
function acceptedNamesOf(player) {
  const fullName = [player.first_name, player.last_name].filter(Boolean).join(' ');
  return new Set([player.name, fullName].filter(Boolean).map(normalizeText));
}

/** Nombre completo con al menos dos palabras significativas (para aceptar sin club), o null */
function distinctiveFullName(player) {
  const fullName = normalizeText([player.first_name, player.last_name].filter(Boolean).join(' '));
  return fullName.split(' ').filter((word) => word.length > 2).length >= 2 ? fullName : null;
}

const birthYear = (player) => (player.date_of_birth ? new Date(player.date_of_birth).getUTCFullYear() : null);

/**
 * ¿Es de verdad el mismo jugador? El emparejador da por bueno un nombre parecido; aquí se exige el nombre
 * exacto y, si los dos lados tienen año de nacimiento, que coincida.
 */
function confirmSquadMatch(player, member) {
  if (!acceptedNamesOf(player).has(normalizeText(member.name))) return false;
  const year = birthYear(player);
  return year == null || member.bornYear == null || year === member.bornYear;
}

async function discoverFmIdsFromSquads(fmTeamIds, teamIdByFmId, matcher, takenFmIds, pendingById, failures) {
  if (fmTeamIds.length === 0) return { linked: new Map(), requests: 0 };
  const squads = await mapWithConcurrency(fmTeamIds, SQUAD_CONCURRENCY, (fmTeamId) =>
    tolerant(() => fetchFotmobTeamSquad(fmTeamId), [], failures),
  );
  const linked = new Map();
  const ambiguous = new Set();

  for (const members of squads) {
    for (const member of members) {
      const fmBig = BigInt(member.fmPlayerId);
      if (takenFmIds.has(fmBig)) continue;
      const teamId = teamIdByFmId.get(member.fmTeamId);
      if (!teamId) continue;
      const playerId = matcher.match({
        fmPlayerId: member.fmPlayerId,
        name: member.name,
        teamId,
        bornYear: member.bornYear,
      });
      // Solo jugadores pendientes (sin foto y sin fm_id) y con el nombre exacto: el resto no se toca ni cuenta
      const player = playerId ? pendingById.get(playerId) : null;
      if (!player || ambiguous.has(playerId) || !confirmSquadMatch(player, member)) continue;
      if (linked.has(playerId)) {
        // Dos jugadores de FotMob para el mismo de la BD: no se sabe cuál es, se deja sin enlazar
        if (linked.get(playerId) !== fmBig) {
          ambiguous.add(playerId);
          linked.delete(playerId);
        }
        continue;
      }
      linked.set(playerId, fmBig);
    }
  }
  for (const fmId of linked.values()) takenFmIds.add(fmId);
  return { linked, requests: fmTeamIds.length };
}

function pickSuggestedFmId(player, clubs, options, teamIdByFmId, takenFmIds) {
  const acceptedNames = acceptedNamesOf(player);
  const available = options.filter((opt) => !takenFmIds.has(BigInt(opt.fmPlayerId)));

  // Siempre tiene que coincidir el nombre: el buscador devuelve resultados aproximados (compañeros incluidos)
  // Prioridad 1: mismo nombre y milita o militó en uno de los clubes registrados del jugador en nuestra BD
  const sameClub = available.filter((opt) => {
    const teamId = opt.fmTeamId ? teamIdByFmId.get(opt.fmTeamId) : null;
    return teamId != null && clubs.has(teamId);
  });
  const exactInClub = sameClub.filter((opt) => acceptedNames.has(normalizeText(opt.name)));
  if (exactInClub.length === 1) return BigInt(exactInClub[0].fmPlayerId);

  // Prioridad 2, sin club en común: solo con el nombre completo (dos palabras o más), nunca con un apodo
  // de una palabra («Rodri»), y que sea el único resultado con ese nombre
  const fullName = distinctiveFullName(player);
  if (!fullName) return null;
  const exactGlobal = available.filter((opt) => normalizeText(opt.name) === fullName);
  return exactGlobal.length === 1 ? BigInt(exactGlobal[0].fmPlayerId) : null;
}

async function discoverFmIdsFromSuggest(unlinkedPlayers, clubHistory, teamIdByFmId, takenFmIds, failures) {
  if (unlinkedPlayers.length === 0) return { linked: new Map(), requests: 0 };
  const results = await mapWithConcurrency(unlinkedPlayers, SUGGEST_CONCURRENCY, async (player) => {
    const options = await tolerant(() => suggestFotmobPlayers(player.name), [], failures);
    await sleep(SUGGEST_PAUSE_MS);
    return { player, options };
  });

  const linked = new Map();
  for (const { player, options } of results) {
    const clubs = playerClubs(player, clubHistory);
    const chosen = pickSuggestedFmId(player, clubs, options, teamIdByFmId, takenFmIds);
    if (chosen != null) {
      linked.set(player.id, chosen);
      takenFmIds.add(chosen);
    }
  }
  return { linked, requests: unlinkedPlayers.length };
}

async function verifyCandidatePhotos(candidates) {
  const checked = await mapWithConcurrency(candidates, HEAD_CONCURRENCY, async (item) => ({
    ...item,
    hasPhoto: await checkFotmobPhotoExists(item.fmId),
  }));
  return { checked, requests: candidates.length };
}

function collectTeamLinks(teams, fmIdByTeamId) {
  const taken = new Set(teams.filter((t) => t.fm_id != null).map((t) => t.fm_id));
  const updates = [];
  for (const team of teams) {
    const fmId = fmIdByTeamId.get(team.id);
    if (team.fm_id == null && fmId != null && !taken.has(fmId)) {
      taken.add(fmId);
      updates.push({ id: team.id, fmId });
    }
  }
  return updates;
}

async function persistPhotoChanges(playerUpdates, teamUpdates) {
  await prisma.$transaction(
    async (tx) => {
      for (const team of teamUpdates) {
        await tx.teams.update({ where: { id: team.id }, data: { fm_id: team.fmId } });
      }
      for (const item of playerUpdates) {
        await tx.players.update({ where: { id: item.id }, data: item.data });
      }
    },
    { timeout: PHOTO_TX_TIMEOUT_MS },
  );
}

/** Registra la ejecución en sync_runs: { status: 'OK', records } o { status: 'ERROR', error } */
async function recordPhotoSyncRun({ seasonId = null, startedAt, requests = 0, ...result }) {
  if (requests > MAX_SMALLINT) console.warn(`[player_photos] ${requests} peticiones: se guardan ${MAX_SMALLINT}`);
  await prisma.sync_runs.create({
    data: {
      source: FOTMOB_SOURCE,
      resource: RESOURCE_NAME,
      season_id: seasonId,
      requests: Math.min(requests, MAX_SMALLINT),
      started_at: startedAt,
      finished_at: new Date(Math.max(Date.now(), startedAt.getTime())),
      ...result,
    },
  });
}

function buildPlayerUpdates(checkedCandidates) {
  const updates = [];
  let photosAdded = 0;
  let fmLinkedOnly = 0;

  for (const item of checkedCandidates) {
    // Sin retrato no se guarda nada, ni siquiera un fm_id nuevo (ver la cabecera)
    if (!item.hasPhoto) {
      if (item.newFmId) fmLinkedOnly++;
      continue;
    }
    const data = { photo_url: fotmobPlayerPhotoUrl(item.fmId), photo_source: FOTMOB_SOURCE };
    if (item.newFmId) data.fm_id = item.fmId;
    photosAdded++;
    updates.push({ id: item.playerId, data });
  }
  return { updates, photosAdded, fmLinkedOnly };
}

export async function importPlayerPhotos({ dryRun = false, startedAt = new Date() } = {}) {
  const [{ season }, refData] = await Promise.all([resolveSeason(), loadReferenceData()]);
  const teamMaps = buildTeamMaps(refData.teams);
  const matcher = createPlayerMatcher(refData.players, refData.clubHistory);
  const takenFmIds = new Set(refData.players.filter((p) => p.fm_id != null).map((p) => p.fm_id));

  // Solo jugadores sin foto (los CHECK de la BD garantizan que entonces tampoco tienen photo_source)
  const missingPlayers = refData.players.filter((p) => p.photo_url == null);
  const pendingById = new Map(missingPlayers.filter((p) => p.fm_id == null).map((p) => [p.id, p]));
  const failures = { count: 0 };
  const fmTeamIds = neededSquadFmIds(missingPlayers, refData.clubHistory, teamMaps.teamIdByFmId);
  const fromSquads = await discoverFmIdsFromSquads(
    fmTeamIds,
    teamMaps.teamIdByFmId,
    matcher,
    takenFmIds,
    pendingById,
    failures,
  );

  const stillUnlinked = missingPlayers.filter((p) => p.fm_id == null && !fromSquads.linked.has(p.id));
  const fromSuggest = await discoverFmIdsFromSuggest(
    stillUnlinked,
    refData.clubHistory,
    teamMaps.teamIdByFmId,
    takenFmIds,
    failures,
  );

  const candidates = missingPlayers
    .map((player) => {
      const discovered = fromSquads.linked.get(player.id) ?? fromSuggest.linked.get(player.id) ?? null;
      const fmId = player.fm_id ?? discovered;
      return fmId != null ? { playerId: player.id, name: player.name, fmId, newFmId: player.fm_id == null } : null;
    })
    .filter(Boolean);

  const verified = await verifyCandidatePhotos(candidates);
  const { updates, photosAdded, fmLinkedOnly } = buildPlayerUpdates(verified.checked);
  const teamUpdates = collectTeamLinks(refData.teams, teamMaps.fmIdByTeamId);
  const requests = fromSquads.requests + fromSuggest.requests + verified.requests;

  if (!dryRun) {
    await persistPhotoChanges(updates, teamUpdates);
    // Si hubo peticiones fallidas (FotMob caído, 429…), queda escrito aunque la ejecución sea OK
    const error = failures.count ? `${failures.count} peticiones a FotMob han fallado` : null;
    await recordPhotoSyncRun({ seasonId: season.id, startedAt, requests, status: 'OK', records: photosAdded, error });
  }

  return {
    missingBefore: missingPlayers.length,
    candidatesChecked: candidates.length,
    photosAdded,
    fmLinked: updates.filter((item) => item.data.fm_id != null).length,
    fmLinkedOnly,
    stillWithoutPhoto: missingPlayers.length - photosAdded,
    failedRequests: failures.count,
    requests,
  };
}

async function runCli() {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const startedAt = new Date();
  try {
    const summary = await importPlayerPhotos({ dryRun, startedAt });
    const mode = dryRun ? '[DRY-RUN]' : '[OK]';
    console.log(
      `${mode} player_photos: ${summary.photosAdded} retratos añadidos de ${summary.missingBefore} pendientes ` +
        `(${summary.fmLinked} fm_id nuevos guardados, ${summary.fmLinkedOnly} descartados por no tener retrato, ` +
        `${summary.stillWithoutPhoto} sin retrato real → iniciales, ` +
        `${summary.requests} peticiones, ${summary.failedRequests} fallidas)`,
    );
  } catch (error) {
    console.error('[player_photos] La importación ha fallado:', error?.message ?? error);
    process.exitCode = 1;
    if (!dryRun) {
      // Queda rastro en el panel; solo los mensajes de AppError, sin detalles internos
      const message = error instanceof AppError ? error.message : UNEXPECTED_ERROR;
      await recordPhotoSyncRun({ startedAt, status: 'ERROR', error: message }).catch((logError) =>
        console.warn('[player_photos] No se ha podido registrar el error en sync_runs:', logError?.code),
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
