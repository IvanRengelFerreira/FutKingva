import Avatar from '../Avatar/Avatar.jsx';
import Rating from '../Rating/Rating.jsx';
import { getPlayer, getTeam } from '../../data/mockData.js';
import plusIcon from '../../assets/icon-plus.svg';
import { FORMATIONS, POSITION_NAMES, slotPosition } from './formations.js';
import './Pitch.css';

// Campo de fútbol con el once colocado según la formación (equipo ideal).
// Cada jugador sale con su avatar (borde del color de su club), su valoración, su nombre y la posición.
// Las posiciones vacías salen con un círculo dorado discontinuo y «Añadir».
// Diseño: Figma › Mockups › 11 · Mi equipo ideal › Campo (once ideal) (escritorio 860 × 680, móvil 358 × 500)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=55-761
// Uso: se le pasa «players» tal cual viene en IDEAL_TEAM_EXAMPLE (mockData.js): [{ slot: 'POR', playerId: 'courtois' }, …]
//   <Pitch formation="4-3-3" players={team.players} />                       → solo para ver (12 · Mi perfil)
//   <Pitch formation={formation} players={players} activeSlot={slot} onSlotClick={setSlot} />   → 11 · Mi equipo ideal
// Con onSlotClick cada posición es un botón: la página decide qué hacer (elegir para quién se busca, quitar…).
// FORMATIONS, POSITION_NAMES y slotPosition están en formations.js (los usan también las páginas).

export default function Pitch({ formation = '4-3-3', players = [], activeSlot, onSlotClick, className = '' }) {
  const layout = FORMATIONS[formation] ?? FORMATIONS['4-3-3'];
  const playerBySlot = Object.fromEntries(players.map((p) => [p.slot, p.playerId]));

  return (
    <div className={`pitch ${className}`.trim()}>
      <div className="pitch__lines" aria-hidden="true">
        <span className="pitch__halfway" />
        <span className="pitch__circle" />
        <span className="pitch__box pitch__box--top" />
        <span className="pitch__box pitch__box--bottom" />
        <span className="pitch__goal-area pitch__goal-area--top" />
        <span className="pitch__goal-area pitch__goal-area--bottom" />
      </div>

      <ul className="pitch__slots" aria-label={`Once ideal en ${formation}`}>
        {Object.entries(layout).map(([slot, [x, y]]) => (
          <li key={slot} className="pitch__slot" style={{ '--x': `${x}%`, '--y': `${y}%` }}>
            <PitchSlot
              slot={slot}
              player={getPlayer(playerBySlot[slot])}
              active={slot === activeSlot}
              onClick={onSlotClick && (() => onSlotClick(slot))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PitchSlot({ slot, player, active, onClick }) {
  const position = slotPosition(slot);
  const positionName = `${POSITION_NAMES[position] ?? position} (${position})`;
  const Tag = onClick ? 'button' : 'div';
  const classes = `pitch__player ${player ? '' : 'pitch__player--empty'} ${active ? 'pitch__player--active' : ''}`;

  return (
    <Tag
      className={classes.replace(/\s+/g, ' ').trim()}
      {...(onClick && { type: 'button', onClick, 'aria-pressed': active })}
      aria-label={player ? `${positionName}: ${player.name}` : `${positionName}: vacía, añadir jugador`}
      style={player ? { '--team-color': getTeam(player.teamId)?.color } : undefined}
    >
      {player ? (
        <span className="pitch__token">
          <Avatar name={player.name} size={58} className="pitch__avatar" />
          <Rating value={player.rating} size="sm" className="pitch__rating" />
        </span>
      ) : (
        <span className="pitch__token pitch__add">
          <img src={plusIcon} alt="" width="24" height="24" />
        </span>
      )}
      <span className="pitch__name">{player ? (player.shortName ?? player.name) : 'Añadir'}</span>
      <span className="pitch__position">{position}</span>
    </Tag>
  );
}
