// Metadatos oficiales (CTA / RFEF) de los árbitros de LaLiga y emparejado por apellidos normalizados.
// Permite completar comité territorial, condición internacional FIFA, año de debut en Primera División y
// nombre corto sin depender de ids autoincrementales de la base de datos.

import { normalizeText } from './playerMatcher.js';

const REF_PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

// Clave = apellidos o nombre normalizado; cubre la plantilla actual y el histórico cargado en `referees`
const RFEF_REFEREE_META = [
  { match: 'gil manzano', committee: 'Extremadura', isFifa: true, firstSeason: 2012, shortName: 'Gil Manzano' },
  { match: 'soto grado', committee: 'La Rioja', isFifa: true, firstSeason: 2019, shortName: 'Soto Grado' },
  {
    match: 'diaz de mera',
    committee: 'Castilla-La Mancha',
    isFifa: false,
    firstSeason: 2020,
    shortName: 'Díaz de Mera',
  },
  { match: 'cuadra fernandez', committee: 'Baleares', isFifa: true, firstSeason: 2018, shortName: 'Cuadra Fernández' },
  {
    match: 'hernandez hernandez',
    committee: 'Canarias',
    isFifa: true,
    firstSeason: 2012,
    shortName: 'Hernández Hernández',
  },
  { match: 'munuera montero', committee: 'Andalucía', isFifa: true, firstSeason: 2016, shortName: 'Munuera Montero' },
  {
    match: 'martinez munuera',
    committee: 'C. Valenciana',
    isFifa: true,
    firstSeason: 2013,
    shortName: 'Martínez Munuera',
  },
  {
    match: 'alberola rojas',
    committee: 'Castilla-La Mancha',
    isFifa: true,
    firstSeason: 2017,
    shortName: 'Alberola Rojas',
  },
  { match: 'sanchez martinez', committee: 'Murcia', isFifa: true, firstSeason: 2015, shortName: 'Sánchez Martínez' },
  {
    match: 'burgos bengoetxea',
    committee: 'País Vasco',
    isFifa: true,
    firstSeason: 2015,
    shortName: 'De Burgos Bengoetxea',
  },
  { match: 'busquets ferrer', committee: 'Baleares', isFifa: true, firstSeason: 2023, shortName: 'Busquets Ferrer' },
  { match: 'muniz ruiz', committee: 'Galicia', isFifa: true, firstSeason: 2021, shortName: 'Muñiz Ruiz' },
  { match: 'garcia verdura', committee: 'Cataluña', isFifa: false, firstSeason: 2023, shortName: 'García Verdura' },
  {
    match: 'hernandez maeso',
    committee: 'Extremadura',
    isFifa: false,
    firstSeason: 2023,
    shortName: 'Hernández Maeso',
  },
  {
    match: 'quintero gonzalez',
    committee: 'Andalucía',
    isFifa: false,
    firstSeason: 2024,
    shortName: 'Quintero González',
  },
  { match: 'cordero vega', committee: 'Cantabria', isFifa: false, firstSeason: 2018, shortName: 'Cordero Vega' },
  { match: 'ortiz arias', committee: 'Madrid', isFifa: false, firstSeason: 2021, shortName: 'Ortiz Arias' },
  { match: 'pulido santana', committee: 'Canarias', isFifa: false, firstSeason: 2022, shortName: 'Pulido Santana' },
  { match: 'gonzalez fuertes', committee: 'Asturias', isFifa: false, firstSeason: 2017, shortName: 'González Fuertes' },
  { match: 'melero lopez', committee: 'Andalucía', isFifa: false, firstSeason: 2014, shortName: 'Melero López' },
  {
    match: 'figueroa vazquez',
    committee: 'Andalucía',
    isFifa: false,
    firstSeason: 2020,
    shortName: 'Figueroa Vázquez',
  },
  {
    match: 'javier iglesias villanueva',
    committee: 'Galicia',
    isFifa: false,
    firstSeason: 2022,
    shortName: 'Iglesias Villanueva',
  },
  {
    match: 'galech apezteguia',
    committee: 'Navarra',
    isFifa: false,
    firstSeason: 2025,
    shortName: 'Galech Apezteguía',
  },
  { match: 'sesma espinosa', committee: 'La Rioja', isFifa: false, firstSeason: 2025, shortName: 'Sesma Espinosa' },
  { match: 'guzman mansilla', committee: 'Andalucía', isFifa: false, firstSeason: 2025, shortName: 'Guzmán Mansilla' },
  { match: 'orellana cid', committee: 'Andalucía', isFifa: false, firstSeason: 2026, shortName: 'Orellana Cid' },
  { match: 'muniz munoz', committee: 'Aragón', isFifa: false, firstSeason: 2026, shortName: 'Muñiz Muñoz' },
  {
    match: 'gonzalez esteban',
    committee: 'País Vasco',
    isFifa: false,
    firstSeason: 2026,
    shortName: 'González Esteban',
  },
  { match: 'bestard servera', committee: 'Baleares', isFifa: false, firstSeason: 2026, shortName: 'Bestard Servera' },
  // Histórico reciente de LaLiga (2012–2024)
  { match: 'mateu lahoz', committee: 'C. Valenciana', isFifa: true, firstSeason: 2008, shortName: 'Mateu Lahoz' },
  { match: 'cerro grande', committee: 'Madrid', isFifa: true, firstSeason: 2011, shortName: 'Del Cerro Grande' },
  {
    match: 'estrada fernandez',
    committee: 'Cataluña',
    isFifa: true,
    firstSeason: 2009,
    shortName: 'Estrada Fernández',
  },
  { match: 'undiano mallenco', committee: 'Navarra', isFifa: true, firstSeason: 2000, shortName: 'Undiano Mallenco' },
  { match: 'velasco carballo', committee: 'Madrid', isFifa: true, firstSeason: 2004, shortName: 'Velasco Carballo' },
  { match: 'clos gomez', committee: 'Aragón', isFifa: true, firstSeason: 2006, shortName: 'Clos Gómez' },
  {
    match: 'fernandez borbalan',
    committee: 'Andalucía',
    isFifa: true,
    firstSeason: 2004,
    shortName: 'Fernández Borbalán',
  },
  {
    match: 'gonzalez gonzalez',
    committee: 'Castilla y León',
    isFifa: false,
    firstSeason: 2009,
    shortName: 'González González',
  },
  { match: 'jaime latre', committee: 'Aragón', isFifa: false, firstSeason: 2014, shortName: 'Jaime Latre' },
  { match: 'trujillo suarez', committee: 'Canarias', isFifa: false, firstSeason: 2016, shortName: 'Trujillo Suárez' },
  { match: 'medie jimenez', committee: 'Cataluña', isFifa: false, firstSeason: 2017, shortName: 'Medié Jiménez' },
  { match: 'prieto iglesias', committee: 'Navarra', isFifa: false, firstSeason: 2013, shortName: 'Prieto Iglesias' },
  { match: 'pizarro gomez', committee: 'Madrid', isFifa: false, firstSeason: 2019, shortName: 'Pizarro Gómez' },
  {
    match: 'nacho iglesias villanueva',
    committee: 'Galicia',
    isFifa: false,
    firstSeason: 2010,
    shortName: 'Iglesias Villanueva',
  },
  {
    match: 'iglesias villanueva',
    committee: 'Galicia',
    isFifa: false,
    firstSeason: 2010,
    shortName: 'Iglesias Villanueva',
  },
  {
    match: 'alvarez izquierdo',
    committee: 'Cataluña',
    isFifa: false,
    firstSeason: 2006,
    shortName: 'Álvarez Izquierdo',
  },
  { match: 'bikandi garrido', committee: 'País Vasco', isFifa: false, firstSeason: 2014, shortName: 'Bikandi Garrido' },
  { match: 'ocon arraiz', committee: 'La Rioja', isFifa: false, firstSeason: 2016, shortName: 'Ocón Arráiz' },
  { match: 'perez montero', committee: 'Andalucía', isFifa: false, firstSeason: 2011, shortName: 'Pérez Montero' },
  { match: 'muniz fernandez', committee: 'Asturias', isFifa: true, firstSeason: 2000, shortName: 'Muñiz Fernández' },
  {
    match: 'fernando teixeira vitienes',
    committee: 'Cantabria',
    isFifa: true,
    firstSeason: 2003,
    shortName: 'Teixeira Vitienes',
  },
  {
    match: 'jose antonio teixeira vitienes',
    committee: 'Cantabria',
    isFifa: false,
    firstSeason: 2010,
    shortName: 'Teixeira Vitienes',
  },
  { match: 'paradas romero', committee: 'Andalucía', isFifa: false, firstSeason: 2007, shortName: 'Paradas Romero' },
  { match: 'perez lasa', committee: 'País Vasco', isFifa: false, firstSeason: 1997, shortName: 'Pérez Lasa' },
  { match: 'ayza gamez', committee: 'C. Valenciana', isFifa: false, firstSeason: 2005, shortName: 'Ayza Gámez' },
  {
    match: 'delgado ferreiro',
    committee: 'País Vasco',
    isFifa: false,
    firstSeason: 2006,
    shortName: 'Delgado Ferreiro',
  },
];

