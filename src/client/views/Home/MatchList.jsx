import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';

// Lista de partidos de Inicio, para «Últimos resultados» y «Próximos partidos».
// Escritorio: tabla con FECHA · LOCAL · marcador (u hora) · VISITANTE · COMPETICIÓN.
// Móvil: cada partido es una tarjeta con «LALIGA · 17/10» arriba y los dos equipos con el marcador en medio.
// Diseño: Figma › Mockups › 01 · Inicio › Tabla resultados (escritorio) y Resultado (móvil)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-156
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=41-155
// items: [{ key, date, homeTeam, awayTeam, center, competition, winner }]  (winner: 'home' | 'away' | undefined)
// Un marcador u hora que falte se pinta «—».
export default function MatchList({ items, label, emptyText, maxMobile }) {
  const rows = items.filter((item) => item.homeTeam && item.awayTeam);

  if (rows.length === 0) {
    return <p className="home__empty">{emptyText}</p>;
  }

  return (
    <div className="match-list">
      <div className="match-list__head" aria-hidden="true">
        <span>Fecha</span>
        <span>Local</span>
        <span />
        <span>Visitante</span>
        <span>Competición</span>
      </div>
      <ul className="match-list__rows" aria-label={label}>
        {rows.map((item, index) => (
          <li
            key={item.key}
            className={`match-list__row${maxMobile && index >= maxMobile ? ' match-list__row--desktop-only' : ''}`}
          >
            <span className="match-list__date">
              <span className="match-list__competition-mobile">{item.competition ?? '—'} · </span>
              {item.date ?? '—'}
            </span>
            <TeamCell team={item.homeTeam} winner={item.winner === 'home'} />
            <span className="match-list__center">{item.center ?? '—'}</span>
            <TeamCell team={item.awayTeam} winner={item.winner === 'away'} away />
            <span className="match-list__competition">{item.competition ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamCell({ team, winner, away = false }) {
  return (
    <span
      className={`match-list__team${away ? ' match-list__team--away' : ''}${winner ? ' match-list__team--winner' : ''}`}
    >
      <Crest team={team} size={26} className="match-list__crest" />
      <Link to={`/equipos/${team.id}`} className="match-list__team-name">
        <span className="home__desktop">{team.name}</span>
        <span className="home__mobile">{team.shortName ?? team.name}</span>
      </Link>
    </span>
  );
}
