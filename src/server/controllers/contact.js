// 16 · Contacto: guarda los mensajes que escriben los visitantes. Responsable: Carlota.
// Los datos llegan ya comprobados por validate() en routes/contact.js (reglas de src/shared/validation/contact.js).

import { prisma } from '../db.js';
import { subjectLabel } from '../../shared/validation/contact.js';

/** POST /api/contact  { name, email, subject, message, accepted } → 201 + { id, createdAt } */
export async function create(req, res) {
  const { name, email, subject, message } = req.body;
  const saved = await prisma.contact_messages.create({
    data: { name: name.trim(), email: email.trim(), subject: subjectLabel(subject), message: message.trim() },
  });
  res.status(201).json({ id: saved.id, createdAt: saved.created_at });
}
