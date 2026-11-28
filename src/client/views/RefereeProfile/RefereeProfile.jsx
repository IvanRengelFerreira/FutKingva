import { Link, useParams, useSearchParams } from 'react-router';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import StatCard from '../../components/StatCard/StatCard.jsx';
import Select from '../../components/Select/Select.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useApi } from '../../services/useApi.js';
import { getReferee } from '../../services/referees.js';
import { formatDecimal, seasonOptions } from '../Referees/format.js';
import RefereeHero from './RefereeHero.jsx';
import RefereeCardsChart from './RefereeCardsChart.jsx';
import RefereeMatches from './RefereeMatches.jsx';
import './RefereeProfile.css';

// 07 · Ficha de árbitro: cabecera con sus tarjetas por partido frente a la media de LaLiga, indicadores,
// gráfico de tarjetas por jornada (BarChart de Ivan: amarillas + rojas apiladas) y últimos partidos dirigidos.
// El árbitro sale de la dirección (/arbitros/6) y sus datos, de la API (GET /api/referees/6). La temporada va
// en ?season=2025; sin ella, la API elige la última en la que tiene estadísticas.
// El gráfico y la tabla enseñan sus últimos partidos de la temporada; si no hay datos, un aviso.
// Diseño: Figma › Mockups › 07 · Ficha de árbitro
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-743

const RECENT_MATCHES = 8; // Los que caben en el gráfico (también en móvil) sin amontonarse

export default function RefereeProfile() {
  const { refereeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const season = searchParams.get('season') ?? '';
  const { data, error, loading, reload } = useApi(
    (signal) => getReferee(refereeId, { season }, { signal }),
    [refereeId, season],
  );

  if (loading) return <LoadingState label="Cargando árbitro…" />;
  // 400 (dirección sin número) o 404 (no existe): la página de «no encontrado», no el aviso de error
  if ([400, 404].includes(error?.status)) return <RefereeNotFound />;
  if (error) return <ErrorState error={error} title="No se ha podido cargar el árbitro" onRetry={reload} />;

  const changeSeason = (year) => setSearchParams({ season: year }, { replace: true });
  return <RefereeContent data={data} onSeasonChange={changeSeason} />;
}

function RefereeContent({ data, onSeasonChange }) {
  const { referee, season, seasons, stats, leagueCardsPerMatch, matches } = data;
  const recent = matches.slice(0, RECENT_MATCHES);
  const charted = recent.filter((match) => match.yellowCards != null);

  return (
    <section className="page referee-profile">
      <Breadcrumbs
        items={[
          { label: 'Árbitros', to: '/arbitros' },
          { label: 'LaLiga', to: '/clasificaciones', hideOnMobile: true },
          { label: referee.name, shortLabel: referee.shortName },
        ]}
      />

      <RefereeHero
        referee={referee}
        season={season}
        cardsPerMatch={stats?.cardsPerMatch}
        leagueCardsPerMatch={leagueCardsPerMatch}
      />

      <RefereeStats stats={stats} seasonCount={seasons.length} />

      <div className="referee-profile__columns">
        <section className="referee-profile__section" aria-labelledby="referee-chart-title">
          <div className="referee-profile__section-header">
            <h2 id="referee-chart-title" className="referee-profile__section-title">
              Tarjetas por jornada
            </h2>
            <Select
              className="referee-profile__season referee-profile__desktop-flex"
              size="sm"
              label="Temporada"
              hideLabel
              options={seasonOptions(seasons, season, (label) => `Temporada ${label}`)}
              value={season.year}
              onChange={(event) => onSeasonChange(event.target.value)}
            />
          </div>
          {charted.length > 0 ? (
            <RefereeCardsChart name={referee.name} matches={charted} leagueCardsPerMatch={leagueCardsPerMatch} />
          ) : (
            <p className="referee-profile__empty">No tenemos sus tarjetas partido a partido de {season.label}.</p>
          )}
        </section>

        <section className="referee-profile__section" aria-labelledby="referee-matches-title">
          <div className="referee-profile__section-header">
            <h2 id="referee-matches-title" className="referee-profile__section-title">
              <span className="referee-profile__desktop">Últimos partidos dirigidos</span>
              <span className="referee-profile__mobile">Últimos partidos</span>
            </h2>
          </div>
          {recent.length > 0 ? (
            <RefereeMatches name={referee.name} matches={recent} />
          ) : (
            <p className="referee-profile__empty">No tenemos partidos suyos de {season.label}.</p>
          )}
        </section>
      </div>
    </section>
  );
}

// Indicadores de la temporada; sin estadísticas, un guion en cada uno
function RefereeStats({ stats, seasonCount }) {
  return (
    <div className="referee-profile__stats">
      <StatCard value={stats?.matches ?? '—'} label={<Label long="Partidos dirigidos" short="Partidos" />} />
      <StatCard
        value={stats?.yellowCards ?? '—'}
        label={<Label long="Tarjetas amarillas" short="Amarillas" />}
        tone="yellow"
      />
      <StatCard value={stats?.redCards ?? '—'} label={<Label long="Tarjetas rojas" short="Rojas" />} tone="loss" />
      <StatCard value={stats?.penalties ?? '—'} label={<Label long="Penaltis señalados" short="Penaltis" />} />
      <StatCard
        value={formatDecimal(stats?.cardsPerMatch)}
        label={<Label long="Tarjetas / partido" short="Tarj. / partido" />}
        tone="amber"
      />
      {seasonCount > 0 && <StatCard className="referee-profile__mobile-flex" value={seasonCount} label="Temporadas" />}
    </div>
  );
}

// Etiqueta de indicador larga en escritorio y corta en móvil («Partidos dirigidos» / «Partidos»)
function Label({ long, short }) {
  return (
    <>
      <span className="referee-profile__desktop">{long}</span>
      <span className="referee-profile__mobile">{short}</span>
    </>
  );
}

function RefereeNotFound() {
  return (
    <section className="placeholder">
      <h1>Árbitro no encontrado</h1>
      <p>
        No tenemos ningún árbitro con esa dirección. <Link to="/arbitros">Ver todos los árbitros</Link>
      </p>
    </section>
  );
}
