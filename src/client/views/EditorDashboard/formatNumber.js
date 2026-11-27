// 4812 → «4.812» · null → «—»
export function formatNumber(value) {
  return value == null ? '—' : value.toLocaleString('es-ES', { useGrouping: 'always' });
}

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** «+47 % vs octubre»: visitas de este mes frente al anterior ('' si el mes anterior no tuvo visitas) */
export function visitsTrend({ monthViews, previousMonthViews }, today = new Date()) {
  if (!previousMonthViews) return '';
  const change = Math.round(((monthViews - previousMonthViews) / previousMonthViews) * 100);
  const previousMonth = MONTHS[(today.getMonth() + 11) % 12];
  return `${change >= 0 ? '+' : '−'}${Math.abs(change)} % vs ${previousMonth}`;
}
