// Helpers comunes para los validadores de formularios (cliente y servidor).
// JavaScript puro, sin dependencias, para que funcione en Node y en el navegador.

/** Lo que llega del servidor puede no ser texto (null, números…): se trata como vacío */
export function text(value) {
  return typeof value === 'string' ? value : '';
}

/** Quita los campos sin error */
export function onlyErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}
