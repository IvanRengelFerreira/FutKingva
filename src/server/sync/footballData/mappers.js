// Reglas de limpieza de football-data.org (ver «Plan del back-end», sección 4.6).

// Equipos de LaLiga 2026/27: id de football-data → id de Transfermarkt (tabla fija).
// El nombre, el nombre corto y las siglas salen de CLUBS (../transfermarkt/mappers.js),
// que son los del front; los de la API no se usan («Atleti», «ATL», «Santander», «SAN»…).
export const FD_TO_TM = {
  77: 621,    // Athletic Club
  78: 13,     // Atlético de Madrid
  79: 331,    // Osasuna
  80: 714,    // Espanyol
  81: 131,    // FC Barcelona
  82: 3709,   // Getafe
  84: 1084,   // Málaga
  86: 418,    // Real Madrid
  87: 367,    // Rayo Vallecano
  88: 3368,   // Levante
  90: 150,    // Real Betis
  92: 681,    // Real Sociedad
  94: 1050,   // Villarreal
  95: 1049,   // Valencia
  263: 1108,  // Alavés
  285: 1531,  // Elche
  558: 940,   // Celta
  559: 368,   // Sevilla
  560: 897,   // Deportivo
  5335: null, // Racing de Santander: no está en el histórico (sin Segunda División)
};

// Equipos que no están en el histórico de Transfermarkt
export const NEW_CLUBS = {
  5335: { name: 'Real Racing Club', shortName: 'Racing', tla: 'RAC', city: 'Santander', venue: 'El Sardinero' },
};

// Entrenadores que la API escribe sin tildes o abreviados
const COACH_NAMES = {
  'Inigo Perez': 'Iñigo Pérez',
  'Quique Sanchez Flores': 'Quique Sánchez Flores',
  Claudio: 'Claudio Giráldez',
  'Martin Anselmi': 'Martín Anselmi',
  'Pepe Bordalás': 'José Bordalás',
  'Luís García': 'Luis García Plaza',
};

export function coachName(name) {
  const clean = text(name);
  return COACH_NAMES[clean] ?? clean;
}

// Jugadores con un nombre de la API que no se parece al de Transfermarkt (se comprueba además
// la fecha de nacimiento). Nombre en football-data → nombre en Transfermarkt.
export const PLAYER_ALIASES = {
  Yusi: 'Youssef Enríquez',
};

// Árbitros con un nombre de la API que no se parece lo suficiente al de Transfermarkt
export const REFEREE_ALIASES = {
  'Ricardo de Burgos': 'De Burgos Bengoetxea',
};

// Posición general de la API (en plantillas: position; en goleadores: section)
const POSITION_GROUP = {
  Goalkeeper: 'GOALKEEPER',
  Defence: 'DEFENDER',
  Midfield: 'MIDFIELDER',
  Offence: 'FORWARD',
};

export function positionGroup(value) {
  return POSITION_GROUP[text(value)] ?? null; // null y 'null' → «Sin posición»
}

/** Texto limpio: '' y 'null' → null */
export function text(value) {
  if (value == null) return null;
  const clean = String(value).replace(/\s+/g, ' ').trim();
  return clean === '' || clean === 'null' ? null : clean;
}
