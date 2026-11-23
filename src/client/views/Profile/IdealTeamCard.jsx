import { Link } from 'react-router';
import Rating from '../../components/Rating/Rating.jsx';
import { FORMATIONS } from '../../components/Pitch/formations.js';
import { summarize, toAssigned } from '../IdealTeam/team.js';
import { getPlayer } from '../../data/mockData.js';
import editIcon from '../../assets/icon-edit-gold.svg';
import pitchLines from '../../assets/pitch-lines.svg';

// Miniatura del equipo ideal: campo con un punto oro por jugador (discontinuo si el puesto está vacío)
export default function IdealTeamCard({ team }) {
  const filled = team.players.filter((slot) => slot.playerId).length;
  const totals = summarize(toAssigned(team.players));
  const spots = FORMATIONS[team.formation] ?? FORMATIONS['4-3-3'];
  return (
    <div className="profile-ideal">
      <div className="profile-ideal__pitch" style={{ backgroundImage: `url("${pitchLines}")` }}>
        {team.players.map((slot) => {
          const [x, y] = spots[slot.slot] ?? [50, 50];
          const player = slot.playerId ? getPlayer(slot.playerId) : null;
          return (
            <span
              key={slot.slot}
              className={`profile-ideal__dot${player ? '' : ' profile-ideal__dot--empty'}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              title={player ? `${slot.slot} · ${player.name}` : `${slot.slot} · vacío`}
            />
          );
        })}
      </div>
      <div className="profile-ideal__summary">
        <span className="profile-ideal__text">
          <span className="profile-ideal__name">
            {team.name}
            <span className="profile__mobile"> · {team.formation}</span>
          </span>
          <span className="profile-ideal__meta profile__desktop">
            {team.formation} · {filled}/{team.players.length} jugadores · {totals.goals ?? 0} goles
          </span>
        </span>
        {totals.averageRating != null && (
          <Rating value={totals.averageRating} size="md" className="profile__desktop-flex" />
        )}
      </div>
      <Link className="profile__outline-button" to="/equipo-ideal">
        <img src={editIcon} alt="" width="16" height="16" />
        Editar equipo ideal
      </Link>
    </div>
  );
}
