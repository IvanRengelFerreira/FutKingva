// Cuentas de demostración (una por rol). Las crea `npm run seed:demo` en src/server y las usan
// los botones «Acceso rápido de prueba» de 14 · Acceso, que inician sesión de verdad con ellas.
// ⚠ La contraseña es pública (está en el repositorio): solo para desarrollo y la presentación.

export const DEMO_PASSWORD = 'futkingva2026';

export const DEMO_ACCOUNTS = [
  { role: 'user', label: 'Usuario', name: 'Usuario', email: 'usuario@futkingva.es' },
  { role: 'editor', label: 'Editor', name: 'Editor', email: 'editor@futkingva.es' },
  { role: 'admin', label: 'Admin', name: 'Admin', email: 'admin@futkingva.es' },
];
