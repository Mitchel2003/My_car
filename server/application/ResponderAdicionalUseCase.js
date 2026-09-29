export class ResponderAdicionalUseCase {
  constructor({ ordenRepository }) {
    this.ordenRepository = ordenRepository;
  }

  async ejecutar({ token, adicionalId, respuestas }) {
    if (!token) throw new Error('Token de cliente requerido');
    if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
      throw new Error('Debe responder al menos un ítem');
    }

    const orden = this.ordenRepository.buscarPorToken(token);
    if (!orden) {
      throw new Error('Acceso no autorizado o enlace inválido');
    }

    // M8.5: Si la orden fue entregada o el token expiró, no se permiten modificaciones
    if (orden.tokenExpirado || orden.estado === 'Entregado') {
      throw new Error('El servicio ya fue entregado y este enlace ha expirado. Por favor comunícate directamente con el taller.');
    }

    const adicionales = this.ordenRepository.obtenerAdicionalesPorOt(orden.id);
    const adicional = adicionales.find(a => a.id === adicionalId);
    if (!adicional) {
      throw new Error('Cotización adicional no encontrada');
    }

    // El dominio valida vencimiento de 48h, inmutabilidad y estados válidos
    adicional.responder({ respuestas });

    this.ordenRepository.actualizarAdicional(adicional);

    return {
      message: '¡Decisión registrada exitosamente!',
      respondidoAt: adicional.respondidoAt,
      totalAprobado: adicional.totalAprobado
    };
  }
}
