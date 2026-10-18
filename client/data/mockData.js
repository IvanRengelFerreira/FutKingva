/*
 * FutKingva · Datos de ejemplo
 * ------------------------------------------------------------------
 * Todos los datos de la web, escritos a mano (no hay servidor). Son los
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
export const TODAY = { label: 'Sábado 17 de octubre', round: 9, time: '17:00' };

/* ---------------------------------------------------------------- */
/* Equipos                                                           */
/* ---------------------------------------------------------------- */

// code: siglas del escudo · shortName: nombre corto (tarjetas de partido)
// color: color del club para el escudo (borde; el fondo es el mismo color al 16 %)
// coach: entrenador (según Wikipedia, octubre de 2026)
export const TEAMS = {
  // LaLiga 2026/27 (ascendidos: Racing, Deportivo y Málaga; bajaron Mallorca, Girona y Oviedo)
  'real-madrid': { id: 'real-madrid', code: 'RMA', name: 'Real Madrid', shortName: 'R. Madrid', color: '#D9D9D9', competition: 'LaLiga', coach: 'José Mourinho' },
  barcelona: { id: 'barcelona', code: 'FCB', name: 'Barcelona', shortName: 'Barça', color: '#A50044', competition: 'LaLiga', coach: 'Hansi Flick' },
  'atletico-madrid': { id: 'atletico-madrid', code: 'ATM', name: 'Atlético de Madrid', shortName: 'Atlético', color: '#CB3524', competition: 'LaLiga', coach: 'Diego Simeone' },
  'real-betis': { id: 'real-betis', code: 'BET', name: 'Real Betis', shortName: 'Betis', color: '#00954C', competition: 'LaLiga', coach: 'Manuel Pellegrini' },
  sevilla: { id: 'sevilla', code: 'SEV', name: 'Sevilla', shortName: 'Sevilla', color: '#D8282F', competition: 'LaLiga', coach: 'Luis García Plaza' },
  'real-sociedad': { id: 'real-sociedad', code: 'RSO', name: 'Real Sociedad', shortName: 'R. Sociedad', color: '#0067B1', competition: 'LaLiga', coach: 'Pellegrino Matarazzo' },
  alaves: { id: 'alaves', code: 'ALA', name: 'Alavés', shortName: 'Alavés', color: '#0761AF', competition: 'LaLiga', coach: 'Quique Sánchez Flores' },
  deportivo: { id: 'deportivo', code: 'DEP', name: 'Deportivo', shortName: 'Depor', color: '#1B5AAB', competition: 'LaLiga', coach: 'Antonio Hidalgo' },
  celta: { id: 'celta', code: 'CEL', name: 'Celta', shortName: 'Celta', color: '#8AC3EE', competition: 'LaLiga', coach: 'Claudio Giráldez' },
  'athletic-club': { id: 'athletic-club', code: 'ATH', name: 'Athletic Club', shortName: 'Athletic', color: '#EE2523', competition: 'LaLiga', coach: 'Edin Terzić' },
  villarreal: { id: 'villarreal', code: 'VIL', name: 'Villarreal', shortName: 'Villarreal', color: '#FFE667', competition: 'LaLiga', coach: 'Iñigo Pérez' },
  espanyol: { id: 'espanyol', code: 'ESP', name: 'Espanyol', shortName: 'Espanyol', color: '#007FC8', competition: 'LaLiga', coach: 'Manolo González' },
  'rayo-vallecano': { id: 'rayo-vallecano', code: 'RAY', name: 'Rayo Vallecano', shortName: 'Rayo', color: '#E53027', competition: 'LaLiga', coach: 'Beñat San José' },
  getafe: { id: 'getafe', code: 'GET', name: 'Getafe', shortName: 'Getafe', color: '#005999', competition: 'LaLiga', coach: 'José Bordalás' },
  racing: { id: 'racing', code: 'RAC', name: 'Racing de Santander', shortName: 'Racing', color: '#00A650', competition: 'LaLiga', coach: 'José Alberto López' },
  osasuna: { id: 'osasuna', code: 'OSA', name: 'Osasuna', shortName: 'Osasuna', color: '#D91A21', competition: 'LaLiga', coach: 'Jagoba Arrasate' },
  levante: { id: 'levante', code: 'LEV', name: 'Levante', shortName: 'Levante', color: '#B4053F', competition: 'LaLiga', coach: 'Luís Castro' },
  elche: { id: 'elche', code: 'ELC', name: 'Elche', shortName: 'Elche', color: '#05642C', competition: 'LaLiga', coach: 'Martín Anselmi' },
  valencia: { id: 'valencia', code: 'VAL', name: 'Valencia', shortName: 'Valencia', color: '#EE7814', competition: 'LaLiga', coach: null },
  malaga: { id: 'malaga', code: 'MAL', name: 'Málaga', shortName: 'Málaga', color: '#3FA9E0', competition: 'LaLiga', coach: 'Juan Funes' },

  // Otras ligas (solo salen en los partidos en directo de Inicio)
  brentford: { id: 'brentford', code: 'BRE', name: 'Brentford', shortName: 'Brentford', color: '#E30613', competition: 'Premier League' },
  liverpool: { id: 'liverpool', code: 'LIV', name: 'Liverpool', shortName: 'Liverpool', color: '#C8102E', competition: 'Premier League' },
  'manchester-city': { id: 'manchester-city', code: 'MCI', name: 'Man. City', shortName: 'Man. City', color: '#6CABDD', competition: 'Premier League' },
  ipswich: { id: 'ipswich', code: 'IPS', name: 'Ipswich Town', shortName: 'Ipswich', color: '#1E4AA0', competition: 'Premier League' },
  'union-berlin': { id: 'union-berlin', code: 'FCU', name: 'Union Berlin', shortName: 'Union', color: '#D4011D', competition: 'Bundesliga' },
  dortmund: { id: 'dortmund', code: 'BVB', name: 'Dortmund', shortName: 'Dortmund', color: '#FDE100', competition: 'Bundesliga' },
  'rb-leipzig': { id: 'rb-leipzig', code: 'RBL', name: 'RB Leipzig', shortName: 'Leipzig', color: '#DD0741', competition: 'Champions League' },
};

