// Crea (o deja como nuevas) las cuentas de demostración, una por rol: `npm run seed:demo` en src/server.
// Las usan los botones «Acceso rápido de prueba» de 14 · Acceso. Se puede repetir sin duplicar:
// si la cuenta ya existe, le vuelve a poner la contraseña de demo, su rol y la desbloquea.
// ⚠ La contraseña es pública (src/shared/demoAccounts.js): no ejecutar en un servidor real.

import { prisma, findUserByEmail } from '../db.js';
import { hashPassword } from '../utils/password.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../shared/demoAccounts.js';

try {
  for (const { role, name, email } of DEMO_ACCOUNTS) {
    const data = { name, role: role.toUpperCase(), status: 'ACTIVE', password_hash: await hashPassword(DEMO_PASSWORD) };
    const existing = await findUserByEmail(email);

    if (existing) {
      await prisma.users.update({ where: { id: existing.id }, data });
      console.log(`Actualizada: ${email} (${role})`);
    } else {
      await prisma.users.create({ data: { ...data, email } });
      console.log(`Creada:      ${email} (${role})`);
    }
  }
  console.log(`Contraseña de todas: ${DEMO_PASSWORD}`);
} finally {
  await prisma.$disconnect();
}
