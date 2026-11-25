// Carga de candidatos para 11 · Mi equipo ideal desde GET /api/players con búsqueda diferida y «Ver más».
import { useEffect, useState } from 'react';
import { fitsSlot, slotPositionGroups } from '../../../shared/positions.js';
import { listPlayers } from '../../services/players.js';
import { useApi } from '../../services/useApi.js';

const INITIAL_LIMIT = 5;
const LIMIT_STEP = 20;
const MAX_FETCH_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 250;

async function fetchCandidates({ slot, onlySlot, search, limit, queryKey, signal }) {
  if (!slot) return { items: [], hasMore: false, queryKey };

  if (!onlySlot) {
    const result = await listPlayers({ search, limit }, { signal });
    return { items: result.items, hasMore: result.items.length < result.total, queryKey };
  }

  const groups = slotPositionGroups(slot);
  const responses = await Promise.all(groups.map((position) => listPlayers({ search, position, limit }, { signal })));
  const merged = responses.flatMap((response) => response.items).filter((player) => fitsSlot(player, slot));
  const hasMore = responses.some((response) => response.items.length < response.total);
  return { items: merged, hasMore, queryKey };
}

export function useCandidates({ slot, onlySlot, query }) {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [limit, setLimit] = useState(INITIAL_LIMIT);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const queryKey = `${slot ?? ''}|${onlySlot}|${debouncedQuery}`;
  const [previousKey, setPreviousKey] = useState(queryKey);
  if (queryKey !== previousKey) {
    setPreviousKey(queryKey);
    setLimit(INITIAL_LIMIT);
  }

  const { data, error, loading, reload } = useApi(
    (signal) => fetchCandidates({ slot, onlySlot, search: debouncedQuery, limit, queryKey, signal }),
    [slot, onlySlot, debouncedQuery, limit],
  );

  const sameQuery = data?.queryKey === queryKey;
  const items = slot && sameQuery ? data.items : [];
  const isInitialLoading = Boolean(slot) && loading && !sameQuery;
  const isLoadingMore = Boolean(slot) && loading && sameQuery;
  const canLoadMore = Boolean(slot) && sameQuery && Boolean(data?.hasMore) && limit < MAX_FETCH_LIMIT;
  const expanded = limit > INITIAL_LIMIT;

  function loadMore() {
    setLimit((current) => Math.min(MAX_FETCH_LIMIT, current + LIMIT_STEP));
  }

  return { items, error, isInitialLoading, isLoadingMore, canLoadMore, expanded, loadMore, reload };
}
