import { db } from '../database/connection.js';

export class SQLiteTenantRepository {
  obtenerTodos() {
    return db.prepare('SELECT id, name, slug, phone, address FROM tenants ORDER BY name ASC').all();
  }

  buscarPorSlug(slug) {
    return db.prepare('SELECT id, name, slug, phone, address FROM tenants WHERE slug = ?').get(slug);
  }

  buscarPorId(id) {
    return db.prepare('SELECT id, name, slug, phone, address FROM tenants WHERE id = ?').get(id);
  }
}
