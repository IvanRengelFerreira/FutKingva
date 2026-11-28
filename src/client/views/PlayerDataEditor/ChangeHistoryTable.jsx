import Avatar from '../../components/Avatar/Avatar.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { fieldLabel } from '../../../shared/validation/playerData.js';
import { displayValue, shortDay } from './playerDataFields.js';

// Historial de cambios (GET /api/player-data/history): las correcciones de todos los editores, las últimas primero
export default function ChangeHistoryTable({ history }) {
  const { data, error, loading, reload } = history;

  return (
    <div className="player-data__history">
      <h2 className="player-data__history-title">Historial de cambios</h2>
      {loading && !data && <LoadingState label="Cargando historial…" />}
      {error && <ErrorState error={error} title="No se ha podido cargar el historial" onRetry={reload} />}
      {data && (
        <div className="player-data__table">
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <span className="player-data__more">Fecha</span>
                  <span className="player-data__less">Día</span>
                </th>
                <th scope="col">Jugador · campo</th>
                <th scope="col">Cambio</th>
                <th scope="col" className="player-data__by">
                  Por
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="player-data__history-empty">
                    Todavía no hay cambios.
                  </td>
                </tr>
              )}
              {data.items.map((entry) => (
                <tr key={entry.id}>
                  <td className="player-data__date">{shortDay(entry.createdAt)}</td>
                  <td>
                    <span className="player-data__entry">
                      <Avatar name={entry.player.name} src={entry.player.photoUrl} size={26} />
                      <span>
                        <span className="player-data__entry-name">{entry.player.name}</span>
                        <span className="player-data__entry-field">{fieldLabel(entry.field)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="player-data__change">
                    {displayValue(entry.oldValue)} <span className="player-data__arrow" aria-label="pasa a" />{' '}
                    <strong>{displayValue(entry.newValue)}</strong>
                  </td>
                  <td className="player-data__by">
                    <Avatar name={entry.editor?.name ?? '?'} size={26} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
