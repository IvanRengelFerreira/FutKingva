// Ayudas comunes de las páginas de árbitros (06 y 07).

// Números con coma decimal: 5.8 → «5,8»
export function formatDecimal(value) {
  return value == null ? '—' : value.toFixed(1).replace('.', ',');
}

// Opciones del desplegable «Temporada»: las que tienen cifras y, si se está viendo otra (pedida en la
// dirección), también esa, para que el desplegable no diga una temporada distinta de la de los datos.
export function seasonOptions(seasons, shown, toLabel) {
  const isListed = seasons.some((season) => season.year === shown.year);
  const options = isListed ? seasons : [shown, ...seasons].sort((a, b) => b.year - a.year);
  return options.map((season) => ({ value: season.year, label: toLabel(season.label) }));
}
