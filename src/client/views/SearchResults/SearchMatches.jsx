import { useState } from 'react';
import { Link } from 'react-router';
import Tabs from '../../components/Tabs/Tabs.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useApi } from '../../services/useApi.js';
import { listTeams } from '../../services/teams.js';
import { useTeamsResults } from '../Teams/useTeamsResults.js';
import TeamResults from './TeamResults.jsx';
import PlayerResults from './PlayerResults.jsx';

const ALL_TEAMS = 100; // Máximo de la API: caben todos los equipos de LaLiga, así que no se paginan

// Resultados de una búsqueda: pide a la vez los equipos y los jugadores (por tramos, como en 02 · Equipos
// y jugadores). Se monta de cero con cada búsqueda (key), que cancela las peticiones de la anterior.
export default function SearchMatches({ query }) {
  const [tab, setTab] = useState('all');
  const teams = useApi((signal) => listTeams({ q: query, limit: ALL_TEAMS }, { signal }), [query]);
  const players = useTeamsResults({ tab: 'players', search: query, sort: 'rating' });
  const playersTotal = useLastTotal(players.data);

  if (teams.loading || (players.loading && playersTotal === null)) return <LoadingState label="Buscando…" />;

  const error = teams.error ?? (playersTotal === null ? players.error : null);
  if (error) {
    const retry = () => {
      if (teams.error) teams.reload();
      if (players.error) players.reload();
    };
    return <ErrorState error={error} title="No se ha podido hacer la búsqueda" onRetry={retry} />;
  }

  const teamsTotal = teams.data.total;
  const total = teamsTotal + playersTotal;
  const tabs = [
    { id: 'all', label: `Todos (${total})` },
    { id: 'teams', label: `Equipos (${teamsTotal})` },
    { id: 'players', label: `Jugadores (${playersTotal})` },
  ];
  const showTeams = tab !== 'players' && teamsTotal > 0;
  const showPlayers = tab !== 'teams' && playersTotal > 0;

  return (
    <>
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow search-results__desktop">Búsqueda</p>
          <h1 className="page-header__title search-results__title">
            <span className="search-results__desktop">
              Resultados para «{query}» · {total} {total === 1 ? 'coincidencia' : 'coincidencias'}
            </span>
            <span className="search-results__mobile">
              «{query}» · {total} {total === 1 ? 'resultado' : 'resultados'}
            </span>
          </h1>
        </div>
      </header>

      {total === 0 ? (
        <NoMatches query={query} />
      ) : (
        <>
          <Tabs label="Filtrar resultados" tabs={tabs} active={tab} onChange={setTab} />

          {showTeams && <TeamResults teams={teams.data.items} query={query} />}
          {showPlayers && <PlayerResults results={players} query={query} />}
        </>
      )}
    </>
  );
}

// Total de la última respuesta: si falla otro tramo, los contadores no se pierden
function useLastTotal(data) {
  const [total, setTotal] = useState(null);
  if (data && data.total !== total) setTotal(data.total);
  return data?.total ?? total;
}

function NoMatches({ query }) {
  return (
    <div className="search-results__empty">
      <p>No hay equipos ni jugadores que coincidan con «{query}».</p>
      <p>
        Prueba con otro nombre o busca en <Link to="/arbitros">árbitros</Link> y <Link to="/analisis">análisis</Link>.
      </p>
    </div>
  );
}
