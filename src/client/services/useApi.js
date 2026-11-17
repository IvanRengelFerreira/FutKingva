// Hook común para cargar datos de la API en una vista: estados cargando / error / datos.
//
//   const { data, error, loading, reload } = useApi(
//     (signal) => apiFetch('/standings', { query: { season }, signal }),
//     [season],
//   );
//   if (loading) return …;            // primera carga o al cambiar de temporada
//   if (error) return …;              // error.message está en español; reload() reintenta
//   return <StandingsTable rows={data.table} />;
//
// - La función recibe un `signal`: hay que pasárselo a apiFetch para cancelar la petición
//   si el usuario cambia de página o de filtro antes de que llegue la respuesta.
// - `deps` funciona como en useEffect: cuando cambia algún valor, se vuelve a pedir.
// - Mientras se recarga se mantienen los datos anteriores (data) para que la página no parpadee:
//   comprueba `loading` antes que `data` si los datos de la petición anterior no deben verse
//   (p. ej. al pasar de la ficha de un equipo a la de otro). Si hay error, data vuelve a null.

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} request función que hace la petición
 * @param {unknown[]} deps valores de los que depende la petición
 * @returns {{ data: T | null, error: import('./client.js').ApiError | null, loading: boolean, reload: () => void }}
 */
export function useApi(request, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0); // Sube con reload() para repetir la petición

  // Si cambian las dependencias, se marca «cargando» en el mismo render (no después, en el efecto):
  // así ninguna vista ve un instante loading=false con los datos de la petición anterior.
  const key = [...deps, attempt];
  const [previousKey, setPreviousKey] = useState(key);
  if (!sameValues(key, previousKey)) {
    setPreviousKey(key);
    setLoading(true);
    setError(null);
  }

  // Siempre la última versión de la función, sin tener que ponerla en las dependencias
  const requestRef = useRef(request);
  requestRef.current = request;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    requestRef.current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setData(null); // Sin datos de una petición anterior junto al error
        setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    // Al cambiar las dependencias o salir de la página: se cancela la petición anterior
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- las dependencias las indica quien llama
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, error, loading, reload };
}

/** Compara dos listas de dependencias como lo hace React (Object.is, posición a posición) */
function sameValues(a, b) {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}
