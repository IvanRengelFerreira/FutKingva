import { useEffect, useRef, useState } from 'react';
import { useSession } from './SessionContext.jsx';
import { useApi } from '../services/useApi.js';
import * as favoritesApi from '../services/favorites.js';

// Favoritos del usuario autenticado conectados a la API (/api/me/favorites).
// Sin sesión no hace peticiones y devuelve listas vacías; al cambiar de usuario se recargan.
// Las vistas de equipos y jugadores leen favoriteTeams / favoritePlayers (arrays de ids numéricos)
// y llaman a toggleFavoriteTeam / toggleFavoritePlayer (actualización optimista con vuelta atrás si falla).

const FAVORITE_ACTIONS = {
  team: { add: favoritesApi.addFavoriteTeam, remove: favoritesApi.removeFavoriteTeam },
  player: { add: favoritesApi.addFavoritePlayer, remove: favoritesApi.removeFavoritePlayer },
};

const EMPTY_LIST = [];

function applyOptimisticIds(items, overrides, kind) {
  const ids = items.map((item) => item.id).filter((id) => overrides[`${kind}:${id}`]?.desired !== false);
  const added = Object.values(overrides)
    .filter((entry) => entry.kind === kind && entry.desired && !ids.includes(entry.id))
    .map((entry) => entry.id);
  return [...added, ...ids];
}

function applyOptimisticItems(items, overrides, kind) {
  return items.filter((item) => overrides[`${kind}:${item.id}`]?.desired !== false);
}

// Quita las entradas ya confirmadas en cuanto los datos frescos del servidor las reflejan
function pruneSettled(overrides, data) {
  if (!data || Object.keys(overrides).length === 0) return overrides;
  const serverIds = {
    team: new Set(data.teams.map((item) => item.id)),
    player: new Set(data.players.map((item) => item.id)),
  };
  const next = {};
  for (const [key, entry] of Object.entries(overrides)) {
    const synced = entry.done && serverIds[entry.kind].has(entry.id) === entry.desired;
    if (!synced) next[key] = entry;
  }
  return next;
}

function removeKey(obj, key) {
  const { [key]: _removed, ...rest } = obj;
  return rest;
}

// Estado optimista de cambios en curso: se limpia al cambiar de usuario o al llegar la recarga
function useSyncedOverrides(userId, data) {
  const [overrides, setOverrides] = useState({});
  const [prev, setPrev] = useState({ userId, data });

  if (prev.userId !== userId) {
    setPrev({ userId, data });
    setOverrides({});
  } else if (prev.data !== data) {
    setPrev({ userId, data });
    setOverrides((current) => pruneSettled(current, data));
  }
  return [overrides, setOverrides];
}

export function useFavoritesData() {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const { data, error, loading, reload } = useApi(
    (signal) =>
      userId == null
        ? Promise.resolve(null)
        : favoritesApi.getFavorites({ signal }).then((res) => ({ userId, ...res })),
    [userId],
  );
  const [overrides, setOverrides] = useSyncedOverrides(userId, data);

  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Evita mostrar datos de un usuario anterior mientras carga el nuevo y oculta recargas en segundo plano
  const currentData = userId != null && data?.userId === userId ? data : null;
  const serverTeams = currentData?.teams ?? EMPTY_LIST;
  const serverPlayers = currentData?.players ?? EMPTY_LIST;
  const favoriteTeams = applyOptimisticIds(serverTeams, overrides, 'team');
  const favoritePlayers = applyOptimisticIds(serverPlayers, overrides, 'player');

  async function toggleFavorite(kind, id) {
    const requestUserId = userId;
    if (requestUserId == null) return;

    const key = `${kind}:${id}`;
    if (overrides[key]?.done === false) return;

    const desired = !(kind === 'team' ? favoriteTeams : favoritePlayers).includes(id);
    const { add, remove } = FAVORITE_ACTIONS[kind];
    setOverrides((current) => ({ ...current, [key]: { kind, id, desired, done: false } }));

    try {
      await (desired ? add(id) : remove(id));
      if (userIdRef.current !== requestUserId) return;
      setOverrides((current) => (current[key] ? { ...current, [key]: { ...current[key], done: true } } : current));
      reload();
    } catch (err) {
      console.warn('[favoritos] No se ha podido guardar el cambio:', err.message);
      if (userIdRef.current === requestUserId) {
        setOverrides((current) => removeKey(current, key));
      }
    }
  }

  return {
    favoriteTeams,
    favoritePlayers,
    favoriteTeamItems: applyOptimisticItems(serverTeams, overrides, 'team'),
    favoritePlayerItems: applyOptimisticItems(serverPlayers, overrides, 'player'),
    favoritesLoading: userId != null && loading && !currentData,
    favoritesError: userId != null ? error : null,
    reloadFavorites: reload,
    toggleFavoriteTeam: (teamId) => toggleFavorite('team', teamId),
    toggleFavoritePlayer: (playerId) => toggleFavorite('player', playerId),
  };
}
