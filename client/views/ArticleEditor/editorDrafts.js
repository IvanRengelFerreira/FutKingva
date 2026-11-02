// Datos que el Editor de artículo (18) necesita y no están en ARTICLES (mockData.js) ni en
// articleContent.js: el texto del borrador, la fecha y hora de publicación, las etiquetas,
// los jugadores y equipos relacionados y la portada.
// Sacado de Figma › Mockups › 18 · Editor de artículo (el Clásico, programado para el 24/10).
// Los demás artículos se abren con lo que haya en ARTICLES, articleExtras.js y articleContent.js.
//
// body: bloques en orden
//   { type: 'paragraph', text } · { type: 'heading', text } · { type: 'quote', text }
//   { type: 'player', id }  → ficha del jugador insertada
//   { type: 'chart', text } · { type: 'image', text }  → bloques de ejemplo
// related: [{ type: 'player' | 'team', id }]
// cover: lo que necesita <Illustration> para la portada automática

export const ARTICLE_DRAFTS = {
  'previa-barcelona-real-madrid': {
    excerpt: 'Lo que dicen los datos antes del Clásico del Camp Nou.',
    publishAt: '24/10/2026 · 18:00',
    tags: ['LaLiga', 'Camp Nou', 'Real Madrid'],
    related: [
      { type: 'player', id: 'mbappe' },
      { type: 'player', id: 'bellingham' },
      { type: 'team', id: 'barcelona' },
    ],
    cover: { home: 'barcelona', away: 'real-madrid' },
    body: [
      {
        type: 'paragraph',
        text: 'El Camp Nou recibe al Madrid de Mourinho con el Barça de Flick líder y con pleno de victorias. El Madrid llega cuarto y con Mbappé como amenaza principal: 7 goles en 8 jornadas.',
      },
      { type: 'heading', text: 'Las claves del partido' },
      {
        type: 'paragraph',
        text: 'El Barça presiona alto y obliga a salir en largo. Si Valverde y Bellingham encuentran tiempo entre líneas, el Madrid tendrá espacios a la espalda de los laterales.',
      },
      { type: 'player', id: 'mbappe' },
      { type: 'paragraph', text: 'Para Hansi Flick, la duda es si arriesgar' },
    ],
  },
};

export function getArticleDraft(id) {
  return ARTICLE_DRAFTS[id] ?? {};
}
