import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Button from '../../components/Button/Button.jsx';
import { seasonOptions } from './format.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Filtros de 06 · Árbitros: buscador, liga, temporada, «Ordenar» y «Buscar».
// Mismo aspecto que LeagueSeasonFilters (el de Equipos), pero aquí la temporada se puede elegir y sale
// de la API: el común solo enseña una temporada fija.

const EMPTY_SEASON = [{ value: '', label: 'Temporada' }]; // Mientras no llega la primera respuesta

export default function RefereeFilters({ query, onQueryChange, seasons, shownSeason, season, onSeasonChange, sort }) {
  const optionsFor = (toLabel) => (shownSeason ? seasonOptions(seasons, shownSeason, toLabel) : EMPTY_SEASON);
  // La elegida; sin elegir ninguna, la que haya respondido la API
  const selected = season || (shownSeason?.year ?? '');

  return (
    <form className="referees__filters" role="search" onSubmit={(event) => event.preventDefault()}>
      <TextField
        className="referees__search"
        size="sm"
        label="Buscar árbitro"
        hideLabel
        icon={searchIcon}
        placeholder="Buscar árbitro…"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {/* Escritorio «Liga: LaLiga» / «Temporada 2025/26»; móvil, textos cortos como en el mockup */}
      <Select
        className="referees__filter referees__desktop-block"
        size="sm"
        label="Liga"
        hideLabel
        options={[{ value: 'laliga', label: 'Liga: LaLiga' }]}
      />
      <Select
        className="referees__filter referees__desktop-block"
        size="sm"
        label="Temporada"
        hideLabel
        options={optionsFor((label) => `Temporada ${label}`)}
        value={selected}
        onChange={(event) => onSeasonChange(event.target.value)}
      />
      <Select
        className="referees__filter referees__mobile-flex"
        size="sm"
        label="Liga"
        hideLabel
        options={[{ value: 'laliga', label: 'LaLiga' }]}
      />
      <Select
        className="referees__filter referees__mobile-flex"
        size="sm"
        label="Temporada"
        hideLabel
        options={optionsFor((label) => label)}
        value={selected}
        onChange={(event) => onSeasonChange(event.target.value)}
      />
      <Select
        className="referees__filter referees__filter--sort"
        size="sm"
        label="Ordenar"
        hideLabel
        options={sort.options}
        value={sort.value}
        onChange={(event) => sort.onChange(event.target.value)}
      />
      <Button type="submit" className="referees__submit">
        Buscar
      </Button>
    </form>
  );
}
