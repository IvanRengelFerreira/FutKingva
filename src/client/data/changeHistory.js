// Historial de cambios de 19 · Actualizar datos de jugadores (sacado de Figma).
// Cada cambio: fecha, jugador (id de PLAYERS), campo, valor anterior y nuevo, y quién lo hizo (iniciales).
// Los valores nuevos cuadran con mockData.js. En Figma, Vinícius aparecía «2 → 3» amarillas, pero en
// mockData.js tiene 2: se deja «1 → 2» porque manda mockData.js.
export const CHANGE_HISTORY = [
  { id: 1, date: '16/10', playerId: 'lamine-yamal', field: 'Asistencias', from: '5', to: '6', by: 'CR' },
  { id: 2, date: '15/10', playerId: 'mbappe', field: 'Goles', from: '6', to: '7', by: 'AM' },
  { id: 3, date: '14/10', playerId: 'courtois', field: 'Partidos', from: '7', to: '8', by: 'IR' },
  { id: 4, date: '13/10', playerId: 'bellingham', field: 'Tiros a puerta', from: '10', to: '11', by: 'CR' },
  { id: 5, date: '12/10', playerId: 'raphinha', field: 'Posición', from: 'Delantero', to: 'Extremo', by: 'AM' },
  { id: 6, date: '11/10', playerId: 'vinicius', field: 'Amarillas', from: '1', to: '2', by: 'IR' },
];
