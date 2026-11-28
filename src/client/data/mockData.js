/*
 * FutKingva · Datos de ejemplo
 * ------------------------------------------------------------------
 * Datos escritos a mano para las páginas que aún no usan la API. Son los
 * mismos que salen en los mockups de Figma, para que todas las páginas
 * cuenten la misma historia.
 *
 * Son datos REALES de la temporada 2026/27, congelados en un momento:
 *   sábado 17 de octubre de 2026, 17:00 · jornada 9 a medias
 *   (clasificación tras el Espanyol 0-1 Atlético; Villarreal–Elche en juego).
 * Fuentes: futboltotal.futbol (resultados J1–J9), dsn.pe (tabla), laliga.com y
 * webs oficiales del Real Madrid y del Barça (plantillas y dorsales).
 * Comprobado: la tabla sale igual sumando los resultados partido a partido.
 *
 * Lo que no se ha podido consultar (estadísticas individuales, valoraciones,
 * árbitros, marcadores en directo de otras ligas, datos de editor y de admin)
 * está marcado como «estimado» o «simulado»: inventado, pero coherente.
 *
 * Reglas:
 *  - Nombres de variables y campos en inglés; los textos que se ven, en español.
 *  - Los equipos, jugadores, árbitros y artículos se identifican por su «id»
 *    (el mismo que va en la dirección: /equipos/real-madrid, /jugadores/pedri…).
 *    Entre datos se enlazan por id: teamId: 'barcelona'.
 *  - Si añades datos, comprueba que cuadran con el resto (clasificación,
 *    resultados, estadísticas…). Si cambias algo que ya existe, avisa al grupo.
 *
 * Uso:
 *   import { TEAMS, STANDINGS_LALIGA, getTeam } from '../../data/mockData.js';
 *   const team = getTeam('real-madrid');   // → { id, code, name, color, … }
 */

export const SEASON = '2026/27';

/* ---------------------------------------------------------------- */
/* Equipos                                                           */
/* ---------------------------------------------------------------- */

