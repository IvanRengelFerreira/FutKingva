import TextField from '../TextField/TextField.jsx';
import Select from '../Select/Select.jsx';
import Button from '../Button/Button.jsx';
import searchIcon from '../../assets/icon-search-small.svg';

// Formulario de filtros de Equipos: buscador, liga, temporada (textos largos en escritorio y cortos en móvil),
// «Ordenar» y «Buscar». classPrefix es el prefijo de las clases de la vista («teams»).
// Temporada: las opciones llegan de la API (seasons, de la más reciente a la más antigua) y shownSeason es la
// de los datos que se están viendo; season es la elegida ('' = la que decida la API, la actual).

const EMPTY_SEASON = [{ value: '', label: 'Temporada' }]; // Mientras no llega la primera respuesta

// Si se está viendo una temporada que no está en la lista, se añade, para que el desplegable diga la de los datos
function seasonOptions(seasons, shown, toLabel) {
  const isListed = seasons.some((season) => season.year === shown.year);
  const options = isListed ? seasons : [shown, ...seasons].sort((a, b) => b.year - a.year);
  return options.map((season) => ({ value: season.year, label: toLabel(season.label) }));
}

export default function LeagueSeasonFilters({
  classPrefix,
  searchLabel,
  query,
  onQueryChange,
  seasons = [],
  shownSeason,
  season = '',
  onSeasonChange,
  sortOptions,
  sortValue,
  onSortChange,
}) {
  const optionsFor = (toLabel) => (shownSeason ? seasonOptions(seasons, shownSeason, toLabel) : EMPTY_SEASON);
  const selected = season || (shownSeason?.year ?? '');
  const changeSeason = (event) => onSeasonChange(event.target.value);

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
        options={optionsFor((label) => `Temporada ${label}`)}
        value={selected}
        onChange={changeSeason}
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
        options={optionsFor((label) => label)}
        value={selected}
        onChange={changeSeason}
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
