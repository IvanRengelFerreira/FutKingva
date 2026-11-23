import { TEAMS, PLAYERS, STANDINGS_LALIGA } from '../../data/mockData.js';
import { toSearchText } from '../../utils/text.js';

// Filas de 02 · Equipos y jugadores sacadas de mockData.js, filtradas por nombre y ordenadas.

export const TEAM_SORTS = [
  { value: 'standings', label: 'Clasificación' },
  { value: 'name', label: 'Nombre' },
  { value: 'goals', label: 'Goles a favor' },
];

export const PLAYER_SORTS = [
  { value: 'rating', label: 'Valoración' },
  { value: 'goals', label: 'Goles' },
  { value: 'assists', label: 'Asistencias' },
  { value: 'name', label: 'Nombre' },
];

function byName(a, b) {
  return a.name.localeCompare(b.name, 'es');
}

// Equipos de LaLiga con su fila de la clasificación: { ...team, row }
export function getTeamRows(query, sort) {
  const text = toSearchText(query);
  const rows = STANDINGS_LALIGA.filter((row) => TEAMS[row.teamId])
    .map((row) => ({ ...TEAMS[row.teamId], row }))
    .filter((team) => toSearchText(team.name).includes(text) || toSearchText(team.shortName ?? '').includes(text));

  if (sort === 'name') return rows.sort(byName);
  if (sort === 'goals') return rows.sort((a, b) => b.row.goalsFor - a.row.goalsFor || a.row.position - b.row.position);
  return rows; // STANDINGS_LALIGA ya viene por puesto
}

// Jugadores con su equipo: { ...player, team }. Los que no tienen el dato van al final.
export function getPlayerRows(query, sort) {
  const text = toSearchText(query);
  const rows = Object.values(PLAYERS)
    .filter((player) => toSearchText(player.name).includes(text))
    .map((player) => ({ ...player, team: TEAMS[player.teamId] }));

  if (sort === 'name') return rows.sort(byName);
  return rows.sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1) || byName(a, b));
}
