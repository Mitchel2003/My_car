export class ItemAdicional {
  constructor({
    id,
    adicionalId,
    descripcion,
    tipo = 'REPUESTO',
    esSeguridad = false,
    cantidad = 1,
    valorUnitario = 0,
    estado = 'PENDIENTE'
  }) {
    if (!descripcion || !descripcion.trim()) {
      throw new Error('La descripción del ítem es obligatoria');
    }

    this.id = id;
    this.adicionalId = adicionalId;
    this.descripcion = descripcion.trim();
    this.tipo = tipo === 'MANO_OBRA' ? 'MANO_OBRA' : 'REPUESTO';
    this.esSeguridad = Boolean(esSeguridad);
    this.cantidad = Math.max(1, Number(cantidad) || 1);
    this.valorUnitario = Math.round(Math.max(0, Number(valorUnitario) || 0));
    this.estado = estado; // PENDIENTE, APROBADO, RECHAZADO
  }

  get subtotal() {
    return this.cantidad * this.valorUnitario;
  }

  responder(nuevoEstado) {
    if (!['APROBADO', 'RECHAZADO'].includes(nuevoEstado)) {
      throw new Error(`Estado de respuesta inválido: ${nuevoEstado}`);
    }
    this.estado = nuevoEstado;
  }
}
