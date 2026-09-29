import { db } from '../database/connection.js';
import { Usuario } from '../../domain/Usuario.js';

export class SQLiteUsuarioRepository {
  buscarPorEmail(email) {
    const row = db.prepare('SELECT * FROM usuarios WHERE email = ? AND activo = 1').get(email.toLowerCase());
    if (!row) return null;
    return this._mapear(row);
  }

  buscarPorId(id) {
    const row = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!row) return null;
    return this._mapear(row);
  }

  listarPorTenant(tenantId) {
    const rows = db.prepare('SELECT * FROM usuarios WHERE tenant_id = ? AND activo = 1').all(tenantId);
    return rows.map(r => this._mapear(r));
  }

  guardar(usuario) {
    db.prepare(`
      INSERT OR REPLACE INTO usuarios (id, tenant_id, nombre, email, password_hash, rol, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      usuario.id,
      usuario.tenantId,
      usuario.nombre,
      usuario.email,
      usuario.passwordHash,
      usuario.rol,
      usuario.activo ? 1 : 0
    );
  }

  _mapear(row) {
    return new Usuario({
      id: row.id,
      tenantId: row.tenant_id,
      nombre: row.nombre,
      email: row.email,
      passwordHash: row.password_hash,
      rol: row.rol,
      activo: row.activo === 1
    });
  }
}
