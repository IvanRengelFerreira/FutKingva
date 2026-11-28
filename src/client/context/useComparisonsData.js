import { useCallback, useEffect, useState } from 'react';
import { useSession } from './SessionContext.jsx';
import { listComparisons, createComparison, deleteComparison } from '../services/comparisons.js';
import { shortDate } from '../services/format.js';

// Comparativas guardadas del usuario en la API (/api/me/comparisons). Responsable: Ivan.
// Se mezcla en UserDataContext para mantener la interfaz de useUserData():
//   savedComparisons → [{ id, name, playerIds, players, createdAt, date }]
//   comparisonsLoading · comparisonsError · reloadComparisons()
//   saveComparison(playerIds) → guarda en la API y devuelve la comparativa guardada
//   removeComparison(id) → borra en la API y la quita de la lista

const MAX_FETCH = 100;

/** Misma clave para los mismos jugadores, en cualquier orden: detecta comparativas sustituidas */
function comparisonKey(playerIds) {
  return [...playerIds].sort((a, b) => a - b).join(',');
}

function normalizeComparison(item) {
  const players = item.players ?? [];
  return {
    id: item.id,
    name: item.name,
    playerIds: players.map((player) => player.id),
    players,
    createdAt: item.createdAt,
    date: item.createdAt ? shortDate(item.createdAt) : '',
  };
}

export function useComparisonsData() {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const [savedComparisons, setSavedComparisons] = useState([]);
  // Con sesión empieza cargando: así Mi perfil no enseña «0 comparativas» antes de la primera respuesta
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  // Al cambiar de usuario o cerrar sesión se vacía la lista en el mismo render para no enseñar datos ajenos
  const [lastUserId, setLastUserId] = useState(userId);
  if (lastUserId !== userId) {
    setLastUserId(userId);
    setSavedComparisons([]);
    setLoading(Boolean(userId));
    setError(null);
  }

  useEffect(() => {
    if (!userId) return undefined;
    const controller = new AbortController();

    listComparisons({ limit: MAX_FETCH }, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setSavedComparisons(result.items.map(normalizeComparison));
        setError(null);
        setLoading(false);
      })
      .catch((caught) => {
        if (caught.name === 'AbortError' || controller.signal.aborted) return;
        setError(caught);
        setLoading(false);
      });

    return () => controller.abort();
  }, [userId, reloadCount]);

  const reloadComparisons = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadCount((count) => count + 1);
  }, []);

  async function saveComparison(playerIds) {
    if (!userId) return null;
    const created = await createComparison(playerIds);
    const saved = normalizeComparison(created);
    const key = comparisonKey(saved.playerIds);
    setSavedComparisons((current) => [
      saved,
      ...current.filter((item) => item.id !== saved.id && comparisonKey(item.playerIds) !== key),
    ]);
    return saved;
  }

  async function removeComparison(id) {
    if (!userId) return;
    await deleteComparison(id);
    setSavedComparisons((current) => current.filter((item) => item.id !== id));
  }

  return {
    savedComparisons,
    comparisonsLoading: Boolean(userId) && loading,
    comparisonsError: userId ? error : null,
    reloadComparisons,
    saveComparison,
    removeComparison,
  };
}
