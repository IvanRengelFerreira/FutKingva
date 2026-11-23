import Avatar from '../../components/Avatar/Avatar.jsx';
import { getPlayer } from '../../data/mockData.js';

export default function ChangeHistoryTable({ entries }) {
  return (
    <div className="player-data__history">
      <h2 className="player-data__history-title">Historial de cambios</h2>
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
            {entries.map((entry) => {
              const player = getPlayer(entry.playerId);
              return (
                <tr key={entry.id}>
                  <td className="player-data__date">{entry.date}</td>
                  <td>
                    <span className="player-data__entry">
                      <Avatar name={player?.name} size={26} />
                      <span>
                        <span className="player-data__entry-name">{player?.name}</span>
                        <span className="player-data__entry-field">{entry.field}</span>
                      </span>
                    </span>
                  </td>
                  <td className="player-data__change">
                    {entry.from} <span className="player-data__arrow" aria-label="pasa a" /> <strong>{entry.to}</strong>
                  </td>
                  <td className="player-data__by">
                    <Avatar initials={entry.by} name={entry.by} size={26} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
