import ChartBlock from './ChartBlock.jsx';
import Mention from './Mention.jsx';
import Spans from './Spans.jsx';
import Rating from '../../components/Rating/Rating.jsx';

// Un bloque del texto del artículo (tipos en src/shared/validation/article.js). Se pinta con React, sin HTML.
// refs: { players: Map(id → jugador), teams: Map(id → equipo) } con los que vienen en el artículo de la API.
export default function Block({ block, refs }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="article__paragraph">
          <Spans spans={block.spans} />
        </p>
      );

    case 'heading':
      return <h2 className="article__heading">{block.text}</h2>;

    case 'list':
      return (
        <ul className="article__list">
          {block.items.map((item, index) => (
            <li key={index}>
              <Spans spans={item.spans} />
            </li>
          ))}
        </ul>
      );

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

    case 'mentions': {
      // Los que ya no estén en la BD no salen
      const items = block.items.filter((item) => (item.type === 'team' ? refs.teams : refs.players).has(item.id));
      if (items.length === 0) return null;
      return (
        <aside className="article__box">
          <h2 className="article__box-title">Jugadores y equipos mencionados</h2>
          <ul className="article__mentions">
            {items.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Mention type={item.type} item={(item.type === 'team' ? refs.teams : refs.players).get(item.id)} />
              </li>
            ))}
          </ul>
        </aside>
      );
    }

    case 'player': {
      // Ficha de jugador insertada desde el Editor de artículo
      const player = refs.players.get(block.playerId);
      if (!player) return null;
      return (
        <aside className="article__box article__player">
          <Mention type="player" item={player} />
          <span className="article__player-info">
            {[player.position, player.team?.name].filter(Boolean).join(' · ')}
          </span>
          <Rating value={player.rating} size="sm" className="article__player-rating" />
        </aside>
      );
    }

    case 'chart':
      return <ChartBlock block={block} player={refs.players.get(block.playerId)} />;

    case 'image':
    case 'figure':
      // Hueco de imagen o gráfico del editor: todavía no se suben archivos, se deja el recuadro con su pie
      return (
        <figure className="article__box article__placeholder">
          <span className="article__placeholder-label">{block.type === 'image' ? 'Imagen' : 'Gráfico'}</span>
          {block.caption && <figcaption className="article__source">{block.caption}</figcaption>}
        </figure>
      );

    case 'quote':
      return <blockquote className="article__quote">«{block.text}»</blockquote>;

    default:
      return null;
  }
}
