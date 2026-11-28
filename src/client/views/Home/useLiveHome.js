// 01 · Inicio en directo (RF9): aplica sobre los datos de GET /api/home lo que llega por Socket.IO,
// sin recargar la página.
//   match:update   → marcador y minuto nuevos en «Partidos en juego» (o aparece si acaba de empezar)
//   match:finished → sale de «Partidos en juego» y, si es real, pasa el primero a «Últimos resultados»
//   match:removed  → desaparece (partido simulado borrado)
//   standings:update → «Clasificación rápida» nueva

import { useEffect, useState } from 'react';
import { onEvent } from '../../services/realtime.js';

const LIVE_STATUSES = ['IN_PLAY', 'PAUSED'];

const withoutMatch = (matches, id) => matches.filter((match) => match.id !== id);

function updateLive(data, match) {
  if (!LIVE_STATUSES.includes(match.status)) return data;
  const exists = data.liveMatches.some((item) => item.id === match.id);
  const liveMatches = exists
    ? data.liveMatches.map((item) => (item.id === match.id ? match : item))
    : [...data.liveMatches, match];
  return { ...data, liveMatches, upcomingMatches: withoutMatch(data.upcomingMatches, match.id) };
}

function finishMatch(data, match, simulated) {
  const liveMatches = withoutMatch(data.liveMatches, match.id);
  // Un partido simulado nunca es un resultado: solo deja de estar en juego
  if (simulated) return { ...data, liveMatches };
  return { ...data, liveMatches, latestResults: [match, ...withoutMatch(data.latestResults, match.id)] };
}

function removeMatch(data, matchId) {
  return {
    ...data,
    liveMatches: withoutMatch(data.liveMatches, matchId),
    latestResults: withoutMatch(data.latestResults, matchId),
  };
}

/** Datos de Inicio con los cambios en directo aplicados (null mientras no hay datos) */
export function useLiveHome(data) {
  const [live, setLive] = useState(data);

  // Datos nuevos de la API (primera carga o reintento): se parte de ellos
  const [source, setSource] = useState(data);
  if (source !== data) {
    setSource(data);
    setLive(data);
  }

  useEffect(() => {
    const offs = [
      onEvent('match:update', ({ match }) => setLive((current) => current && updateLive(current, match))),
      onEvent('match:finished', ({ match, simulated }) =>
        setLive((current) => current && finishMatch(current, match, simulated)),
      ),
      onEvent('match:removed', ({ matchId }) => setLive((current) => current && removeMatch(current, matchId))),
      onEvent('standings:update', ({ seasonId, standings }) =>
        setLive((current) =>
          current && current.season?.id === seasonId ? { ...current, standings: standings.slice(0, 5) } : current,
        ),
      ),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  return live;
}
