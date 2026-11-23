import TextField from '../TextField/TextField.jsx';
import Select from '../Select/Select.jsx';
import Button from '../Button/Button.jsx';
import { SEASON } from '../../data/mockData.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Formulario de filtros de Equipos y Árbitros: buscador, liga, temporada (textos largos en escritorio y
// cortos en móvil), «Ordenar» y «Buscar». classPrefix es el prefijo de las clases de la vista («teams», «referees»).
export default function LeagueSeasonFilters({
  classPrefix,
  searchLabel,
  query,
  onQueryChange,
  sortOptions,
  sortValue,
  onSortChange,
}) {
  return (
    <form className={`${classPrefix}__filters`} role="search" onSubmit={(event) => event.preventDefault()}>
      <TextField
        className={`${classPrefix}__search`}
        size="sm"
        label={searchLabel}
        hideLabel
        icon={searchIcon}
        placeholder={`${searchLabel}…`}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {/* Escritorio «Liga: LaLiga» / «Temporada 2026/27»; móvil, textos cortos como en el mockup */}
      <Select
        className={`${classPrefix}__filter ${classPrefix}__desktop-block`}
        size="sm"
        label="Liga"
        hideLabel
        options={[{ value: 'laliga', label: 'Liga: LaLiga' }]}
      />
      <Select
        className={`${classPrefix}__filter ${classPrefix}__desktop-block`}
        size="sm"
        label="Temporada"
        hideLabel
        options={[{ value: SEASON, label: `Temporada ${SEASON}` }]}
      />
      <Select
        className={`${classPrefix}__filter ${classPrefix}__mobile-flex`}
        size="sm"
        label="Liga"
        hideLabel
        options={[{ value: 'laliga', label: 'LaLiga' }]}
      />
      <Select
        className={`${classPrefix}__filter ${classPrefix}__mobile-flex`}
        size="sm"
        label="Temporada"
        hideLabel
        options={[{ value: SEASON, label: SEASON }]}
      />
      <Select
        className={`${classPrefix}__filter ${classPrefix}__filter--sort`}
        size="sm"
        label="Ordenar"
        hideLabel
        options={sortOptions}
        value={sortValue}
        onChange={onSortChange}
      />
      <Button type="submit" className={`${classPrefix}__submit`}>
        Buscar
      </Button>
    </form>
  );
}
