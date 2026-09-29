import { Semaforo } from '../domain/Semaforo.js';

export class ObtenerOrdenesTallerUseCase {
  constructor({ ordenRepository, tenantRepository }) {
    this.ordenRepository = ordenRepository;
    this.tenantRepository = tenantRepository;
  }

  async ejecutar({ tenantSlug }) {
    const tenant = this.tenantRepository.buscarPorSlug(tenantSlug);
    if (!tenant) {
      throw new Error(`Taller '${tenantSlug}' no encontrado`);
    }

    const ordenes = this.ordenRepository.listarPorTenantId(tenant.id);
    const now = new Date();

    const ordenesDTO = ordenes.map(orden => {
      const adicionales = this.ordenRepository.obtenerAdicionalesPorOt(orden.id);
      const semaforoInfo = Semaforo.calcular({ orden, adicionales, now });

      return {
        id: orden.id,
        tenantId: orden.tenantId,
        token: orden.token,
        placa: orden.placa,
        clienteNombre: orden.clienteNombre,
        clienteTelefono: orden.clienteTelefono,
        vehiculoModelo: orden.vehiculoModelo,
        estado: orden.estado,
        avanceNota: orden.avanceNota,
        createdAt: orden.createdAt,
        updatedAt: orden.updatedAt,
        semaforo: semaforoInfo.color,
        detalleSemaforo: semaforoInfo.detalle,
        horasRestantesAdicional: semaforoInfo.horasRestantes,
        adicionales: adicionales.map(ad => ({
          id: ad.id,
          titulo: ad.titulo,
          estado: ad.estado,
          subtotal: ad.subtotal,
          iva: ad.iva,
          total: ad.total,
          horasRestantes: ad.horasRestantes(now),
          haVencido: ad.haVencido(now),
          items: ad.items.map(it => ({
            id: it.id,
            descripcion: it.descripcion,
            tipo: it.tipo,
            esSeguridad: it.esSeguridad,
            cantidad: it.cantidad,
            valorUnitario: it.valorUnitario,
            subtotal: it.subtotal,
            estado: it.estado
          }))
        }))
      };
    });

    return {
      tenant,
      ordenes: ordenesDTO
    };
  }
}
