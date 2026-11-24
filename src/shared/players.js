// Ayudas de jugadores compartidas entre servidor y cliente (sin dependencias).

/** Nombre corto de un jugador: «Jude Bellingham» → «Bellingham»; «Pedri» y «Vinícius Jr.» se quedan igual */
export function shortPlayerName(name) {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  return words.length === 1 || trimmed.endsWith('.') ? trimmed : words.at(-1);
}
