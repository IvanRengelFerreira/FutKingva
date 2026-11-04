import { STATS, statValue, formatStat, bestIndexes, compactName } from './stats.js';

// Tabla «Estadísticas lado a lado»: una columna por jugador con su color (serie 1–4).
// Cada cifra lleva una barra proporcional al mejor de la fila; el mejor valor va en color con corona.
// En móvil la cabecera usa las iniciales y no salen las barras, como en el mockup.
export default function StatsTable({ players, mode }) {
  return (
    <div className="comparator-table">
      <table>
        <caption className="comparator-table__caption">
          Estadísticas de {players.map(compactName).join(', ')}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="comparator-table__label">Estadística</th>
            {players.map((player, i) => (
              <th key={player.id} scope="col" className={`comparator-table__player comparator-series--${i + 1}`}>
                <span className="comparator-table__dot" aria-hidden="true" />
                <span className="comparator-table__name-long">{compactName(player)}</span>
                <span className="comparator-table__name-short" aria-hidden="true">{initials(player.name)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STATS.map((stat) => {
            const values = players.map((player) => statValue(player, stat, mode));
            const winners = bestIndexes(values, stat.best);
            const top = Math.max(...values.filter((value) => value != null), 0);

            return (
              <tr key={stat.id}>
                <th scope="row" className="comparator-table__label">{stat.label}</th>
                {values.map((value, i) => {
                  const isBest = winners.includes(i);
                  return (
                    <td
                      key={players[i].id}
                      className={`comparator-series--${i + 1} ${isBest ? 'comparator-table__cell--best' : ''}`.trim()}
                    >
                      <span className="comparator-table__cell">
                        <span className="comparator-table__value">{formatStat(value, stat, mode)}</span>
                        <span className="comparator-table__bar" aria-hidden="true">
                          <span style={{ width: `${top && value ? (value / top) * 100 : 0}%` }} />
                        </span>
                        {isBest && <span className="comparator-crown" role="img" aria-label="Mejor valor" />}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// «Jude Bellingham» → «JB» (sin tildes, como en el mockup)
function initials(name) {
  const words = name.normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ');
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}
