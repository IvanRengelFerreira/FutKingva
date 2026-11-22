// Ayudas de los formularios de 14 · Acceso que solo existen en el navegador.
// Las reglas que deciden si los datos valen están en src/shared/validation/auth.js
// (las mismas que comprueba el servidor).

// 16 · Contacto también lo importa desde aquí
export { isValidEmail } from '../../../shared/validation/auth.js';

// Seguridad de la contraseña de 0 a 4, solo como ayuda visual (barra bajo «Contraseña»):
// un punto por cada cosa que cumple (8 caracteres o más, mayúsculas y minúsculas, algún número,
// algún símbolo). Con menos de 6 caracteres nunca pasa de «Débil».
export function passwordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return password.length < 6 ? Math.min(score, 1) : score;
}

export const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