// code: siglas del escudo · shortName: nombre corto (tarjetas de partido)
// color: color del club para el escudo (borde; el fondo es el mismo color al 16 %)
// coach: entrenador (según Wikipedia, octubre de 2026)
export const TEAMS = {
  // LaLiga 2026/27 (ascendidos: Racing, Deportivo y Málaga; bajaron Mallorca, Girona y Oviedo)
  'real-madrid': {
    id: 'real-madrid',
    code: 'RMA',
    name: 'Real Madrid',
    shortName: 'R. Madrid',
    color: '#D9D9D9',
    competition: 'LaLiga',
    coach: 'José Mourinho',
  },
  barcelona: {
    id: 'barcelona',
    code: 'FCB',
    name: 'Barcelona',
    shortName: 'Barça',
    color: '#A50044',
    competition: 'LaLiga',
    coach: 'Hansi Flick',
  },
  'atletico-madrid': {
    id: 'atletico-madrid',
    code: 'ATM',
    name: 'Atlético de Madrid',
    shortName: 'Atlético',
    color: '#CB3524',
    competition: 'LaLiga',
    coach: 'Diego Simeone',
  },
  'real-betis': {
    id: 'real-betis',
    code: 'BET',
    name: 'Real Betis',
    shortName: 'Betis',
    color: '#00954C',
    competition: 'LaLiga',
    coach: 'Manuel Pellegrini',
  },
  sevilla: {
    id: 'sevilla',
    code: 'SEV',
    name: 'Sevilla',
    shortName: 'Sevilla',
    color: '#D8282F',
    competition: 'LaLiga',
    coach: 'Luis García Plaza',
  },
  'real-sociedad': {
    id: 'real-sociedad',
    code: 'RSO',
    name: 'Real Sociedad',
    shortName: 'R. Sociedad',
    color: '#0067B1',
    competition: 'LaLiga',
    coach: 'Pellegrino Matarazzo',
  },
  alaves: {
    id: 'alaves',
    code: 'ALA',
    name: 'Alavés',
    shortName: 'Alavés',
    color: '#0761AF',
    competition: 'LaLiga',
    coach: 'Quique Sánchez Flores',
  },
  deportivo: {
    id: 'deportivo',
    code: 'DEP',
    name: 'Deportivo',
    shortName: 'Depor',
    color: '#1B5AAB',
    competition: 'LaLiga',
    coach: 'Antonio Hidalgo',
  },
  celta: {
    id: 'celta',
    code: 'CEL',
    name: 'Celta',
    shortName: 'Celta',
    color: '#8AC3EE',
    competition: 'LaLiga',
    coach: 'Claudio Giráldez',
  },
  'athletic-club': {
    id: 'athletic-club',
    code: 'ATH',
    name: 'Athletic Club',
    shortName: 'Athletic',
    color: '#EE2523',
    competition: 'LaLiga',
    coach: 'Edin Terzić',
  },
  villarreal: {
    id: 'villarreal',
    code: 'VIL',
    name: 'Villarreal',
    shortName: 'Villarreal',
    color: '#FFE667',
    competition: 'LaLiga',
    coach: 'Iñigo Pérez',
  },
  espanyol: {
    id: 'espanyol',
    code: 'ESP',
    name: 'Espanyol',
    shortName: 'Espanyol',
    color: '#007FC8',
    competition: 'LaLiga',
    coach: 'Manolo González',
  },
  'rayo-vallecano': {
    id: 'rayo-vallecano',
    code: 'RAY',
    name: 'Rayo Vallecano',
    shortName: 'Rayo',
    color: '#E53027',
    competition: 'LaLiga',
    coach: 'Beñat San José',
  },
  getafe: {
    id: 'getafe',
    code: 'GET',
    name: 'Getafe',
    shortName: 'Getafe',
    color: '#005999',
    competition: 'LaLiga',
    coach: 'José Bordalás',
  },
  racing: {
    id: 'racing',
    code: 'RAC',
    name: 'Racing de Santander',
    shortName: 'Racing',
    color: '#00A650',
    competition: 'LaLiga',
    coach: 'José Alberto López',
  },
  osasuna: {
    id: 'osasuna',
    code: 'OSA',
    name: 'Osasuna',
    shortName: 'Osasuna',
    color: '#D91A21',
    competition: 'LaLiga',
    coach: 'Jagoba Arrasate',
  },
  levante: {
    id: 'levante',
    code: 'LEV',
    name: 'Levante',
    shortName: 'Levante',
    color: '#B4053F',
    competition: 'LaLiga',
    coach: 'Luís Castro',
  },
  elche: {
    id: 'elche',
    code: 'ELC',
    name: 'Elche',
    shortName: 'Elche',
    color: '#05642C',
    competition: 'LaLiga',
    coach: 'Martín Anselmi',
  },
  valencia: {
    id: 'valencia',
    code: 'VAL',
    name: 'Valencia',
    shortName: 'Valencia',
    color: '#EE7814',
    competition: 'LaLiga',
    coach: null,
  },
  malaga: {
    id: 'malaga',
    code: 'MAL',
    name: 'Málaga',
    shortName: 'Málaga',
    color: '#3FA9E0',
    competition: 'LaLiga',
    coach: 'Juan Funes',
  },

  // Otras ligas (solo salen en los partidos en directo de Inicio)
  brentford: {
    id: 'brentford',
    code: 'BRE',
    name: 'Brentford',
    shortName: 'Brentford',
    color: '#E30613',
    competition: 'Premier League',
  },
  liverpool: {
    id: 'liverpool',
    code: 'LIV',
    name: 'Liverpool',
    shortName: 'Liverpool',
    color: '#C8102E',
    competition: 'Premier League',
  },
  'manchester-city': {
    id: 'manchester-city',
    code: 'MCI',
    name: 'Man. City',
    shortName: 'Man. City',
    color: '#6CABDD',
    competition: 'Premier League',
  },
  ipswich: {
    id: 'ipswich',
    code: 'IPS',
    name: 'Ipswich Town',
    shortName: 'Ipswich',
    color: '#1E4AA0',
    competition: 'Premier League',
  },
  'union-berlin': {
    id: 'union-berlin',
    code: 'FCU',
    name: 'Union Berlin',
    shortName: 'Union',
    color: '#D4011D',
    competition: 'Bundesliga',
  },
  dortmund: {
    id: 'dortmund',
    code: 'BVB',
    name: 'Dortmund',
    shortName: 'Dortmund',
    color: '#FDE100',
    competition: 'Bundesliga',
  },
  'rb-leipzig': {
    id: 'rb-leipzig',
    code: 'RBL',
    name: 'RB Leipzig',
    shortName: 'Leipzig',
    color: '#DD0741',
    competition: 'Champions League',
  },
};

