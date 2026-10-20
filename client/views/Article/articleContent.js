// Texto de los artículos para 09 · Artículo, sacado de Figma › Mockups › 09 · Artículo.
// En Figma solo está escrito el de Pedri: los demás artículos se ven sin cuerpo
// (titular, entradilla, autor, ilustración y relacionados).
// Para escribir otro, añade su id con su «body» (y, si quieres, «lead» y «related»).
//
// Cada artículo puede tener:
//   lead     Entradilla de la página del artículo (si no hay, se usa la de articleExtras.js)
//   body     Bloques del texto, en orden:
//              { type: 'paragraph', text }
//              { type: 'stats', items: [{ value, label }] }        → recuadro «Dato destacado»
//              { type: 'mentions', items: [{ type: 'player' | 'team', id, label? }] }
//              { type: 'chart', title, playerId, source }          → acierto en el pase por jornada
//              { type: 'quote', text }
//   related  Ids de los «Análisis relacionados» (si no hay, se eligen solos)

// Cómo se presenta cada editor debajo del titular
export const AUTHOR_ROLES = {
  'Carlota R.': 'Editora',
  'Iván R.': 'Editor',
  'Ángel M.': 'Editor',
};

export const ARTICLE_CONTENT = {
  'pedri-arte-de-no-perder-el-balon': {
    lead: 'Cinco partidos seguidos por encima del 90 % de acierto en el pase. Qué ha cambiado en su posición y por qué el Barça depende de él para salir jugando.',
    related: ['madrid-de-mourinho', 'celta-athletic-defensas', 'barca-ocho-de-ocho'],
    body: [
      {
        type: 'paragraph',
        text: 'Hay jugadores que se miden en goles y otros que se miden en lo que no pasa. Con Pedri sobre el césped, el Barça pierde menos balones que nadie en LaLiga: 6,1 pérdidas por partido, la cifra más baja de los centrocampistas con más de 600 minutos.',
      },
      {
        type: 'paragraph',
        text: 'La clave está en su nueva posición. Hansi Flick le ha retrasado unos metros, casi a la altura de los centrales en la salida, y desde ahí recibe de cara. Ya no tiene que girarse con un rival encima: ve todo el campo antes de recibir.',
      },
      {
        type: 'stats',
        items: [
          { value: '91 %', label: 'Acierto en el pase' },
          { value: '6,1', label: 'Pérdidas por partido' },
          { value: '2,7', label: 'Pases clave por 90' },
        ],
      },
      {
        type: 'paragraph',
        text: 'El efecto se nota en los números. En las cinco últimas jornadas ha superado siempre el 90 % de acierto en el pase y ha dado tres de sus cuatro asistencias. Solo Lamine Yamal ha generado más ocasiones en el equipo.',
      },
      {
        type: 'mentions',
        items: [
          { type: 'player', id: 'pedri' },
          { type: 'player', id: 'lamine-yamal' },
          { type: 'team', id: 'barcelona', label: 'FC Barcelona' },
        ],
      },
      {
        type: 'chart',
        title: 'Acierto en el pase de Pedri por jornada (%)',
        playerId: 'pedri',
        source: 'Fuente: FutKingva con datos de football-data.org',
      },
      {
        type: 'quote',
        text: 'Ya no tiene que girarse con un rival encima: ve todo el campo antes de recibir.',
      },
      {
        type: 'paragraph',
        text: 'La pregunta ahora es cuánto puede sostenerlo. Con Champions entre semana y un calendario sin descanso hasta diciembre, la gestión de sus minutos será tan importante como su talento.',
      },
    ],
  },
};

// Contenido de un artículo por su id (objeto vacío si no tiene)
export function getArticleContent(id) {
  return ARTICLE_CONTENT[id] ?? {};
}
