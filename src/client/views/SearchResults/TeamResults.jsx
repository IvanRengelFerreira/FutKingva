import { Link } from 'react-router';
import Crest from '../../components/Crest/Crest.jsx';
import chevronIcon from '../../assets/icon-chevron-right-lg.svg';
import Highlighted from './Highlighted.jsx';

// Sección «Equipos» de los resultados: tarjetas con escudo, puesto y enlace a la ficha
export default function TeamResults({ teams, query }) {
  return (
    <section className="search-results__section" aria-labelledby="search-teams-title">
      <h2 id="search-teams-title" className="search-results__section-title">
        Equipos
      </h2>
      <ul className="search-results__teams">
        {teams.map((team) => (
          <li key={team.id}>
            <Link className="search-results__card" to={`/equipos/${team.id}`}>
              <Crest teamId={team.id} size={48} className="search-results__desktop-flex" />
              <Crest teamId={team.id} size={40} className="search-results__mobile-flex" />
              <span className="search-results__card-text">
                <Highlighted name={team.name} query={query} className="search-results__card-name" />
                <span className="search-results__card-meta">
                  {team.competition} · España · {team.position}.º
                </span>
              </span>
              <span className="search-results__see search-results__desktop">Ver ficha →</span>
              <img className="search-results__mobile-flex" src={chevronIcon} alt="" width="18" height="18" />
            </Link>
          </li>
        ))}
        <li className="search-results__also search-results__desktop-flex">
          Busca también en&nbsp;<Link to="/arbitros">árbitros</Link>&nbsp;y&nbsp;
          <Link to="/analisis">análisis</Link>&nbsp;→
        </li>
      </ul>
    </section>
  );
}
