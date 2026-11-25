// Equipo ideal del usuario sincronizado con la API (/api/me/ideal-team).
// Se mezcla en UserDataContext para conservar idealTeam y saveIdealTeam sin pisar a otros recursos.
// Sin sesión (invitado) no hace peticiones y devuelve un equipo vacío por defecto.

import { useCallback, useState } from 'react';
import { useSession } from './SessionContext.jsx';
import { useApi } from '../services/useApi.js';
import * as idealTeamApi from '../services/idealTeam.js';
import { DEFAULT_FORMATION, slotsOf } from '../../shared/formations.js';
import { DEFAULT_IDEAL_TEAM_NAME } from '../../shared/validation/idealTeam.js';

function emptyIdealTeam(formation = DEFAULT_FORMATION) {
  return {
    name: DEFAULT_IDEAL_TEAM_NAME,
    formation,
    updatedAt: null,
    season: null,
    players: slotsOf(formation).map((slot) => ({ slot, playerId: null, player: null })),
  };
}

const EMPTY_IDEAL_TEAM = emptyIdealTeam();

// Normaliza la respuesta de la API (solo huecos ocupados) al formato de la web (todos los huecos de la formación)
function normalizeIdealTeam(apiTeam) {
  const formation = apiTeam?.formation || DEFAULT_FORMATION;
  const bySlot = new Map((apiTeam?.players ?? []).map((entry) => [entry.slot, entry.player ?? null]));
  return {
    name: apiTeam?.name || DEFAULT_IDEAL_TEAM_NAME,
    formation,
    updatedAt: apiTeam?.updatedAt ?? null,
    season: apiTeam?.season ?? null,
    players: slotsOf(formation).map((slot) => {
      const player = bySlot.get(slot) ?? null;
      return { slot, playerId: player?.id ?? null, player };
    }),
  };
}

export function useIdealTeamData() {
  const { user } = useSession();
  const userId = user?.id ?? null;

  const { data, error, loading, reload } = useApi(
    (signal) => (userId ? idealTeamApi.getIdealTeam({ signal }) : Promise.resolve(null)),
    [userId],
  );
  // Resultado del último PUT asociado al usuario para reflejarlo al instante sin volver a pedir el GET
  const [saved, setSaved] = useState({ userId: null, team: null });

  const reloadIdealTeam = useCallback(() => {
    setSaved({ userId: null, team: null });
    reload();
  }, [reload]);

  const saveIdealTeam = useCallback(
    async (team) => {
      const filled = (team.players ?? [])
        .filter((entry) => entry.playerId != null)
        .map(({ slot, playerId }) => ({ slot, playerId }));
      const response = await idealTeamApi.saveIdealTeam({
        name: team.name,
        formation: team.formation,
        players: filled,
      });
      const normalized = normalizeIdealTeam(response);
      setSaved({ userId, team: normalized });
      return normalized;
    },
    [userId],
  );

  const loaded = userId && data ? normalizeIdealTeam(data) : EMPTY_IDEAL_TEAM;
  const idealTeam = userId && saved.userId === userId && saved.team ? saved.team : loaded;

  return {
    idealTeam,
    idealTeamLoading: Boolean(userId) && loading,
    idealTeamError: userId ? error : null,
    reloadIdealTeam,
    saveIdealTeam,
  };
}
