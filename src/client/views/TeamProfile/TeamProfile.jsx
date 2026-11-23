import { useState } from 'react';
import { Link, useParams } from 'react-router';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import StatCard from '../../components/StatCard/StatCard.jsx';
import StandingsTable from '../../components/StandingsTable/StandingsTable.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useApi } from '../../services/useApi.js';
import { getTeam } from '../../services/teams.js';
import TeamHero from './TeamHero.jsx';
import { TeamSquadTable, TeamSquadList } from './TeamSquad.jsx';
import { UpcomingMatches, RecentResults } from './TeamMatches.jsx';
import { getTopScorers } from './teamData.js';
import './TeamProfile.css';

// 03 · Ficha de equipo: cabecera del equipo, indicadores, plantilla, próximos partidos y últimos resultados.
// El equipo sale de la dirección (/equipos/16) y sus datos, de la API (GET /api/teams/16), de la temporada actual.
// Pestañas: Resumen (lo del mockup) · Plantilla (toda) · Partidos · Estadísticas (indicadores y clasificación).
// En móvil, el Resumen enseña la plantilla como lista corta (los 4 máximos goleadores) y no los últimos resultados.
// Diseño: Figma › Mockups › 03 · Ficha de equipo
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154

const MOBILE_SQUAD_COUNT = 4; // Lista corta del Resumen en móvil

const TABS = [
  { id: 'summary', label: 'Resumen' },
  { id: 'squad', label: 'Plantilla' },
  { id: 'matches', label: 'Partidos' },
  { id: 'stats', label: 'Estadísticas' },
];

// key={teamId}: al pasar de un equipo a otro, la página empieza de cero (pestaña Resumen, sin «Siguiendo»)
export default function TeamProfile() {
  const { teamId } = useParams();
  return <TeamPage key={teamId} teamId={teamId} />;
}

function TeamPage({ teamId }) {
  const { data, error, loading, reload } = useApi((signal) => getTeam(teamId, { signal }), [teamId]);

  if (loading) return <LoadingState label="Cargando equipo…" />;
  // 400 (dirección sin número) o 404 (no existe): la página de «no encontrado», no el aviso de error
  if ([400, 404].includes(error?.status)) return <TeamNotFound />;
  if (error) return <ErrorState error={error} title="No se ha podido cargar el equipo" onRetry={reload} />;
  return <TeamContent data={data} />;
}

function TeamContent({ data }) {
  const [tab, setTab] = useState('summary');
  const { team, standing: row, table, squad, upcoming, results } = data;

  return (
    <section className="page team-profile">
      <Breadcrumbs
        items={[
          { label: 'Equipos y jugadores', shortLabel: 'Equipos', to: '/equipos' },
          {
            label: team.competition,
            to: team.competition === 'LaLiga' ? '/clasificaciones' : undefined,
            hideOnMobile: true,
          },
          { label: team.name },
        ]}
      />

      <TeamHero team={team} row={row} />

      <Tabs label={`Secciones de ${team.name}`} tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'summary' && (
        <>
          {row && <TeamStats row={row} />}
          <div className="team-profile__columns">
            <TeamSection
              id="team-squad-title"
              title="Plantilla"
              action={squad.length > 0 && <SeeSquadButton count={squad.length} onClick={() => setTab('squad')} />}
            >
              {squad.length > 0 ? (
                <>
                  <TeamSquadTable players={squad} className="team-profile__desktop-block" />
                  <TeamSquadList
                    players={getTopScorers(squad, MOBILE_SQUAD_COUNT)}
                    className="team-profile__mobile-block"
                  />
                </>
              ) : (
                <EmptySquad />
              )}
            </TeamSection>

            <div className="team-profile__side">
              <TeamSection id="team-upcoming-title" title="Próximos partidos">
                <UpcomingMatches matches={upcoming} />
              </TeamSection>
              <TeamSection id="team-results-title" title="Últimos resultados" className="team-profile__desktop-block">
                <RecentResults results={results} />
              </TeamSection>
            </div>
          </div>
        </>
      )}

      {tab === 'squad' && (
        <TeamSection id="team-squad-full-title" title="Plantilla">
          {squad.length > 0 ? (
            <>
              <TeamSquadTable players={squad} className="team-profile__desktop-block" />
              <TeamSquadList players={squad} className="team-profile__mobile-block" />
            </>
          ) : (
            <EmptySquad />
          )}
        </TeamSection>
      )}

      {tab === 'matches' && (
        <div className="team-profile__columns team-profile__columns--even">
          <TeamSection id="team-upcoming-tab-title" title="Próximos partidos">
            <UpcomingMatches matches={upcoming} />
          </TeamSection>
          <TeamSection id="team-results-tab-title" title="Últimos resultados">
            <RecentResults results={results} />
          </TeamSection>
        </div>
      )}

      {tab === 'stats' &&
        (row ? (
          <>
            <TeamStats row={row} />
            <TeamSection
              id="team-table-title"
              title="Clasificación"
              action={
                <Link className="team-profile__more" to="/clasificaciones">
                  Ver completa <span aria-hidden="true">→</span>
                </Link>
              }
            >
              <StandingsTable standings={table} variant="compact" highlightTeamId={team.id} />
            </TeamSection>
          </>
        ) : (
          <p className="team-profile__empty">No tenemos estadísticas de este equipo.</p>
        ))}
    </section>
  );
}

// Indicadores: posición, puntos, partidos, V-E-D, goles a favor y en contra
function TeamStats({ row }) {
  return (
    <div className="team-profile__stats">
      <StatCard value={`${row.position}º`} label="Posición" tone="gold" />
      <StatCard value={row.points} label="Puntos" />
      <StatCard value={row.played} label="Partidos" />
      <StatCard value={`${row.won}-${row.drawn}-${row.lost}`} label="V - E - D" />
      <StatCard value={row.goalsFor} label="Goles a favor" tone="win" />
      <StatCard value={row.goalsAgainst} label="Goles en contra" tone="loss" />
    </div>
  );
}

// Bloque de la ficha: título (con un enlace o botón opcional a la derecha) y contenido
function TeamSection({ id, title, action, className = '', children }) {
  return (
    <section className={['team-profile__section', className].filter(Boolean).join(' ')} aria-labelledby={id}>
      <div className="team-profile__section-header">
        <h2 id={id} className="team-profile__section-title">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// Botón del Resumen que lleva a la pestaña Plantilla
function SeeSquadButton({ count, onClick }) {
  return (
    <button type="button" className="team-profile__more" onClick={onClick}>
      <span className="team-profile__desktop">{count > 1 ? `Ver los ${count}` : 'Ver plantilla'}</span>
      <span className="team-profile__mobile">{count > 1 ? 'Ver todos' : 'Ver'}</span>
      <span aria-hidden="true"> →</span>
    </button>
  );
}

function TeamNotFound() {
  return (
    <section className="placeholder">
      <h1>Equipo no encontrado</h1>
      <p>
        No tenemos ningún equipo con esa dirección. <Link to="/equipos">Ver todos los equipos</Link>
      </p>
    </section>
  );
}

function EmptySquad() {
  return <p className="team-profile__empty">Todavía no tenemos la plantilla de este equipo.</p>;
}
