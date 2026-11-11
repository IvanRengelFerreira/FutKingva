// Normalización de nombres para emparejar personas entre fuentes
// ('Álex Baena' de football-data ↔ 'Álex Baena' de Transfermarkt, 'Inigo' ↔ 'Iñigo'…).

const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'da', 'do', 'dos', 'van', 'von', 'der', 'y']);

/** 'Jesús Gil  Manzano' → 'jesus gil manzano' (sin tildes, minúsculas, sin signos) */
export function normalizeName(name) {
  return (name ?? '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Palabras significativas del nombre (sin partículas ni palabras de 2 letras o menos) */
export function nameTokens(name) {
  return normalizeName(name).split(' ').filter((t) => t.length > 2 && !PARTICLES.has(t));
}

/**
 * ¿Dos palabras son «la misma»? Iguales, una contenida en la otra ('gavi' ⊂ 'gavira',
 * 'terrats' ⊂ 'ramonterrats') o con los 5 primeros caracteres iguales ('brugui' / 'brugue').
 */
function sameToken(a, b) {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 4 && long.includes(short)) return true;
  return short.length >= 5 && a.slice(0, 5) === b.slice(0, 5);
}

/** Número de palabras significativas en común (0 = nada que ver) */
export function nameScore(a, b) {
  // Cada palabra cuenta una vez ('González González' no suma 2 con 'Jon González Esteban')
  const tokensB = new Set(nameTokens(b));
  return [...new Set(nameTokens(a))].filter((t) => [...tokensB].some((u) => sameToken(t, u))).length;
}

/** ¿Comparten al menos una palabra significativa? */
export function namesOverlap(a, b) {
  return nameScore(a, b) > 0;
}
