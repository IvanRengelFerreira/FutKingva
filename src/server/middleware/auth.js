// Usuario de la sesión y protección de rutas por rol (RF1, RF7, RF8).
//
//   router.get('/me/favorites', requireAuth, controller.list);                 // con sesión
//   router.post('/articles', requireRole('editor'), controller.create);       // solo editores
//   router.patch('/admin/users/:id', requireRole('admin'), controller.update); // solo admin
//
// En los controladores, el usuario está en req.user ({ id, name, email, role, status }) o es null.
// Los roles se escriben en minúsculas ('user', 'editor', 'admin'), igual que en el front.
//
// ⚠ El front también oculta páginas por rol (RequireRole), pero eso es solo comodidad:
// quien protege de verdad es el servidor. Toda ruta privada tiene que llevar requireAuth o requireRole.

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { destroySession } from './session.js';

const USER_FIELDS = { id: true, name: true, email: true, role: true, status: true };

/**
 * Carga el usuario de la sesión desde la BD en cada petición (req.user), para que un bloqueo,
 * un cambio de rol o un borrado se apliquen al momento. Si ya no puede entrar, se cierra su sesión.
 */
export async function loadUser(req, res, next) {
  req.user = null;
  const userId = req.session?.userId;
  if (userId == null) return next();

  const user = await prisma.users.findUnique({ where: { id: BigInt(userId) }, select: USER_FIELDS });
  if (!user || user.status === 'BLOCKED') {
    await destroySession(req, res);
    return next();
  }
  req.user = { ...user, role: user.role.toLowerCase() };
  next();
}

/** Solo con sesión iniciada → si no, 401 */
export function requireAuth(req, res, next) {
  if (!req.user) throw AppError.unauthorized();
  next();
}

/**
 * Solo para ciertos roles → sin sesión 401, con otro rol 403.
 * @param {...('user'|'editor'|'admin')} roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) throw AppError.unauthorized();
    if (!roles.includes(req.user.role)) throw AppError.forbidden();
    next();
  };
}
