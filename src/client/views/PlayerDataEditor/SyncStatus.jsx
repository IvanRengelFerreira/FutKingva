import { useEffect, useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import { TODAY } from '../../data/mockData.js';
import syncIcon from '../../assets/icon-sync.svg';

const SYNC_DURATION_MS = 1200;

// La última sincronización, poco antes de la hora de los datos (sábado 17/10 a las 17:00); se sincroniza cada 5 min
const SYNC_EVERY_MINUTES = 5;

// «17:00» menos unos minutos → «16:59»
function minutesBefore(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins - minutes;
  const formattedHours = String(Math.floor(total / 60)).padStart(2, '0');
  const formattedMinutes = String(total % 60).padStart(2, '0');
  return `${formattedHours}:${formattedMinutes}`;
}

const FIRST_SYNC = minutesBefore(TODAY.time, 1);

export default function SyncStatus() {
  const [lastSync, setLastSync] = useState(FIRST_SYNC);
  const [syncing, setSyncing] = useState(false);

  // «Sincronizar ahora»: un momento «Sincronizando…» y se actualiza la hora
  useEffect(() => {
    if (!syncing) return undefined;
    const timer = setTimeout(() => {
      setSyncing(false);
      setLastSync(TODAY.time);
    }, SYNC_DURATION_MS);
    return () => clearTimeout(timer);
  }, [syncing]);

  const dotClassName = syncing ? 'player-data__dot player-data__dot--syncing' : 'player-data__dot';
  const nextSyncMinutes = lastSync === TODAY.time ? SYNC_EVERY_MINUTES : SYNC_EVERY_MINUTES - 1;

  return (
    <div className="player-data__sync">
      <span className={dotClassName} aria-hidden="true" />
      <div className="player-data__sync-text">
        <p className="player-data__sync-title">
          <span className="player-data__more">Conectado a </span>football-data.org
        </p>
        <p className="player-data__sync-time" role="status">
          {syncing ? (
            'Sincronizando…'
          ) : (
            <>
              <span className="player-data__more">Última sincronización: </span>
              <span className="player-data__capital">hoy {lastSync}</span>
              <span className="player-data__more"> · próxima en {nextSyncMinutes} min</span>
            </>
          )}
        </p>
      </div>
      <Button variant="tertiary" className="player-data__button" onClick={() => setSyncing(true)} disabled={syncing}>
        <img src={syncIcon} alt="" width="16" height="16" />
        <span>
          Sincronizar<span className="player-data__more"> ahora</span>
        </span>
      </Button>
    </div>
  );
}
