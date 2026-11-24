// Hook común para las acciones de 20 · Panel de administración (usuarios y moderación).
// Reutiliza useFormSubmit (estado «enviando», freno contra doble clic y errores del servidor) y
// centraliza el aviso de resultado y la recarga tras borrar o resolver el último elemento de la página.

import { useState } from 'react';
import { useFormSubmit } from '../../services/useFormSubmit.js';

export function useAdminAction({ itemCount, page, setPage, reload, onStatsChange }) {
  const { sending, serverFields, message: serverMessage, clearServerError, submit } = useFormSubmit();
  const [statusMessage, setStatusMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  const fieldError = Object.values(serverFields).find(Boolean) ?? '';
  const errorMessage = validationError || serverMessage || fieldError;

  function refresh({ removed = false } = {}) {
    if (removed && itemCount === 1 && page > 1) setPage((current) => current - 1);
    else reload();
    onStatsChange();
  }

  function clearFeedback() {
    setStatusMessage('');
    setValidationError('');
    clearServerError();
    for (const key of Object.keys(serverFields)) clearServerError(key);
  }

  function runAction(request, { successMessage, errors = {}, removed = false, onConflict } = {}) {
    setStatusMessage('');
    setValidationError(Object.values(errors)[0] ?? '');

    return submit(async () => {
      try {
        await request();
      } catch (err) {
        if (err?.status === 409 && onConflict) onConflict();
        throw err;
      }
      setStatusMessage(successMessage);
      refresh({ removed });
    }, errors);
  }

  return { sending, statusMessage, errorMessage, runAction, clearFeedback };
}
