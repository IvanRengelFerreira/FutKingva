// Simulador de partidos para la demo (RF9): como la presentación puede no coincidir con partidos de
// LaLiga, el administrador juega partidos simulados con equipos y jugadores reales (20 · Administración).
//
// - Los partidos simulados van marcados en la BD (is_simulated, source SIMULATOR) y la sincronización
//   con football-data nunca los toca.
// - NUNCA cuentan en los datos reales: ni en la clasificación, ni en los resultados, ni en las
//   estadísticas de jugadores o equipos. Todas las consultas de partidos terminados filtran
//   is_simulated: false. Solo se ven en directo (Inicio, avisos) y en el panel del simulador.
// - Cada config.simulatorTickMs (3 s por defecto) avanzan un minuto; en cada minuto, con una
//   probabilidad pequeña, hay gol o tarjeta. Al 90' terminan solos.
// - Cada cambio de estado solo se aplica si el partido sigue en juego (updateMany con la condición
//   de estado): así el reloj y los botones del panel no pueden pisarse (doble final, gol tras el final).
//
// Los usan las rutas de controllers/simulator.js; server.js lo reanuda al arrancar y lo para al cerrar.

import { prisma } from '../db.js';
import { config } from '../config.js';
import { AppError } from '../errors/AppError.js';
import { MATCH_TEAMS } from '../utils/matches.js';
import {
  findMatchWithTeams,
  publishGoal,
  publishMatchFinished,
  publishMatchStarted,
  publishMatchUpdate,
} from './events.js';
import { emitToAll } from './socket.js';

const SOURCE = 'SIMULATOR';
const LIVE_STATUSES = ['IN_PLAY', 'PAUSED'];
const HALF_TIME = 45;
const FULL_TIME = 90;

// Probabilidad de cada suceso en un minuto (≈ 2,7 goles y 3,6 amarillas por partido)
const GOAL_CHANCE = 0.03;
const YELLOW_CHANCE = 0.04;
const RED_CHANCE = 0.004;

let timer = null;
let currentTick = null; // Promesa del paso del reloj en marcha (el cierre la espera)
let stopped = false; // El servidor se está cerrando: el reloj ya no vuelve a arrancar

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

/** Condición «este partido simulado sigue en juego» para los updateMany */
const liveWhere = (matchId) => ({ id: matchId, is_simulated: true, status: { in: LIVE_STATUSES } });

/** Jugador al azar de la plantilla actual del equipo (para un gol, sin porteros) */
async function pickPlayer(teamId, { forGoal = false } = {}) {
  const outfield = { OR: [{ position: null }, { position: { not: 'GOALKEEPER' } }] };
  const players = await prisma.players.findMany({
    where: { team_id: teamId, ...(forGoal ? outfield : {}) },
    select: { id: true, name: true },
  });
  return players.length ? randomItem(players) : null;
}

/** Partido simulado en juego; 404 si no existe o no es simulado, 409 si ya ha terminado */
async function findLiveSimulatedMatch(matchId) {
  const match = await prisma.matches.findUnique({ where: { id: matchId }, include: MATCH_TEAMS });
  if (!match || !match.is_simulated) throw AppError.notFound('No existe ese partido simulado');
  if (!LIVE_STATUSES.includes(match.status)) throw AppError.conflict('Ese partido simulado ya ha terminado');
  return match;
}

const alreadyFinished = () => AppError.conflict('Ese partido simulado ya ha terminado');

/**
 * Empieza un partido simulado ahora mismo, en la jornada actual de la temporada.
 * @returns el partido con sus equipos (MATCH_TEAMS)
 */
export async function startSimulatedMatch(season, homeTeamId, awayTeamId) {
  const match = await prisma.matches.create({
    data: {
      season_id: season.id,
      matchday: season.current_matchday,
      utc_date: new Date(),
      status: 'IN_PLAY',
      minute: 0,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_goals: 0,
      away_goals: 0,
      source: SOURCE,
      is_simulated: true,
    },
    include: MATCH_TEAMS,
  });
  // El reloj arranca aunque fallen los avisos: el partido ya existe y tiene que avanzar
  ensureRunning();
  await publishMatchStarted(match);
  return match;
}

/**
 * Gol en un partido simulado. side: 'home' | 'away' (al azar si no se indica).
 * Lo usan el reloj del simulador y el botón «Gol» del panel (para que la demo no dependa del azar).
 */
export async function scoreGoal(matchId, side = Math.random() < 0.5 ? 'home' : 'away') {
  const match = await findLiveSimulatedMatch(matchId);
  const teamId = side === 'home' ? match.home_team_id : match.away_team_id;
  const player = await pickPlayer(teamId, { forGoal: true });
  const minute = Math.max(1, match.minute ?? 1);

  await prisma.$transaction(async (tx) => {
    // Solo si sigue en juego: un gol no puede colarse después del final
    const { count } = await tx.matches.updateMany({
      where: liveWhere(match.id),
      data: side === 'home' ? { home_goals: { increment: 1 } } : { away_goals: { increment: 1 } },
    });
    if (!count) throw alreadyFinished();
    await tx.match_events.create({
      data: {
        match_id: match.id,
        minute,
        type: 'GOAL',
        team_id: teamId,
        player_id: player?.id ?? null,
        player_name: player?.name ?? 'Jugador sin identificar',
        source: SOURCE,
      },
    });
  });

  const updated = await findMatchWithTeams(match.id);
  await publishGoal(updated, { minute, teamId, playerName: player?.name });
  return updated;
}

