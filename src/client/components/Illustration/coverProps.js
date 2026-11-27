// Portada de un artículo de la API (articles.cover + coverTeams) → props de <Illustration>.
//   { type: 'stat', value }            → { stat }              (Táctica: cifra en el hexágono)
//   { type: 'match', score, caption }  → { score, caption }    (Crónica: marcador)
//   { type: 'teams', … } + coverTeams  → { home, away }        (Previa: escudos; equipos { name, code, color })
//   { type: 'bars', values }           → { values }            (Datos: barras)
// Sin portada, el dibujo de la categoría sin datos (en una previa, escudos con «?»).
//
//   <Illustration type={article.category} {...coverProps(article)} />

export function coverProps({ category, cover, coverTeams } = {}) {
  switch (cover?.type) {
    case 'stat':
      return { stat: cover.value };
    case 'match':
      return { score: cover.score, ...(cover.caption ? { caption: cover.caption } : {}) };
    case 'teams':
      return { home: coverTeams?.home ?? null, away: coverTeams?.away ?? null };
    case 'bars':
      return { values: cover.values };
    default:
      return category === 'Previa' ? { home: null, away: null } : {};
  }
}
