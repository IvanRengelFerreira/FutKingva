// Cliente de los feeds JSON estáticos de FotMob (Opta) para LaLiga (id 87).
// Descarga en paralelo los rankings públicos de una temporada en data.fotmob.com y los unifica
// por (jugador, equipo) para alimentar player_season_stats sin necesitar API key ni scraping HTML.

import { AppError } from '../errors/AppError.js';

const LEAGUE_ID = 87;
const LEAGUE_OVERVIEW_URL = `https://www.fotmob.com/api/data/leagues?id=${LEAGUE_ID}`;
const REQUEST_TIMEOUT_MS = 15000;
const MINUTES_PER_MATCH = 90;

const REQUIRED_FEEDS = [
  'mins_played',
  'goals',
  'goal_assist',
  'rating',
  'expected_goals',
  'ontarget_scoring_att',
  'accurate_pass',
  'total_att_assist',
  'yellow_card',
  'red_card',
];

function seasonQueryParam(startYear) {
  return `${startYear}/${startYear + 1}`;
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw AppError.badGateway(`No se ha podido conectar con FotMob (${url}).`);
  }
  if (!response.ok) {
    throw AppError.badGateway(`FotMob ha respondido con HTTP ${response.status} en ${url}.`);
  }
  return response.json();
}

function extractFeedUrls(overview) {
  const feeds = overview?.stats?.players;
  if (!Array.isArray(feeds) || feeds.length === 0) return new Map();
  const urls = new Map();
  for (const item of feeds) {
    if (item?.name && item?.fetchAllUrl) urls.set(item.name, item.fetchAllUrl);
  }
  return urls;
}

async function loadFeedRows(feedUrls, feedName) {
  const url = feedUrls.get(feedName);
  if (!url) return [];
  const payload = await fetchJson(url);
  const list = payload?.TopLists?.[0]?.StatList;
  return Array.isArray(list) ? list : [];
}

// En los JSON de FotMob el id del jugador viene escrito «ParticiantId» (sin la segunda «p»)
function readParticipantId(entry) {
  const raw = entry?.ParticiantId ?? entry?.ParticipantId;
  const num = Number(raw);
  return Number.isInteger(num) && num > 0 ? num : null;
}

const rowKey = (fmPlayerId, fmTeamId) => `${fmPlayerId}:${fmTeamId}`;

function createBaseRecord(entry, fmPlayerId) {
  return {
    fmPlayerId,
    fmTeamId: Number(entry.TeamId),
    name: String(entry.ParticipantName ?? '').trim(),
    teamName: String(entry.TeamName ?? '').trim(),
    countryCode: entry.ParticipantCountryCode ?? null,
    played: Math.max(0, Math.trunc(Number(entry.MatchesPlayed ?? 0))),
    minutes: Math.max(0, Math.trunc(Number(entry.MinutesPlayed ?? entry.StatValue ?? 0))),
    // Los contadores acumulados omiten a quienes llevan 0 en su feed respectivo; si jugó minutos, su valor es 0
    goals: 0,
    penalties: 0,
    assists: 0,
    xg: 0,
    shotsOnTarget: 0,
    keyPasses: 0,
    yellowCards: 0,
    redCards: 0,
    // Promedios con umbral mínimo de minutos en FotMob: si no aparece en el feed, se deja sin dato (null)
    passAccuracy: null,
    rating: null,
  };
}

function ensureRecord(records, entry) {
  const fmPlayerId = readParticipantId(entry);
  const fmTeamId = Number(entry?.TeamId);
  if (!fmPlayerId || !Number.isInteger(fmTeamId) || fmTeamId <= 0) return null;

  const key = rowKey(fmPlayerId, fmTeamId);
  if (!records.has(key)) records.set(key, createBaseRecord(entry, fmPlayerId));
  return records.get(key);
}

function roundTo(value, decimals) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
}

function applyFeed(records, feedName, entries) {
  for (const entry of entries) {
    const rec = ensureRecord(records, entry);
    if (!rec) continue;
    const val = Number(entry.StatValue ?? 0);
    const sub = Number(entry.SubStatValue ?? 0);

    if (feedName === 'mins_played') {
      rec.minutes = Math.max(0, Math.trunc(val));
      rec.played = Math.max(0, Math.trunc(Number(entry.MatchesPlayed ?? sub)));
    } else if (feedName === 'goals') {
      rec.goals = Math.max(0, Math.trunc(val));
      rec.penalties = Math.min(rec.goals, Math.max(0, Math.trunc(sub)));
    } else if (feedName === 'goal_assist') {
      rec.assists = Math.max(0, Math.trunc(val));
    } else if (feedName === 'expected_goals') {
      rec.xg = Math.max(0, roundTo(val, 2) ?? 0);
    } else if (feedName === 'ontarget_scoring_att') {
      // StatValue viene por 90 min; si luego se cruza FBref se sustituye por su entero exacto (SoT)
      const mins = Number(entry.MinutesPlayed ?? rec.minutes);
      rec.shotsOnTarget = Math.max(0, Math.round((val * mins) / MINUTES_PER_MATCH));
    } else if (feedName === 'accurate_pass') {
      // SubStatValue es el % de acierto en el pase (0–100)
      const pct = roundTo(sub, 1);
      if (pct != null && pct >= 0 && pct <= 100) rec.passAccuracy = pct;
    } else if (feedName === 'total_att_assist') {
      rec.keyPasses = Math.max(0, Math.trunc(val));
    } else if (feedName === 'yellow_card') {
      rec.yellowCards = Math.max(0, Math.trunc(val));
    } else if (feedName === 'red_card') {
      rec.redCards = Math.max(0, Math.trunc(val));
    } else if (feedName === 'rating') {
      const rating = roundTo(val, 1);
      if (rating != null && rating >= 0 && rating <= 10) rec.rating = rating;
    }
  }
}

/**
 * Descarga y unifica todas las estadísticas de jugador de LaLiga para `startYear` (p. ej. 2026 → 2026/2027).
 */
export async function fetchFotmobSeasonStats(startYear) {
  const seasonUrl = `${LEAGUE_OVERVIEW_URL}&season=${encodeURIComponent(seasonQueryParam(startYear))}`;
  const overview = await fetchJson(seasonUrl);
  const feedUrls = extractFeedUrls(overview);
  if (!feedUrls.has('mins_played')) {
    return { records: [], requests: 1 };
  }

  const loaded = await Promise.all(REQUIRED_FEEDS.map(async (name) => [name, await loadFeedRows(feedUrls, name)]));
  const requests = 1 + REQUIRED_FEEDS.filter((name) => feedUrls.has(name)).length;

  const records = new Map();
  for (const [name, entries] of loaded) applyFeed(records, name, entries);

  return { records: [...records.values()], requests };
}
