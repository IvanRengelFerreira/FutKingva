// Rutas de 20 · Panel de administración (RF8). Todas exigen rol de administrador.

import { Router } from 'express';
import * as admin from '../controllers/admin.js';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateAdminUserUpdate, validateReportAction } from '../../shared/validation/admin.js';

export const adminRouter = Router();
adminRouter.get('/stats', requireRole('admin'), admin.stats);
adminRouter.get('/users', requireRole('admin'), admin.listUsers);
adminRouter.patch('/users/:id', requireRole('admin'), validate(validateAdminUserUpdate), admin.updateUser);
adminRouter.delete('/users/:id', requireRole('admin'), admin.deleteUser);
adminRouter.get('/reports', requireRole('admin'), admin.listReports);
adminRouter.patch('/reports/:id', requireRole('admin'), validate(validateReportAction), admin.resolveReport);
