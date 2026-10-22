import { useState } from 'react';
import MatchCard from '../../components/MatchCard/MatchCard.jsx';
import StandingsTable from '../../components/StandingsTable/StandingsTable.jsx';
import SectionHeader from './SectionHeader.jsx';
import MatchList from './MatchList.jsx';
import Featured from './Featured.jsx';
import { COMPETITION_FILTERS, matchesFilter, shortDateLabel } from './filters.js';
import { TODAY, LIVE_MATCHES, LATEST_RESULTS, UPCOMING_MATCHES, getTeam } from '../../data/mockData.js';
import './Home.css';

const RESULTS_SHOWN = 6; // Escritorio; en móvil se ven 4
const RESULTS_SHOWN_MOBILE = 4;
const UPCOMING_SHOWN = 5;

// 01 · Inicio: resumen del día. Partidos en juego, últimos resultados, clasificación rápida,
// próximos partidos y destacados (análisis, jugador de la jornada y favoritos).
// Los chips de arriba filtran los partidos por competición; la clasificación es siempre la de LaLiga.
// Escritorio: dos columnas (resultados y clasificación | destacados). Móvil: todo en una columna
// y los partidos en juego en un carrusel con scroll lateral.
// Diseño: Figma › Mockups › 01 · Inicio
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20
export default function Home() {
  const [filterId, setFilterId] = useState('all');
  const filter = COMPETITION_FILTERS.find((item) => item.id === filterId);

  // Un partido con un equipo que no esté en los datos se descarta para no romper la página
  const known = (match) => getTeam(match.homeId) && getTeam(match.awayId);
  const live = LIVE_MATCHES.filter((match) => known(match) && matchesFilter(match, filter));

  const results = LATEST_RESULTS.filter((match) => known(match) && matchesFilter(match, filter))
    .slice(0, RESULTS_SHOWN)
    .map((match, index) => {
      const [homeGoals, awayGoals] = match.score ?? [];
      const hasScore = homeGoals != null && awayGoals != null;
      return {
        key: `${match.date}-${match.homeId}-${match.awayId}-${index}`,
        date: match.date,
        homeId: match.homeId,
        awayId: match.awayId,
        center: hasScore ? `${homeGoals} – ${awayGoals}` : '—',
        competition: match.competition,
        winner: hasScore && homeGoals !== awayGoals ? (homeGoals > awayGoals ? 'home' : 'away') : undefined,
      };
    });

  const upcoming = UPCOMING_MATCHES.filter((match) => known(match) && matchesFilter(match, filter))
    .slice(0, UPCOMING_SHOWN)
    .map((match, index) => ({
      key: `${match.date}-${match.homeId}-${match.awayId}-${index}`,
      date: match.date,
      homeId: match.homeId,
      awayId: match.awayId,
      center: match.time,
      competition: match.competition ?? 'LaLiga',
    }));

  return (
    <section className="page home">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            <span className="home__desktop">{TODAY.label} · Jornada {TODAY.round}</span>
            <span className="home__mobile">{shortDateLabel(TODAY.label)} · Jornada {TODAY.round}</span>
          </p>
          <h1 className="page-header__title">Hoy en el fútbol</h1>
        </div>
        <div className="page-header__actions home__chips" role="group" aria-label="Filtrar por competición">
          {COMPETITION_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`home-chip${item.id === filterId ? ' home-chip--active' : ''}`}
              aria-pressed={item.id === filterId}
              onClick={() => setFilterId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <section className="home__live" aria-labelledby="home-live-title">
        <SectionHeader
          id="home-live-title"
          title="Partidos en juego"
          badge={
            live.length > 0 && (
              <span className="home__live-count">
                <span className="home__live-dot" aria-hidden="true" />
                {live.length} en directo
              </span>
            )
          }
          to="/clasificaciones"
          linkLabel="Ver todos →"
        />
        {live.length > 0 ? (
          <div className="home__live-list">
            {live.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="home__empty">No hay partidos en juego en esta competición.</p>
        )}
      </section>

      <div className="home__columns">
        <div className="home__main">
          <section aria-labelledby="home-results-title">
            <SectionHeader id="home-results-title" title="Últimos resultados" to="/clasificaciones" linkLabel="Ver todos →" />
            <MatchList
              items={results}
              label="Últimos resultados"
              emptyText="No hay resultados recientes en esta competición."
              maxMobile={RESULTS_SHOWN_MOBILE}
            />
          </section>

          <section aria-labelledby="home-standings-title">
            <SectionHeader
              id="home-standings-title"
              title={
                <>
                  <span className="home__desktop">Clasificación rápida</span>
                  <span className="home__mobile">Clasificación</span>
                </>
              }
              to="/clasificaciones"
              linkLabel="Ver clasificación completa →"
              mobileLabel="Ver →"
            />
            <StandingsTable variant="compact" limit={5} caption="Clasificación rápida de LaLiga: los cinco primeros" />
          </section>

          <section aria-labelledby="home-upcoming-title">
            <SectionHeader id="home-upcoming-title" title="Próximos partidos" to="/clasificaciones" linkLabel="Ver todos →" />
            <MatchList
              items={upcoming}
              label="Próximos partidos"
              emptyText="No hay próximos partidos en esta competición."
            />
          </section>
        </div>

        <Featured />
      </div>
    </section>
  );
}
