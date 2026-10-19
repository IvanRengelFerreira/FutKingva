import Crest from '../Crest/Crest.jsx';
import { getTeam } from '../../data/mockData.js';
import './MatchCard.css';

// Tarjeta de un partido en juego: competición, minuto, escudos, marcador y barra de lo que va de partido.
// Diseño: Figma › Mockups › 01 · Inicio › Partidos en juego (VIL-ELC, BRE-LIV…)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-80
// Uso: se le pasa un partido tal cual viene en LIVE_MATCHES (mockData.js)
//   {LIVE_MATCHES.map((match) => <MatchCard key={match.id} match={match} />)}
// La página decide cómo colocarlas: 4 en fila en escritorio, carrusel con scroll lateral en móvil.

// En móvil el mockup acorta el nombre de algunas competiciones
const SHORT_COMPETITIONS = { 'Premier League': 'Premier' };

const MATCH_MINUTES = 90;

export default function MatchCard({ match, className = '' }) {
  const home = getTeam(match.homeId);
  const away = getTeam(match.awayId);
  const [homeGoals, awayGoals] = match.score;
  const progress = Math.min(100, (match.minute / MATCH_MINUTES) * 100);
  const shortCompetition = SHORT_COMPETITIONS[match.competition];

  return (
    <article
      className={`match-card ${className}`.trim()}
      aria-label={`${home.name} ${homeGoals}, ${away.name} ${awayGoals}. ${match.competition}, minuto ${match.minute}`}
    >
      <div className="match-card__top">
        <span className="match-card__competition">
          {shortCompetition ? (
            <>
              <span className="match-card__long">{match.competition}</span>
              <span className="match-card__short">{shortCompetition}</span>
            </>
          ) : (
            match.competition
          )}
        </span>
        <span className="match-card__minute">
          <span className="match-card__dot" aria-hidden="true" />
          {match.minute}'
        </span>
      </div>

      <div className="match-card__score-row" aria-hidden="true">
        <span className="match-card__team">
          <Crest teamId={match.homeId} size={40} className="match-card__crest" />
          <span className="match-card__team-name">{home.shortName}</span>
        </span>
        <span className="match-card__score">{homeGoals} – {awayGoals}</span>
        <span className="match-card__team">
          <Crest teamId={match.awayId} size={40} className="match-card__crest" />
          <span className="match-card__team-name">{away.shortName}</span>
        </span>
      </div>

      <div className="match-card__progress" style={{ '--progress': `${progress}%` }} aria-hidden="true">
        <span className="match-card__progress-fill" />
      </div>
    </article>
  );
}
