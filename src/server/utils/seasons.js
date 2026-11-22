// Temporada que pide el front (?season=2025, año en que empieza) o, si no la pide, la actual de LaLiga.
// La usan las rutas de clasificación, equipos, árbitros y búsqueda.

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';

// Por ahora FutKingva solo tiene datos de LaLiga
const LALIGA = 'LaLiga';

const SEASON_FIELDS = { id: true, start_year: true, label: true, current_matchday: true };

/** Datos de una temporada tal como se envían al front */
export function seasonSummary(season) {
  return {
    id: season.id,
    year: season.start_year,
    label: season.label,
    matchday: season.current_matchday,
  };
}

/**
 * Temporada de LaLiga pedida en ?season (año de inicio) o la actual.
 * @returns {Promise<{ season, isCurrent: boolean }>} season con los campos de la BD
 */
export async function resolveSeason(seasonParam) {
  const competition = await prisma.competitions.findFirst({
    where: { name: LALIGA },
    select: { id: true, current_season_id: true },
  });
  if (!competition) throw AppError.notFound('Todavía no hay datos de LaLiga');

  let season;
  if (seasonParam === undefined || seasonParam === '') {
    season = competition.current_season_id
      ? await prisma.seasons.findUnique({ where: { id: competition.current_season_id }, select: SEASON_FIELDS })
      : await prisma.seasons.findFirst({
          where: { competition_id: competition.id },
          orderBy: { start_year: 'desc' },
          select: SEASON_FIELDS,
        });
  } else {
    const year = Number(seasonParam);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw AppError.badRequest('La temporada no es válida', { season: 'Tiene que ser un año, p. ej. 2025' });
    }
    season = await prisma.seasons.findUnique({
      where: { competition_id_start_year: { competition_id: competition.id, start_year: year } },
      select: SEASON_FIELDS,
    });
  }
  if (!season) throw AppError.notFound('No tenemos datos de esa temporada');

  return { season, isCurrent: season.id === competition.current_season_id };
}

/** Todas las temporadas de LaLiga que hay en la BD, de la más reciente a la más antigua */
export async function listSeasons() {
  const seasons = await prisma.seasons.findMany({
    where: { competitions_seasons_competition_idTocompetitions: { name: LALIGA } },
    orderBy: { start_year: 'desc' },
    select: SEASON_FIELDS,
  });
  return seasons.map(seasonSummary);
}
