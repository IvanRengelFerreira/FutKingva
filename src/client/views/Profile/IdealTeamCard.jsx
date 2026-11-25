import { Link } from 'react-router';
import Rating from '../../components/Rating/Rating.jsx';
import { DEFAULT_FORMATION, FORMATIONS, slotsOf } from '../../../shared/formations.js';
import { summarize, toAssigned } from '../IdealTeam/team.js';
import editIcon from '../../assets/icon-edit-gold.svg';
import pitchLines from '../../assets/pitch-lines.svg';

// Miniatura del equipo ideal: campo con un punto oro por jugador (discontinuo si el puesto está vacío)
export default function IdealTeamCard({ team }) {
  const assigned = toAssigned(team.players);
  const slots = slotsOf(team.formation);
  const totals = summarize(assigned);
  const spots = FORMATIONS[team.formation] ?? FORMATIONS[DEFAULT_FORMATION];
  const goalsText = totals.goals != null ? `${totals.goals} goles` : '— goles';

  return (
    <div className="profile-ideal">
      <div className="profile-ideal__pitch" style={{ backgroundImage: `url("${pitchLines}")` }}>
        {slots.map((slot) => {
          const [x, y] = spots[slot] ?? [50, 50];
          const player = assigned[slot] ?? null;
          return (
            <span
              key={slot}
              className={`profile-ideal__dot${player ? '' : ' profile-ideal__dot--empty'}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              title={player ? `${slot} · ${player.name}` : `${slot} · vacío`}
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
            {team.formation} · {totals.count}/{slots.length} jugadores · {goalsText}
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
