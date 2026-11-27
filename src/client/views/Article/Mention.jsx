import { Link } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import arrowIcon from '../../assets/icon-arrow-right.svg';

// Píldora con enlace a la ficha del jugador o del equipo (datos de la API: { id, name, … })
export default function Mention({ type, item }) {
  if (type === 'team') {
    return (
      <Link className="article__mention" to={`/equipos/${item.id}`}>
        <Crest team={item} size={26} />
        {item.name}
        <img src={arrowIcon} alt="" width="14" height="14" />
      </Link>
    );
  }

  return (
    <Link className="article__mention" to={`/jugadores/${item.id}`}>
      <Avatar name={item.name} size={26} />
      {item.name}
      <img src={arrowIcon} alt="" width="14" height="14" />
    </Link>
  );
}
