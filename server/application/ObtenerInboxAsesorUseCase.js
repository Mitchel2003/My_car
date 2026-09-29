import { InboxItem } from '../domain/InboxItem.js';

export class ObtenerInboxAsesorUseCase {
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
    const inboxItems = [];

    for (const orden of ordenes) {
      const adicionales = this.ordenRepository.obtenerAdicionalesPorOt(orden.id);

      // 1. Revisar respuestas recientes de clientes
      const adicionalesRespondidos = adicionales.filter(a => a.estado === 'RESPONDIDO');
      for (const ad of adicionalesRespondidos) {
        const aprobados = ad.items.filter(i => i.estado === 'APROBADO').length;
        const totalItems = ad.items.length;

        inboxItems.push(new InboxItem({
          id: `resp-${ad.id}`,
          otId: orden.id,
          placa: orden.placa,
          clienteNombre: orden.clienteNombre,
          clienteTelefono: orden.clienteTelefono,
          vehiculoModelo: orden.vehiculoModelo,
          tipo: 'RESPUESTA_CLIENTE',
          prioridad: 'ALTA',
          titulo: `Respuesta recibida: ${orden.clienteNombre}`,
          mensaje: `Aprobó ${aprobados} de ${totalItems} ítems en "${ad.titulo}" ($${ad.totalAprobado.toLocaleString('es-CO')} COP).`,
          accionSugerida: 'Informar a Jairo para iniciar montaje de repuestos aprobados',
          timestamp: ad.respondidoAt || orden.updatedAt,
          token: orden.token
        }));
      }

      // 2. Revisar adicionales vencidos (bloqueando fosa de taller)
      const adicionalesVencidos = adicionales.filter(a => a.haVencido(now) && a.estado !== 'RESPONDIDO');
      for (const ad of adicionalesVencidos) {
        inboxItems.push(new InboxItem({
          id: `venc-${ad.id}`,
          otId: orden.id,
          placa: orden.placa,
          clienteNombre: orden.clienteNombre,
          clienteTelefono: orden.clienteTelefono,
          vehiculoModelo: orden.vehiculoModelo,
          tipo: 'ADICIONAL_VENCIDO',
          prioridad: 'ALTA',
          titulo: `¡Cotización Vencida! Placa ${orden.placa}`,
          mensaje: `Transcurrieron 48 horas sin respuesta en "${ad.titulo}". El vehículo está detenido en fosa.`,
          accionSugerida: `Llamar inmediatamente a ${orden.clienteNombre} (${orden.clienteTelefono})`,
          timestamp: ad.venceAt,
          token: orden.token
        }));
      }

      // 3. Revisar adicionales por vencer (< 12 horas)
      const adicionalesPorVencer = adicionales.filter(
        a => a.estado === 'PENDIENTE' && !a.haVencido(now) && a.horasRestantes(now) <= 12
      );
      for (const ad of adicionalesPorVencer) {
        const horas = ad.horasRestantes(now);
        inboxItems.push(new InboxItem({
          id: `por-venc-${ad.id}`,
          otId: orden.id,
          placa: orden.placa,
          clienteNombre: orden.clienteNombre,
          clienteTelefono: orden.clienteTelefono,
          vehiculoModelo: orden.vehiculoModelo,
          tipo: 'ADICIONAL_POR_VENCER',
          prioridad: 'MEDIA',
          titulo: `Próximo a vencer (${horas}h restantes)`,
          mensaje: `"${ad.titulo}" vencerá pronto si el cliente no autoriza desde su celular.`,
          accionSugerida: 'Reenviar enlace por WhatsApp para recordar la urgencia',
          timestamp: ad.createdAt,
          token: orden.token
        }));
      }

      // 4. Autos listos para entrega
      if (orden.estado === 'Listo para entregar') {
        inboxItems.push(new InboxItem({
          id: `listo-${orden.id}`,
          otId: orden.id,
          placa: orden.placa,
          clienteNombre: orden.clienteNombre,
          clienteTelefono: orden.clienteTelefono,
          vehiculoModelo: orden.vehiculoModelo,
          tipo: 'ORDEN_LISTA',
          prioridad: 'MEDIA',
          titulo: `Vehículo listo para entrega: ${orden.placa}`,
          mensaje: `Los técnicos terminaron todas las labores de ${orden.vehiculoModelo}.`,
          accionSugerida: 'Coordinar con el propietario horario para recoger el carro',
          timestamp: orden.updatedAt,
          token: orden.token
        }));
      }
    }

    // Ordenar: primero ALTA, luego MEDIA, luego por fecha más reciente
    const pesoPrioridad = { ALTA: 1, MEDIA: 2, INFORMATIVA: 3 };
    inboxItems.sort((a, b) => {
      const pDiff = (pesoPrioridad[a.prioridad] || 3) - (pesoPrioridad[b.prioridad] || 3);
      if (pDiff !== 0) return pDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return inboxItems;
  }
}
