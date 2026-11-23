// Ayudas comunes para comparar textos sin tildes ni mayúsculas (búsquedas, colores por categoría…).

/** Quita las tildes: «Vinícius» → «Vinicius» (NFD separa la letra de su tilde, y luego se borran las tildes) */
export function removeAccents(text = '') {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Clave sin tildes ni mayúsculas: «Crónica» → «cronica» */
export function toKey(text = '') {
  return removeAccents(text).toLowerCase();
}

/** Texto para buscar: sin tildes, sin mayúsculas y sin espacios en los extremos («  Díaz » → «diaz») */
export function toSearchText(text = '') {
  return toKey(text).trim();
}