/* ---------------------------------------------------------------- */
/* Clasificación de LaLiga (sábado 17/10, 17:00)                     */
/* ---------------------------------------------------------------- */

// Real. Hay partidos jugados distintos porque faltan por jugar el resto de la J9
// y dos aplazados del Athletic (Levante–Athletic de la J6 y Rayo–Athletic de la J8).
// Comprobado: played = won + drawn + lost · points = 3·won + drawn · goalDifference = goalsFor − goalsAgainst.
// form: últimos 5 resultados (V victoria, E empate, D derrota), el más reciente al final.
function row(position, teamId, played, won, drawn, lost, goalsFor, goalsAgainst, points, form) {
  return { position, teamId, played, won, drawn, lost, goalsFor, goalsAgainst, goalDifference: goalsFor - goalsAgainst, points, form };
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

// En juego a las 17:00. score: [local, visitante] · minute: minuto actual (de 90).
// Villarreal–Elche es real (acabó 0-0). Los marcadores de la Premier y la Bundesliga
// son simulados: los partidos sí son de ese día, pero su resultado no se pudo consultar.
export const LIVE_MATCHES = [
  { id: 'vil-elc', homeId: 'villarreal', awayId: 'elche', score: [0, 0], minute: 38, competition: 'LaLiga' },
  { id: 'bre-liv', homeId: 'brentford', awayId: 'liverpool', score: [1, 1], minute: 52, competition: 'Premier League', simulated: true },
  { id: 'mci-ips', homeId: 'manchester-city', awayId: 'ipswich', score: [2, 0], minute: 52, competition: 'Premier League', simulated: true },
  { id: 'fcu-bvb', homeId: 'union-berlin', awayId: 'dortmund', score: [0, 1], minute: 81, competition: 'Bundesliga', simulated: true },
];

// Próximos partidos (hora peninsular): resto de la J9 y los siguientes del Real Madrid (ficha de equipo)
export const UPCOMING_MATCHES = [
  { date: 'Sáb 17/10', time: '18:30', homeId: 'real-betis', awayId: 'barcelona' },
  { date: 'Sáb 17/10', time: '21:00', homeId: 'valencia', awayId: 'athletic-club' },
  { date: 'Dom 18/10', time: '14:00', homeId: 'osasuna', awayId: 'racing' },
  { date: 'Dom 18/10', time: '16:15', homeId: 'celta', awayId: 'alaves' },
  { date: 'Dom 18/10', time: '18:30', homeId: 'malaga', awayId: 'real-sociedad' },
  { date: 'Dom 18/10', time: '21:00', homeId: 'real-madrid', awayId: 'sevilla' },
  { date: 'Lun 19/10', time: '21:00', homeId: 'getafe', awayId: 'rayo-vallecano' },
  { date: 'Mié 21/10', time: '21:00', homeId: 'real-madrid', awayId: 'rb-leipzig', competition: 'Champions League' },
  { date: 'Dom 25/10', time: '20:00', homeId: 'barcelona', awayId: 'real-madrid', round: 10 }, // el Clásico
];

// Últimos resultados (J9 ya jugados y final de la J8), del más reciente al más antiguo
export const LATEST_RESULTS = [
  { date: '17/10', homeId: 'espanyol', awayId: 'atletico-madrid', score: [0, 1], competition: 'LaLiga' },
  { date: '16/10', homeId: 'deportivo', awayId: 'levante', score: [1, 1], competition: 'LaLiga' },
  { date: '12/10', homeId: 'levante', awayId: 'sevilla', score: [3, 3], competition: 'LaLiga' },
  { date: '11/10', homeId: 'real-betis', awayId: 'osasuna', score: [5, 2], competition: 'LaLiga' },
  { date: '11/10', homeId: 'real-sociedad', awayId: 'deportivo', score: [3, 2], competition: 'LaLiga' },
  { date: '11/10', homeId: 'racing', awayId: 'valencia', score: [2, 2], competition: 'LaLiga' },
];

/* ---------------------------------------------------------------- */
/* Jugadores (temporada 2026/27)                                     */
/* ---------------------------------------------------------------- */

// Club, posición, país y dorsal: reales (webs oficiales de los clubes).
// Estadísticas: ESTIMADAS (no se han podido consultar), coherentes con los partidos de su equipo.
// matches: partidos jugados · minutes · goals · assists · xg: goles esperados
// shotsOnTarget: tiros a puerta · passAccuracy: % de pases acertados · cards: tarjetas
// rating: valoración media · ratingsByRound: valoración por jornada (J1…J8)
export const PLAYERS = {
  pedri: {
    id: 'pedri', name: 'Pedri', teamId: 'barcelona', position: 'Centrocampista', age: 23, country: 'España', number: 8,
    matches: 8, minutes: 668, goals: 2, assists: 4, xg: 1.5, shotsOnTarget: 6, passAccuracy: 91, cards: 2, rating: 8.1, // cards: 2 → en «Actualizar datos» (19) se corrige a 3
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
    id: 'bellingham', name: 'Jude Bellingham', teamId: 'real-madrid', position: 'Centrocampista', age: 23, country: 'Inglaterra', number: 5,
    matches: 8, minutes: 701, goals: 5, assists: 2, xg: 4.0, shotsOnTarget: 11, passAccuracy: 86, cards: 3, rating: 7.8,
  },
  'lamine-yamal': {
    id: 'lamine-yamal', name: 'Lamine Yamal', teamId: 'barcelona', position: 'Extremo', age: 19, country: 'España', number: 10,
    matches: 8, minutes: 650, goals: 4, assists: 6, xg: 3.2, shotsOnTarget: 14, passAccuracy: 82, cards: 1, rating: 8.0,
  },
  mbappe: {
    id: 'mbappe', name: 'Kylian Mbappé', teamId: 'real-madrid', position: 'Delantero', age: 27, country: 'Francia', number: 10,
    matches: 8, minutes: 712, goals: 7, assists: 2, xg: 6.9, shotsOnTarget: 20, passAccuracy: 79, cards: 1, rating: 8.2,
  },
  isco: {
    id: 'isco', name: 'Isco', teamId: 'real-betis', position: 'Centrocampista', age: 34, country: 'España', number: 22,
  },

  // Plantilla del Real Madrid en su ficha (dorsales reales; estadísticas estimadas)
  courtois: { id: 'courtois', name: 'Thibaut Courtois', teamId: 'real-madrid', position: 'Portero', number: 1, matches: 8, goals: 0, assists: 0, rating: 7.3 },
  'alexander-arnold': { id: 'alexander-arnold', name: 'Trent Alexander-Arnold', teamId: 'real-madrid', position: 'Defensa', number: 12, matches: 7, goals: 0, assists: 2, rating: 7.1 },
  militao: { id: 'militao', name: 'Éder Militão', teamId: 'real-madrid', position: 'Defensa', number: 3, matches: 7, goals: 1, assists: 0, rating: 7.0 },
  huijsen: { id: 'huijsen', name: 'Dean Huijsen', teamId: 'real-madrid', position: 'Defensa', number: 4, matches: 8, goals: 0, assists: 0, rating: 7.1 },
  valverde: { id: 'valverde', name: 'Federico Valverde', teamId: 'real-madrid', position: 'Centrocampista', number: 8, matches: 8, goals: 1, assists: 3, rating: 7.5 },
  vinicius: { id: 'vinicius', name: 'Vinícius Jr.', teamId: 'real-madrid', position: 'Delantero', number: 7, matches: 8, goals: 3, assists: 4, rating: 7.9 },
  'raul-asencio': { id: 'raul-asencio', name: 'Raúl Asencio', teamId: 'real-madrid', position: 'Defensa', number: 2, goals: 0, assists: 0 },

  // Resto del equipo ideal de ejemplo
  aramburu: { id: 'aramburu', name: 'Jon Aramburu', teamId: 'real-sociedad', position: 'Defensa', goals: 0, assists: 1, rating: 7.0 },
  laporte: { id: 'laporte', name: 'Aymeric Laporte', teamId: 'athletic-club', position: 'Defensa', number: 14, rating: 7.2 },
  balde: { id: 'balde', name: 'Alejandro Balde', teamId: 'barcelona', position: 'Defensa', number: 3, rating: 7.0 },
  baena: { id: 'baena', name: 'Álex Baena', teamId: 'atletico-madrid', position: 'Centrocampista', rating: 7.6 },

  // Otros que salen en la búsqueda «ra» y en el buscador del equipo ideal (estadísticas estimadas)
  raphinha: { id: 'raphinha', name: 'Raphinha', teamId: 'barcelona', position: 'Extremo', number: 11, goals: 5, assists: 3, rating: 7.8 },
  'gerard-martin': { id: 'gerard-martin', name: 'Gerard Martín', teamId: 'barcelona', position: 'Defensa', number: 18, goals: 0, assists: 1 },
  'nico-williams': { id: 'nico-williams', name: 'Nico Williams', teamId: 'athletic-club', position: 'Extremo', goals: 3, assists: 3, rating: 7.5 },
  kubo: { id: 'kubo', name: 'Take Kubo', teamId: 'real-sociedad', position: 'Extremo', goals: 2, rating: 7.1 },
  'giuliano-simeone': { id: 'giuliano-simeone', name: 'Giuliano Simeone', teamId: 'atletico-madrid', position: 'Extremo', goals: 2, rating: 7.0 },
};

// Jugador de la jornada 8: Isco, doblete en el Betis 5-2 Osasuna (real; la nota es estimada)
export const PLAYER_OF_THE_ROUND = { playerId: 'isco', round: 8, rating: 9.1, note: 'Doblete ante Osasuna' };

// Comparador de ejemplo: jugador A (serie/1, oro), B (serie/2, azul) y C (serie/3, violeta)
export const COMPARISON_EXAMPLE = ['pedri', 'bellingham', 'lamine-yamal'];

// Equipo ideal de ejemplo (4-3-3, 10 de 11: falta el extremo izquierdo).
// Regla de negocio: un equipo ideal no repite posición. Totales estimados.
export const IDEAL_TEAM_EXAMPLE = {
  name: 'Los Coronados',
  formation: '4-3-3',
  players: [
    { slot: 'POR', playerId: 'courtois' },
    { slot: 'LD', playerId: 'aramburu' },
    { slot: 'DFC1', playerId: 'militao' },
    { slot: 'DFC2', playerId: 'laporte' },
    { slot: 'LI', playerId: 'balde' },
    { slot: 'MC1', playerId: 'baena' },
    { slot: 'MC2', playerId: 'pedri' },
    { slot: 'MC3', playerId: 'valverde' },
    { slot: 'ED', playerId: 'lamine-yamal' },
    { slot: 'DC', playerId: 'mbappe' },
    { slot: 'EI', playerId: null },
  ],
  totals: { goals: 18, assists: 19, averageAge: 26.2, averageRating: 7.5 },
};

/* ---------------------------------------------------------------- */
/* Árbitros                                                          */
/* ---------------------------------------------------------------- */

// Árbitros reales de Primera; las cifras son ESTIMADAS.
// cardsPerMatch: tarjetas por partido (media de LaLiga: LEAGUE_CARDS_PER_MATCH)
export const LEAGUE_CARDS_PER_MATCH = 4.9;

export const REFEREES = [
  {
    id: 'gil-manzano', name: 'Jesús Gil Manzano', cardsPerMatch: 5.8,
    matches: 5, yellowCards: 27, redCards: 2, penalties: 3,
    // Partidos dirigidos (partidos y resultados reales; que los pitara él y sus tarjetas, estimado)
    cardsByMatch: [
      { round: 8, date: '11/10', homeId: 'real-betis', awayId: 'osasuna', score: [5, 2], yellow: 5, red: 1 },
      { round: 7, date: '20/09', homeId: 'atletico-madrid', awayId: 'real-madrid', score: [2, 1], yellow: 5, red: 0 },
      { round: 5, date: '13/09', homeId: 'real-sociedad', awayId: 'atletico-madrid', score: [0, 3], yellow: 7, red: 0 },
      { round: 3, date: '30/08', homeId: 'celta', awayId: 'athletic-club', score: [0, 2], yellow: 4, red: 1 },
      { round: 1, date: '15/08', homeId: 'alaves', awayId: 'getafe', score: [3, 0], yellow: 6, red: 0 },
    ],
  },
  { id: 'soto-grado', name: 'Soto Grado', cardsPerMatch: 5.6 },
  { id: 'diaz-de-mera', name: 'Díaz de Mera', cardsPerMatch: 5.5 },
  { id: 'cuadra', name: 'Cuadra', cardsPerMatch: 5.3 },
  { id: 'hernandez', name: 'Hernández', cardsPerMatch: 5.0 },
  { id: 'munuera', name: 'Munuera', cardsPerMatch: 4.8 },
  { id: 'martinez-munuera', name: 'Martínez Munuera', cardsPerMatch: 4.6 },
  { id: 'alberola', name: 'Alberola', cardsPerMatch: 4.4 },
  { id: 'sanchez-martinez', name: 'Sánchez Martínez', cardsPerMatch: 4.2 },
  { id: 'ortiz-arias', name: 'Ortiz Arias', cardsPerMatch: 4.0 },
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
  { id: 'pedri-arte-de-no-perder-el-balon', title: 'Pedri y el arte de no perder el balón', category: 'Táctica', status: 'published', date: '15/10/2026', visits: 4812, author: 'Carlota R.' },
  { id: 'barca-ocho-de-ocho', title: 'Barça: ocho de ocho y 34 goles a favor', category: 'Crónica', status: 'published', date: '11/10/2026', visits: 3205, author: 'Iván R.' },
  { id: 'previa-barcelona-real-madrid', title: 'Previa: Barcelona – Real Madrid, el Clásico del liderato', category: 'Previa', status: 'scheduled', date: '24/10/2026', visits: null, author: 'Ángel M.' },
  { id: 'madrid-de-mourinho', title: 'El Madrid de Mourinho: orden atrás y Mbappé arriba', category: 'Táctica', status: 'published', date: '14/10/2026', visits: 2954, author: 'Ángel M.' },
  { id: 'celta-athletic-defensas', title: 'Celta y Athletic, las defensas menos goleadas', category: 'Datos', status: 'published', date: '13/10/2026', visits: 3610, author: 'Carlota R.' },
  { id: 'porteros-que-mas-paran', title: 'Los porteros que más paran de LaLiga', category: 'Datos', status: 'draft', date: null, visits: null, author: 'Carlota R.' },
  { id: 'atletico-cinco-victorias', title: 'El Atlético encadena cinco victorias y ya es segundo', category: 'Datos', status: 'published', date: '17/10/2026', visits: 1877, author: 'Iván R.' },
  { id: 'como-leer-el-xg', title: 'Cómo leer el xG sin volverse loco', category: 'Datos', status: 'draft', date: null, visits: null, author: 'Ángel M.' },
  // Solo en Análisis (de otros editores)
  { id: 'previa-real-madrid-sevilla', title: 'Previa: Real Madrid – Sevilla, el Bernabéu aprieta', category: 'Previa', status: 'published', date: '17/10/2026', visits: 1240, author: 'Ángel M.' },
  { id: 'gil-manzano-tarjeta-facil', title: 'Gil Manzano y la tarjeta fácil', category: 'Datos', status: 'published', date: '14/10/2026', visits: 2105, author: 'Carlota R.' },
];

// Indicadores del panel de editor (estimados)
export const EDITOR_STATS = { published: 12, drafts: 3, monthlyVisits: 18420, visitsChange: '+24 % vs septiembre', comments: 146 };

/* ---------------------------------------------------------------- */
/* Notificaciones en directo (RF9)                                   */
/* ---------------------------------------------------------------- */

// Hechos reales; la hora es la del momento congelado (sábado, 17:00).
// type: 'goal' (balón) o 'standings' (tendencia) · unread: sin leer
export const NOTIFICATIONS = [
  { id: 1, type: 'goal', title: '¡Gol de Baena!', detail: "Espanyol 0 – 1 Atlético · 89'", time: 'hace 1 h', unread: true },
  { id: 2, type: 'standings', title: 'El Atlético se pone 2.º', detail: 'A 2 puntos del Barça, que juega a las 18:30', time: 'hace 1 h', unread: true },
  { id: 3, type: 'goal', title: 'Empate en Riazor', detail: 'Deportivo 1 – 1 Levante', time: 'ayer', unread: true },
  { id: 4, type: 'goal', title: 'Doblete de Isco', detail: 'Real Betis 5 – 2 Osasuna', time: 'hace 6 días', unread: false },
  { id: 5, type: 'standings', title: 'Barça: ocho de ocho', detail: 'Pleno de victorias tras el 3 – 0 al Getafe', time: 'hace 7 días', unread: false },
];

/* ---------------------------------------------------------------- */
/* Panel de administración (estimado)                                */
/* ---------------------------------------------------------------- */

export const ADMIN_STATS = { users: 1284, editors: 3, blockedAccounts: 7, pendingReports: 3 };

// role: 'user', 'editor' o 'admin' (los mismos que la sesión) · status: 'active' o 'blocked'
// isCurrentUser: la cuenta con la que se ha entrado (sale «(tú)» y no se puede bloquear)
export const USERS = [
  { id: 1, name: 'Lucía Gómez', initials: 'LG', email: 'lucia.g@ejemplo.com', role: 'user', status: 'active', registered: '02/10/2026' },
  { id: 2, name: 'Carlota R.', initials: 'CR', email: 'carlota.r@ejemplo.com', role: 'editor', status: 'active', registered: '15/09/2026' },
  { id: 3, name: 'Ángel M.', initials: 'AM', email: 'angel.m@ejemplo.com', role: 'editor', status: 'active', registered: '15/09/2026' },
  { id: 4, name: 'Admin', initials: 'A', email: 'admin@ejemplo.com', role: 'admin', status: 'active', registered: '14/09/2026', isCurrentUser: true },
  { id: 5, name: 'Marcos Pérez', initials: 'MP', email: 'marcos.p@ejemplo.com', role: 'user', status: 'blocked', registered: '28/09/2026' },
  { id: 6, name: 'Daniel Ruiz', initials: 'DR', email: 'daniel.r@ejemplo.com', role: 'editor', status: 'active', registered: '20/09/2026' },
  { id: 7, name: 'Sara López', initials: 'SL', email: 'sara.l@ejemplo.com', role: 'user', status: 'active', registered: '11/10/2026' },
  { id: 8, name: 'Elena Martín', initials: 'EM', email: 'elena.m@ejemplo.com', role: 'user', status: 'active', registered: '16/10/2026' },
];

// type: 'comment' (Comentario) o 'article' (Artículo)
export const REPORTS = [
  { id: 1, content: 'Comentario en «Barça: ocho de ocho y 34 goles…»', type: 'comment', reason: 'Lenguaje ofensivo', author: 'marcos_p', date: '12/10' },
  { id: 2, content: 'Comentario en «Pedri y el arte de no perder el balón»', type: 'comment', reason: 'Spam / publicidad', author: 'promo_apuestas', date: '16/10' },
  { id: 3, content: 'Gil Manzano y la tarjeta fácil', type: 'article', reason: 'Posible dato incorrecto', author: 'Carlota R.', date: '14/10' },
];

/* ---------------------------------------------------------------- */
/* Funciones de ayuda                                                */
/* ---------------------------------------------------------------- */

export function getTeam(id) {
  return TEAMS[id];
}

export function getPlayer(id) {
  return PLAYERS[id];
}

export function getReferee(id) {
  return REFEREES.find((referee) => referee.id === id);
}

export function getArticle(id) {
  return ARTICLES.find((article) => article.id === id);
}

// Jugadores de un equipo
export function getPlayersByTeam(teamId) {
  return Object.values(PLAYERS).filter((player) => player.teamId === teamId);
}

// Zona de la tabla a la que pertenece una posición (o undefined si no tiene)
export function getStandingsZone(position) {
  return STANDINGS_ZONES.find((zone) => position >= zone.from && position <= zone.to);
}
