// Reglas del formulario de 16 · Contacto. Las usan los dos lados con el mismo código:
//   cliente:  views/Contact (enseña el error junto al campo antes de enviar)
//   servidor: routes/contact.js con validate() (400 con los mismos mensajes: el servidor nunca se fía del cliente)
//
// Devuelve { campo: 'mensaje' } solo con los campos que fallan ({} si todo vale).
// JavaScript puro, sin dependencias, para que funcione en Node y en el navegador.

import { EMAIL_MAX, isValidEmail } from './auth.js';

export const CONTACT_NAME_MAX = 60;
// La tabla contact_messages pide entre 10 y 2000 (CHECK); la página deja escribir hasta 1000, como en Figma
export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 1000;

// El valor viaja en la petición; en la BD se guarda el texto, que es lo que lee quien responde
export const CONTACT_SUBJECTS = [
  { value: 'consulta', label: 'Duda o consulta' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'datos', label: 'Error en los datos' },
  { value: 'editor', label: 'Quiero ser editor' },
  { value: 'otro', label: 'Otro' },
];

/** Texto del asunto ('datos' → 'Error en los datos'), o undefined si no es uno de la lista */
export function subjectLabel(value) {
  return CONTACT_SUBJECTS.find((subject) => subject.value === value)?.label;
}

// Lo que llega del servidor puede no ser texto (null, números…): se trata como vacío
const text = (value) => (typeof value === 'string' ? value : '');

function nameError(name) {
  const value = text(name).trim();
  if (!value) return 'Escribe tu nombre';
  if (value.length > CONTACT_NAME_MAX) return `El nombre no puede tener más de ${CONTACT_NAME_MAX} caracteres`;
  return null;
}

function emailError(email) {
  const value = text(email).trim();
  if (!value) return 'Escribe tu correo electrónico';
  if (value.length > EMAIL_MAX || !isValidEmail(value)) return 'El correo no es válido';
  return null;
}

function messageError(message) {
  const value = text(message).trim();
  if (!value) return 'Escribe tu mensaje';
  if (value.length < CONTACT_MESSAGE_MIN) {
    return `El mensaje tiene que tener al menos ${CONTACT_MESSAGE_MIN} caracteres`;
  }
  if (value.length > CONTACT_MESSAGE_MAX) {
    return `El mensaje no puede tener más de ${CONTACT_MESSAGE_MAX} caracteres`;
  }
  return null;
}

/** Contacto: { name, email, subject, message, accepted } */
export function validateContact({ name, email, subject, message, accepted } = {}) {
  const errors = {
    name: nameError(name),
    email: emailError(email),
    subject: subjectLabel(subject) ? null : 'Elige un asunto',
    message: messageError(message),
    accepted: accepted === true ? null : 'Tienes que aceptar la política de privacidad',
  };
  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error));
}
