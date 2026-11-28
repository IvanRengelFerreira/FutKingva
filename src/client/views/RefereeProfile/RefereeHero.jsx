import Avatar from '../../components/Avatar/Avatar.jsx';
import { formatDecimal } from '../Referees/format.js';
import { buildMeta, describeLeagueComparison } from './refereeData.js';

// Cabecera de la ficha: nombre, datos y sus tarjetas por partido frente a la media de LaLiga
export default function RefereeHero({ referee, season, cardsPerMatch, leagueCardsPerMatch }) {
  const comparison = describeLeagueComparison(cardsPerMatch, leagueCardsPerMatch);
  const meta = buildMeta(referee);

  return (
    <header className="referee-hero">
      <Avatar
        name={referee.name}
        src={referee.photoUrl}
        size={132}
        className="referee-hero__avatar referee-profile__desktop-flex"
      />
      <Avatar
        name={referee.name}
        src={referee.photoUrl}
        size={96}
        className="referee-hero__avatar referee-profile__mobile-flex"
      />
      <div className="referee-hero__text">
        <p className="referee-hero__eyebrow">
          Árbitro{referee.fifa ? ' FIFA' : ''} · LaLiga {season.label}
        </p>
        <h1 className="referee-hero__name">
          <span className="referee-profile__desktop">{referee.name}</span>
          <span className="referee-profile__mobile">{referee.shortName}</span>
        </h1>
        <p className="referee-hero__meta">
          {meta.join('  ·  ')}
          {referee.firstSeason && (
            <span className="referee-profile__desktop">{`  ·  Primera División desde ${referee.firstSeason}`}</span>
          )}
        </p>
      </div>
      <div className="referee-hero__highlight">
        <span className="referee-hero__value">{formatDecimal(cardsPerMatch)}</span>
        <span className="referee-hero__label">Tarjetas / partido</span>
        {comparison && <span className="referee-hero__comparison">{comparison}</span>}
      </div>
    </header>
  );
}
