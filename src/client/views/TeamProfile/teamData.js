import {
  STANDINGS_LALIGA,
  UPCOMING_MATCHES,
  LATEST_RESULTS,
  TEAM_RECENT_RESULTS,
  PLAYER_PROFILE_EXTRAS,
  TODAY,
  getPlayersByTeam,
} from '../../data/mockData.js';

// Datos de la ficha de equipo sacados de mockData.js (todo por id de equipo).

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// Orden de la plantilla: porteros, defensas, centrocampistas y delanteros
const POSITION_ORDER = ['Portero', 'Defensa', 'Centrocampista', 'Extremo', 'Delantero'];

// Fila de la clasificación del equipo (undefined si no es de LaLiga)
export function getStandingsRow(teamId) {
  return STANDINGS_LALIGA.find((row) => row.teamId === teamId);
}

// Plantilla ordenada por posición y, dentro de cada posición, por dorsal
export function getSquad(teamId) {
  return [...getPlayersByTeam(teamId)].sort(
    (a, b) => positionIndex(a) - positionIndex(b) || (a.number ?? 99) - (b.number ?? 99)
  );
}

// Los máximos goleadores del equipo (lista corta del móvil)
export function getTopScorers(teamId, count) {
  return [...getPlayersByTeam(teamId)]
    .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
    .slice(0, count);
}

// Próximos partidos del equipo, con la fecha partida para el cuadradito «18 OCT»
// «Dom 18/10» → { weekday: 'Dom', day: '18', month: 'OCT' }
export function getUpcomingMatches(teamId) {
  return UPCOMING_MATCHES
    .filter((match) => match.homeId === teamId || match.awayId === teamId)
    .map((match) => {
      const [weekday, dayMonth] = match.date.split(' ');
      const [day, month] = dayMonth.split('/');
      const competition = match.competition ?? 'LaLiga';
      // Los de LaLiga sin «round» son de la jornada que se está jugando
      const round = match.round ?? (match.competition ? null : TODAY.round);
      return {
        ...match,
        weekday,
        day,
        month: MONTHS[Number(month) - 1],
        competition,
        round,
        opponentId: match.homeId === teamId ? match.awayId : match.homeId,
      };
    });
}

// Últimos resultados del equipo: { date, opponentId, venue: 'C' | 'F', score: [a favor, en contra], result: 'V' | 'E' | 'D' }
// Si el equipo no tiene los suyos en TEAM_RECENT_RESULTS, se sacan de LATEST_RESULTS y, si ahí no hay ninguno,
// de los últimos partidos de algún jugador suyo (p. ej. los de Pedri para el Barcelona; la fecha va como jornada).
export function getRecentResults(teamId) {
  const fromLatest = LATEST_RESULTS
    .filter((match) => match.homeId === teamId || match.awayId === teamId)
    .map((match) => {
      const home = match.homeId === teamId;
      return {
        date: match.date,
        opponentId: home ? match.awayId : match.homeId,
        venue: home ? 'C' : 'F',
        score: home ? match.score : [match.score[1], match.score[0]],
      };
    });
  const results = TEAM_RECENT_RESULTS[teamId] ?? (fromLatest.length > 0 ? fromLatest : resultsFromPlayers(teamId));

  return results.map((match) => ({ ...match, result: getResult(match.score) }));
}

// Últimos partidos del primer jugador del equipo que los tenga (score «3-0» con los goles del equipo primero)
function resultsFromPlayers(teamId) {
  const player = getPlayersByTeam(teamId).find((p) => p.lastMatches?.length);
  if (!player) return [];
  const venues = PLAYER_PROFILE_EXTRAS[player.id]?.venues ?? {};
  return player.lastMatches.map((match) => ({
    date: `J${match.round}`,
    opponentId: match.opponentId,
    venue: venues[match.round] ?? 'C',
    score: match.score.split('-').map(Number),
  }));
}

function getResult([goalsFor, goalsAgainst]) {
  if (goalsFor > goalsAgainst) return 'V';
  if (goalsFor < goalsAgainst) return 'D';
  return 'E';
}

function positionIndex(player) {
  const index = POSITION_ORDER.indexOf(player.position);
  return index === -1 ? POSITION_ORDER.length : index;
}
