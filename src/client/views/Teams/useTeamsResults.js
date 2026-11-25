import { useState } from 'react';
import { useApi } from '../../services/useApi.js';
import { listTeams } from '../../services/teams.js';
import { listPlayers } from '../../services/players.js';
import useIsMobile from '../PlayerProfile/useIsMobile.js';

// Resultados de 02 · Equipos y jugadores, pedidos a la API por tramos.
//   Escritorio: la página `page` (offset = páginas anteriores).
//   Móvil: cada «Cargar más» pide el tramo siguiente y lo añade a los ya cargados.
// Al cambiar de pestaña, búsqueda u orden se vuelve a la primera página.

const REQUESTS = { teams: listTeams, players: listPlayers };
const PER_PAGE = { teams: 12, players: 10 };
const MOBILE_STEP = 7;
const START = { page: 1, loaded: [] }; // loaded: tramos de móvil anteriores al que se está pidiendo

export function useTeamsResults({ tab, search, sort }) {
  const isMobile = useIsMobile();
  const [{ page, loaded }, setPosition] = useState(START);

  // Se vuelve al principio en el mismo render: así no se llega a pedir la página anterior con los filtros nuevos
  const filters = JSON.stringify([tab, search, sort]);
  const [previousFilters, setPreviousFilters] = useState(filters);
  if (filters !== previousFilters) {
    setPreviousFilters(filters);
    setPosition(START);
  }

  const limit = isMobile ? MOBILE_STEP : PER_PAGE[tab];
  const previousItems = isMobile ? loaded : [];
  const offset = isMobile ? previousItems.length : (page - 1) * limit;

  const { data, error, loading, reload } = useApi(
    async (signal) => {
      const result = await REQUESTS[tab]({ q: search, sort, limit, offset }, { signal });
      return { ...result, tab, search };
    },
    [tab, search, sort, limit, offset],
  );

  // Mientras llega otra respuesta se siguen viendo los datos anteriores, pero nunca los de la otra pestaña
  const current = data?.tab === tab ? data : null;
  // En móvil solo se añade el tramo que toca (si no, se repetiría el anterior mientras llega)
  const isNextChunk = !isMobile || current?.offset === offset;
  const items = [...previousItems, ...((isNextChunk && current?.items) || [])];

  return {
    data: current,
    items,
    error,
    loading,
    reload,
    page,
    totalPages: current ? Math.ceil(current.total / PER_PAGE[tab]) : 0,
    setPage: (value) => setPosition({ page: value, loaded: [] }),
    hasMore: Boolean(current) && items.length < current.total,
    loadMore: () => setPosition({ page: 1, loaded: items }),
  };
}
