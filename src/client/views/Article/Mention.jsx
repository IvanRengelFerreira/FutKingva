import { Link } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import { getPlayer, getTeam } from '../../data/mockData.js';
import arrowIcon from '../../assets/icon-arrow-right.svg';

// Píldora con enlace a la ficha del jugador o del equipo
export default function Mention({ item }) {
  if (item.type === 'team') {
    const team = getTeam(item.id);
    return (
      <Link className="article__mention" to={`/equipos/${item.id}`}>
        <Crest teamId={item.id} size={26} />
        {item.label ?? team?.name}
        <img src={arrowIcon} alt="" width="14" height="14" />
      </Link>
    );
  }

  const player = getPlayer(item.id);
  return (
    <Link className="article__mention" to={`/jugadores/${item.id}`}>
      <Avatar name={player?.name} size={26} />
      {item.label ?? player?.name}
      <img src={arrowIcon} alt="" width="14" height="14" />
    </Link>
  );
}
