// Módulo M8.1 / M8.2 / M8.4 / M8.5 — Autenticación y Roles
// Usuarios del taller (Marcela, Jairo, Admin) con hashing con crypto nativo de Node.js
import { createHash } from 'node:crypto';

export const ROLES = {
  ASESOR: 'asesor',
  JEFE_TALLER: 'jefe_taller',
  ADMIN_TENANT: 'admin_tenant',
  SUPERADMIN: 'superadmin'
};

export class Usuario {
  constructor({ id, tenantId, nombre, email, passwordHash, rol, activo = true }) {
    if (!email) throw new Error('El email es obligatorio');
    if (!rol || !Object.values(ROLES).includes(rol)) {
      throw new Error(`Rol inválido: ${rol}. Válidos: ${Object.values(ROLES).join(', ')}`);
    }

    this.id = id;
    this.tenantId = tenantId; // null para superadmin
    this.nombre = nombre;
    this.email = email.toLowerCase().trim();
    this.passwordHash = passwordHash;
    this.rol = rol;
    this.activo = activo;
  }

  static hashPassword(password) {
    return createHash('sha256').update(`mcd_salt_2026_${password}`).digest('hex');
  }

  verificarPassword(password) {
    return this.passwordHash === Usuario.hashPassword(password);
  }

  puedeGestionarTenant(tenantId) {
    if (this.rol === ROLES.SUPERADMIN) return true;
    return this.tenantId === tenantId;
  }
}
