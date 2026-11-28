// Zonas de la clasificación de LaLiga: qué puestos pintan franja de color y qué dice la leyenda.
export const STANDINGS_ZONES = [
  { id: 'champions', label: 'Champions League', from: 1, to: 4 },
  { id: 'europa', label: 'Europa League', from: 5, to: 6 },
  { id: 'conference', label: 'Conference League', from: 7, to: 7 },
  { id: 'relegation', label: 'Descenso', from: 18, to: 20 },
];

export function getStandingsZone(position) {
  return STANDINGS_ZONES.find((zone) => position >= zone.from && position <= zone.to);
}
