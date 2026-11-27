import { createContext, useContext } from 'react';
import { useFavoritesData } from './useFavoritesData.js';
import { useComparisonsData } from './useComparisonsData.js';
import { useIdealTeamData } from './useIdealTeamData.js';

// Lo que el usuario guarda en la web. Favoritos (useFavoritesData → /api/me/favorites), comparativas
// (useComparisonsData → /api/me/comparisons) y equipo ideal (useIdealTeamData → /api/me/ideal-team) vienen
// de la API y no se guardan en el navegador.
//
// Uso en cualquier componente o vista:
//   const { favoriteTeams, toggleFavoriteTeam, savedComparisons, saveComparison, idealTeam, saveIdealTeam } = useUserData();
//   favoriteTeams / favoritePlayers         → ids numéricos desde /api/me/favorites (useFavoritesData)
//   favoriteTeamItems / favoritePlayerItems → datos completos para las tarjetas de 12 · Mi perfil
//   favoritesLoading / favoritesError / reloadFavorites · toggleFavoriteTeam(id) · toggleFavoritePlayer(id)
//   savedComparisons → [{ id, name, playerIds, players, createdAt, date }] · saveComparison(playerIds) devuelve la comparativa guardada
//   removeComparison(id)
//   idealTeam → { name, formation, updatedAt, season, players: [{ slot, playerId, player }] } (desde /api/me/ideal-team)
//   idealTeamLoading · idealTeamError · reloadIdealTeam() · saveIdealTeam(team)

const UserDataContext = createContext(null);

export function UserDataProvider({ children }) {
  const favorites = useFavoritesData();
  const comparisons = useComparisonsData();
  const idealTeamData = useIdealTeamData();

  const value = { ...favorites, ...comparisons, ...idealTeamData };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  return useContext(UserDataContext);
}
