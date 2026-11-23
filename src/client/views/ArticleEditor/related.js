import { PLAYERS, TEAMS, getPlayer, getTeam } from '../../data/mockData.js';
import { toSearchText } from '../../utils/text.js';

// Nombre de un jugador o equipo relacionado (completo, o corto en las etiquetas ya elegidas)
export function relatedName(item, full = false) {
  if (item.type === 'team') return getTeam(item.id)?.name ?? item.id;
  const player = getPlayer(item.id);
  return full ? player?.name : (player?.shortName ?? player?.name);
}

// Jugadores y equipos que coinciden con lo buscado (máximo 5, sin los ya elegidos)
export function getSuggestions(query, chosen) {
  const text = toSearchText(query);
  if (!text) return [];
  const isChosen = (type, id) => chosen.some((item) => item.type === type && item.id === id);
  const players = Object.values(PLAYERS)
    .filter((player) => !isChosen('player', player.id) && toSearchText(player.name).includes(text))
    .map((player) => ({ type: 'player', id: player.id }));
  const teams = Object.values(TEAMS)
    .filter((team) => !isChosen('team', team.id) && toSearchText(team.name).includes(text))
    .map((team) => ({ type: 'team', id: team.id }));
  return [...players, ...teams].slice(0, 5);
}
