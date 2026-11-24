// Contacto (POST /api/contact). Responsable: Carlota.
import { apiFetch } from './client.js';

/** { name, email, subject, message, accepted } → { id, createdAt } */
export const sendContactMessage = (data) => apiFetch('/contact', { method: 'POST', body: data });
