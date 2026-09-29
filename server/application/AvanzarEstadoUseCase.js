export class AvanzarEstadoUseCase {
  constructor({ ordenRepository, tenantRepository }) {
    this.ordenRepository = ordenRepository;
    this.tenantRepository = tenantRepository;
  }

  async ejecutar({ tenantSlug, ordenId, nuevoEstado }) {
    const tenant = this.tenantRepository.buscarPorSlug(tenantSlug);
    if (!tenant) {
      throw new Error(`Taller con slug '${tenantSlug}' no encontrado`);
    }

    const orden = this.ordenRepository.buscarPorIdYTenant(ordenId, tenant.id);
    if (!orden) {
      throw new Error('Orden de trabajo no encontrada en este taller');
    }

    // El dominio valida que la transición sea estrictamente el estado siguiente
    orden.avanzarEstado(nuevoEstado);

    this.ordenRepository.actualizar(orden);

    return {
      id: orden.id,
      placa: orden.placa,
      estado: orden.estado,
      updatedAt: orden.updatedAt
    };
  }
}
