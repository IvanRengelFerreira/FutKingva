import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import FormGuide from '../../components/FormGuide/FormGuide.jsx';
import Rating from '../../components/Rating/Rating.jsx';
import { getTeam } from '../../data/mockData.js';
import { MISSING, formatNumber, formatScore } from './format.js';

// Últimos partidos del jugador: tabla en escritorio (5) y lista en móvil (4, como el mockup).
// «(C)» = jugó en casa, «(F)» = fuera (viene de PLAYER_PROFILE_EXTRAS; si no está, no se pone).
function opponentName(match, venues) {
  const team = getTeam(match.opponentId);
  const name = team?.shortName ?? team?.name ?? MISSING;
  const venue = venues?.[match.round];
  return venue ? `${name} (${venue})` : name;
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

export default function LastMatches({ player, extras, isMobile }) {
  const matches = (player.lastMatches ?? []).slice(0, isMobile ? 4 : 5);

  return (
    <section className="player-matches" aria-labelledby="player-matches-title">
      <div className="player-section-head">
        <h2 id="player-matches-title" className="player-section-head__title">Últimos partidos</h2>
        <span className="player-section-head__line" aria-hidden="true" />
        <Link className="player-section-head__link" to={`/equipos/${player.teamId}`}>
          {isMobile ? 'Ver' : 'Ver todos'} <span aria-hidden="true">→</span>
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="player-card">
          <p className="player-card__empty">Todavía no hay partidos registrados de este jugador.</p>
        </div>
      ) : isMobile ? (
        <ul className="player-card player-matches__list">
          {matches.map((match) => (
            <li key={match.round} className="player-match-item">
              <Crest teamId={match.opponentId} size={36} />
              <div className="player-match-item__info">
                <p className="player-match-item__name">{opponentName(match, extras.venues)}</p>
                <p className="player-match-item__stats">
                  {formatNumber(match.goals)} G · {formatNumber(match.assists)} A · {match.minutes != null ? `${match.minutes}'` : MISSING}
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
                <th scope="col" className="player-matches__num">G</th>
                <th scope="col" className="player-matches__num">A</th>
                <th scope="col" className="player-matches__min">Min</th>
                <th scope="col" className="player-matches__rating">Val.</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.round}>
                  <td>
                    <span className="player-match__rival">
                      <Crest teamId={match.opponentId} size={26} />
                      {opponentName(match, extras.venues)}
                    </span>
                  </td>
                  <td><Result match={match} /></td>
                  <td className={`player-matches__num player-matches__goals${match.goals ? ' player-matches__goals--on' : ''}`}>{formatNumber(match.goals)}</td>
                  <td className={`player-matches__num player-matches__assists${match.assists ? ' player-matches__assists--on' : ''}`}>{formatNumber(match.assists)}</td>
                  <td className="player-matches__min">{match.minutes != null ? `${match.minutes}'` : MISSING}</td>
                  <td className="player-matches__rating"><Value rating={match.rating} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
