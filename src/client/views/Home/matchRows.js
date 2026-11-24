// Convierte los partidos de la API (GET /api/home) en las filas que pinta MatchList.
import { shortDate, shortTime } from '../../services/format.js';
import { capitalize } from '../../utils/text.js';

// 'home' | 'away' | undefined (empate o marcador que falta)
function getWinner(homeGoals, awayGoals) {
  if (homeGoals === awayGoals) return undefined;
  return homeGoals > awayGoals ? 'home' : 'away';
}

function formatRowDate(iso) {
  return iso ? capitalize(shortDate(iso)) : '—';
}

export function toResultRow(match) {
  const [homeGoals, awayGoals] = match.score ?? [];
  const hasScore = homeGoals != null && awayGoals != null;
  return {
    key: match.id,
    date: formatRowDate(match.date),
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    center: hasScore ? `${homeGoals} – ${awayGoals}` : '—',
    competition: match.competition,
    winner: hasScore ? getWinner(homeGoals, awayGoals) : undefined,
  };
}

export function toUpcomingRow(match) {
  // Solo los partidos con hora fijada (TIMED) tienen hora fiable; los SCHEDULED aún están por definir
  const kickoff = match.status === 'TIMED' && match.date ? shortTime(match.date) : '—';
  return {
    key: match.id,
    date: formatRowDate(match.date),
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    center: kickoff,
    competition: match.competition,
  };
}
