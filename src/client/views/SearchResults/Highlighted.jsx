import { toKey, toSearchText } from '../../utils/text.js';

// Nombre con la parte que coincide con la búsqueda en oro (sin tener en cuenta tildes ni mayúsculas)
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

// Parte el nombre en trozos: [{ text, match }]
// «Gerard Martín» con «ra» → [{ text: 'Ge' }, { text: 'ra', match: true }, { text: 'rd Martín' }]
function splitMatch(name, query) {
  const text = toSearchText(query);
  const index = text ? toKeyKeepingIndexes(name).indexOf(text) : -1;
  if (index === -1) return [{ text: name, match: false }];
  return [
    { text: name.slice(0, index), match: false },
    { text: name.slice(index, index + text.length), match: true },
    { text: name.slice(index + text.length), match: false },
  ].filter((part) => part.text);
}

// toKey letra a letra: así cada posición sigue siendo la misma letra del nombre original
function toKeyKeepingIndexes(name) {
  return Array.from(name)
    .map((letter) => toKey(letter).charAt(0) || letter)
    .join('');
}
