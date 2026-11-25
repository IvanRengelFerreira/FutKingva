// Ruta de 16 · Contacto. Pública: cualquier visitante puede escribir al equipo.

import { Router } from 'express';
import * as contact from '../controllers/contact.js';
import { validate } from '../middleware/validate.js';
import { validateContact } from '../../shared/validation/contact.js';

export const contactRouter = Router();
contactRouter.post('/', validate(validateContact), contact.create);