/* ---------------------------------------------------------------- */
/* Clasificación de LaLiga (sábado 17/10, 17:00)                     */
/* ---------------------------------------------------------------- */

// Real. Hay partidos jugados distintos porque faltan por jugar el resto de la J9
// y dos aplazados del Athletic (Levante–Athletic de la J6 y Rayo–Athletic de la J8).
// Comprobado: played = won + drawn + lost · points = 3·won + drawn · goalDifference = goalsFor − goalsAgainst.
// form: últimos 5 resultados (V victoria, E empate, D derrota), el más reciente al final.
function row(position, teamId, played, won, drawn, lost, goalsFor, goalsAgainst, points, form) {
  return {
    position,
    teamId,
    played,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points,
    form,
  };
}

export const STANDINGS_LALIGA = [
  row(1, 'barcelona', 8, 8, 0, 0, 34, 7, 24, 'VVVVV'),
  row(2, 'atletico-madrid', 9, 7, 1, 1, 19, 8, 22, 'VVVVV'),
  row(3, 'real-betis', 8, 6, 1, 1, 14, 9, 19, 'VVVEV'),
  row(4, 'real-madrid', 8, 6, 0, 2, 19, 8, 18, 'DVVDV'),
  row(5, 'sevilla', 8, 4, 2, 2, 13, 12, 14, 'EVVDE'),
  row(6, 'real-sociedad', 8, 4, 1, 3, 12, 15, 13, 'VDEVV'),
  row(7, 'alaves', 8, 3, 2, 3, 12, 8, 11, 'VDDED'),
  row(8, 'deportivo', 9, 2, 5, 2, 13, 12, 11, 'EDEDE'),
  row(9, 'celta', 8, 1, 5, 2, 8, 6, 8, 'EEEVE'),
  row(10, 'athletic-club', 6, 2, 2, 2, 7, 6, 8, 'DVVEE'),
  row(11, 'villarreal', 8, 2, 2, 4, 13, 13, 8, 'DDVVD'),
  row(12, 'espanyol', 9, 2, 2, 5, 11, 12, 8, 'VDDED'),
  row(13, 'rayo-vallecano', 7, 2, 2, 3, 11, 16, 8, 'DVDVE'),
  row(14, 'getafe', 8, 2, 2, 4, 4, 10, 8, 'EEDVD'),
  row(15, 'racing', 8, 2, 2, 4, 13, 23, 8, 'DVDDE'),
  row(16, 'osasuna', 8, 2, 2, 4, 8, 18, 8, 'DDDED'),
  row(17, 'levante', 8, 1, 4, 3, 12, 16, 7, 'EDDEE'),
  row(18, 'elche', 8, 1, 3, 4, 11, 17, 6, 'DEDVE'),
  row(19, 'valencia', 8, 1, 2, 5, 6, 15, 5, 'DDVDE'),
  row(20, 'malaga', 8, 0, 4, 4, 4, 13, 4, 'EEDDE'),
];

// Zonas de color de la tabla (posiciones incluidas)
export const STANDINGS_ZONES = [
  { id: 'champions', label: 'Champions League', from: 1, to: 4 },
  { id: 'europa', label: 'Europa League', from: 5, to: 6 },
  { id: 'conference', label: 'Conference League', from: 7, to: 7 },
  { id: 'relegation', label: 'Descenso', from: 18, to: 20 },
];

/* ---------------------------------------------------------------- */
/* Partidos                                                          */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* Jugadores (temporada 2026/27)                                     */
/* ---------------------------------------------------------------- */

