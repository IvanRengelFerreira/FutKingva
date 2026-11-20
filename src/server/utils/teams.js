// Formato común de un equipo en las respuestas de la API (escudos, tablas, partidos…).
// La web no usa escudos reales: pinta un círculo con las siglas (code) y el borde del color del club (color).
//   teamSummary(team) → { id, name, shortName, code, color }

// Color del borde del escudo según el primer color del club en la BD (club_colors = «Red / White»)
const CLUB_COLORS = {
  red: '#C8102E',
  crimson: '#A50044',
  blue: '#1E5BC6',
  'sky blue': '#6CB4EE',
  'navy blue': '#1B2A55',
  white: '#D9D9D9',
  green: '#00954C',
  yellow: '#FFD100',
  black: '#2B2B2B',
  orange: '#F28C28',
};

/** Color del club a partir de club_colors («Sky Blue / White» → '#6CB4EE'), o null si no se sabe */
export function teamColor(clubColors) {
  const first = clubColors?.split('/')[0]?.trim().toLowerCase();
  return (first && CLUB_COLORS[first]) || null;
}

/** Siglas del equipo: la tla de la BD, o las tres primeras letras del nombre corto */
export function teamCode(team) {
  return team.tla?.trim() || team.short_name.slice(0, 3).toUpperCase();
}

/** Campos que hay que pedir a Prisma (select) para poder usar teamSummary */
export const TEAM_SUMMARY_FIELDS = { id: true, name: true, short_name: true, tla: true, club_colors: true };

/** Equipo tal como se envía al front para pintar escudos y nombres */
export function teamSummary(team) {
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    shortName: team.short_name,
    code: teamCode(team),
    color: teamColor(team.club_colors),
  };
}
