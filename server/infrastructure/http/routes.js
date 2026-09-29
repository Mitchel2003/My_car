import { Router } from 'express';
import { autenticar, requerirRoles } from './authMiddleware.js';
import { ROLES } from '../../domain/Usuario.js';

export function configurarRutas({
  tenantController,
  ordenController,
  adicionalController,
  inboxController,
  authController,
  superAdminController
}) {
  const router = Router();

  // 1. Autenticación (M8.3)
  router.post('/auth/login', authController.login);
  router.get('/auth/perfil', autenticar, authController.perfil);

  // 2. Tenants (Público / Asesores)
  router.get('/tenants', tenantController.obtenerTodos);

  // 3. Superadmin Panel (M7.7 - Solo Superadmin)
  router.get('/admin/tenants', autenticar, requerirRoles(ROLES.SUPERADMIN), superAdminController.listarTenants);
  router.get('/admin/tenants/:slug', autenticar, requerirRoles(ROLES.SUPERADMIN), superAdminController.obtenerTenant);

  // 4. Taller - Tablero y Órdenes
  router.get('/:tenantSlug/ordenes', ordenController.listar);
  router.post('/:tenantSlug/ordenes', ordenController.crear);
  router.patch('/:tenantSlug/ordenes/:id/estado', ordenController.avanzarEstado);
  router.patch('/:tenantSlug/ordenes/:id/avance', ordenController.actualizarAvance);

  // 5. Taller - Adicionales
  router.post('/:tenantSlug/ordenes/:id/adicionales', adicionalController.crear);

  // 6. Asesor - Bandeja de Entrada / Inbox Operativo
  router.get('/:tenantSlug/inbox', inboxController.obtenerInbox);

  // 7. Portal Cliente - Consulta y Respuestas (Sin login, acceso seguro vía token de OT)
  router.get('/public/ver/:token', ordenController.verCliente);
  router.post('/public/ver/:token/adicionales/:adicionalId/responder', adicionalController.responder);

  return router;
}
