import { TEAMS, PLAYERS, STANDINGS_LALIGA } from '../../data/mockData.js';

// Búsqueda de equipos y jugadores por nombre (RF10), sin tener en cuenta tildes ni mayúsculas:
// «ra» encuentra «Raúl Asencio» y «Racing de Santander».

// Quita tildes y pasa a minúsculas, letra a letra (así cada posición sigue siendo la misma letra del original)
export function normalize(text = '') {
  return Array.from(text)
    .map((letter) => letter.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().charAt(0) || letter)
    .join('');
}

// Posición en la clasificación de cada equipo (los que no son de LaLiga van al final)
function positionOf(teamId) {
  return STANDINGS_LALIGA.find((row) => row.teamId === teamId)?.position ?? 99;
}

// ¿Coincide el nombre del equipo o su nombre corto («Barça», «Atlético»)?
function teamMatches(team, text) {
  return normalize(team.name).includes(text) || normalize(team.shortName ?? '').includes(text);
}

// Equipos de LaLiga cuyo nombre (o nombre corto) contiene el texto, por puesto en la tabla
export function searchTeams(query) {
  const text = normalize(query.trim());
  if (!text) return [];
  return Object.values(TEAMS)
    .filter((team) => team.competition === 'LaLiga' && teamMatches(team, text))
    .map((team) => ({ ...team, position: positionOf(team.id) }))
    .sort((a, b) => a.position - b.position);
}

// Jugadores cuyo nombre contiene el texto. Relevancia: primero los de los equipos mejor clasificados
// y, dentro de cada equipo, los que más goles llevan.
export function searchPlayers(query) {
  const text = normalize(query.trim());
  if (!text) return [];
  return Object.values(PLAYERS)
    .filter((player) => normalize(player.name).includes(text))
    .sort((a, b) => positionOf(a.teamId) - positionOf(b.teamId) || (b.goals ?? 0) - (a.goals ?? 0));
}

// Parte el nombre en trozos para resaltar lo que coincide: [{ text, match }]
// «Gerard Martín» con «ra» → [{ text: 'Ge' }, { text: 'ra', match: true }, { text: 'rd Martín' }]
export function splitMatch(name, query) {
  const text = normalize(query.trim());
  const index = text ? normalize(name).indexOf(text) : -1;
  if (index === -1) return [{ text: name, match: false }];
  return [
    { text: name.slice(0, index), match: false },
    { text: name.slice(index, index + text.length), match: true },
    { text: name.slice(index + text.length), match: false },
  ].filter((part) => part.text);
}