// Club, posición, país y dorsal: reales (webs oficiales de los clubes).
// Estadísticas: ESTIMADAS (no se han podido consultar), coherentes con los partidos de su equipo.
// matches: partidos jugados · minutes · goals · assists · xg: goles esperados
// shotsOnTarget: tiros a puerta · passAccuracy: % de pases acertados · cards: tarjetas
// shortName: nombre corto (campo del equipo ideal); si no tiene, se usa name
// Todos tienen las estadísticas del comparador (10): matches, minutes, goals, assists, xg, shotsOnTarget, passAccuracy, cards y rating
// rating: valoración media · ratingsByRound: valoración por jornada (J1…J8)
export const PLAYERS = {
  pedri: {
    id: 'pedri',
    name: 'Pedri',
    teamId: 'barcelona',
    position: 'Centrocampista',
    age: 23,
    country: 'España',
    number: 8,
    matches: 8,
    minutes: 668,
    goals: 2,
    assists: 4,
    xg: 1.5,
    shotsOnTarget: 6,
    passAccuracy: 91,
    cards: 2,
    rating: 8.1, // cards: 2 → en «Actualizar datos» (19) se corrige a 3
    ratingsByRound: [7.4, 8.2, 7.9, 8.6, 7.1, 8.8, 8.0, 8.4],
    passAccuracyByRound: [90, 88, 89, 92, 91, 93, 91, 94], // J4–J8 siempre por encima del 90 %
    // Últimos partidos (J8 → J4): resultados reales del Barça; goles, asistencias, minutos y nota estimados
    lastMatches: [
      { round: 8, opponentId: 'getafe', score: '3-0', result: 'V', goals: 1, assists: 1, minutes: 90, rating: 8.4 },
      { round: 7, opponentId: 'sevilla', score: '3-1', result: 'V', goals: 0, assists: 1, minutes: 90, rating: 8.0 },
      { round: 6, opponentId: 'racing', score: '7-2', result: 'V', goals: 1, assists: 1, minutes: 78, rating: 8.8 },
      { round: 5, opponentId: 'levante', score: '4-2', result: 'V', goals: 0, assists: 0, minutes: 70, rating: 7.1 },
      { round: 4, opponentId: 'valencia', score: '5-0', result: 'V', goals: 0, assists: 0, minutes: 84, rating: 8.6 },
    ],
  },
  bellingham: {
    id: 'bellingham',
    name: 'Jude Bellingham',
    shortName: 'Bellingham',
    teamId: 'real-madrid',
    position: 'Centrocampista',
    age: 23,
    country: 'Inglaterra',
    number: 5,
    matches: 8,
    minutes: 701,
    goals: 5,
    assists: 2,
    xg: 4.0,
    shotsOnTarget: 11,
    passAccuracy: 86,
    cards: 3,
    rating: 7.8,
  },
  'lamine-yamal': {
    id: 'lamine-yamal',
    name: 'Lamine Yamal',
    teamId: 'barcelona',
    position: 'Extremo',
    age: 19,
    country: 'España',
    number: 10,
    matches: 8,
    minutes: 650,
    goals: 4,
    assists: 6,
    xg: 3.2,
    shotsOnTarget: 14,
    passAccuracy: 82,
    cards: 1,
    rating: 8.0,
  },
  mbappe: {
    id: 'mbappe',
    name: 'Kylian Mbappé',
    shortName: 'Mbappé',
    teamId: 'real-madrid',
    position: 'Delantero',
    age: 27,
    country: 'Francia',
    number: 10,
    matches: 8,
    minutes: 712,
    goals: 7,
    assists: 2,
    xg: 6.9,
    shotsOnTarget: 20,
    passAccuracy: 79,
    cards: 1,
    rating: 8.2,
  },
  isco: {
    id: 'isco',
    name: 'Isco',
    teamId: 'real-betis',
    position: 'Centrocampista',
    age: 34,
    country: 'España',
    number: 22,
    matches: 7,
    minutes: 540,
    goals: 4,
    assists: 3,
    xg: 3.1,
    shotsOnTarget: 9,
    passAccuracy: 88,
    cards: 2,
    rating: 7.9,
  },

  // Plantilla del Real Madrid en su ficha (dorsales reales; estadísticas estimadas)
  courtois: {
    id: 'courtois',
    name: 'Thibaut Courtois',
    shortName: 'Courtois',
    teamId: 'real-madrid',
    position: 'Portero',
    number: 1,
    matches: 8,
    goals: 0,
    assists: 0,
    rating: 7.3,
    minutes: 720,
    xg: 0.0,
    shotsOnTarget: 0,
    passAccuracy: 78,
    cards: 0,
  },
  'alexander-arnold': {
    id: 'alexander-arnold',
    name: 'Trent Alexander-Arnold',
    shortName: 'Alexander-Arnold',
    teamId: 'real-madrid',
    position: 'Defensa',
    number: 12,
    matches: 7,
    goals: 0,
    assists: 2,
    rating: 7.1,
    minutes: 560,
    xg: 0.4,
    shotsOnTarget: 3,
    passAccuracy: 84,
    cards: 1,
  },
  militao: {
    id: 'militao',
    name: 'Éder Militão',
    shortName: 'Militão',
    teamId: 'real-madrid',
    position: 'Defensa',
    number: 3,
    matches: 7,
    goals: 1,
    assists: 0,
    rating: 7.0,
    minutes: 610,
    xg: 0.8,
    shotsOnTarget: 2,
    passAccuracy: 90,
    cards: 2,
  },
  huijsen: {
    id: 'huijsen',
    name: 'Dean Huijsen',
    shortName: 'Huijsen',
    teamId: 'real-madrid',
    position: 'Defensa',
    number: 4,
    matches: 8,
    goals: 0,
    assists: 0,
    rating: 7.1,
    minutes: 705,
    xg: 0.3,
    shotsOnTarget: 1,
    passAccuracy: 92,
    cards: 1,
  },
  valverde: {
    id: 'valverde',
    name: 'Federico Valverde',
    shortName: 'Valverde',
    teamId: 'real-madrid',
    position: 'Centrocampista',
    number: 8,
    matches: 8,
    goals: 1,
    assists: 3,
    rating: 7.5,
    minutes: 690,
    xg: 1.4,
    shotsOnTarget: 6,
    passAccuracy: 89,
    cards: 1,
  },
  vinicius: {
    id: 'vinicius',
    name: 'Vinícius Jr.',
    teamId: 'real-madrid',
    position: 'Delantero',
    number: 7,
    matches: 8,
    goals: 3,
    assists: 4,
    rating: 7.9,
    minutes: 640,
    xg: 3.6,
    shotsOnTarget: 13,
    passAccuracy: 80,
    cards: 2,
  },
  'raul-asencio': {
    id: 'raul-asencio',
    name: 'Raúl Asencio',
    shortName: 'Asencio',
    teamId: 'real-madrid',
    position: 'Defensa',
    number: 2,
    goals: 0,
    assists: 0,
    matches: 4,
    minutes: 290,
    xg: 0.1,
    shotsOnTarget: 0,
    passAccuracy: 88,
    cards: 1,
    rating: 6.8,
  },

  // Resto del equipo ideal de ejemplo
  aramburu: {
    id: 'aramburu',
    name: 'Jon Aramburu',
    shortName: 'Aramburu',
    teamId: 'real-sociedad',
    position: 'Defensa',
    goals: 0,
    assists: 1,
    rating: 7.0,
    matches: 8,
    minutes: 700,
    xg: 0.3,
    shotsOnTarget: 2,
    passAccuracy: 82,
    cards: 2,
  },
  laporte: {
    id: 'laporte',
    name: 'Aymeric Laporte',
    shortName: 'Laporte',
    teamId: 'athletic-club',
    position: 'Defensa',
    number: 14,
    rating: 7.2,
    matches: 6,
    minutes: 540,
    goals: 0,
    assists: 0,
    xg: 0.5,
    shotsOnTarget: 1,
    passAccuracy: 91,
    cards: 1,
  },
  balde: {
    id: 'balde',
    name: 'Alejandro Balde',
    shortName: 'Balde',
    teamId: 'barcelona',
    position: 'Defensa',
    number: 3,
    rating: 7.0,
    matches: 8,
    minutes: 620,
    goals: 1,
    assists: 0,
    xg: 0.4,
    shotsOnTarget: 3,
    passAccuracy: 87,
    cards: 1,
  },
  baena: {
    id: 'baena',
    name: 'Álex Baena',
    shortName: 'Baena',
    teamId: 'atletico-madrid',
    position: 'Centrocampista',
    rating: 7.6,
    matches: 9,
    minutes: 720,
    goals: 2,
    assists: 3,
    xg: 2.1,
    shotsOnTarget: 8,
    passAccuracy: 84,
    cards: 3,
  },

  // Otros que salen en la búsqueda «ra» y en el buscador del equipo ideal (estadísticas estimadas)
  raphinha: {
    id: 'raphinha',
    name: 'Raphinha',
    teamId: 'barcelona',
    position: 'Extremo',
    number: 11,
    goals: 5,
    assists: 3,
    rating: 7.8,
    matches: 8,
    minutes: 610,
    xg: 4.4,
    shotsOnTarget: 12,
    passAccuracy: 81,
    cards: 1,
  },
  'gerard-martin': {
    id: 'gerard-martin',
    name: 'Gerard Martín',
    shortName: 'Gerard Martín',
    teamId: 'barcelona',
    position: 'Defensa',
    number: 18,
    goals: 0,
    assists: 1,
    matches: 6,
    minutes: 430,
    xg: 0.2,
    shotsOnTarget: 1,
    passAccuracy: 89,
    cards: 1,
    rating: 6.9,
  },
  'nico-williams': {
    id: 'nico-williams',
    name: 'Nico Williams',
    teamId: 'athletic-club',
    position: 'Extremo',
    goals: 3,
    assists: 3,
    rating: 7.5,
    matches: 6,
    minutes: 470,
    xg: 2.5,
    shotsOnTarget: 9,
    passAccuracy: 78,
    cards: 1,
  },
  kubo: {
    id: 'kubo',
    name: 'Take Kubo',
    teamId: 'real-sociedad',
    position: 'Extremo',
    goals: 2,
    rating: 7.1,
    matches: 8,
    minutes: 580,
    assists: 2,
    xg: 2.0,
    shotsOnTarget: 8,
    passAccuracy: 83,
    cards: 0,
  },
  'giuliano-simeone': {
    id: 'giuliano-simeone',
    name: 'Giuliano Simeone',
    shortName: 'Giuliano',
    teamId: 'atletico-madrid',
    position: 'Extremo',
    goals: 2,
    rating: 7.0,
    matches: 9,
    minutes: 640,
    assists: 1,
    xg: 1.9,
    shotsOnTarget: 7,
    passAccuracy: 77,
    cards: 2,
  },
};

