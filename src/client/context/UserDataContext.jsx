import { createContext, useContext, useEffect, useState } from 'react';
import { IDEAL_TEAM_EXAMPLE, getPlayer } from '../data/mockData.js';
import { CHANGE_HISTORY } from '../data/changeHistory.js';
import { useFavoritesData } from './useFavoritesData.js';
import { useComparisonsData } from './useComparisonsData.js';

// Lo que el usuario guarda en la web: favoritos (API /api/me/favorites en useFavoritesData) y comparativas
// (API /api/me/comparisons en useComparisonsData), que no se guardan en el navegador; equipo ideal y
// correcciones de editores (en localStorage hasta conectarlos).
//
// Uso en cualquier componente o vista:
//   const { favoriteTeams, toggleFavoriteTeam, savedComparisons, saveComparison, idealTeam, saveIdealTeam } = useUserData();
//   favoriteTeams / favoritePlayers         → ids numéricos desde /api/me/favorites (useFavoritesData)
//   favoriteTeamItems / favoritePlayerItems → datos completos para las tarjetas de 12 · Mi perfil
//   favoritesLoading / favoritesError / reloadFavorites · toggleFavoriteTeam(id) · toggleFavoritePlayer(id)
//   savedComparisons → [{ id, name, playerIds, players, createdAt, date }] · saveComparison(playerIds) devuelve la comparativa guardada
//   removeComparison(id)
//   idealTeam → { name, formation, players: [{ slot, playerId }] } · saveIdealTeam(team)
//   playerCorrections → { playerId: { campo: valor } } · dataHistory → historial de 19 · Actualizar datos
//   savePlayerCorrection(playerId, changes, entries)

const STORAGE_KEY = 'futkingva-user-data';

const INITIAL_DATA = {
  idealTeam: {
    name: IDEAL_TEAM_EXAMPLE.name,
    formation: IDEAL_TEAM_EXAMPLE.formation,
    players: IDEAL_TEAM_EXAMPLE.players,
  },
  playerCorrections: {},
  dataHistory: CHANGE_HISTORY,
};

// Las correcciones de los editores cambian los datos del jugador en toda la web (ficha, comparador…),
// como pasaría si se guardaran en el servidor.
function applyCorrections(corrections) {
  Object.entries(corrections).forEach(([playerId, changes]) => {
    const player = getPlayer(playerId);
    if (!player) return;
    Object.entries(changes).forEach(([key, value]) => {
      player[key] = toDataValue(key, value);
    });
  });
}

// De lo escrito en el formulario («0,8», «3») al tipo de mockData.js (número), salvo la posición
function toDataValue(key, value) {
  if (key === 'position' || typeof value !== 'string') return value;
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) ? number : value;
}

// Si el navegador bloquea localStorage, se usan los datos de ejemplo y los cambios duran hasta recargar
function readStoredData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored && typeof stored === 'object' ? { ...INITIAL_DATA, ...stored } : INITIAL_DATA;
  } catch {
    return INITIAL_DATA;
  }
}

function storeData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Sin localStorage: los cambios duran hasta recargar.
  }
}

const UserDataContext = createContext(null);

export function UserDataProvider({ children }) {
  const favorites = useFavoritesData();
  const comparisons = useComparisonsData();
  const [data, setData] = useState(() => {
    const initial = readStoredData();
    applyCorrections(initial.playerCorrections);
    return initial;
  });

  useEffect(() => {
    storeData(data);
  }, [data]);

  function saveIdealTeam(team) {
    setData((current) => ({ ...current, idealTeam: team }));
  }

  // changes: { campo: valor escrito } · entries: filas nuevas del historial (las más recientes, primero)
  function savePlayerCorrection(playerId, changes, entries) {
    applyCorrections({ [playerId]: changes });
    setData((current) => ({
      ...current,
      playerCorrections: {
        ...current.playerCorrections,
        [playerId]: { ...current.playerCorrections[playerId], ...changes },
      },
      dataHistory: [...entries, ...current.dataHistory],
    }));
  }

  const value = {
    ...data,
    ...favorites,
    ...comparisons,
    saveIdealTeam,
    savePlayerCorrection,
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  return useContext(UserDataContext);
}
