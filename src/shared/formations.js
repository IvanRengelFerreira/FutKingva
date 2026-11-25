// Formaciones del campo y posiciones (compartidas entre cliente y servidor).
// Las usan Pitch, 11 · Mi equipo ideal, 12 · Mi perfil y la validación de PUT /api/me/ideal-team.

export const DEFAULT_FORMATION = '4-3-3';

// Dónde va cada posición, en % del campo (x de izquierda a derecha, y de arriba abajo; la portería propia abajo).
// Los números de DFC1, MC2… solo distinguen posiciones repetidas; en el campo sale «DFC», «MC»…
export const FORMATIONS = {
  '4-3-3': {
    DC: [50, 14],
    EI: [19, 19],
    ED: [81, 19],
    MC1: [26, 46],
    MC2: [50, 50],
    MC3: [74, 46],
    LI: [14, 67],
    DFC1: [38, 70],
    DFC2: [62, 70],
    LD: [86, 67],
    POR: [50, 86],
  },
  '4-4-2': {
    DC1: [38, 15],
    DC2: [62, 15],
    MI: [14, 42],
    MC1: [38, 48],
    MC2: [62, 48],
    MD: [86, 42],
    LI: [14, 67],
    DFC1: [38, 70],
    DFC2: [62, 70],
    LD: [86, 67],
    POR: [50, 86],
  },
  '3-5-2': {
    DC1: [38, 15],
    DC2: [62, 15],
    MI: [12, 42],
    MC1: [32, 50],
    MC2: [50, 40],
    MC3: [68, 50],
    MD: [88, 42],
    DFC1: [28, 70],
    DFC2: [50, 72],
    DFC3: [72, 70],
    POR: [50, 86],
  },
};

export const FORMATION_NAMES = Object.keys(FORMATIONS);

export const POSITION_NAMES = {
  POR: 'Portero',
  LD: 'Lateral derecho',
  LI: 'Lateral izquierdo',
  DFC: 'Defensa central',
  MC: 'Centrocampista',
  MD: 'Medio derecho',
  MI: 'Medio izquierdo',
  ED: 'Extremo derecho',
  EI: 'Extremo izquierdo',
  DC: 'Delantero centro',
};

/** «DFC1» → «DFC» */
export function slotPosition(slot) {
  return slot.replace(/\d+$/, '');
}

/** Posiciones de la formación en el orden del campo (delantera arriba → portero) */
export function slotsOf(formation) {
  return Object.keys(FORMATIONS[formation] ?? FORMATIONS[DEFAULT_FORMATION]);
}
