export class Semaforo {
  static calcular({ orden, adicionales = [], now = new Date() }) {
    if (orden.estado === 'Entregado') {
      return {
        color: 'GRIS',
        detalle: 'Vehículo entregado al cliente',
        horasRestantes: null
      };
    }

    if (orden.estado === 'Listo para entregar') {
      return {
        color: 'VERDE',
        detalle: 'Listo para retiro por el propietario',
        horasRestantes: null
      };
    }

    const adicionalVencido = adicionales.find(a => a.haVencido(now));
    if (adicionalVencido) {
      return {
        color: 'ROJO',
        detalle: 'Adicional venció (> 48h sin respuesta). Vehículo detenido.',
        horasRestantes: 0
      };
    }

    const adicionalPendiente = adicionales.find(a => a.estado === 'PENDIENTE');
    if (adicionalPendiente) {
      const horas = adicionalPendiente.horasRestantes(now);
      if (horas <= 12) {
        return {
          color: 'ROJO',
          detalle: `Urgente: vence en ${horas}h`,
          horasRestantes: horas
        };
      }
      return {
        color: 'AMARILLO',
        detalle: `Esperando al cliente (${horas}h restantes)`,
        horasRestantes: horas
      };
    }

    return {
      color: 'VERDE',
      detalle: 'En tiempo normal',
      horasRestantes: null
    };
  }
}
