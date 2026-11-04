import './Tag.css';

// Etiqueta de categoría de un artículo: Táctica (oro), Crónica (rojo), Previa (violeta) y Datos (azul).
// También la etiqueta «Destacado» (degradado oro) del artículo principal de Análisis.
// Diseño: Figma › Mockups › 08 · Análisis › «Etiqueta TÁCTICA», «Etiqueta CRÓNICA»…
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=52-562
// Uso:
//   <Tag category="Táctica" />          → con la categoría tal cual viene en ARTICLES (mockData.js)
//   <Tag category={article.category} />
//   <Tag featured>Destacado</Tag>
export default function Tag({ category, featured = false, children, className = '' }) {
  const variant = featured ? 'featured' : toKey(category);
  return (
    <span className={`tag tag--${variant} ${className}`.trim()}>
      {children ?? category}
    </span>
  );
}

// «Crónica» → «cronica» (sin tildes ni mayúsculas) para elegir el color
function toKey(text = '') {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
