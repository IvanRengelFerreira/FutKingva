// Perfil del usuario autenticado (12 · Mi perfil, RF3). Responsable: Ivan.
//   GET /api/me/profile → publicUser + memberSince (GET /api/auth/me no devuelve created_at)

import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { publicUser } from '../utils/users.js';

const PROFILE_FIELDS = { id: true, name: true, email: true, role: true, created_at: true };

/** GET /api/me/profile → datos públicos del usuario más su fecha de alta */
export async function detail(req, res) {
  const user = await prisma.users.findUnique({ where: { id: req.user.id }, select: PROFILE_FIELDS });
  if (!user) throw AppError.notFound('No se ha encontrado tu perfil');

  res.json({
    ...publicUser(user),
    memberSince: user.created_at,
  });
}
