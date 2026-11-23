// Convierte los partidos de mockData.js en las filas que pinta MatchList.

// Un partido con un equipo que no esté en los datos se descarta para no romper la página
export function hasKnownTeams(match, getTeam) {
  return Boolean(getTeam(match.homeId) && getTeam(match.awayId));
}

function rowKey(match, index) {
  return `${match.date}-${match.homeId}-${match.awayId}-${index}`;
}

// 'home' | 'away' | undefined (empate o marcador que falta)
function getWinner(homeGoals, awayGoals) {
  if (homeGoals === awayGoals) return undefined;
  return homeGoals > awayGoals ? 'home' : 'away';
}

export function toResultRow(match, index) {
  const [homeGoals, awayGoals] = match.score ?? [];
  const hasScore = homeGoals != null && awayGoals != null;
  return {
    key: rowKey(match, index),
    date: match.date,
    homeId: match.homeId,
    awayId: match.awayId,
    center: hasScore ? `${homeGoals} – ${awayGoals}` : '—',
    competition: match.competition,
    winner: hasScore ? getWinner(homeGoals, awayGoals) : undefined,
  };
}

export function toUpcomingRow(match, index) {
  return {
    key: rowKey(match, index),
    date: match.date,
    homeId: match.homeId,
    awayId: match.awayId,
    center: match.time,
    competition: match.competition ?? 'LaLiga',
  };
}
