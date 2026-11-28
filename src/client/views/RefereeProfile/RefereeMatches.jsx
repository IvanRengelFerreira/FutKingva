import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import CardCount from '../Referees/CardCount.jsx';
import { numericDate } from '../../services/format.js';

const DAY_MONTH_LENGTH = 5; // «11/10» de «11/10/2025»

// Tabla de los últimos partidos que ha dirigido, con las tarjetas de cada uno
export default function RefereeMatches({ name, matches }) {
  return (
    <div className="referee-matches">
      <table className="referee-matches__table">
        <caption className="referee-profile__sr-only">Últimos partidos dirigidos por {name}</caption>
        <thead>
          <tr>
            <th scope="col" className="referee-matches__date">
              <span className="referee-profile__desktop">Fecha</span>
              <span className="referee-profile__mobile">Día</span>
            </th>
            <th scope="col">Partido</th>
            <th scope="col" className="referee-matches__cards">
              <span className="referee-profile__desktop">Tarjetas</span>
              <span className="referee-profile__mobile">Tarj.</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({ match }) {
  const { homeTeam, awayTeam, score } = match;

  return (
    <tr>
      <td className="referee-matches__date">{numericDate(match.date).slice(0, DAY_MONTH_LENGTH)}</td>
      <th scope="row">
        <span className="referee-matches__match">
          <Crest team={homeTeam} size={24} className="referee-profile__desktop-flex" />
          <span>
            <TeamLink team={homeTeam} /> {score ? `${score[0]} – ${score[1]}` : '–'} <TeamLink team={awayTeam} />
          </span>
        </span>
      </th>
      <td className="referee-matches__cards">
        {match.yellowCards == null ? (
          <span aria-label="Sin datos de tarjetas">—</span>
        ) : (
          <span className="referee-matches__cards-cell">
            <CardCount color="yellow" value={match.yellowCards} />
            <CardCount color="red" value={match.redCards} />
          </span>
        )}
      </td>
    </tr>
  );
}

function TeamLink({ team }) {
  return (
    <Link className="referee-matches__team" to={`/equipos/${team.id}`}>
      {team.shortName}
    </Link>
  );
}
