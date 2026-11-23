import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import { getPlayer } from '../../data/mockData.js';
import { getSuggestions, relatedName } from './related.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Jugadores y equipos relacionados: buscador con sugerencias y lista de los ya elegidos
export default function RelatedField({ related, onChange }) {
  const [query, setQuery] = useState('');
  const suggestions = getSuggestions(query, related);

  function add(item) {
    onChange([...related, item]);
    setQuery('');
  }

  return (
    <div className="article-editor__group">
      <TextField
        label="Jugadores / equipos relacionados"
        placeholder="Buscar y enlazar…"
        icon={searchIcon}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <ul className="article-editor__suggestions">
          {suggestions.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <button type="button" className="article-editor__suggestion" onClick={() => add(item)}>
                <RelatedBadge item={item} />
                {relatedName(item, true)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {related.length > 0 && (
        <ul className="article-editor__chips">
          {related.map((item) => (
            <li key={`${item.type}-${item.id}`} className="article-editor__chip article-editor__chip--related">
              <RelatedBadge item={item} />
              {relatedName(item)}
              <button
                type="button"
                className="article-editor__chip-remove"
                aria-label={`Quitar ${relatedName(item)}`}
                onClick={() => onChange(related.filter((other) => other !== item))}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Círculo del jugador (iniciales) o escudo del equipo
function RelatedBadge({ item }) {
  if (item.type === 'team') return <Crest teamId={item.id} size={22} />;
  return <Avatar name={getPlayer(item.id)?.name} size={22} />;
}
