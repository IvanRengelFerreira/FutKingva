// Reglas de los formularios de 14 · Acceso (RF1). Las usan los dos lados con el mismo código:
//   cliente:  views/Access (enseña el error junto al campo antes de enviar)
//   servidor: routes/auth.js con validate() (400 con los mismos mensajes: el servidor nunca se fía del cliente)
//
// Cada función devuelve un objeto { campo: 'mensaje' } solo con los campos que fallan ({} si todo vale).
// JavaScript puro, sin dependencias, para que funcione en Node y en el navegador.

import { onlyErrors, text } from './common.js';

export const NAME_MIN = 2;
export const NAME_MAX = 40;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
// Tope para que nadie mande una contraseña enorme y haga trabajar de más al servidor al calcular el hash
export const PASSWORD_MAX = 128;

/** Correo con forma algo@algo.algo */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(email).trim());
}

function emailError(email) {
  const value = text(email).trim();
  if (!value) return 'Escribe tu correo electrónico';
  if (value.length > EMAIL_MAX || !isValidEmail(value)) return 'El correo no es válido';
  return null;
}

/** Contraseña nueva: entre 8 y 128 caracteres, con al menos una letra y un número */
export function passwordError(password) {
  const value = text(password);
  if (!value) return 'Elige una contraseña';
  if (value.length < PASSWORD_MIN) return `La contraseña tiene que tener al menos ${PASSWORD_MIN} caracteres`;
  if (value.length > PASSWORD_MAX) return `La contraseña no puede tener más de ${PASSWORD_MAX} caracteres`;
  if (!/\p{L}/u.test(value) || !/\d/.test(value)) return 'La contraseña tiene que tener al menos una letra y un número';
  return null;
}

function nameError(name) {
  const value = text(name).trim();
  if (!value) return 'Elige un nombre de usuario';
  if (value.length < NAME_MIN || value.length > NAME_MAX) {
    return `El nombre tiene que tener entre ${NAME_MIN} y ${NAME_MAX} caracteres`;
  }
  return null;
}

// Al iniciar sesión no se repiten las reglas de una contraseña nueva: solo que no esté vacía ni sea enorme
function loginPasswordError(password) {
  const value = text(password);
  if (!value) return 'Escribe tu contraseña';
  if (value.length > PASSWORD_MAX) return 'La contraseña no es válida';
  return null;
}

/** Iniciar sesión: { email, password } */
export function validateLogin({ email, password } = {}) {
  return onlyErrors({
    email: emailError(email),
    password: loginPasswordError(password),
  });
}

/** Registrarse: { name, email, password, repeat, accepted } */
export function validateRegister({ name, email, password, repeat, accepted } = {}) {
  return onlyErrors({
    name: nameError(name),
    email: emailError(email),
    password: passwordError(password),
    repeat: text(repeat) !== text(password) ? 'Las contraseñas no coinciden' : null,
    accepted: accepted !== true ? 'Tienes que aceptar las condiciones para crear la cuenta' : null,
  });
}
