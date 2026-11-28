import { useState } from 'react';
import MatchCard from '../../components/MatchCard/MatchCard.jsx';
import StandingsTable from '../../components/StandingsTable/StandingsTable.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useApi } from '../../services/useApi.js';
import { getHome } from '../../services/home.js';
import { todayLabel } from '../../services/format.js';
import SectionHeader from './SectionHeader.jsx';
import MatchList from './MatchList.jsx';
import Featured from './Featured.jsx';
import { toResultRow, toUpcomingRow } from './matchRows.js';
import { COMPETITION_FILTERS, matchesFilter } from './filters.js';
import { useLiveHome } from './useLiveHome.js';
import './Home.css';

const RESULTS_SHOWN = 6; // Escritorio; en móvil se ven 4
const RESULTS_SHOWN_MOBILE = 4;
const UPCOMING_SHOWN = 5;
const STANDINGS_SHOWN = 5;

// 01 · Inicio: resumen del día desde GET /api/home. Partidos en juego, últimos resultados,
// clasificación rápida, próximos partidos y destacados (análisis, jugador de la jornada y favoritos).
// Chips de competición del mockup arriba; las competiciones sin datos en la BD salen vacías.
// Los marcadores y la clasificación se actualizan en directo (Socket.IO, useLiveHome).
// Diseño: Figma › Mockups › 01 · Inicio
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=40-20
export default function Home() {
  const { data, error, loading, reload } = useApi((signal) => getHome({ signal }), []);
  const liveData = useLiveHome(data);

  if (loading) return <LoadingState label="Cargando inicio…" />;
  if (error) return <ErrorState error={error} title="No se ha podido cargar el inicio" onRetry={reload} />;
  return <HomeContent data={liveData ?? data} />;
}

function HomeContent({ data }) {
  const [filterId, setFilterId] = useState('all');
  const filters = COMPETITION_FILTERS;
  const activeFilter = filters.find((item) => item.id === filterId) ?? null;
  const filtered = Boolean(activeFilter?.competition);

  const visible = (matches) => matches.filter((match) => matchesFilter(match, activeFilter));

  const live = visible(data.liveMatches);
  const results = visible(data.latestResults).slice(0, RESULTS_SHOWN).map(toResultRow);
  const upcoming = visible(data.upcomingMatches).slice(0, UPCOMING_SHOWN).map(toUpcomingRow);

  return (
    <section className="page home">
      <HomeHeader round={data.round} filters={filters} filterId={filterId} onSelectFilter={setFilterId} />

      <LiveMatchesSection matches={live} filtered={filtered} />

      <div className="home__columns">
        <div className="home__main">
          <section aria-labelledby="home-results-title">
            <SectionHeader
              id="home-results-title"
              title="Últimos resultados"
              to="/clasificaciones"
              linkLabel="Ver clasificación →"
            />
            <MatchList
              items={results}
              label="Últimos resultados"
              emptyText={filtered ? 'No hay resultados recientes en esta competición.' : 'No hay resultados recientes.'}
              maxMobile={RESULTS_SHOWN_MOBILE}
            />
          </section>

          <StandingsSection standings={data.standings} />

          <section aria-labelledby="home-upcoming-title">
            <SectionHeader
              id="home-upcoming-title"
              title="Próximos partidos"
              to="/clasificaciones"
              linkLabel="Ver clasificación →"
            />
            <MatchList
              items={upcoming}
              label="Próximos partidos"
              emptyText={
                filtered ? 'No hay próximos partidos en esta competición.' : 'No hay próximos partidos programados.'
              }
            />
          </section>
        </div>

        <Featured article={data.featuredArticle} topScorer={data.topScorerOfRound} />
      </div>
    </section>
  );
}

function HomeHeader({ round, filters, filterId, onSelectFilter }) {
  const today = todayLabel();
  const roundSuffix = round ? ` · Jornada ${round}` : '';

  return (
    <header className="page-header">
      <div className="page-header__text">
        <p className="page-header__eyebrow">
          <span className="home__desktop">
            {today.full}
            {roundSuffix}
          </span>
          <span className="home__mobile">
            {today.short}
            {roundSuffix}
          </span>
        </p>
        <h1 className="page-header__title">Hoy en el fútbol</h1>
      </div>
      {filters.length > 0 && (
        <div className="page-header__actions home__chips" role="group" aria-label="Filtrar por competición">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`home-chip${item.id === filterId ? ' home-chip--active' : ''}`}
              aria-pressed={item.id === filterId}
              onClick={() => onSelectFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function LiveMatchesSection({ matches, filtered }) {
  return (
    <section className="home__live" aria-labelledby="home-live-title">
      <SectionHeader
        id="home-live-title"
        title="Partidos en juego"
        badge={
          matches.length > 0 && (
            <span className="home__live-count">
              <span className="home__live-dot" aria-hidden="true" />
              {matches.length} en directo
            </span>
          )
        }
        to="/clasificaciones"
        linkLabel="Ver clasificación →"
      />
      {matches.length > 0 ? (
        <div className="home__live-list">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <p className="home__empty">
          {filtered ? 'No hay partidos en juego en esta competición.' : 'No hay partidos en juego en este momento.'}
        </p>
      )}
    </section>
  );
}

function StandingsSection({ standings }) {
  return (
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
      {standings.length > 0 ? (
        <StandingsTable
          standings={standings}
          variant="compact"
          limit={STANDINGS_SHOWN}
          caption="Clasificación rápida de LaLiga: los cinco primeros"
        />
      ) : (
        <p className="home__empty">Todavía no hay clasificación disponible.</p>
      )}
    </section>
  );
}
