import { useEffect, useState } from 'react';
import { useApi } from '../../services/useApi.js';
import { listPlayers } from '../../services/players.js';
import { listTeams } from '../../services/teams.js';

// Buscador de jugadores y equipos de la BD para «Jugadores / equipos relacionados» y para «Jugador»
// (GET /api/players?search= y GET /api/teams?q=). Espera a que se deje de escribir para no pedir en cada letra.

const SEARCH_DELAY_MS = 250;
const MAX_SUGGESTIONS = 5;
const NO_RESULTS = { players: [], teams: [] };

/** Nombre de un relacionado (los jugadores, sin apellidos de más en las etiquetas ya elegidas) */
export function relatedName(item) {
  return item.name;
}

/**
 * Sugerencias para lo escrito: [{ type: 'player', id, name, team, … } | { type: 'team', id, name, code, color }]
 * sin los ya elegidos. withTeams = false → solo jugadores.
 */
export function useSuggestions(query, chosen = [], { withTeams = true } = {}) {
  const [text, setText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setText(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data } = useApi(
    async (signal) => {
      if (text.length < 2) return NO_RESULTS;
      const [players, teams] = await Promise.all([
        listPlayers({ search: text, limit: MAX_SUGGESTIONS }, { signal }),
        withTeams ? listTeams({ q: text, limit: MAX_SUGGESTIONS }, { signal }) : { items: [] },
      ]);
      return { players: players.items, teams: teams.items };
    },
    [text, withTeams],
  );

  if (text.length < 2 || !data) return [];
  const isChosen = (type, id) => chosen.some((item) => item.type === type && item.id === id);
  const players = data.players
    .filter((player) => !isChosen('player', player.id))
    .map((player) => ({
      type: 'player',
      id: player.id,
      name: player.name,
      photoUrl: player.photoUrl,
      team: player.team,
      position: player.position,
      rating: player.rating,
    }));
  const teams = data.teams
    .filter((team) => !isChosen('team', team.id))
    .map((team) => ({
      type: 'team',
      id: team.id,
      name: team.name,
      code: team.code,
      color: team.color,
      crestUrl: team.crestUrl,
    }));
  return [...players, ...teams].slice(0, MAX_SUGGESTIONS);
}
