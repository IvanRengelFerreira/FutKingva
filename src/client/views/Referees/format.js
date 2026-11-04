// Números de las páginas de árbitros (06 y 07) con coma decimal: 5.8 → «5,8»
export function formatDecimal(value) {
  return value == null ? '—' : value.toFixed(1).replace('.', ',');
}
