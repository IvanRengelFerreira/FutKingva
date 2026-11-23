import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import FormGuide from '../../components/FormGuide/FormGuide.jsx';
import { matchDateParts } from './teamData.js';

// Partidos del equipo en su ficha (los de la API: cada partido trae sus equipos, el rival y, si se ha jugado, el marcador).
//   UpcomingMatches → tarjetas de «Próximos partidos»: fecha en un cuadradito, «Local – Visitante»,
//                     «Dom · 21:00 · LaLiga · J9» y el escudo del rival
//   RecentResults   → tabla de «Últimos resultados»: rival (C casa / F fuera), V/E/D + marcador y fecha
// Diseño: Figma › Mockups › 03 · Ficha de equipo › Próximos partidos y Últimos resultados
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-251
export function UpcomingMatches({ matches }) {
  if (matches.length === 0) {
    return <p className="team-profile__empty">No hay partidos programados.</p>;
  }

  return (
    <ul className="team-upcoming">
      {matches.map((match) => {
        const date = matchDateParts(match.date);
        return (
          <li key={match.id} className="team-upcoming__item">
            <span className="team-upcoming__date">
              <span className="team-upcoming__day">{date.day}</span>
              <span className="team-upcoming__month">{date.month}</span>
            </span>
            <span className="team-upcoming__text">
              <span className="team-upcoming__teams">
                {match.homeTeam.name} – {match.awayTeam.name}
              </span>
              <span className="team-upcoming__meta">
                {[date.weekday, date.time, 'LaLiga', match.round && `J${match.round}`].filter(Boolean).join(' · ')}
              </span>
            </span>
            <Link
              className="team-upcoming__opponent"
              to={`/equipos/${match.opponent.id}`}
              aria-label={`Ficha de ${match.opponent.name}`}
            >
              <Crest team={match.opponent} size={36} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function RecentResults({ results }) {
  if (results.length === 0) {
    return <p className="team-profile__empty">Todavía no ha jugado ningún partido esta temporada.</p>;
  }

  return (
    <div className="team-results">
      <table className="team-results__table">
        <caption className="team-profile__sr-only">Últimos resultados</caption>
        <thead>
          <tr>
            <th scope="col">Rival</th>
            <th scope="col" className="team-results__score">
              Resultado
            </th>
            <th scope="col" className="team-results__date">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((match) => {
            const { opponent } = match;
            return (
              <tr key={match.id}>
                <th scope="row">
                  <Link className="team-results__rival" to={`/equipos/${opponent.id}`}>
                    <Crest team={opponent} size={26} />
                    <span>
                      {opponent.shortName}{' '}
                      <abbr title={match.venue === 'C' ? 'En casa' : 'Fuera'}>({match.venue})</abbr>
                    </span>
                  </Link>
                </th>
                <td className="team-results__score">
                  <span className="team-results__score-cell">
                    <FormGuide form={match.result} size={20} />
                    <span className="team-results__goals">
                      {match.score[0]} – {match.score[1]}
                    </span>
                  </span>
                </td>
                <td className="team-results__date">{matchDateParts(match.date).dayMonth}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
