// Formato de la clasificación en las respuestas de la API (GET /api/standings).

import { teamSummary } from './teams.js';

// La BD guarda la forma en inglés (W/D/L); la web la enseña en español (V/E/D)
const FORM_LETTERS = { W: 'V', D: 'E', L: 'D' };

/** «WWDL» → «VVED»; las letras desconocidas se descartan */
export function toSpanishForm(form) {
  return (form ?? '')
    .split('')
    .map((letter) => FORM_LETTERS[letter] ?? '')
    .join('');
}

/** Fila de la clasificación tal como se envía al front (la fila de Prisma ha de incluir `teams`) */
export function standingRow(row) {
  return {
    position: row.position,
    teamId: row.team_id,
    team: teamSummary(row.teams),
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    goalDifference: row.goals_for - row.goals_against,
    points: row.points,
    form: toSpanishForm(row.form),
  };
}

/** Fecha de la última actualización de la tabla (la fila más reciente), o null si no hay filas */
export function latestUpdate(rows) {
  if (!rows.length) return null;
  return rows.reduce((latest, row) => (row.updated_at > latest ? row.updated_at : latest), new Date(0));
}
