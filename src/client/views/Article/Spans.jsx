import { Link } from 'react-router';
import { isSafeHref } from '../../../shared/validation/article.js';

// Trozos de texto de un párrafo o de un elemento de lista: { text, bold?, italic?, href? }.
// Se pintan con React (nunca con innerHTML). Los enlaces internos (#/…) van con Link y los externos
// se abren en otra pestaña; si un enlace no es seguro, se pinta solo el texto.
export default function Spans({ spans = [] }) {
  return spans.map((span, index) => <Span key={index} span={span} />);
}

function Span({ span }) {
  let content = span.text;
  if (span.bold) content = <strong>{content}</strong>;
  if (span.italic) content = <em>{content}</em>;
  if (!span.href || !isSafeHref(span.href)) return content;

  if (span.href.startsWith('#/')) {
    return (
      <Link className="article__link" to={span.href.slice(1)}>
        {content}
      </Link>
    );
  }
  return (
    <a className="article__link" href={span.href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}
