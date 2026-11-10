// Reglas de limpieza de los datos de Transfermarkt (transfermarkt-datasets, CC0).
// Ver «Plan del back-end», secciones 4.6 y 4.9.

/** Texto limpio: sin espacios sobrantes; '' → null. */
export function text(value) {
  if (value == null) return null;
  const clean = String(value).replace(/\s+/g, ' ').trim();
  return clean === '' || clean === 'null' ? null : clean;
}

/** Entero o null ('' → null). */
export function int(value) {
  const clean = text(value);
  if (clean == null) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/** '1978-06-09 00:00:00' → '1978-06-09' */
export function date(value) {
  const clean = text(value);
  return clean ? clean.slice(0, 10) : null;
}

/** 2012 → '2012/13' */
export function seasonLabel(startYear) {
  return `${startYear}/${String(startYear + 1).slice(2)}`;
}

/** '12. Matchday' → 12 */
export function matchday(round) {
  const m = /^(\d+)\./.exec(text(round) ?? '');
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------------
// Equipos: Transfermarkt no da nombre corto ni siglas → tabla fija.
// Nombres cortos y siglas como en el front (client/data/mockData.js).
// Son los 33 clubes que han jugado en LaLiga de 2012/13 a 2025/26.
// ---------------------------------------------------------------------

export const CLUBS = {
  131:   { name: 'FC Barcelona',             shortName: 'Barça',       tla: 'FCB', city: 'Barcelona' },
  418:   { name: 'Real Madrid',              shortName: 'R. Madrid',   tla: 'RMA', city: 'Madrid' },
  13:    { name: 'Atlético de Madrid',       shortName: 'Atlético',    tla: 'ATM', city: 'Madrid' },
  621:   { name: 'Athletic Club',            shortName: 'Athletic',    tla: 'ATH', city: 'Bilbao' },
  681:   { name: 'Real Sociedad',            shortName: 'R. Sociedad', tla: 'RSO', city: 'San Sebastián' },
  150:   { name: 'Real Betis Balompié',      shortName: 'Betis',       tla: 'BET', city: 'Sevilla' },
  368:   { name: 'Sevilla FC',               shortName: 'Sevilla',     tla: 'SEV', city: 'Sevilla' },
  1049:  { name: 'Valencia CF',              shortName: 'Valencia',    tla: 'VAL', city: 'Valencia' },
  1050:  { name: 'Villarreal CF',            shortName: 'Villarreal',  tla: 'VIL', city: 'Vila-real' },
  940:   { name: 'RC Celta de Vigo',         shortName: 'Celta',       tla: 'CEL', city: 'Vigo' },
  714:   { name: 'RCD Espanyol',             shortName: 'Espanyol',    tla: 'ESP', city: 'Cornellà de Llobregat' },
  367:   { name: 'Rayo Vallecano',           shortName: 'Rayo',        tla: 'RAY', city: 'Madrid' },
  3709:  { name: 'Getafe CF',                shortName: 'Getafe',      tla: 'GET', city: 'Getafe' },
  331:   { name: 'CA Osasuna',               shortName: 'Osasuna',     tla: 'OSA', city: 'Pamplona' },
  3368:  { name: 'Levante UD',               shortName: 'Levante',     tla: 'LEV', city: 'Valencia' },
  1531:  { name: 'Elche CF',                 shortName: 'Elche',       tla: 'ELC', city: 'Elche' },
  1108:  { name: 'Deportivo Alavés',         shortName: 'Alavés',      tla: 'ALA', city: 'Vitoria-Gasteiz' },
  12321: { name: 'Girona FC',                shortName: 'Girona',      tla: 'GIR', city: 'Girona' },
  237:   { name: 'RCD Mallorca',             shortName: 'Mallorca',    tla: 'MLL', city: 'Palma' },
  2497:  { name: 'Real Oviedo',              shortName: 'Oviedo',      tla: 'OVI', city: 'Oviedo' },
  1084:  { name: 'Málaga CF',                shortName: 'Málaga',      tla: 'MAL', city: 'Málaga' },
  897:   { name: 'RC Deportivo de La Coruña', shortName: 'Depor',      tla: 'DEP', city: 'A Coruña' },
  1244:  { name: 'CD Leganés',               shortName: 'Leganés',     tla: 'LEG', city: 'Leganés' },
  366:   { name: 'Real Valladolid CF',       shortName: 'Valladolid',  tla: 'VLL', city: 'Valladolid' },
  472:   { name: 'UD Las Palmas',            shortName: 'Las Palmas',  tla: 'LPA', city: 'Las Palmas de Gran Canaria' },
  16795: { name: 'Granada CF',               shortName: 'Granada',     tla: 'GRA', city: 'Granada' },
  2687:  { name: 'Cádiz CF',                 shortName: 'Cádiz',       tla: 'CAD', city: 'Cádiz' },
  3302:  { name: 'UD Almería',               shortName: 'Almería',     tla: 'ALM', city: 'Almería' },
  1533:  { name: 'SD Eibar',                 shortName: 'Eibar',       tla: 'EIB', city: 'Eibar' },
  5358:  { name: 'SD Huesca',                shortName: 'Huesca',      tla: 'HUE', city: 'Huesca' },
  2448:  { name: 'Real Sporting de Gijón',   shortName: 'Sporting',    tla: 'SPO', city: 'Gijón' },
  142:   { name: 'Real Zaragoza',            shortName: 'Zaragoza',    tla: 'ZAR', city: 'Zaragoza' },
  993:   { name: 'Córdoba CF',               shortName: 'Córdoba',     tla: 'COR', city: 'Córdoba' },
};

/** Escudo de Transfermarkt (se puede sustituir después por el de football-data). */
export function crestUrl(tmClubId) {
  return `https://tmssl.akamaized.net/images/wappen/head/${tmClubId}.png`;
}

// ---------------------------------------------------------------------
// Jugadores
// ---------------------------------------------------------------------

const POSITION_GROUP = {
  Goalkeeper: 'GOALKEEPER',
  Defender: 'DEFENDER',
  Midfield: 'MIDFIELDER',
  Attack: 'FORWARD',
  // 'Missing' → null («Sin posición»)
};

const DETAILED_POSITION = {
  Goalkeeper: 'Portero',
  'Centre-Back': 'Central',
  'Left-Back': 'Lateral izquierdo',
  'Right-Back': 'Lateral derecho',
  'Defensive Midfield': 'Pivote',
  'Central Midfield': 'Mediocentro',
  'Attacking Midfield': 'Mediapunta',
  'Left Midfield': 'Interior izquierdo',
  'Right Midfield': 'Interior derecho',
  'Left Winger': 'Extremo izquierdo',
  'Right Winger': 'Extremo derecho',
  'Second Striker': 'Segundo delantero',
  'Centre-Forward': 'Delantero centro',
};

const FOOT = { left: 'LEFT', right: 'RIGHT', both: 'BOTH' };

export function positionGroup(position) {
  return POSITION_GROUP[text(position)] ?? null;
}

export function detailedPosition(subPosition) {
  return DETAILED_POSITION[text(subPosition)] ?? null;
}

export function foot(value) {
  return FOOT[text(value)] ?? null;
}

/** Altura dentro del rango que admite la BD (140–220 cm); si no, null. */
export function height(value) {
  const cm = int(value);
  return cm != null && cm >= 140 && cm <= 220 ? cm : null;
}

// ---------------------------------------------------------------------
// Eventos de partido (game_events)
// ---------------------------------------------------------------------
// La descripción viene como trozos separados por comas, p. ej.:
//   Goals:         ', Right-footed shot, 3. Goal of the Season Assist: , Pass, 1. Assist of the Season'
//   Cards:         '2. Yellow card  , Foul'   ·   'Second yellow , Repeated Foul'   ·   'Red card , Serious foul'
//   Substitutions: ', Tactical'
// En los goles en propia, club_id es el equipo BENEFICIADO (el que suma el gol).

function parts(description) {
  return (description ?? '').split(',').map((p) => text(p)).filter(Boolean);
}

/**
 * @returns {{ type: string, detail: string | null } | null} null = tipo desconocido
 */
export function eventType(tmType, description) {
  const bits = parts(description);

  if (tmType === 'Goals') {
    // El remate va antes de «N. Goal of the Season»; lo de después es la asistencia («Pass»…)
    const end = bits.findIndex((b) => /Goal of the Season|Assist/.test(b));
    const detail = (end === -1 ? bits : bits.slice(0, end))[0] ?? null;
    if (bits.some((b) => b.startsWith('Own-goal'))) return { type: 'OWN_GOAL', detail: null };
    if (detail === 'Penalty') return { type: 'PENALTY_GOAL', detail: null };
    return { type: 'GOAL', detail };
  }

  if (tmType === 'Cards') {
    const [kind = '', reason = null] = bits;
    if (/Second yellow/i.test(kind)) return { type: 'SECOND_YELLOW', detail: reason };
    if (/Red card/i.test(kind)) return { type: 'RED_CARD', detail: reason };
    if (/Yellow card/i.test(kind)) return { type: 'YELLOW_CARD', detail: reason };
    return null;
  }

  if (tmType === 'Substitutions') {
    const reason = bits[0] ?? null;
    return { type: 'SUBSTITUTION', detail: reason === 'Not reported' ? null : reason };
  }

  return null;
}
