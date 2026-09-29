export class ObtenerDetalleClienteUseCase {
  constructor({ ordenRepository }) {
    this.ordenRepository = ordenRepository;
  }

  async ejecutar({ token }) {
    const orden = this.ordenRepository.buscarPorToken(token);
    if (!orden) {
      throw new Error('El enlace no es válido o ha expirado.');
    }

    const now = new Date();
    const adicionales = this.ordenRepository.obtenerAdicionalesPorOt(orden.id);

    return {
      orden: {
        id: orden.id,
        placa: orden.placa,
        clienteNombre: orden.clienteNombre,
        cliente_nombre: orden.clienteNombre,
        clienteTelefono: orden.clienteTelefono,
        cliente_telefono: orden.clienteTelefono,
        vehiculoModelo: orden.vehiculoModelo,
        vehiculo_modelo: orden.vehiculoModelo,
        estado: orden.estado,
        avanceNota: orden.avanceNota,
        avance_nota: orden.avanceNota,
        tenantName: orden.tenantInfo?.name || '',
        tenant_name: orden.tenantInfo?.name || '',
        tenantPhone: orden.tenantInfo?.phone || '',
        tenant_phone: orden.tenantInfo?.phone || '',
        tenantAddress: orden.tenantInfo?.address || '',
        tenant_address: orden.tenantInfo?.address || '',
        tokenExpirado: Boolean(orden.tokenExpirado)
      },
      adicionales: adicionales.map(ad => ({
        id: ad.id,
        titulo: ad.titulo,
        estado: ad.estado,
        venceAt: ad.venceAt,
        vence_at: ad.venceAt,
        respondidoAt: ad.respondidoAt,
        respondido_at: ad.respondidoAt,
        subtotal: ad.subtotal,
        iva: ad.iva,
        total: ad.total,
        subtotalAprobado: ad.subtotalAprobado,
        subtotal_aprobado: ad.subtotalAprobado,
        ivaAprobado: ad.ivaAprobado,
        iva_aprobado: ad.ivaAprobado,
        totalAprobado: ad.totalAprobado,
        total_aprobado: ad.totalAprobado,
        horasRestantes: ad.horasRestantes(now),
        haVencido: ad.haVencido(now),
        ha_vencido: ad.haVencido(now),
        items: ad.items.map(it => ({
          id: it.id,
          descripcion: it.descripcion,
          tipo: it.tipo,
          esSeguridad: it.esSeguridad ? 1 : 0,
          es_seguridad: it.esSeguridad ? 1 : 0,
          cantidad: it.cantidad,
          valorUnitario: it.valorUnitario,
          valor_unitario: it.valorUnitario,
          subtotal: it.subtotal,
          estado: it.estado
        }))
      }))
    };
  }
}
