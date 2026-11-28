import { Link } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { formatDecimal } from './format.js';

// Tarjetas por partido que llenan la barra entera
const MAX_CARDS_PER_MATCH = 7.5;

// Tabla de árbitros (escritorio) con una barra de tarjetas por partido
export default function RefereeTable({ referees, season }) {
  return (
    <div className="referees__table-wrapper referees__desktop-block">
      <table className="referees__table">
        <caption className="referees__sr-only">Árbitros de LaLiga {season?.label}</caption>
        <thead>
          <tr>
            <th scope="col">Árbitro</th>
            <th scope="col" className="referees__committee">
              Comité
            </th>
            <th scope="col" className="referees__num">
              Partidos
            </th>
            <th scope="col" className="referees__cards">
              Tarjetas / partido
            </th>
            <th scope="col" className="referees__num referees__num--sm">
              Rojas
            </th>
            <th scope="col" className="referees__num referees__num--sm">
              Penaltis
            </th>
            <th scope="col" className="referees__link">
              <span className="referees__sr-only">Ficha</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {referees.map((referee) => (
            <tr key={referee.id}>
              <th scope="row">
                <span className="referees__name">
                  <Avatar name={referee.name} src={referee.photoUrl} size={36} />
                  <span>{referee.name}</span>
                  {referee.fifa && <span className="referees__fifa">FIFA</span>}
                </span>
              </th>
              <td className="referees__committee">{referee.committee ?? '—'}</td>
              <td className="referees__num referees__big">{referee.matches ?? '—'}</td>
              <td className="referees__cards">
                <span className="referees__cards-cell">
                  <span className="referees__big">{formatDecimal(referee.cardsPerMatch)}</span>
                  <span className="referees__bar" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, (referee.cardsPerMatch / MAX_CARDS_PER_MATCH) * 100)}%` }} />
                  </span>
                </span>
              </td>
              <td
                className={`referees__num referees__num--sm referees__big${referee.redCards > 0 ? ' referees__big--red' : ' referees__big--muted'}`}
              >
                {referee.redCards ?? '—'}
              </td>
              <td className="referees__num referees__num--sm referees__big">{referee.penalties ?? '—'}</td>
              <td className="referees__link">
                <Link
                  to={`/arbitros/${referee.id}?season=${season?.year ?? ''}`}
                  aria-label={`Ver ficha de ${referee.name}`}
                >
                  Ver ficha →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
