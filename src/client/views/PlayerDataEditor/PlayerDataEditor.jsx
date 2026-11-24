import { useState } from 'react';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useApi } from '../../services/useApi.js';
import { getPlayerData, getPlayerDataHistory, getPlayerDataOverview } from '../../services/playerData.js';
import SyncStatus from './SyncStatus.jsx';
import PlayerPicker from './PlayerPicker.jsx';
import PlayerDataForm from './PlayerDataForm.jsx';
import ChangeHistoryTable from './ChangeHistoryTable.jsx';
import './PlayerDataEditor.css';

// 19 · Actualizar datos de jugadores (RF11): corregir las estadísticas que llegan del proveedor.
// Datos de la API (/api/player-data, solo editores): se abre con Pedri, el ejemplo de Figma del aviso que
// llegó desde Contacto (16). «Guardar cambios» corrige el dato en la BD y lo apunta en el historial.
// Diseño: Figma › Mockups › 19 · Actualizar datos de jugadores
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=62-1286

const BREADCRUMBS = [
  { label: 'Panel de editor', to: '/editor' },
  { label: 'Actualizar datos de jugadores', shortLabel: 'Actualizar datos' },
];

export default function PlayerDataEditor() {
  const overview = useApi((signal) => getPlayerDataOverview({ signal }), []);
  const [historyVersion, setHistoryVersion] = useState(0); // Sube al guardar para recargar el historial
  const history = useApi((signal) => getPlayerDataHistory({ signal }), [historyVersion]);
  const [selectedId, setSelectedId] = useState(null); // null = el jugador de ejemplo
  const [dirty, setDirty] = useState(false);
  const [switchNotice, setSwitchNotice] = useState('');

  const featuredId = overview.data?.featuredPlayerId ?? null;
  const playerId = selectedId ?? featuredId;
  const player = useApi(
    (signal) => (playerId ? getPlayerData(playerId, { signal }) : Promise.resolve(null)),
    [playerId],
  );

  function handleSelectPlayer(id) {
    setSwitchNotice(dirty ? `Se han descartado los cambios sin guardar de ${player.data?.player.name}.` : '');
    setDirty(false);
    setSelectedId(id);
  }

  return (
    <section className="page player-data">
      <RoleNotice role="editor" />
      <Breadcrumbs items={BREADCRUMBS} />

      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            Zona de editor<span className="player-data__more"> · RF11</span>
          </p>
          <h1 className="page-header__title">Actualizar datos de jugadores</h1>
          <p className="page-header__subtitle player-data__more">
            Corrige o completa las estadísticas recibidas del proveedor de datos.
          </p>
        </div>

        {overview.data && <SyncStatus sync={overview.data.sync} />}
      </header>

      {overview.loading && <LoadingState label="Cargando datos…" />}
      {overview.error && <ErrorState error={overview.error} onRetry={overview.reload} />}

      {overview.data && (
        <>
          <PlayerPicker
            currentPlayer={player.data?.player ?? { id: playerId, name: 'Buscar jugador' }}
            teams={overview.data.teams}
            season={overview.data.season}
            onSelectPlayer={handleSelectPlayer}
          />

          <div className="player-data__layout">
            <div className="player-data__main">
              {switchNotice && (
                <p className="player-data__message player-data__switch" role="status">
                  {switchNotice}
                </p>
              )}
              {player.loading && <LoadingState label="Cargando jugador…" />}
              {player.error && (
                <ErrorState error={player.error} title="No se ha podido cargar el jugador" onRetry={player.reload} />
              )}
              {!player.loading && !player.error && !player.data && (
                <p className="state-box">Busca un jugador para corregir sus datos.</p>
              )}
              {!player.loading && player.data && (
                <PlayerDataForm
                  key={player.data.player.id}
                  initialData={player.data}
                  showReport={player.data.player.id === featuredId}
                  onDirtyChange={(value) => {
                    setDirty(value);
                    if (value) setSwitchNotice('');
                  }}
                  onSaved={() => setHistoryVersion((n) => n + 1)}
                />
              )}
            </div>

            <ChangeHistoryTable history={history} />
          </div>
        </>
      )}
    </section>
  );
}
