import { useState } from 'react';
import { useApi } from '../../services/useApi.js';
import { listReferees } from '../../services/referees.js';
import useIsMobile from '../PlayerProfile/useIsMobile.js';

// Resultados de 06 · Árbitros, pedidos a la API por tramos (como useTeamsResults en Equipos).
//   Escritorio: la página `page` (offset = páginas anteriores).
//   Móvil: cada «Cargar más» pide el tramo siguiente y lo añade a los ya cargados.
// Al cambiar de temporada, búsqueda u orden se vuelve a la primera página.

const PER_PAGE = 10;
const MOBILE_STEP = 6;
const START = { page: 1, loaded: [] }; // loaded: tramos de móvil anteriores al que se está pidiendo

export function useRefereesResults({ season, search, sort }) {
  const isMobile = useIsMobile();
  const [{ page, loaded }, setPosition] = useState(START);

  // Se vuelve al principio en el mismo render: así no se llega a pedir la página anterior con los filtros nuevos
  const filters = JSON.stringify([season, search, sort]);
  const [previousFilters, setPreviousFilters] = useState(filters);
  if (filters !== previousFilters) {
    setPreviousFilters(filters);
    setPosition(START);
  }

  const limit = isMobile ? MOBILE_STEP : PER_PAGE;
  const previousItems = isMobile ? loaded : [];
  const offset = isMobile ? previousItems.length : (page - 1) * limit;

  const { data, error, loading, reload } = useApi(
    async (signal) => {
      const result = await listReferees({ season, q: search, sort, limit, offset }, { signal });
      return { ...result, search };
    },
    [season, search, sort, limit, offset],
  );

  // En móvil solo se añade el tramo que toca (si no, se repetiría el anterior mientras llega)
  const isNextChunk = !isMobile || data?.offset === offset;
  const items = [...previousItems, ...((isNextChunk && data?.items) || [])];

  return {
    data,
    items,
    error,
    loading,
    reload,
    page,
    totalPages: data ? Math.ceil(data.total / PER_PAGE) : 0,
    setPage: (value) => setPosition({ page: value, loaded: [] }),
    hasMore: Boolean(data) && items.length < data.total,
    loadMore: () => setPosition({ page: 1, loaded: items }),
  };
}
