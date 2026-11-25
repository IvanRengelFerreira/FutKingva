import { useEffect, useRef, useState } from 'react';

const DELAY_MS = 300; // Para no pedir a la API en cada tecla

// Buscador: `query` es lo escrito y `search`, lo que ya se puede pedir.
export function useDebouncedSearch() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  return {
    query,
    search,
    changeQuery(value) {
      setQuery(value);
      clearTimeout(timer.current);
      const next = value.trim();
      timer.current = setTimeout(() => setSearch(next), DELAY_MS);
    },
    clearQuery() {
      setQuery('');
      clearTimeout(timer.current);
      setSearch('');
    },
  };
}