/* ---------------------------------------------------------------- */
/* Árbitros                                                          */
/* ---------------------------------------------------------------- */

// Árbitros reales de Primera; las cifras son ESTIMADAS.
// cardsPerMatch: tarjetas por partido (media de LaLiga: LEAGUE_CARDS_PER_MATCH)
export const LEAGUE_CARDS_PER_MATCH = 4.9;

// fullName, comité territorial, FIFA, partidos, rojas y penaltis: los del mockup 06 (los árbitros y sus comités son
// reales; las cifras, ESTIMADAS). yellowCards: amarillas (estimadas, cuadran más o menos con partidos × tarjetas por partido − rojas).
// age y since (año de debut en Primera): aproximados (06/07).
// shortName: como sale en el móvil y en las migas («Gil Manzano»)
export const REFEREES = [
  {
    id: 'gil-manzano',
    name: 'Jesús Gil Manzano',
    shortName: 'Gil Manzano',
    committee: 'Extremadura',
    committeeAdjective: 'extremeño',
    fifa: true,
    age: 43,
    since: 2012,
    cardsPerMatch: 5.8,
    matches: 5,
    yellowCards: 27,
    redCards: 2,
    penalties: 3,
    // Partidos dirigidos (partidos y resultados reales; que los pitara él y sus tarjetas, estimado)
    cardsByMatch: [
      { round: 8, date: '11/10', homeId: 'real-betis', awayId: 'osasuna', score: [5, 2], yellow: 5, red: 1 },
      { round: 7, date: '20/09', homeId: 'atletico-madrid', awayId: 'real-madrid', score: [2, 1], yellow: 5, red: 0 },
      { round: 5, date: '13/09', homeId: 'real-sociedad', awayId: 'atletico-madrid', score: [0, 3], yellow: 7, red: 0 },
      { round: 3, date: '30/08', homeId: 'celta', awayId: 'athletic-club', score: [0, 2], yellow: 4, red: 1 },
      { round: 1, date: '15/08', homeId: 'alaves', awayId: 'getafe', score: [3, 0], yellow: 6, red: 0 },
    ],
  },
  {
    id: 'soto-grado',
    name: 'César Soto Grado',
    shortName: 'Soto Grado',
    committee: 'La Rioja',
    committeeAdjective: 'riojano',
    fifa: true,
    age: 46,
    since: 2012,
    cardsPerMatch: 5.5,
    matches: 4,
    yellowCards: 20,
    redCards: 2,
    penalties: 1,
  },
  {
    id: 'diaz-de-mera',
    name: 'Isidro Díaz de Mera',
    shortName: 'Díaz de Mera',
    committee: 'Castilla-La Mancha',
    committeeAdjective: 'castellanomanchego',
    fifa: false,
    age: 39,
    since: 2019,
    cardsPerMatch: 5.5,
    matches: 4,
    yellowCards: 21,
    redCards: 1,
    penalties: 2,
  },
  {
    id: 'cuadra',
    name: 'Guillermo Cuadra Fernández',
    shortName: 'Cuadra Fernández',
    committee: 'Baleares',
    committeeAdjective: 'balear',
    fifa: false,
    age: 40,
    since: 2016,
    cardsPerMatch: 5.3,
    matches: 4,
    yellowCards: 20,
    redCards: 1,
    penalties: 0,
  },
  {
    id: 'hernandez',
    name: 'Alejandro Hernández Hernández',
    shortName: 'Hernández Hernández',
    committee: 'Canarias',
    committeeAdjective: 'canario',
    fifa: true,
    age: 44,
    since: 2012,
    cardsPerMatch: 5.0,
    matches: 4,
    yellowCards: 20,
    redCards: 0,
    penalties: 2,
  },
  {
    id: 'munuera',
    name: 'José Luis Munuera Montero',
    shortName: 'Munuera Montero',
    committee: 'Andalucía',
    committeeAdjective: 'andaluz',
    fifa: true,
    age: 43,
    since: 2013,
    cardsPerMatch: 4.8,
    matches: 5,
    yellowCards: 23,
    redCards: 1,
    penalties: 2,
  },
  {
    id: 'martinez-munuera',
    name: 'Juan Martínez Munuera',
    shortName: 'Martínez Munuera',
    committee: 'C. Valenciana',
    committeeAdjective: 'valenciano',
    fifa: true,
    age: 44,
    since: 2010,
    cardsPerMatch: 4.6,
    matches: 5,
    yellowCards: 23,
    redCards: 0,
    penalties: 3,
  },
  {
    id: 'alberola',
    name: 'Javier Alberola Rojas',
    shortName: 'Alberola Rojas',
    committee: 'Castilla-La Mancha',
    committeeAdjective: 'castellanomanchego',
    fifa: false,
    age: 36,
    since: 2018,
    cardsPerMatch: 4.4,
    matches: 5,
    yellowCards: 22,
    redCards: 0,
    penalties: 1,
  },
  {
    id: 'sanchez-martinez',
    name: 'José María Sánchez Martínez',
    shortName: 'Sánchez Martínez',
    committee: 'Murcia',
    committeeAdjective: 'murciano',
    fifa: true,
    age: 43,
    since: 2013,
    cardsPerMatch: 4.2,
    matches: 5,
    yellowCards: 20,
    redCards: 1,
    penalties: 1,
  },
  {
    id: 'ortiz-arias',
    name: 'Miguel Ángel Ortiz Arias',
    shortName: 'Ortiz Arias',
    committee: 'Madrid',
    committeeAdjective: 'madrileño',
    fifa: false,
    age: 40,
    since: 2019,
    cardsPerMatch: 4.0,
    matches: 4,
    yellowCards: 16,
    redCards: 0,
    penalties: 1,
  },
];

