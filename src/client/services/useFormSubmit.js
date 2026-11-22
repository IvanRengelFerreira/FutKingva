// Hook común para enviar un formulario a la API: estado «enviando» y errores que devuelve el servidor.
// Ejemplo de uso completo: src/server/CONVENCIONES.md, apartado 6 «Formularios que envían a la API».
//
// - submit(send, errors) no envía si hay errores locales o si ya se está enviando; marca `submitted`
//   para que los campos enseñen sus errores.
// - Si send() falla con errores por campo (400, 409), van a serverFields junto a su campo; si no
//   (401, 403, sin conexión…), a `message`, el aviso general encima del botón.
// - Al tocar un campo, clearServerError(campo) quita su error del servidor y el aviso general.

import { useRef, useState } from 'react';

const NO_SERVER_ERRORS = { fields: {}, message: null };
const UNEXPECTED = 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';

function serverErrors(error) {
  if (error?.fields && Object.keys(error.fields).length) return { fields: error.fields, message: null };
  return { fields: {}, message: error?.message || UNEXPECTED };
}

export function useFormSubmit() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [server, setServer] = useState(NO_SERVER_ERRORS);
  // `sending` es para pintar; el ref frena un segundo envío antes de que se pinte el botón deshabilitado
  const inFlight = useRef(false);

  async function submit(send, errors = {}) {
    setSubmitted(true);
    if (inFlight.current || Object.keys(errors).length) return;

    inFlight.current = true;
    setSending(true);
    setServer(NO_SERVER_ERRORS);
    try {
      await send();
    } catch (error) {
      setServer(serverErrors(error));
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  function clearServerError(field) {
    setServer((current) => ({ fields: { ...current.fields, [field]: undefined }, message: null }));
  }

  return { submitted, sending, serverFields: server.fields, message: server.message, clearServerError, submit };
}
