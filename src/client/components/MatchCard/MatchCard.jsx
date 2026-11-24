import Crest from '../Crest/Crest.jsx';
import { getTeam } from '../../data/mockData.js';
import './MatchCard.css';

// Tarjeta de un partido en juego: competición, minuto, escudos, marcador y barra de lo que va de partido.
// Diseño: Figma › Mockups › 01 · Inicio › Partidos en juego (VIL-ELC, BRE-LIV…)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-80
// Uso: admite tanto un partido de la API (con homeTeam y awayTeam) como uno de mockData.js (con homeId y awayId)
//   {liveMatches.map((match) => <MatchCard key={match.id} match={match} />)}
// La página decide cómo colocarlas: 4 en fila en escritorio, carrusel con scroll lateral en móvil.

// En móvil el mockup acorta el nombre de algunas competiciones
const SHORT_COMPETITIONS = { 'Premier League': 'Premier' };

const MATCH_MINUTES = 90;
const HALFTIME_MINUTE = 45;
const PAUSED_LABEL = 'Descanso';
const LIVE_LABEL = 'En juego';

function minuteText(match) {
  if (match.status === 'PAUSED') {
    return { label: PAUSED_LABEL, aria: PAUSED_LABEL.toLowerCase(), minute: match.minute ?? HALFTIME_MINUTE };
  }
  if (match.minute != null) {
    return { label: `${match.minute}'`, aria: `minuto ${match.minute}`, minute: match.minute };
  }
  return { label: LIVE_LABEL, aria: LIVE_LABEL.toLowerCase(), minute: 0 };
}

export default function MatchCard({ match, className = '' }) {
  // Con datos de la API llegan homeTeam y awayTeam; si no, se buscan en mockData.js por id
  const home = match.homeTeam ?? getTeam(match.homeId) ?? { name: match.homeId, shortName: match.homeId };
  const away = match.awayTeam ?? getTeam(match.awayId) ?? { name: match.awayId, shortName: match.awayId };
  const [homeGoals, awayGoals] = match.score ?? [0, 0];
  const { label: minuteLabel, aria: minuteAria, minute } = minuteText(match);
  const progress = Math.min(100, (minute / MATCH_MINUTES) * 100);
  const shortCompetition = SHORT_COMPETITIONS[match.competition];

  return (
    <article
      className={`match-card ${className}`.trim()}
      aria-label={`${home.name} ${homeGoals}, ${away.name} ${awayGoals}. ${match.competition}, ${minuteAria}`}
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
          {minuteLabel}
        </span>
      </div>

      <div className="match-card__score-row" aria-hidden="true">
        <span className="match-card__team">
          <Crest team={match.homeTeam} teamId={match.homeId} size={40} className="match-card__crest" />
          <span className="match-card__team-name">{home.shortName}</span>
        </span>
        <span className="match-card__score">
          {homeGoals} – {awayGoals}
        </span>
        <span className="match-card__team">
          <Crest team={match.awayTeam} teamId={match.awayId} size={40} className="match-card__crest" />
          <span className="match-card__team-name">{away.shortName}</span>
        </span>
      </div>

      <div className="match-card__progress" style={{ '--progress': `${progress}%` }} aria-hidden="true">
        <span className="match-card__progress-fill" />
      </div>
    </article>
  );
}