/* ---------------------------------------------------------------- */
/* Análisis (artículos de los editores)                              */
/* ---------------------------------------------------------------- */

// Los titulares se apoyan en datos reales; las visitas son estimadas.
// category: Táctica, Datos, Crónica o Previa
// status: 'published' (Publicado), 'scheduled' (Programado) o 'draft' (Borrador)
// date y visits: null si todavía no se ha publicado
export const ARTICLES = [
  // Panel de editor («Mis artículos»)
  {
    id: 'pedri-arte-de-no-perder-el-balon',
    title: 'Pedri y el arte de no perder el balón',
    category: 'Táctica',
    status: 'published',
    date: '15/10/2026',
    visits: 4812,
    author: 'Carlota R.',
  },
  {
    id: 'barca-ocho-de-ocho',
    title: 'Barça: ocho de ocho y 34 goles a favor',
    category: 'Crónica',
    status: 'published',
    date: '11/10/2026',
    visits: 3205,
    author: 'Iván R.',
  },
  {
    id: 'previa-barcelona-real-madrid',
    title: 'Previa: Barcelona – Real Madrid, el Clásico del liderato',
    category: 'Previa',
    status: 'scheduled',
    date: '24/10/2026',
    visits: null,
    author: 'Ángel M.',
  },
  {
    id: 'madrid-de-mourinho',
    title: 'El Madrid de Mourinho: orden atrás y Mbappé arriba',
    category: 'Táctica',
    status: 'published',
    date: '14/10/2026',
    visits: 2954,
    author: 'Ángel M.',
  },
  {
    id: 'celta-athletic-defensas',
    title: 'Celta y Athletic, las defensas menos goleadas',
    category: 'Datos',
    status: 'published',
    date: '13/10/2026',
    visits: 3610,
    author: 'Carlota R.',
  },
  {
    id: 'porteros-que-mas-paran',
    title: 'Los porteros que más paran de LaLiga',
    category: 'Datos',
    status: 'draft',
    date: null,
    visits: null,
    author: 'Carlota R.',
  },
  {
    id: 'atletico-cinco-victorias',
    title: 'El Atlético encadena cinco victorias y ya es segundo',
    category: 'Datos',
    status: 'published',
    date: '17/10/2026',
    visits: 1877,
    author: 'Iván R.',
  },
  {
    id: 'como-leer-el-xg',
    title: 'Cómo leer el xG sin volverse loco',
    category: 'Datos',
    status: 'draft',
    date: null,
    visits: null,
    author: 'Ángel M.',
  },
  // Solo en Análisis (de otros editores)
  {
    id: 'previa-real-madrid-sevilla',
    title: 'Previa: Real Madrid – Sevilla, el Bernabéu aprieta',
    category: 'Previa',
    status: 'published',
    date: '17/10/2026',
    visits: 1240,
    author: 'Ángel M.',
  },
  {
    id: 'gil-manzano-tarjeta-facil',
    title: 'Gil Manzano y la tarjeta fácil',
    category: 'Datos',
    status: 'published',
    date: '14/10/2026',
    visits: 2105,
    author: 'Carlota R.',
  },
];

