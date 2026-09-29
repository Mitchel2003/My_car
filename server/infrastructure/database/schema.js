import { db } from './connection.js';
import { randomUUID } from 'node:crypto';
import { Usuario, ROLES } from '../../domain/Usuario.js';

export function inicializarEsquema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ordenes_trabajo (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      token_expira_at DATETIME,
      placa TEXT NOT NULL,
      cliente_nombre TEXT NOT NULL,
      cliente_telefono TEXT NOT NULL,
      vehiculo_modelo TEXT NOT NULL,
      estado TEXT NOT NULL,
      avance_nota TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS adicionales (
      id TEXT PRIMARY KEY,
      ot_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      titulo TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE',
      vence_at DATETIME NOT NULL,
      respondido_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ot_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items_adicional (
      id TEXT PRIMARY KEY,
      adicional_id TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      tipo TEXT NOT NULL,
      es_seguridad INTEGER NOT NULL DEFAULT 0,
      cantidad INTEGER NOT NULL DEFAULT 1,
      valor_unitario INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE',
      FOREIGN KEY (adicional_id) REFERENCES adicionales(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_ot_tenant ON ordenes_trabajo(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_ot_token ON ordenes_trabajo(token);
    CREATE INDEX IF NOT EXISTS idx_adicionales_ot ON adicionales(ot_id);
    CREATE INDEX IF NOT EXISTS idx_items_adicional ON items_adicional(adicional_id);
    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
  `);

  // Add token_expira_at column if it doesn't exist (migration for existing DBs)
  try {
    db.exec('ALTER TABLE ordenes_trabajo ADD COLUMN token_expira_at DATETIME');
  } catch {
    // Column already exists, skip
  }

  const countTenants = db.prepare('SELECT COUNT(*) as count FROM tenants').get().count;
  if (countTenants === 0) {
    poblarDatosSemilla();
  }

  // Seed users independently (allows re-seeding if users table is empty)
  const countUsuarios = db.prepare('SELECT COUNT(*) as count FROM usuarios').get().count;
  if (countUsuarios === 0) {
    poblarUsuarios();
  }
}

function poblarDatosSemilla() {
  const insertTenant = db.prepare(`
    INSERT INTO tenants (id, name, slug, phone, address)
    VALUES (?, ?, ?, ?, ?)
  `);

  const t1Id = randomUUID();
  const t2Id = randomUUID();

  insertTenant.run(t1Id, 'Autofrenos del Norte', 'autofrenos-norte', '310 987 6543', 'Av. Principal #45-12, Bogotá');
  insertTenant.run(t2Id, 'Taller Los Compadres', 'los-compadres', '315 222 8899', 'Calle 80 #12-34, Bogotá');

  const insertOt = db.prepare(`
    INSERT INTO ordenes_trabajo (id, tenant_id, token, placa, cliente_nombre, cliente_telefono, vehiculo_modelo, estado, avance_nota, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();

  // OT 1: Con adicional pendiente urgente (frenos + plumillas)
  const ot1Id = randomUUID();
  const ot1Token = 'token-carlos-001';
  const venceIn42h = new Date(now.getTime() + 42 * 3600 * 1000).toISOString();

  insertOt.run(
    ot1Id,
    t1Id,
    ot1Token,
    'UWE-412',
    'Carlos Mendoza',
    '312 456 7890',
    'Mazda 3 Skyactiv (2020)',
    'Diagnóstico',
    'Vehículo ingresado. Encontramos desgaste irregular en pastillas de freno delanteras.',
    now.toISOString()
  );

  const ad1Id = randomUUID();
  db.prepare(`
    INSERT INTO adicionales (id, ot_id, tenant_id, titulo, estado, vence_at, created_at)
    VALUES (?, ?, ?, ?, 'PENDIENTE', ?, ?)
  `).run(ad1Id, ot1Id, t1Id, 'Reparación de Sistema de Frenos y Accesorios', venceIn42h, now.toISOString());

  const insertItem = db.prepare(`
    INSERT INTO items_adicional (id, adicional_id, descripcion, tipo, es_seguridad, cantidad, valor_unitario, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')
  `);

  insertItem.run(randomUUID(), ad1Id, 'Juego de pastillas de freno delanteras cerámicas', 'REPUESTO', 1, 1, 185000);
  insertItem.run(randomUUID(), ad1Id, 'Mano de obra rectificado de discos delanteros y cambio', 'MANO_OBRA', 1, 1, 95000);
  insertItem.run(randomUUID(), ad1Id, 'Juego de plumillas limpiabrisas de silicona', 'REPUESTO', 0, 2, 45000);

  // OT 2: En reparación normal
  const ot2Id = randomUUID();
  insertOt.run(
    ot2Id,
    t1Id,
    'token-marina-002',
    'KLO-890',
    'Doña Marina Gómez',
    '300 123 4567',
    'Renault Duster 2.0 (2018)',
    'Reparación',
    'Cambiando amortiguadores traseros aprobados previamente. Todo en orden.',
    new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
  );

  // OT 3: Con adicional vencido (frenado)
  const ot3Id = randomUUID();
  const ot3VencePast = new Date(now.getTime() - 4 * 3600 * 1000).toISOString();
  insertOt.run(
    ot3Id,
    t1Id,
    'token-roberto-003',
    'FGT-104',
    'Don Roberto Díaz',
    '311 888 9900',
    'Chevrolet Onix Turbo (2022)',
    'Diagnóstico',
    'Carro detenido en fosa esperando respuesta del cliente por cambio de terminal de dirección.',
    new Date(now.getTime() - 50 * 3600 * 1000).toISOString()
  );

  const ad3Id = randomUUID();
  db.prepare(`
    INSERT INTO adicionales (id, ot_id, tenant_id, titulo, estado, vence_at, created_at)
    VALUES (?, ?, ?, ?, 'VENCIDO', ?, ?)
  `).run(ad3Id, ot3Id, t1Id, 'Cambio urgente de terminales de dirección', ot3VencePast, new Date(now.getTime() - 52 * 3600 * 1000).toISOString());

  insertItem.run(randomUUID(), ad3Id, 'Terminal de dirección derecho e izquierdo', 'REPUESTO', 1, 2, 120000);
  insertItem.run(randomUUID(), ad3Id, 'Alineación computarizada y mano de obra', 'MANO_OBRA', 1, 1, 80000);

  // OT 4: Con respuesta recién recibida del cliente (para alimentar el Inbox del asesor!)
  const ot4Id = randomUUID();
  const ot4Token = 'token-laura-004';
  insertOt.run(
    ot4Id,
    t1Id,
    ot4Token,
    'HJK-555',
    'Laura Restrepo',
    '314 999 1234',
    'Kia Sportage GT Line (2021)',
    'Diagnóstico',
    'Cliente acaba de autorizar mantenimiento preventivo desde su celular.',
    new Date(now.getTime() - 6 * 3600 * 1000).toISOString()
  );

  const ad4Id = randomUUID();
  db.prepare(`
    INSERT INTO adicionales (id, ot_id, tenant_id, titulo, estado, vence_at, respondido_at, created_at)
    VALUES (?, ?, ?, ?, 'RESPONDIDO', ?, ?, ?)
  `).run(
    ad4Id,
    ot4Id,
    t1Id,
    'Mantenimiento de Correa de Repartición y Filtros',
    new Date(now.getTime() + 40 * 3600 * 1000).toISOString(),
    new Date(now.getTime() - 25 * 60 * 1000).toISOString(), // respondido hace 25 mins
    new Date(now.getTime() - 5 * 3600 * 1000).toISOString()
  );

  insertItem.run(randomUUID(), ad4Id, 'Kit de correa de repartición con bomba de agua', 'REPUESTO', 1, 1, 320000);
  insertItem.run(randomUUID(), ad4Id, 'Filtro de aire de cabina', 'REPUESTO', 0, 1, 45000);

  // OT en Taller 2 (Los Compadres)
  insertOt.run(
    randomUUID(),
    t2Id,
    'token-taller2-001',
    'XYZ-999',
    'Pedro Pablo',
    '320 000 1111',
    'Toyota Hilux 4x4',
    'Recibido',
    'En el Taller Los Compadres, no debe ser visible para Autofrenos del Norte',
    now.toISOString()
  );
}

function poblarUsuarios() {
  // Para sembrar usuarios necesitamos los tenant IDs existentes
  const tenant1 = db.prepare("SELECT id FROM tenants WHERE slug = 'autofrenos-norte'").get();
  const tenant2 = db.prepare("SELECT id FROM tenants WHERE slug = 'los-compadres'").get();

  if (!tenant1) return; // Los tenants no han sido sembrados aún

  const insertUsuario = db.prepare(`
    INSERT INTO usuarios (id, tenant_id, nombre, email, password_hash, rol, activo)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  // Autofrenos del Norte
  insertUsuario.run(
    randomUUID(), tenant1.id,
    'Marcela Ríos', 'marcela@autofrenos.co',
    Usuario.hashPassword('marcela123'), ROLES.ASESOR
  );

  insertUsuario.run(
    randomUUID(), tenant1.id,
    'Jairo Medina', 'jairo@autofrenos.co',
    Usuario.hashPassword('jairo123'), ROLES.JEFE_TALLER
  );

  insertUsuario.run(
    randomUUID(), tenant1.id,
    'Don Álvaro', 'admin@autofrenos.co',
    Usuario.hashPassword('alvaro123'), ROLES.ADMIN_TENANT
  );

  // Taller Los Compadres
  if (tenant2) {
    insertUsuario.run(
      randomUUID(), tenant2.id,
      'Pedro Admin', 'admin@loscompadres.co',
      Usuario.hashPassword('pedro123'), ROLES.ADMIN_TENANT
    );
  }

  // Superadmin (sin tenant, accede a todos)
  insertUsuario.run(
    randomUUID(), null,
    'Super Administrador', 'superadmin@mi-carro-al-dia.co',
    Usuario.hashPassword('super2026!'), ROLES.SUPERADMIN
  );
}
