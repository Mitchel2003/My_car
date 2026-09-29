export class InboxItem {
  constructor({
    id,
    otId,
    placa,
    clienteNombre,
    clienteTelefono,
    vehiculoModelo,
    tipo, // RESPUESTA_CLIENTE, ADICIONAL_POR_VENCER, ADICIONAL_VENCIDO, ORDEN_LISTA, REQUIERE_DIAGNOSTICO
    prioridad, // ALTA, MEDIA, INFORMATIVA
    titulo,
    mensaje,
    accionSugerida,
    timestamp,
    token
  }) {
    this.id = id;
    this.otId = otId;
    this.placa = placa;
    this.clienteNombre = clienteNombre;
    this.clienteTelefono = clienteTelefono;
    this.vehiculoModelo = vehiculoModelo;
    this.tipo = tipo;
    this.prioridad = prioridad;
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.accionSugerida = accionSugerida;
    this.timestamp = timestamp;
    this.token = token;
  }
}
