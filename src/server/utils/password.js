// Hash de contraseñas con scrypt, que viene con Node (node:crypto): no hace falta instalar nada.
// Nunca se guarda la contraseña: solo el hash, con una sal aleatoria distinta para cada usuario.
//
// Formato guardado en users.password_hash (todo lo necesario para comprobarla después):
//   scrypt$<N>$<r>$<p>$<sal en base64>$<hash en base64>
// Si algún día se suben los parámetros, las contraseñas antiguas se siguen pudiendo comprobar.

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

// Coste: N = 2^15, r = 8, p = 1 → 32 MB de memoria y ≈ 0,3 s por intento en un portátil
// (parecido a bcrypt con coste 12): lo bastante lento para que probar contraseñas a lo bruto
// no compense, sin que entrar se note lento. (2^17 tardaba ≈ 1,3 s.)
const PARAMS = { N: 2 ** 15, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function maxmem({ N, r }) {
  return 128 * N * r + 1024 * 1024; // Memoria que necesita scrypt, con margen
}

/** Hash de una contraseña nueva (registro, cambio de contraseña) */
export async function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: maxmem(PARAMS) });
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), hash.toString('base64')].join('$');
}

/** ¿La contraseña coincide con el hash guardado? (false si el hash no tiene el formato esperado) */
export async function verifyPassword(password, stored) {
  const [algorithm, N, r, p, salt, hash] = String(stored).split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;

  const params = { N: Number(N), r: Number(r), p: Number(p) };
  const expected = Buffer.from(hash, 'base64');
  const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length, {
    ...params,
    maxmem: maxmem(params),
  });
  // Comparación en tiempo constante: no deja adivinar el hash midiendo cuánto tarda
  return timingSafeEqual(actual, expected);
}

// Hash de una contraseña cualquiera: al entrar con un correo que no existe se comprueba contra él,
// para que tarde lo mismo que con uno que sí existe y no se pueda saber qué correos están registrados.
// Se calcula una vez al arrancar, para que el primer intento no tarde el doble.
const dummyHash = hashPassword('contraseña-inexistente-1');
export async function verifyAgainstDummy(password) {
  await verifyPassword(password, await dummyHash);
  return false;
}