// Indicadores del panel de editor (estimados). Publicados y borradores se cuentan en ARTICLES
export const EDITOR_STATS = { monthlyVisits: 18420, visitsChange: '+24 % vs septiembre', comments: 146 };

/* ---------------------------------------------------------------- */
/* Funciones de ayuda                                                */
/* ---------------------------------------------------------------- */

// Con Object.hasOwn, ids como «constructor» o «toString» no devuelven cosas heredadas de Object
export function getTeam(id) {
  return Object.hasOwn(TEAMS, id ?? '') ? TEAMS[id] : undefined;
}

export function getPlayer(id) {
  return Object.hasOwn(PLAYERS, id ?? '') ? PLAYERS[id] : undefined;
}

export function getReferee(id) {
  return REFEREES.find((referee) => referee.id === id);
}

export function getArticle(id) {
  return ARTICLES.find((article) => article.id === id);
}

// Zona de la tabla a la que pertenece una posición (o undefined si no tiene)
export function getStandingsZone(position) {
  return STANDINGS_ZONES.find((zone) => position >= zone.from && position <= zone.to);
}

/* ---------------------------------------------------------------- */
/* --- Página 04 · Ficha de jugador ---                              */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* --- Página 11 · Mi equipo ideal ---                              */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* --- Página 03 · Ficha de equipo ---                               */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* --- Página 12 · Mi perfil ---                                     */
/* ---------------------------------------------------------------- */
