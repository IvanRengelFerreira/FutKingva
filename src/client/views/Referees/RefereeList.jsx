import { Link } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import CardCount from './CardCount.jsx';
import { formatDecimal } from './format.js';
import chevronIcon from '../../assets/icon-chevron-right-lg.svg';

// Lista de tarjetas de árbitros (móvil)
export default function RefereeList({ referees, season }) {
  return (
    <ul className="referees__list referees__mobile-flex">
      {referees.map((referee) => (
        <li key={referee.id}>
          <Link className="referees__item" to={`/arbitros/${referee.id}?season=${season?.year ?? ''}`}>
            <Avatar name={referee.name} size={44} />
            <span className="referees__item-text">
              <span className="referees__item-name">{referee.name}</span>
              <span className="referees__item-meta">
                <span>{referee.matches} PJ</span>
                <CardCount
                  color="yellow"
                  value={`${formatDecimal(referee.cardsPerMatch)}/p`}
                  label={`${formatDecimal(referee.cardsPerMatch)} tarjetas por partido`}
                />
                <CardCount color="red" value={referee.redCards} />
              </span>
            </span>
            <img src={chevronIcon} alt="" width="18" height="18" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
