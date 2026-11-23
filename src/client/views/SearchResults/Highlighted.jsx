import { splitMatch } from './search.js';

// Nombre con la parte que coincide con la búsqueda en oro
export default function Highlighted({ name, query, className }) {
  return (
    <span className={className}>
      {splitMatch(name, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="search-results__match">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}
