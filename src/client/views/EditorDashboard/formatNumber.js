// 4812 → «4.812» · null → «—»
export function formatNumber(value) {
  return value == null ? '—' : value.toLocaleString('es-ES', { useGrouping: 'always' });
}
