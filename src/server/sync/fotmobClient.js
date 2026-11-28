// Cliente de los feeds JSON estáticos de FotMob (Opta) para LaLiga (id 87).
// Descarga en paralelo los rankings públicos de una temporada en data.fotmob.com y los unifica
// por (jugador, equipo) para alimentar player_season_stats sin necesitar API key ni scraping HTML.

import { AppError } from '../errors/AppError.js';

const LEAGUE_ID = 87;
const LEAGUE_OVERVIEW_URL = `https://www.fotmob.com/api/data/leagues?id=${LEAGUE_ID}`;
const MATCH_DETAILS_URL = 'https://www.fotmob.com/api/data/matchDetails?matchId=';
const TEAM_DATA_URL = 'https://www.fotmob.com/api/data/teams?id=';
const SUGGEST_URL = 'https://apigw.fotmob.com/searchapi/suggest?lang=es&term=';
const PLAYER_IMAGE_BASE_URL = 'https://images.fotmob.com/image_resources/playerimages';
const REQUEST_TIMEOUT_MS = 15000;
const MINUTES_PER_MATCH = 90;
const MAX_MATCH_MINUTES = 130;
const MAX_YELLOW_CARDS = 2;

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

/** URL pública en el CDN de FotMob del retrato recortado (PNG) de un futbolista. */
export function fotmobPlayerPhotoUrl(fmPlayerId) {
  return `${PLAYER_IMAGE_BASE_URL}/${fmPlayerId}.png`;
}

function parseBirthYear(rawDate) {
  if (!rawDate) return null;
  const year = new Date(rawDate).getUTCFullYear();
  return Number.isInteger(year) && year > 1950 ? year : null;
}

/** Descarga la plantilla actual de un club en FotMob (incluye suplentes y canteranos sin minutos). */
export async function fetchFotmobTeamSquad(fmTeamId) {
  const payload = await fetchJson(`${TEAM_DATA_URL}${fmTeamId}`);
  const groups = payload?.squad?.squad;
  if (!Array.isArray(groups)) return [];

  const members = [];
  for (const group of groups) {
    if (group?.title === 'coach' || !Array.isArray(group?.members)) continue;
    for (const member of group.members) {
      if (member?.role?.key === 'coach') continue;
      const fmPlayerId = Number(member?.id);
      const name = String(member?.name ?? '').trim();
      if (!Number.isInteger(fmPlayerId) || fmPlayerId <= 0 || !name) continue;
      members.push({ fmPlayerId, fmTeamId, name, bornYear: parseBirthYear(member.dateOfBirth) });
    }
  }
  return members;
}

/** Busca un futbolista por nombre en el autocompletado de FotMob para enlazar históricos o fichajes sin minutos. */
export async function suggestFotmobPlayers(term) {
  const payload = await fetchJson(`${SUGGEST_URL}${encodeURIComponent(term)}`);
  const blocks = payload?.squadMemberSuggest;
  if (!Array.isArray(blocks)) return [];

  const options = [];
  for (const block of blocks) {
    for (const opt of block?.options ?? []) {
      if (opt?.payload?.isCoach) continue;
      const fmPlayerId = Number(opt?.payload?.id);
      const [rawName] = String(opt?.text ?? '').split('|');
      const name = rawName.trim();
      if (!Number.isInteger(fmPlayerId) || fmPlayerId <= 0 || !name) continue;
      const fmTeamId = Number(opt?.payload?.teamId);
      options.push({ fmPlayerId, fmTeamId: Number.isInteger(fmTeamId) && fmTeamId > 0 ? fmTeamId : null, name });
    }
  }
  return options;
}

/** Comprueba con HEAD si FotMob sirve un retrato real (`200 image/*`; devuelve `403` cuando no tiene foto). */
export async function checkFotmobPhotoExists(fmPlayerId) {
  const url = fotmobPlayerPhotoUrl(fmPlayerId);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const contentType = response.headers.get('content-type') ?? '';
    return response.ok && contentType.startsWith('image/');
  } catch {
    return false;
  }
}