export function refereeTokens(name) {
  return normalizeText(name)
    .split(' ')
    .filter((token) => token.length > 2 && !REF_PARTICLES.has(token));
}

/** Devuelve los metadatos RFEF para un nombre de árbitro, o null si no figura en la tabla conocida. */
export function lookupRefereeMeta(name) {
  const norm = normalizeText(name);
  for (const entry of RFEF_REFEREE_META) {
    if (norm === entry.match || norm.includes(entry.match)) return entry;
  }
  const tokens = new Set(refereeTokens(name));
  for (const entry of RFEF_REFEREE_META) {
    const targetTokens = refereeTokens(entry.match);
    if (targetTokens.length >= 2 && targetTokens.every((t) => tokens.has(t))) return entry;
  }
  return null;
}

/** Genera un `short_name` español (dos últimos apellidos) cuando se da de alta un árbitro nuevo. */
export function deriveRefereeShortName(fullName) {
  const meta = lookupRefereeMeta(fullName);
  if (meta?.shortName) return meta.shortName;
  const words = String(fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length > 2 ? words.slice(-2).join(' ') : words.join(' ');
}

/** Crea un buscador de árbitros existentes en la BD por nombre completo, nombre corto o coincidencia de apellidos. */
export function createRefereeMatcher(dbReferees) {
  const indexed = dbReferees.map((ref) => ({
    id: ref.id,
    normName: normalizeText(ref.name),
    normShort: normalizeText(ref.short_name),
    tokens: refereeTokens(ref.name),
    surnames: refereeTokens(ref.name).slice(-2),
  }));

  function match(name) {
    const queryNorm = normalizeText(name);
    if (!queryNorm) return null;

    const exact = indexed.find((r) => r.normName === queryNorm || (r.normShort && r.normShort === queryNorm));
    if (exact) return exact.id;

    const queryTokens = refereeTokens(name);
    const querySet = new Set(queryTokens);
    let bestId = null;
    let bestScore = 0;
    let tied = false;

    for (const cand of indexed) {
      const shared = cand.tokens.filter((t) => querySet.has(t)).length;
      if (shared < 2) continue;
      const surnamesMatch = cand.surnames.length === 2 && cand.surnames.every((s) => querySet.has(s));
      const score = shared * 10 + (surnamesMatch ? 15 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestId = cand.id;
        tied = false;
      } else if (score === bestScore && cand.id !== bestId) {
        tied = true;
      }
    }

    return !tied && bestScore >= 20 ? bestId : null;
  }

  return { match };
}