/** Tarjeta (amarilla o roja) en un partido simulado: se guarda y se avisa del minuto a todos */
async function showCard(match, type) {
  const teamId = Math.random() < 0.5 ? match.home_team_id : match.away_team_id;
  const player = await pickPlayer(teamId);
  const minute = Math.max(1, match.minute ?? 1);
  await prisma.$transaction(async (tx) => {
    // Solo si sigue en juego (como el gol): una tarjeta no puede guardarse después del final
    // Escritura real (con data vacío Prisma no lanza el UPDATE): bloquea la fila y count es fiable
    const { count } = await tx.matches.updateMany({ where: liveWhere(match.id), data: { updated_at: new Date() } });
    if (!count) throw alreadyFinished();
    await tx.match_events.create({
      data: {
        match_id: match.id,
        minute,
        type,
        team_id: teamId,
        player_id: player?.id ?? null,
        player_name: player?.name ?? 'Jugador sin identificar',
        source: SOURCE,
      },
    });
  });
  // Se vuelve a leer: el estado de antes de los await puede haber cambiado
  publishMatchUpdate(await findMatchWithTeams(match.id), { type, minute, teamId, playerName: player?.name ?? null });
}

/** Termina un partido simulado (al 90' o con el botón «Terminar»). No cambia la clasificación. */
export async function finishSimulatedMatch(matchId) {
  const match = await findLiveSimulatedMatch(matchId);

  // Si el reloj y el botón llegan a la vez, solo uno lo termina; el otro recibe 409
  const { count } = await prisma.matches.updateMany({
    where: liveWhere(match.id),
    data: { status: 'FINISHED', minute: Math.max(match.minute ?? 0, FULL_TIME) },
  });
  if (!count) throw alreadyFinished();

  const finished = await findMatchWithTeams(match.id);
  await publishMatchFinished(finished);
  return finished;
}

/** Borra un partido simulado (y sus sucesos). Sus avisos se quedan, sin enlace al partido (match_id NULL). */
export async function deleteSimulatedMatch(matchId) {
  const { count } = await prisma.matches.deleteMany({ where: { id: matchId, is_simulated: true } });
  if (!count) throw AppError.notFound('No existe ese partido simulado');
  emitToAll('match:removed', { matchId });
}

/** Un minuto de un partido: avanza el reloj y, con suerte, gol o tarjeta; al 90', final */
async function playMinute(match) {
  if (match.minute >= FULL_TIME) {
    await finishSimulatedMatch(match.id);
    return;
  }

  const minute = (match.minute ?? 0) + 1;
  const data = { minute };
  if (minute === HALF_TIME) Object.assign(data, { home_goals_ht: match.home_goals, away_goals_ht: match.away_goals });
  // Si lo han terminado o borrado desde el panel a mitad de paso, no se toca ni se avisa
  const { count } = await prisma.matches.updateMany({ where: liveWhere(match.id), data });
  if (!count) return;
  const updated = await findMatchWithTeams(match.id);

  const roll = Math.random();
  if (roll < GOAL_CHANCE) await scoreGoal(match.id);
  else if (roll < GOAL_CHANCE + RED_CHANCE) await showCard(updated, 'RED_CARD');
  else if (roll < GOAL_CHANCE + RED_CHANCE + YELLOW_CHANCE) await showCard(updated, 'YELLOW_CARD');
  else publishMatchUpdate(updated);
}

const findLiveMatches = () =>
  prisma.matches.findMany({
    where: { is_simulated: true, status: { in: LIVE_STATUSES } },
    select: { id: true, minute: true, home_goals: true, away_goals: true },
  });

/** Un paso del reloj para todos los partidos simulados en juego; si no queda ninguno, se para */
async function runTick() {
  try {
    const live = await findLiveMatches();
    for (const match of live) {
      if (stopped) return;
      try {
        await playMinute(match);
      } catch (error) {
        if (error instanceof AppError) continue; // Terminado o borrado desde el panel a la vez: nada que hacer
        // Un partido que falla no para a los demás
        console.error(`[simulador] Error en el partido ${match.id}:`, error?.code ?? error?.message);
      }
    }
    // Se vuelve a contar al final: puede haber empezado un partido nuevo durante este paso
    if (!live.length && !(await findLiveMatches()).length) pauseClock();
  } catch (error) {
    console.error('[simulador] Error al avanzar los partidos:', error?.code ?? error?.message);
  }
}

function tick() {
  if (currentTick) return; // El paso anterior aún no ha terminado
  currentTick = runTick().finally(() => {
    currentTick = null;
  });
}

function ensureRunning() {
  if (!timer && !stopped) timer = setInterval(tick, config.simulatorTickMs);
}

function pauseClock() {
  clearInterval(timer);
  timer = null;
}

/** Al arrancar el servidor: si quedaron partidos simulados a medias, siguen jugándose */
export async function resumeSimulator() {
  const pending = await prisma.matches.count({ where: { is_simulated: true, status: { in: LIVE_STATUSES } } });
  if (pending) ensureRunning();
}

/** Para el reloj del simulador para siempre (cierre del servidor) y espera al paso que esté en marcha */
export async function stopSimulator() {
  stopped = true;
  pauseClock();
  await currentTick;
}

/** Partidos simulados (los más recientes primero) y cuántos hay en total, para el panel de administración */
export async function listSimulatedMatches(limit = 10) {
  const where = { is_simulated: true };
  const [items, total] = await Promise.all([
    prisma.matches.findMany({ where, orderBy: { utc_date: 'desc' }, take: limit, include: MATCH_TEAMS }),
    prisma.matches.count({ where }),
  ]);
  return { items, total, limit };
}
