import { randomUUID } from 'node:crypto';
import { Adicional } from '../domain/Adicional.js';
import { ItemAdicional } from '../domain/ItemAdicional.js';

export class CrearAdicionalUseCase {
  constructor({ ordenRepository, tenantRepository }) {
    this.ordenRepository = ordenRepository;
    this.tenantRepository = tenantRepository;
  }

  async ejecutar({ tenantSlug, ordenId, titulo, items }) {
    const tenant = this.tenantRepository.buscarPorSlug(tenantSlug);
    if (!tenant) {
      throw new Error(`Taller con slug '${tenantSlug}' no encontrado`);
    }

    const orden = this.ordenRepository.buscarPorIdYTenant(ordenId, tenant.id);
    if (!orden) {
      throw new Error('Orden de trabajo no encontrada');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Debe especificar al menos un ítem para la cotización');
    }

    const adicionalId = randomUUID();
    const itemsEntities = items.map(it => new ItemAdicional({
      id: randomUUID(),
      adicionalId,
      descripcion: it.descripcion,
      tipo: it.tipo,
      esSeguridad: Boolean(it.es_seguridad),
      cantidad: it.cantidad,
      valorUnitario: it.valor_unitario
    }));

    const adicional = new Adicional({
      id: adicionalId,
      otId: orden.id,
      tenantId: tenant.id,
      titulo,
      items: itemsEntities
    });

    this.ordenRepository.guardarAdicional(adicional);

    return {
      id: adicional.id,
      titulo: adicional.titulo,
      venceAt: adicional.venceAt,
      subtotal: adicional.subtotal,
      iva: adicional.iva,
      total: adicional.total
    };
  }
}
