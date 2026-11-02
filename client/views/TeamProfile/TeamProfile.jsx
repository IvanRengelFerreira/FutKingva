import { useState } from 'react';
import { Link, useParams } from 'react-router';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import StatCard from '../../components/StatCard/StatCard.jsx';
import StandingsTable from '../../components/StandingsTable/StandingsTable.jsx';
import { getTeam, TEAM_PROFILE_EXTRAS } from '../../data/mockData.js';
import TeamHero from './TeamHero.jsx';
import { TeamSquadTable, TeamSquadList } from './TeamSquad.jsx';
import { UpcomingMatches, RecentResults } from './TeamMatches.jsx';
import { getStandingsRow, getSquad, getTopScorers, getUpcomingMatches, getRecentResults } from './teamData.js';
import './TeamProfile.css';

// 03 · Ficha de equipo: cabecera del equipo, indicadores, plantilla, próximos partidos y últimos resultados.
// El equipo sale de la dirección: /equipos/real-madrid → TEAMS['real-madrid'] (sirve para cualquier equipo).
// Pestañas: Resumen (lo del mockup) · Plantilla (toda) · Partidos · Estadísticas (indicadores y clasificación).
// En móvil, el Resumen enseña la plantilla como lista corta (los 4 máximos goleadores) y no los últimos resultados.
// Diseño: Figma › Mockups › 03 · Ficha de equipo
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=44-154

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
  const [tab, setTab] = useState('summary');
  const team = getTeam(teamId);

  if (!team) {
    return (
      <section className="placeholder">
        <h1>Equipo no encontrado</h1>
        <p>
          No tenemos ningún equipo con esa dirección. <Link to="/equipos">Ver todos los equipos</Link>
        </p>
      </section>
    );
  }

  const row = getStandingsRow(team.id);
  const squad = getSquad(team.id);
  const upcoming = getUpcomingMatches(team.id);
  const results = getRecentResults(team.id);

  return (
    <section className="page team-profile">
      <Breadcrumbs
        items={[
          { label: 'Equipos y jugadores', shortLabel: 'Equipos', to: '/equipos' },
          { label: team.competition, to: team.competition === 'LaLiga' ? '/clasificaciones' : undefined, hideOnMobile: true },
          { label: team.name },
        ]}
      />

      <TeamHero team={team} extras={TEAM_PROFILE_EXTRAS[team.id]} row={row} />

      <Tabs label={`Secciones de ${team.name}`} tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'summary' && (
        <>
          {row && <TeamStats row={row} />}
          <div className="team-profile__columns">
            <section className="team-profile__section" aria-labelledby="team-squad-title">
              <SectionHeader id="team-squad-title" title="Plantilla">
                <button type="button" className="team-profile__more" onClick={() => setTab('squad')}>
                  <span className="team-profile__desktop">Ver los {squad.length}</span>
                  <span className="team-profile__mobile">Ver todos</span>
                  <span aria-hidden="true"> →</span>
                </button>
              </SectionHeader>
              {squad.length > 0 ? (
                <>
                  <TeamSquadTable players={squad} className="team-profile__desktop-block" />
                  <TeamSquadList players={getTopScorers(team.id, 4)} className="team-profile__mobile-block" />
                </>
              ) : (
                <p className="team-profile__empty">Todavía no tenemos la plantilla de este equipo.</p>
              )}
            </section>

            <div className="team-profile__side">
              <section className="team-profile__section" aria-labelledby="team-upcoming-title">
                <SectionHeader id="team-upcoming-title" title="Próximos partidos" />
                <UpcomingMatches matches={upcoming} />
              </section>
              <section className="team-profile__section team-profile__desktop-block" aria-labelledby="team-results-title">
                <SectionHeader id="team-results-title" title="Últimos resultados" />
                <RecentResults results={results} />
              </section>
            </div>
          </div>
        </>
      )}

      {tab === 'squad' && (
        <section className="team-profile__section" aria-labelledby="team-squad-full-title">
          <SectionHeader id="team-squad-full-title" title="Plantilla" />
          {squad.length > 0 ? (
            <>
              <TeamSquadTable players={squad} className="team-profile__desktop-block" />
              <TeamSquadList players={squad} className="team-profile__mobile-block" />
            </>
          ) : (
            <p className="team-profile__empty">Todavía no tenemos la plantilla de este equipo.</p>
          )}
        </section>
      )}

      {tab === 'matches' && (
        <div className="team-profile__columns team-profile__columns--even">
          <section className="team-profile__section" aria-labelledby="team-upcoming-tab-title">
            <SectionHeader id="team-upcoming-tab-title" title="Próximos partidos" />
            <UpcomingMatches matches={upcoming} />
          </section>
          <section className="team-profile__section" aria-labelledby="team-results-tab-title">
            <SectionHeader id="team-results-tab-title" title="Últimos resultados" />
            <RecentResults results={results} />
          </section>
        </div>
      )}

      {tab === 'stats' && (
        row ? (
          <>
            <TeamStats row={row} />
            <section className="team-profile__section" aria-labelledby="team-table-title">
              <SectionHeader id="team-table-title" title="Clasificación">
                <Link className="team-profile__more" to="/clasificaciones">
                  Ver completa <span aria-hidden="true">→</span>
                </Link>
              </SectionHeader>
              <StandingsTable variant="compact" highlightTeamId={team.id} />
            </section>
          </>
        ) : (
          <p className="team-profile__empty">No tenemos estadísticas de este equipo.</p>
        )
      )}
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

// Título de cada bloque, con un enlace o botón opcional a la derecha
function SectionHeader({ id, title, children }) {
  return (
    <div className="team-profile__section-header">
      <h2 id={id} className="team-profile__section-title">{title}</h2>
      {children}
    </div>
  );
}
