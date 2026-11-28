import Button from '../../components/Button/Button.jsx';
import { shortTime } from '../../services/format.js';
import { shortDay } from './playerDataFields.js';
import syncIcon from '../../assets/icon-sync.svg';

// Última sincronización con el proveedor de datos (la última ejecución correcta del importador, sync_runs).
// El botón «Sincronizar ahora» del mockup se queda, pero desactivado: la sincronización solo la lanza
// el administrador (20 · Panel de administración), no el editor.
const SOURCE_NAMES = {
  FOOTBALL_DATA: 'football-data.org',
  API_FOOTBALL: 'API-Football',
  TRANSFERMARKT: 'Transfermarkt',
  FOTMOB: 'FotMob',
  FBREF: 'FBref',
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
      <Button
        variant="tertiary"
        className="player-data__button"
        disabled
        title="Solo el administrador puede lanzar la sincronización"
      >
        <img src={syncIcon} alt="" width="16" height="16" />
        <span>
          Sincronizar<span className="player-data__more"> ahora</span>
        </span>
      </Button>
    </div>
  );
}
