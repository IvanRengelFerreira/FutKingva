import './Pagination.css';
import prevIcon from '../../assets/icon-page-prev.svg';
import nextIcon from '../../assets/icon-page-next.svg';

// Paginación ‹ 1 2 3 ›: la página activa en oro. Las flechas se desactivan en la primera y la última.
// Si hay muchas páginas, enseña la primera, la última y las de alrededor de la actual (1 … 4 5 6 … 12).
// Diseño: Figma › Mockups › 02 · Equipos y jugadores › Paginación
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-509
// Uso (la página guarda en qué página está y decide qué elementos enseña):
//   const [page, setPage] = useState(1);
//   const PER_PAGE = 12;
//   const visibles = teams.slice((page - 1) * PER_PAGE, page * PER_PAGE);
//   <Pagination page={page} totalPages={Math.ceil(teams.length / PER_PAGE)} onChange={setPage} />
// Con una sola página no pinta nada.
export default function Pagination({ page, totalPages, onChange, label = 'Paginación', className = '' }) {
  if (totalPages <= 1) return null;

  return (
    <nav className={`pagination ${className}`.trim()} aria-label={label}>
      <button
        type="button"
        className="pagination__button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        <img src={prevIcon} alt="" width="16" height="16" />
      </button>

      {getPages(page, totalPages).map((item, i) =>
        item === '…' ? (
          <span key={`gap-${i}`} className="pagination__gap" aria-hidden="true">…</span>
        ) : (
          <button
            key={item}
            type="button"
            className={`pagination__button ${item === page ? 'pagination__button--active' : ''}`.trim()}
            onClick={() => onChange(item)}
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        className="pagination__button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Página siguiente"
      >
        <img src={nextIcon} alt="" width="16" height="16" />
      </button>
    </nav>
  );
}

// Hasta 7 páginas: todas. Si hay más: 1 … (actual − 1, actual, actual + 1) … última
function getPages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(totalPages - 1, page + 1);
  if (from > 2) pages.push('…');
  for (let p = from; p <= to; p++) pages.push(p);
  if (to < totalPages - 1) pages.push('…');
  pages.push(totalPages);
  return pages;
}
