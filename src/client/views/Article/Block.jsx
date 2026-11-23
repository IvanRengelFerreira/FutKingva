import ChartBlock from './ChartBlock.jsx';
import Mention from './Mention.jsx';

// Un bloque del texto del artículo (ver los tipos en articleContent.js)
export default function Block({ block }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="article__paragraph">{block.text}</p>;

    case 'stats':
      return (
        <dl className="article__stats">
          {block.items.map((item) => (
            <div key={item.label} className="article__stat">
              <dt className="article__stat-label">{item.label}</dt>
              <dd className="article__stat-value">{item.value}</dd>
            </div>
          ))}
        </dl>
      );

    case 'mentions':
      return (
        <aside className="article__box">
          <h2 className="article__box-title">Jugadores y equipos mencionados</h2>
          <ul className="article__mentions">
            {block.items.map((item) => (
              <li key={item.id}>
                <Mention item={item} />
              </li>
            ))}
          </ul>
        </aside>
      );

    case 'chart':
      return <ChartBlock block={block} />;

    case 'quote':
      return <blockquote className="article__quote">«{block.text}»</blockquote>;

    default:
      return null;
  }
}
