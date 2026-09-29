export const ESTADOS_ORDEN = [
  'Recibido',
  'Diagnóstico',
  'Reparación',
  'Control de calidad',
  'Listo para entregar',
  'Entregado'
];

export class Orden {
  constructor({
    id,
    tenantId,
    token,
    placa,
    clienteNombre,
    clienteTelefono,
    vehiculoModelo,
    estado = 'Recibido',
    avanceNota = '',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    if (!tenantId) throw new Error('El tenantId es obligatorio para garantizar multitenencia');
    if (!placa) throw new Error('La placa del vehículo es obligatoria');
    if (!clienteNombre) throw new Error('El nombre del cliente es obligatorio');
    if (!clienteTelefono) throw new Error('El teléfono del cliente es obligatorio');
    if (!vehiculoModelo) throw new Error('El modelo del vehículo es obligatorio');
    if (estado && !ESTADOS_ORDEN.includes(estado)) {
      throw new Error(`Estado inválido: '${estado}'. Válidos: ${ESTADOS_ORDEN.join(', ')}`);
    }

    this.id = id;
    this.tenantId = tenantId;
    this.token = token;
    this.placa = placa.toUpperCase().trim();
    this.clienteNombre = clienteNombre.trim();
    this.clienteTelefono = clienteTelefono.trim();
    this.vehiculoModelo = vehiculoModelo.trim();
    this.estado = estado;
    this.avanceNota = avanceNota;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  validarSiguienteEstado(nuevoEstado) {
    const currentIndex = ESTADOS_ORDEN.indexOf(this.estado);
    const targetIndex = ESTADOS_ORDEN.indexOf(nuevoEstado);

    if (targetIndex === -1) {
      throw new Error(`Estado '${nuevoEstado}' inválido. Válidos: ${ESTADOS_ORDEN.join(', ')}`);
    }

    if (currentIndex >= ESTADOS_ORDEN.length - 1) {
      throw new Error(`La orden ya se encuentra en estado final: '${this.estado}'`);
    }

    if (targetIndex !== currentIndex + 1) {
      throw new Error(
        `Transición no permitida. De '${this.estado}' solo se puede avanzar a '${ESTADOS_ORDEN[currentIndex + 1]}'`
      );
    }

    return true;
  }

  avanzarEstado(nuevoEstado, nota) {
    this.validarSiguienteEstado(nuevoEstado);
    this.estado = nuevoEstado;
    if (nota !== undefined) {
      this.avanceNota = (nota || '').trim();
    }
    this.updatedAt = new Date().toISOString();
  }

  actualizarAvance(nota) {
    this.avanceNota = (nota || '').trim();
    this.updatedAt = new Date().toISOString();
  }

  siguienteEstado() {
    const currentIndex = ESTADOS_ORDEN.indexOf(this.estado);
    if (currentIndex >= ESTADOS_ORDEN.length - 1) return null;
    return ESTADOS_ORDEN[currentIndex + 1];
  }

  estaFinalizada() {
    return this.estado === 'Entregado';
  }
}
