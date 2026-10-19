// Comprobaciones de los formularios de 14 · Acceso (sin servidor: solo en el navegador).

// Correo con forma algo@algo.algo
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Seguridad de la contraseña de 0 a 4: un punto por cada cosa que cumple
// (8 caracteres o más, mayúsculas y minúsculas, algún número, algún símbolo).
// Con menos de 6 caracteres nunca pasa de «Débil».
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
