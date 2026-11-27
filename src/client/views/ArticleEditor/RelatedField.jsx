import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import { useSuggestions } from './related.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Jugadores y equipos relacionados: buscador con sugerencias de la BD y lista de los ya elegidos.
// Son los «Jugadores y equipos mencionados» del artículo; en las previas, los dos primeros equipos van en la portada.
export default function RelatedField({ related, onChange }) {
  const [query, setQuery] = useState('');
  const suggestions = useSuggestions(query, related);

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
                {item.name}
                {item.type === 'player' && item.team && (
                  <span className="article-editor__suggestion-team">{item.team.name}</span>
                )}
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
              {item.name}
              <button
                type="button"
                className="article-editor__chip-remove"
                aria-label={`Quitar ${item.name}`}
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
  if (item.type === 'team') return <Crest team={item} size={22} />;
  return <Avatar name={item.name} size={22} />;
}