/** Busca un árbitro por nombre en el autocompletado de FotMob para enlazar su identificador y su retrato. */
export async function suggestFotmobReferees(term) {
  const payload = await fetchJson(`${SUGGEST_URL}${encodeURIComponent(term)}`);
  const blocks = payload?.refereeSuggest;
  if (!Array.isArray(blocks)) return [];

  const options = [];
  for (const block of blocks) {
    for (const opt of block?.options ?? []) {
      const fmRefereeId = Number(opt?.payload?.id);
      const [rawName] = String(opt?.text ?? '').split('|');
      const name = rawName.trim();
      if (!Number.isInteger(fmRefereeId) || fmRefereeId <= 0 || !name) continue;
      options.push({ fmRefereeId, name });
    }
  }
  return options;
}

/** Descarga los partidos finalizados de una temporada de LaLiga en FotMob para cruzarlos con `matches`. */
export async function fetchFotmobSeasonFixtures(startYear) {
  const seasonUrl = `${LEAGUE_OVERVIEW_URL}&season=${encodeURIComponent(seasonQueryParam(startYear))}`;
  const overview = await fetchJson(seasonUrl);
  const allMatches = overview?.fixtures?.allMatches ?? overview?.matches?.allMatches ?? [];
  if (!Array.isArray(allMatches)) return { fixtures: [], requests: 1 };

  const fixtures = [];
  for (const item of allMatches) {
    if (!item?.status?.finished || item?.status?.cancelled) continue;
    const fmMatchId = Number(item.id);
    const fmHomeTeamId = Number(item.home?.id);
    const fmAwayTeamId = Number(item.away?.id);
    if (!Number.isInteger(fmMatchId) || fmMatchId <= 0) continue;
    if (!Number.isInteger(fmHomeTeamId) || !Number.isInteger(fmAwayTeamId)) continue;
    const utcDate = item.status?.utcTime ? new Date(item.status.utcTime) : null;
    fixtures.push({
      fmMatchId,
      fmHomeTeamId,
      fmAwayTeamId,
      utcDate: utcDate && !Number.isNaN(utcDate.getTime()) ? utcDate : null,
    });
  }
  return { fixtures, requests: 1 };
}

