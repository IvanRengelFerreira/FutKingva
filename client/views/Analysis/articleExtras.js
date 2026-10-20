// Datos de los artículos que no están en ARTICLES (mockData.js): entradilla, tiempo de lectura
// y lo que necesita su ilustración (<Illustration>). Textos sacados de Figma › Mockups › 08 · Análisis.
// Provisional: si Ivan decide añadir estos campos a ARTICLES, se mueven allí y se borra este archivo.
// Lo usan 08 · Análisis y 09 · Artículo.

// Artículo destacado de Análisis (el grande de arriba)
export const FEATURED_ARTICLE_ID = 'pedri-arte-de-no-perder-el-balon';

export const ARTICLE_EXTRAS = {
  'pedri-arte-de-no-perder-el-balon': {
    excerpt: 'Cinco partidos seguidos por encima del 90 % de acierto en el pase. Analizamos qué ha cambiado en su posición desde el inicio de la temporada y por qué el Barça depende de él para salir jugando.',
    readingTime: '6 min de lectura',
    illustration: { stat: '91 %' },
  },
  'barca-ocho-de-ocho': {
    excerpt: 'El 3 – 0 al Getafe completa un pleno de victorias en LaLiga.',
    illustration: { score: '3 – 0', caption: "FINAL · 90+2'" },
  },
  'madrid-de-mourinho': {
    excerpt: 'Qué ha cambiado en el Madrid en sus primeras ocho jornadas con Mourinho.',
  },
  'celta-athletic-defensas': {
    excerpt: 'Seis goles encajados cada uno: nadie concede menos en LaLiga.',
  },
  'atletico-cinco-victorias': {
    excerpt: 'Desde el 3 – 0 en San Mamés, pleno: 15 de 15 puntos.',
  },
  'previa-real-madrid-sevilla': {
    excerpt: 'Lo que dicen los datos antes del partido del domingo.',
    illustration: { home: 'real-madrid', away: 'sevilla' },
  },
  'gil-manzano-tarjeta-facil': {
    excerpt: '5,8 tarjetas por partido, la media más alta del campeonato.',
  },
};

// Datos extra de un artículo por su id (objeto vacío si no tiene)
export function getArticleExtras(id) {
  return ARTICLE_EXTRAS[id] ?? {};
}
