import { useEffect, useState } from 'react';
import './LoadingState.css';

// Aviso «Cargando…» mientras llegan los datos de la API (con useApi).
// Solo aparece si la carga tarda más de `delay` ms: en las cargas rápidas no parpadea.
// Diseño: acordado con Ivan el 17/11/2026 (misma caja que los avisos de «vacío» de Inicio y Análisis).
// Uso:
//   const { data, error, loading, reload } = useApi(...);
//   if (loading) return <LoadingState label="Cargando clasificación…" />;
export default function LoadingState({ label = 'Cargando…', delay = 300 }) {
  const [visible, setVisible] = useState(delay <= 0);

  useEffect(() => {
    if (delay <= 0) return undefined;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Antes del retraso no se pinta la caja, pero el aviso ya existe para los lectores de pantalla
  return (
    <div className={visible ? 'state-box loading-state' : 'loading-state'} role="status">
      {visible && <span className="loading-state__spinner" aria-hidden="true" />}
      <span className={visible ? undefined : 'loading-state__label--hidden'}>{label}</span>
    </div>
  );
}
