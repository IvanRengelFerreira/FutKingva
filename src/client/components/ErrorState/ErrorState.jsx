import Button from '../Button/Button.jsx';
import './ErrorState.css';

// Aviso de error al cargar datos de la API (con useApi), con botón «Reintentar».
// El mensaje es el del servidor (ApiError.message), que ya viene en español.
// «Reintentar» no sale sin onRetry, ni con 403/404 (repetir la petición no lo arregla).
// Diseño: acordado con Ivan el 17/11/2026 (misma caja que los avisos de «vacío» de Inicio y Análisis).
// Uso:
//   const { data, error, loading, reload } = useApi(...);
//   if (error) return <ErrorState error={error} onRetry={reload} />;
//   <ErrorState error={error} title="No se ha podido cargar la clasificación" onRetry={reload} />
export default function ErrorState({ error, title = 'No se han podido cargar los datos', onRetry }) {
  const message = error?.message || 'Ha ocurrido un error inesperado.';
  const canRetry = Boolean(onRetry) && ![403, 404].includes(error?.status);

  return (
    <div className="state-box error-state" role="alert">
      <p className="error-state__title">{title}</p>
      <p className="error-state__message">{message}</p>
      {canRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
