import { shortTime } from '../../services/format.js';
import { shortDay } from './playerDataFields.js';

// Última sincronización con el proveedor de datos (la última ejecución correcta del importador, sync_runs).
// El botón «Sincronizar ahora» de Figma no está: el importador se lanza desde el servidor, no desde la web.
const SOURCE_NAMES = {
  FOOTBALL_DATA: 'football-data.org',
  API_FOOTBALL: 'API-Football',
  TRANSFERMARKT: 'Transfermarkt',
};

function syncDate(iso) {
  const isToday = shortDay(iso) === shortDay(new Date().toISOString());
  return `${isToday ? 'hoy' : shortDay(iso)} ${shortTime(iso)}`;
}

export default function SyncStatus({ sync }) {
  const source = SOURCE_NAMES[sync?.source] ?? 'football-data.org';

  return (
    <div className="player-data__sync">
      <span className="player-data__dot" aria-hidden="true" />
      <div className="player-data__sync-text">
        <p className="player-data__sync-title">
          <span className="player-data__more">Conectado a </span>
          {source}
        </p>
        <p className="player-data__sync-time">
          <span className="player-data__more">Última sincronización: </span>
          <span className="player-data__capital">{sync ? syncDate(sync.finishedAt) : 'todavía ninguna'}</span>
        </p>
      </div>
    </div>
  );
}
