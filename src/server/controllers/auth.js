// 14 · Acceso (RF1): registro, inicio y cierre de sesión, y usuario de la sesión actual.
// Los datos llegan ya comprobados por validate() en routes/auth.js (reglas de src/shared/validation/auth.js).

import { prisma, findUserByEmail } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { publicUser } from '../utils/users.js';
import { regenerateSession, destroySession } from '../middleware/session.js';
import { hashPassword, verifyPassword, verifyAgainstDummy } from '../utils/password.js';
import { disconnectUser } from '../realtime/socket.js';

const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000; // «Recordarme»: 7 días
const UNIQUE_VIOLATION = 'P2002'; // Código de Prisma cuando choca con un índice único
const EMAIL_TAKEN = 'Ese correo ya tiene una cuenta';
const ACCOUNT_BLOCKED = 'Tu cuenta está bloqueada. Escríbenos desde Contacto si crees que es un error.';

const emailTaken = () => AppError.conflict(EMAIL_TAKEN, { email: EMAIL_TAKEN });

// Abre la sesión del usuario con un id de sesión nuevo (evita la fijación de sesión)
async function startSession(req, user, remember) {
  await regenerateSession(req);
  req.session.userId = Number(user.id);
  if (remember) req.session.cookie.maxAge = REMEMBER_MS; // Si no, dura hasta cerrar el navegador
}

// Crea el usuario; si otro registro con el mismo correo se cuela a la vez, el índice único lo frena
async function createUser({ name, email, password }) {
  try {
    return await prisma.users.create({ data: { name, email, password_hash: await hashPassword(password) } });
  } catch (error) {
    if (error?.code === UNIQUE_VIOLATION) throw emailTaken();
    throw error;
  }
}

/** POST /api/auth/register  { name, email, password, repeat, accepted } → 201 + usuario (ya con sesión) */
export async function register(req, res) {
  const email = req.body.email.trim();
  if (await findUserByEmail(email)) throw emailTaken();

  const user = await createUser({ name: req.body.name.trim(), email, password: req.body.password });
  // Quien acaba de crear la cuenta queda recordado 7 días, como si marcara «Recordarme»
  await startSession(req, user, true);
  res.status(201).json(publicUser(user));
}

/** POST /api/auth/login  { email, password, remember } → 200 + usuario */
export async function login(req, res) {
  const { email, password, remember } = req.body;
  const user = await findUserByEmail(email.trim());
  // Sin usuario se compara igual con un hash señuelo: tarda lo mismo y no revela qué correos tienen cuenta
  const valid = user ? await verifyPassword(password, user.password_hash) : await verifyAgainstDummy(password);
  if (!valid) throw AppError.invalidCredentials();
  // Solo se dice que está bloqueada a quien ya ha demostrado conocer la contraseña
  if (user.status === 'BLOCKED') throw AppError.forbidden(ACCOUNT_BLOCKED);

  await startSession(req, user, remember === true);
  res.json(publicUser(user));
}

/** POST /api/auth/logout → 204. Sin sesión también responde 204: el resultado es el mismo */
export async function logout(req, res) {
  const userId = req.user?.id;
  await destroySession(req, res);
  // Las demás pestañas abiertas dejan de recibir los avisos de esta cuenta
  if (userId != null) disconnectUser(userId);
  res.status(204).end();
}

/** GET /api/auth/me → usuario de la sesión o null (el front lo pide al cargar la web) */
export function me(req, res) {
  res.json(publicUser(req.user));
}
