import { db } from '../database/connection.js';
import { Orden } from '../../domain/Orden.js';
import { Adicional } from '../../domain/Adicional.js';
import { ItemAdicional } from '../../domain/ItemAdicional.js';

export class SQLiteOrdenRepository {
  actualizarVencimientosGlobales() {
    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE adicionales
      SET estado = 'VENCIDO'
      WHERE estado = 'PENDIENTE' AND vence_at < ?
    `).run(nowIso);
  }

  listarPorTenantId(tenantId) {
    this.actualizarVencimientosGlobales();

    const rows = db.prepare(`
      SELECT o.*, t.name as tenant_name, t.phone as tenant_phone, t.address as tenant_address
      FROM ordenes_trabajo o
      JOIN tenants t ON o.tenant_id = t.id
      WHERE o.tenant_id = ?
      ORDER BY o.created_at DESC
    `).all(tenantId);

    return rows.map(r => this._mapearOrden(r));
  }

  buscarPorIdYTenant(id, tenantId) {
    const row = db.prepare(`
      SELECT o.*, t.name as tenant_name, t.phone as tenant_phone, t.address as tenant_address
      FROM ordenes_trabajo o
      JOIN tenants t ON o.tenant_id = t.id
      WHERE o.id = ? AND o.tenant_id = ?
    `).get(id, tenantId);

    if (!row) return null;
    return this._mapearOrden(row);
  }

  buscarPorToken(token) {
    this.actualizarVencimientosGlobales();

    const row = db.prepare(`
      SELECT o.*, t.name as tenant_name, t.phone as tenant_phone, t.address as tenant_address
      FROM ordenes_trabajo o
      JOIN tenants t ON o.tenant_id = t.id
      WHERE o.token = ?
    `).get(token);

    if (!row) return null;

    // M8.5: Token expiró al marcarse como Entregado — mostramos info básica pero bloqueamos acciones
    if (row.token_expira_at) {
      const orden = this._mapearOrden(row);
      orden.tenantInfo = {
        name: row.tenant_name,
        phone: row.tenant_phone,
        address: row.tenant_address
      };
      orden.tokenExpirado = true;
      return orden;
    }

    const orden = this._mapearOrden(row);
    orden.tenantInfo = {
      name: row.tenant_name,
      phone: row.tenant_phone,
      address: row.tenant_address
    };
    return orden;
  }

  guardar(orden) {
    db.prepare(`
      INSERT INTO ordenes_trabajo (id, tenant_id, token, placa, cliente_nombre, cliente_telefono, vehiculo_modelo, estado, avance_nota, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orden.id,
      orden.tenantId,
      orden.token,
      orden.placa,
      orden.clienteNombre,
      orden.clienteTelefono,
      orden.vehiculoModelo,
      orden.estado,
      orden.avanceNota,
      orden.createdAt,
      orden.updatedAt
    );
  }

  actualizar(orden) {
    // M8.5: Al marcar como 'Entregado', el token de cliente expira (ya no necesita consultar)
    const tokenExpiraAt = orden.estado === 'Entregado'
      ? new Date().toISOString()
      : null;

    db.prepare(`
      UPDATE ordenes_trabajo
      SET estado = ?, avance_nota = ?, updated_at = ?, token_expira_at = COALESCE(?, token_expira_at)
      WHERE id = ? AND tenant_id = ?
    `).run(
      orden.estado,
      orden.avanceNota,
      orden.updatedAt,
      tokenExpiraAt,
      orden.id,
      orden.tenantId
    );
  }

  guardarAdicional(adicional) {
    const insertAd = db.prepare(`
      INSERT INTO adicionales (id, ot_id, tenant_id, titulo, estado, vence_at, respondido_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO items_adicional (id, adicional_id, descripcion, tipo, es_seguridad, cantidad, valor_unitario, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      insertAd.run(
        adicional.id,
        adicional.otId,
        adicional.tenantId,
        adicional.titulo,
        adicional.estado,
        adicional.venceAt,
        adicional.respondidoAt,
        adicional.createdAt
      );

      for (const it of adicional.items) {
        insertItem.run(
          it.id,
          adicional.id,
          it.descripcion,
          it.tipo,
          it.esSeguridad ? 1 : 0,
          it.cantidad,
          it.valorUnitario,
          it.estado
        );
      }
    });

    tx();
  }

  obtenerAdicionalesPorOt(otId) {
    const adRows = db.prepare(`
      SELECT * FROM adicionales
      WHERE ot_id = ?
      ORDER BY created_at DESC
    `).all(otId);

    return adRows.map(adRow => {
      const itemRows = db.prepare(`
        SELECT * FROM items_adicional
        WHERE adicional_id = ?
      `).all(adRow.id);

      const items = itemRows.map(ir => new ItemAdicional({
        id: ir.id,
        adicionalId: ir.adicional_id,
        descripcion: ir.descripcion,
        tipo: ir.tipo,
        esSeguridad: ir.es_seguridad === 1,
        cantidad: ir.cantidad,
        valorUnitario: ir.valor_unitario,
        estado: ir.estado
      }));

      return new Adicional({
        id: adRow.id,
        otId: adRow.ot_id,
        tenantId: adRow.tenant_id,
        titulo: adRow.titulo,
        estado: adRow.estado,
        venceAt: adRow.vence_at,
        respondidoAt: adRow.respondido_at,
        createdAt: adRow.created_at,
        items
      });
    });
  }

  actualizarAdicional(adicional) {
    const updateAd = db.prepare(`
      UPDATE adicionales
      SET estado = ?, respondido_at = ?
      WHERE id = ?
    `);

    const updateItem = db.prepare(`
      UPDATE items_adicional
      SET estado = ?
      WHERE id = ? AND adicional_id = ?
    `);

    const tx = db.transaction(() => {
      updateAd.run(adicional.estado, adicional.respondidoAt, adicional.id);
      for (const item of adicional.items) {
        updateItem.run(item.estado, item.id, adicional.id);
      }
    });

    tx();
  }

  _mapearOrden(row) {
    return new Orden({
      id: row.id,
      tenantId: row.tenant_id,
      token: row.token,
      placa: row.placa,
      clienteNombre: row.cliente_nombre,
      clienteTelefono: row.cliente_telefono,
      vehiculoModelo: row.vehiculo_modelo,
      estado: row.estado,
      avanceNota: row.avance_nota,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
