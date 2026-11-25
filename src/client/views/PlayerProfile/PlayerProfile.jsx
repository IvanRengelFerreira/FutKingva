import { useState } from 'react';
import { useParams } from 'react-router';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import Button from '../../components/Button/Button.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useApi } from '../../services/useApi.js';
import { getPlayer } from '../../services/players.js';
import PlayerHero from './PlayerHero.jsx';
import PlayerStats from './PlayerStats.jsx';
import PerformanceChart from './PerformanceChart.jsx';
import LastMatches from './LastMatches.jsx';
import useIsMobile from './useIsMobile.js';
import './PlayerProfile.css';

// 04 · Ficha de jugador: cabecera con valoración, indicadores de la temporada, gráfico de
// minutos por partido y últimos partidos. Pública. El jugador sale del id de la dirección
// (/jugadores/2354) y sus datos, de la API (GET /api/players/2354).
// Diseño: Figma › Mockups › 04 · Ficha de jugador
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=45-221

// key={playerId}: al pasar de un jugador a otro, la página empieza de cero (temporada actual)
export default function PlayerProfile() {
  const { playerId } = useParams();
  return <PlayerPage key={playerId} playerId={playerId} />;
}

function PlayerPage({ playerId }) {
  // undefined = temporada actual (la elige el servidor)
  const [season, setSeason] = useState();
  const { data, error, loading, reload } = useApi(
    (signal) => getPlayer(playerId, { query: { season }, signal }),
    [playerId, season],
  );

  if (loading) return <LoadingState label="Cargando jugador…" />;
  // 400 (dirección sin número) o 404 (no existe): la página de «no encontrado», no el aviso de error
  if ([400, 404].includes(error?.status)) return <PlayerNotFound playerId={playerId} />;
  if (error) return <ErrorState error={error} title="No se ha podido cargar el jugador" onRetry={reload} />;
  return <PlayerContent data={data} onSeasonChange={setSeason} />;
}

function PlayerContent({ data, onSeasonChange }) {
  const isMobile = useIsMobile();
  const { player, team, season, seasons, stats, ranks, lastMatches } = data;

  const breadcrumbs = [
    { label: 'Equipos y jugadores', shortLabel: 'Equipos', to: '/equipos' },
    ...(team ? [{ label: team.name, to: `/equipos/${team.id}` }] : []),
    { label: player.name },
  ];

  return (
    <section className="page player-profile">
      <Breadcrumbs items={breadcrumbs} />
      <PlayerHero player={player} team={team} stats={stats} ranks={ranks} isMobile={isMobile} />
      <PlayerStats stats={stats} ranks={ranks} isMobile={isMobile} />
      <div className="player-profile__columns">
        <PerformanceChart
          player={player}
          season={season}
          seasons={seasons}
          lastMatches={lastMatches}
          onSeasonChange={onSeasonChange}
          isMobile={isMobile}
        />
        <LastMatches team={team} lastMatches={lastMatches} isMobile={isMobile} />
      </div>
    </section>
  );
}

function PlayerNotFound({ playerId }) {
  return (
    <section className="page player-profile">
      <Breadcrumbs
        items={[
          { label: 'Equipos y jugadores', shortLabel: 'Equipos', to: '/equipos' },
          { label: 'Jugador no encontrado' },
        ]}
      />
      <div className="player-missing">
        <h1 className="player-missing__title">Jugador no encontrado</h1>
        <p className="player-missing__text">No tenemos ningún jugador con la dirección «{playerId}».</p>
        <Button to="/equipos">Volver a Equipos y jugadores</Button>
      </div>
    </section>
  );
}
