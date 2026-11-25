import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import FormGuide from '../../components/FormGuide/FormGuide.jsx';
import Rating from '../../components/Rating/Rating.jsx';
import { MISSING, formatNumber, formatScore } from './format.js';

const MOBILE_MATCHES_COUNT = 4;
const DESKTOP_MATCHES_COUNT = 5;

// Últimos partidos del jugador: tabla en escritorio (5) y lista en móvil (4, como el mockup).
// La valoración por partido es la del mockup; la BD aún no la tiene, así que sale «—» hasta tener una fuente.
function opponentName(match) {
  const name = match.opponent?.shortName ?? match.opponent?.name ?? MISSING;
  return match.venue ? `${name} (${match.venue})` : name;
}

function formatMinutes(minutes) {
  return minutes != null ? `${minutes}'` : MISSING;
}

function Result({ match }) {
  return (
    <span className="player-match__result">
      {match.result ? <FormGuide form={match.result} size={20} /> : null}
      <span className="player-match__score">{formatScore(match.score)}</span>
    </span>
  );
}

function Value({ rating, size }) {
  return rating != null ? <Rating value={rating} size={size} /> : <span className="player-match__none">{MISSING}</span>;
}

export default function LastMatches({ team, lastMatches, isMobile }) {
  const matches = lastMatches.slice(0, isMobile ? MOBILE_MATCHES_COUNT : DESKTOP_MATCHES_COUNT);

  return (
    <section className="player-matches" aria-labelledby="player-matches-title">
      <div className="player-section-head">
        <h2 id="player-matches-title" className="player-section-head__title">
          Últimos partidos
        </h2>
        <span className="player-section-head__line" aria-hidden="true" />
        {team && (
          <Link className="player-section-head__link" to={`/equipos/${team.id}`}>
            {isMobile ? 'Ver' : 'Ver todos'} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="player-card">
          <p className="player-card__empty">Todavía no hay partidos registrados de este jugador.</p>
        </div>
      ) : isMobile ? (
        <ul className="player-card player-matches__list">
          {matches.map((match) => (
            <li key={match.id} className="player-match-item">
              <Crest team={match.opponent} size={36} />
              <div className="player-match-item__info">
                <p className="player-match-item__name">{opponentName(match)}</p>
                <p className="player-match-item__stats">
                  {formatNumber(match.goals)} G · {formatNumber(match.assists)} A · {formatMinutes(match.minutes)}
                </p>
              </div>
              <Result match={match} />
              <Value rating={match.rating} size="md" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="player-card">
          <table className="player-matches__table">
            <thead>
              <tr>
                <th scope="col">Rival</th>
                <th scope="col">Res.</th>
                <th scope="col" className="player-matches__num">
                  G
                </th>
                <th scope="col" className="player-matches__num">
                  A
                </th>
                <th scope="col" className="player-matches__min">
                  Min
                </th>
                <th scope="col" className="player-matches__rating">
                  Val.
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id}>
                  <td>
                    <span className="player-match__rival">
                      <Crest team={match.opponent} size={26} />
                      {opponentName(match)}
                    </span>
                  </td>
                  <td>
                    <Result match={match} />
                  </td>
                  <td
                    className={`player-matches__num player-matches__goals${match.goals ? ' player-matches__goals--on' : ''}`}
                  >
                    {formatNumber(match.goals)}
                  </td>
                  <td
                    className={`player-matches__num player-matches__assists${match.assists ? ' player-matches__assists--on' : ''}`}
                  >
                    {formatNumber(match.assists)}
                  </td>
                  <td className="player-matches__min">{formatMinutes(match.minutes)}</td>
                  <td className="player-matches__rating">
                    <Value rating={match.rating} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
