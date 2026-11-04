import { useState } from 'react';
import { Link } from 'react-router';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Button from '../../components/Button/Button.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import { REFEREES, SEASON } from '../../data/mockData.js';
import CardCount from './CardCount.jsx';
import { formatDecimal } from './format.js';
import searchIcon from '../../assets/icon-search-small.svg';
import chevronIcon from '../../assets/icon-chevron-right-lg.svg';
import './Referees.css';

// 06 · Árbitros (RF11): árbitros de LaLiga con sus partidos, tarjetas por partido, rojas y penaltis.
// Escritorio: tabla con una barra de tarjetas por partido; móvil: tarjetas con «Cargar más».
// El buscador filtra mientras se escribe (sin tildes ni mayúsculas) y «Ordenar» cambia el orden.
// Solo hay datos de LaLiga 2026/27: los desplegables de liga y temporada tienen una sola opción.
// Diseño: Figma › Mockups › 06 · Árbitros
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-355

const SORTS = [
  { value: 'cardsPerMatch', label: 'Tarjetas / partido' },
  { value: 'matches', label: 'Partidos' },
  { value: 'redCards', label: 'Rojas' },
  { value: 'penalties', label: 'Penaltis' },
  { value: 'name', label: 'Nombre' },
];

// Tarjetas por partido que llenan la barra entera
const MAX_CARDS_PER_MATCH = 7.5;
const PER_PAGE = 10;
const MOBILE_STEP = 6;

export default function Referees() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(SORTS[0].value);
  const [page, setPage] = useState(1);
  const [mobileCount, setMobileCount] = useState(MOBILE_STEP);

  const text = normalize(query);
  const referees = REFEREES
    .filter((referee) => normalize(referee.name).includes(text))
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name, 'es')
        : (b[sort] ?? 0) - (a[sort] ?? 0) || b.cardsPerMatch - a.cardsPerMatch
    );
  const totalPages = Math.ceil(referees.length / PER_PAGE);
  const pageRows = referees.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function changeQuery(value) {
    setQuery(value);
    setPage(1);
    setMobileCount(MOBILE_STEP);
  }

  function changeSort(event) {
    setSort(event.target.value);
    setPage(1);
  }

  return (
    <section className="page referees">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            LaLiga · <span className="referees__desktop">Temporada </span>{SEASON}
          </p>
          <h1 className="page-header__title">Árbitros</h1>
          <p className="page-header__subtitle">Estadísticas de los árbitros de cada competición.</p>
        </div>
      </header>

      <form className="referees__filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <TextField
          className="referees__search"
          size="sm"
          label="Buscar árbitro"
          hideLabel
          icon={searchIcon}
          placeholder="Buscar árbitro…"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
        />
        {/* Escritorio «Liga: LaLiga» / «Temporada 2026/27»; móvil, textos cortos como en el mockup */}
        <Select className="referees__filter referees__desktop-block" size="sm" label="Liga" hideLabel options={[{ value: 'laliga', label: 'Liga: LaLiga' }]} />
        <Select className="referees__filter referees__desktop-block" size="sm" label="Temporada" hideLabel options={[{ value: SEASON, label: `Temporada ${SEASON}` }]} />
        <Select className="referees__filter referees__mobile-flex" size="sm" label="Liga" hideLabel options={[{ value: 'laliga', label: 'LaLiga' }]} />
        <Select className="referees__filter referees__mobile-flex" size="sm" label="Temporada" hideLabel options={[{ value: SEASON, label: SEASON }]} />
        <Select
          className="referees__filter referees__filter--sort"
          size="sm"
          label="Ordenar"
          hideLabel
          options={SORTS.map((item) => ({ value: item.value, label: `Ordenar: ${item.label}` }))}
          value={sort}
          onChange={changeSort}
        />
        <Button type="submit" className="referees__submit">Buscar</Button>
      </form>

      {referees.length === 0 ? (
        <p className="referees__empty">No hay árbitros que coincidan con «{query}».</p>
      ) : (
        <>
          <div className="referees__table-wrapper referees__desktop-block">
            <table className="referees__table">
              <caption className="referees__sr-only">Árbitros de LaLiga {SEASON}</caption>
              <thead>
                <tr>
                  <th scope="col">Árbitro</th>
                  <th scope="col" className="referees__committee">Comité</th>
                  <th scope="col" className="referees__num">Partidos</th>
                  <th scope="col" className="referees__cards">Tarjetas / partido</th>
                  <th scope="col" className="referees__num referees__num--sm">Rojas</th>
                  <th scope="col" className="referees__num referees__num--sm">Penaltis</th>
                  <th scope="col" className="referees__link"><span className="referees__sr-only">Ficha</span></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((referee) => (
                  <tr key={referee.id}>
                    <th scope="row">
                      <span className="referees__name">
                        <Avatar name={referee.name} size={36} />
                        <span>{referee.name}</span>
                        {referee.fifa && <span className="referees__fifa">FIFA</span>}
                      </span>
                    </th>
                    <td className="referees__committee">{referee.committee ?? '—'}</td>
                    <td className="referees__num referees__big">{referee.matches ?? '—'}</td>
                    <td className="referees__cards">
                      <span className="referees__cards-cell">
                        <span className="referees__big">{formatDecimal(referee.cardsPerMatch)}</span>
                        <span className="referees__bar" aria-hidden="true">
                          <span style={{ width: `${Math.min(100, (referee.cardsPerMatch / MAX_CARDS_PER_MATCH) * 100)}%` }} />
                        </span>
                      </span>
                    </td>
                    <td className={`referees__num referees__num--sm referees__big${referee.redCards > 0 ? ' referees__big--red' : ' referees__big--muted'}`}>
                      {referee.redCards ?? '—'}
                    </td>
                    <td className="referees__num referees__num--sm referees__big">{referee.penalties ?? '—'}</td>
                    <td className="referees__link">
                      <Link to={`/arbitros/${referee.id}`} aria-label={`Ver ficha de ${referee.name}`}>Ver ficha →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="referees__list referees__mobile-flex">
            {referees.slice(0, mobileCount).map((referee) => (
              <li key={referee.id}>
                <Link className="referees__item" to={`/arbitros/${referee.id}`}>
                  <Avatar name={referee.name} size={44} />
                  <span className="referees__item-text">
                    <span className="referees__item-name">{referee.name}</span>
                    <span className="referees__item-meta">
                      <span>{referee.matches} PJ</span>
                      <CardCount
                        color="yellow"
                        value={`${formatDecimal(referee.cardsPerMatch)}/p`}
                        label={`${formatDecimal(referee.cardsPerMatch)} tarjetas por partido`}
                      />
                      <CardCount color="red" value={referee.redCards} />
                    </span>
                  </span>
                  <img src={chevronIcon} alt="" width="18" height="18" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <Pagination className="referees__desktop-flex" page={page} totalPages={totalPages} onChange={setPage} />

      {mobileCount < referees.length && (
        <Button variant="tertiary" className="referees__more referees__mobile-flex" onClick={() => setMobileCount(mobileCount + MOBILE_STEP)}>
          Cargar más
        </Button>
      )}
    </section>
  );
}

// Sin tildes y en minúsculas: «diaz» encuentra «Díaz»
function normalize(text = '') {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