function clampInt(value, min, max) {
  const num = Math.trunc(Number(value));
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function indexPlayerStatsMap(rawPlayerStats) {
  const byPlayer = new Map();
  for (const [idKey, entry] of Object.entries(rawPlayerStats ?? {})) {
    const fmPlayerId = Number(entry?.id ?? idKey);
    if (!Number.isInteger(fmPlayerId) || fmPlayerId <= 0) continue;
    const metrics = new Map();
    for (const section of entry?.stats ?? []) {
      for (const item of Object.values(section?.stats ?? {})) {
        if (item?.key && item?.stat) metrics.set(item.key, item.stat);
      }
    }
    byPlayer.set(fmPlayerId, metrics);
  }
  return byPlayer;
}

function indexMatchFactTallies(events) {
  const cards = new Map();
  const goals = new Map();

  for (const ev of Array.isArray(events) ? events : []) {
    const playerId = Number(ev?.playerId ?? ev?.player?.id);
    if (ev?.type === 'Card' && Number.isInteger(playerId) && playerId > 0) {
      const cur = cards.get(playerId) ?? { yellow: 0, red: 0 };
      if (ev.card === 'Yellow') cur.yellow = Math.min(MAX_YELLOW_CARDS, cur.yellow + 1);
      else if (ev.card === 'YellowRed') {
        cur.yellow = MAX_YELLOW_CARDS;
        cur.red = 1;
      } else if (ev.card === 'Red') cur.red = 1;
      cards.set(playerId, cur);
    } else if (ev?.type === 'Goal' && !ev.ownGoal && !ev.isPenaltyShootoutEvent) {
      if (Number.isInteger(playerId) && playerId > 0) {
        const cur = goals.get(playerId) ?? { goals: 0, assists: 0 };
        cur.goals++;
        goals.set(playerId, cur);
      }
      const assistId = Number(ev?.assistPlayerId);
      if (Number.isInteger(assistId) && assistId > 0) {
        const cur = goals.get(assistId) ?? { goals: 0, assists: 0 };
        cur.assists++;
        goals.set(assistId, cur);
      }
    }
  }
  return { cards, goals };
}

function subMinutesFallback(member, isStarter) {
  const events = member?.performance?.substitutionEvents ?? [];
  const subIn = events.find((e) => e?.type === 'subIn');
  const subOut = events.find((e) => e?.type === 'subOut');
  const start = isStarter ? 0 : Number(subIn?.time ?? MINUTES_PER_MATCH);
  const end = Number(subOut?.time ?? MINUTES_PER_MATCH);
  const mins = end - start;
  return clampInt(isStarter ? Math.max(0, mins) : Math.max(1, mins), 0, MAX_MATCH_MINUTES);
}

function didMemberPlay(member, isStarter, metrics) {
  if (isStarter) return true;
  const events = member?.performance?.substitutionEvents ?? [];
  if (events.some((e) => e?.type === 'subIn')) return true;
  const mins = Number(metrics?.get('minutes_played')?.value ?? 0);
  return mins > 0 || member?.performance?.rating != null;
}

function extractPassAccuracy(metrics) {
  const passes = metrics?.get('accurate_passes');
  const made = Number(passes?.value);
  const total = Number(passes?.total);
  if (!Number.isFinite(made) || !Number.isFinite(total) || total <= 0 || made < 0) return null;
  const pct = roundTo((made / total) * 100, 1);
  return pct != null && pct >= 0 && pct <= 100 ? pct : null;
}

function buildAppearanceRecord(member, fmTeamId, isStarter, metrics, tallies) {
  const fmPlayerId = Number(member?.id);
  const name = String(member?.name ?? '').trim();
  if (!Number.isInteger(fmPlayerId) || fmPlayerId <= 0 || !name) return null;
  if (!didMemberPlay(member, isStarter, metrics)) return null;

  const rawMins = metrics?.get('minutes_played')?.value;
  const minutes = rawMins != null ? clampInt(rawMins, 0, MAX_MATCH_MINUTES) : subMinutesFallback(member, isStarter);
  const rawRating = metrics?.get('rating_title')?.value ?? member?.performance?.rating;
  const roundedRating = rawRating != null ? roundTo(rawRating, 1) : null;
  const rating = roundedRating != null && roundedRating >= 0 && roundedRating <= 10 ? roundedRating : null;

  const eventGoals = tallies.goals.get(fmPlayerId);
  const cardTally = tallies.cards.get(fmPlayerId);
  const goals = clampInt(metrics?.get('goals')?.value ?? eventGoals?.goals ?? 0, 0, 20);
  const assists = clampInt(metrics?.get('assists')?.value ?? eventGoals?.assists ?? 0, 0, 20);

  return {
    fmPlayerId,
    fmTeamId,
    name,
    isStarter,
    minutes,
    goals,
    assists,
    yellowCards: cardTally?.yellow ?? 0,
    redCards: cardTally?.red ?? 0,
    rating,
    passAccuracy: extractPassAccuracy(metrics),
  };
}

/** Descarga las apariciones, valoraciones y % de pase de todos los jugadores que participaron en un partido. */
export async function fetchFotmobMatchAppearances(fmMatchId) {
  const payload = await fetchJson(`${MATCH_DETAILS_URL}${fmMatchId}`);
  const content = payload?.content;
  const lineup = content?.lineup;
  const statsByPlayer = indexPlayerStatsMap(content?.playerStats);
  const tallies = indexMatchFactTallies(content?.matchFacts?.events?.events);
  const appearances = [];

  for (const teamBlock of [lineup?.homeTeam, lineup?.awayTeam]) {
    const fmTeamId = Number(teamBlock?.id);
    if (!Number.isInteger(fmTeamId) || fmTeamId <= 0) continue;

    for (const starter of teamBlock.starters ?? []) {
      const rec = buildAppearanceRecord(starter, fmTeamId, true, statsByPlayer.get(Number(starter?.id)), tallies);
      if (rec) appearances.push(rec);
    }
    for (const sub of teamBlock.subs ?? []) {
      const rec = buildAppearanceRecord(sub, fmTeamId, false, statsByPlayer.get(Number(sub?.id)), tallies);
      if (rec) appearances.push(rec);
    }
  }
  return appearances;
}

function isPenaltyGoalEvent(ev) {
  return (
    ev?.goalDescriptionKey === 'penalty' ||
    ev?.suffixKey === 'penalties_short' ||
    ev?.shotmapEvent?.situation === 'Penalty'
  );
}

function mapMatchFactEvent(ev, index, fmMatchId, homeFmTeamId, awayFmTeamId) {
  if (!ev || ev.isPenaltyShootoutEvent) return null;
  if (ev.type === 'Card' && ev.cardDescription?.localizedKey === 'coach') return null;

  let type = null;
  if (ev.type === 'Card') {
    if (ev.card === 'Red') type = 'RED_CARD';
    else if (ev.card === 'YellowRed') type = 'SECOND_YELLOW';
    else if (ev.card === 'Yellow') type = 'YELLOW_CARD';
  } else if (ev.type === 'Goal') {
    if (ev.ownGoal) type = 'OWN_GOAL';
    else if (isPenaltyGoalEvent(ev)) type = 'PENALTY_GOAL';
    else type = 'GOAL';
  } else if (ev.type === 'MissedPenalty') {
    type = 'MISSED_PENALTY';
  }
  if (!type) return null;

  const fmTeamId = ev.isHome ? homeFmTeamId : awayFmTeamId;
  const fmPlayerId = Number(ev.playerId ?? ev.player?.id);
  const playerName = String(ev.fullName ?? ev.nameStr ?? ev.player?.name ?? '').trim() || null;
  if (!Number.isInteger(fmTeamId) || fmTeamId <= 0) return null;
  if ((!Number.isInteger(fmPlayerId) || fmPlayerId <= 0) && !playerName) return null;

  const minute = clampInt(ev.time ?? 0, 0, MAX_MATCH_MINUTES);
  const rawExtra = Number(ev.overloadTime);
  const extraMinute = Number.isInteger(rawExtra) && rawExtra >= 1 && rawExtra <= 30 ? rawExtra : null;
  const eventKey = ev.eventId != null ? `${fmMatchId}:${ev.eventId}` : `${fmMatchId}:${type}:${minute}:${index}`;

  return {
    externalKey: eventKey,
    type,
    minute,
    extraMinute,
    fmTeamId,
    fmPlayerId: Number.isInteger(fmPlayerId) && fmPlayerId > 0 ? fmPlayerId : null,
    playerName,
    fmRelatedPlayerId:
      Number.isInteger(Number(ev.assistPlayerId)) && Number(ev.assistPlayerId) > 0 ? Number(ev.assistPlayerId) : null,
    relatedPlayerName: typeof ev.assistInput === 'string' && ev.assistInput.trim() ? ev.assistInput.trim() : null,
  };
}

/** Descarga el árbitro principal, los penaltis señalados y los eventos de un partido en FotMob. */
export async function fetchFotmobMatchRefereeSummary(fmMatchId) {
  const payload = await fetchJson(`${MATCH_DETAILS_URL}${fmMatchId}`);
  const content = payload?.content;
  const rawRef = content?.matchFacts?.infoBox?.Referee;
  const refName = String(rawRef?.text ?? '').trim();
  const referee = refName
    ? {
        fmRefereeId: Number.isInteger(Number(rawRef?.id)) ? Number(rawRef.id) : null,
        name: refName,
        country: String(rawRef?.country ?? '').trim() || 'Spain',
      }
    : null;

  const homeFmTeamId = Number(generalTeamId(payload, 'home'));
  const awayFmTeamId = Number(generalTeamId(payload, 'away'));
  const rawEvents = content?.matchFacts?.events?.events ?? [];
  const events = [];
  let penalties = 0;

  for (let i = 0; i < rawEvents.length; i++) {
    const mapped = mapMatchFactEvent(rawEvents[i], i, fmMatchId, homeFmTeamId, awayFmTeamId);
    if (!mapped) continue;
    events.push(mapped);
    if (mapped.type === 'PENALTY_GOAL' || mapped.type === 'MISSED_PENALTY') penalties++;
  }

  return { referee, events, penalties };
}

function generalTeamId(payload, side) {
  const fromLineup = side === 'home' ? payload?.content?.lineup?.homeTeam?.id : payload?.content?.lineup?.awayTeam?.id;
  if (fromLineup != null) return fromLineup;
  return side === 'home' ? payload?.general?.homeTeam?.id : payload?.general?.awayTeam?.id;
}
