import { useEffect, useState } from 'react';

// Mismo corte que el resto de páginas (global.css, Comparator.css): móvil por debajo de 800 px.
// Se usa donde cambia el contenido (no solo el estilo) o un tamaño que va en una prop (escudo, gráfico).
const MOBILE_QUERY = '(max-width: 799px)';

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}
