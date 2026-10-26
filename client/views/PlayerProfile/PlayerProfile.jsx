import { useParams } from 'react-router';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import Button from '../../components/Button/Button.jsx';
import PlayerHero from './PlayerHero.jsx';
import PlayerStats from './PlayerStats.jsx';
import PerformanceChart from './PerformanceChart.jsx';
import LastMatches from './LastMatches.jsx';
import useIsMobile from './useIsMobile.js';
import { PLAYER_PROFILE_EXTRAS, getPlayer, getTeam } from '../../data/mockData.js';
import './PlayerProfile.css';

// 04 · Ficha de jugador: cabecera con valoración, indicadores de la temporada, gráfico de
// rendimiento por jornada y últimos partidos. Pública. El jugador sale del id de la dirección
// (/jugadores/pedri); si no existe, avisa y enlaza a Equipos y jugadores.
// Los datos de los jugadores son estimados y a muchos les falta algo: lo que falta sale «—».
// Diseño: Figma › Mockups › 04 · Ficha de jugador
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=45-221
export default function PlayerProfile() {
  const { playerId } = useParams();
  const isMobile = useIsMobile();
  const player = getPlayer(playerId);

  if (!player) {
    return (
      <section className="page player-profile">
        <Breadcrumbs items={[{ label: 'Equipos y jugadores', shortLabel: 'Equipos', to: '/equipos' }, { label: 'Jugador no encontrado' }]} />
        <div className="player-missing">
          <h1 className="player-missing__title">Jugador no encontrado</h1>
          <p className="player-missing__text">No tenemos ningún jugador con la dirección «{playerId}».</p>
          <Button to="/equipos">Volver a Equipos y jugadores</Button>
        </div>
      </section>
    );
  }

  const team = getTeam(player.teamId);
  const extras = PLAYER_PROFILE_EXTRAS[player.id] ?? {};

  return (
    <section className="page player-profile">
      <Breadcrumbs
        items={[
          { label: 'Equipos y jugadores', shortLabel: 'Equipos', to: '/equipos' },
          { label: extras.clubName ?? team?.name ?? 'Club', to: team ? `/equipos/${team.id}` : undefined },
          { label: player.name },
        ]}
      />
      <PlayerHero player={player} team={team} extras={extras} isMobile={isMobile} />
      <PlayerStats player={player} extras={extras} isMobile={isMobile} />
      <div className="player-profile__columns">
        <PerformanceChart player={player} isMobile={isMobile} />
        <LastMatches player={player} extras={extras} isMobile={isMobile} />
      </div>
    </section>
  );
}
