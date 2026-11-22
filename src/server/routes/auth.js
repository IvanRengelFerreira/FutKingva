// Rutas de 14 · Acceso (RF1). Todas públicas: son las que abren y cierran la sesión.

import { Router } from 'express';
import * as auth from '../controllers/auth.js';
import { validate } from '../middleware/validate.js';
import { validateLogin, validateRegister } from '../../shared/validation/auth.js';

export const authRouter = Router();
authRouter.post('/register', validate(validateRegister), auth.register);
authRouter.post('/login', validate(validateLogin), auth.login);
authRouter.post('/logout', auth.logout);
authRouter.get('/me', auth.me);
