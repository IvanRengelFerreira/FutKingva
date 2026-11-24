// Reglas de 20 · Panel de administración (RF8). Las comparten servidor (validate) y cliente.
// Cada función devuelve { campo: 'mensaje' } solo con lo que falla ({} si todo vale).
// JavaScript puro, sin dependencias, para que funcione en Node y en el navegador.

export const USER_ROLES = ['user', 'editor', 'admin'];
export const USER_STATUSES = ['active', 'blocked'];
export const REPORT_STATUSES = ['pending', 'resolved', 'dismissed'];
export const REPORT_ACTIONS = ['dismiss', 'remove'];

function onlyErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Actualizar rol y/o estado de un usuario: { role?, status? } */
export function validateAdminUserUpdate(body) {
  const { role, status } = isObject(body) ? body : {};
  if (role === undefined && status === undefined) {
    return { role: 'Indica un rol o un estado para actualizar' };
  }

  return onlyErrors({
    role: role !== undefined && (typeof role !== 'string' || !USER_ROLES.includes(role)) ? 'El rol no es válido' : null,
    status:
      status !== undefined && (typeof status !== 'string' || !USER_STATUSES.includes(status))
        ? 'El estado no es válido'
        : null,
  });
}

/** Resolver un reporte pendiente: { action: 'dismiss' | 'remove' } */
export function validateReportAction(body) {
  const { action } = isObject(body) ? body : {};
  if (typeof action !== 'string' || !REPORT_ACTIONS.includes(action)) {
    return { action: 'La acción tiene que ser aprobar o retirar el contenido' };
  }
  return {};
}
