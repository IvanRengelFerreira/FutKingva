import { useState } from 'react';

// Paginación de una lista: páginas en escritorio y «Cargar más» en móvil.
// resetPaging vuelve a la primera página y al primer tramo móvil; resetPage solo a la primera página
// (cada vista decide cuál usa en cada cambio de filtro, orden o pestaña).
export default function usePagedList(items, { perPage, mobileStep }) {
  const [page, setPage] = useState(1);
  const [mobileCount, setMobileCount] = useState(mobileStep);

  return {
    page,
    setPage,
    totalPages: Math.ceil(items.length / perPage),
    pageItems: items.slice((page - 1) * perPage, page * perPage),
    mobileItems: items.slice(0, mobileCount),
    hasMore: mobileCount < items.length,
    loadMore: () => setMobileCount((count) => count + mobileStep),
    resetPage: () => setPage(1),
    resetPaging: () => {
      setPage(1);
      setMobileCount(mobileStep);
    },
  };
}
