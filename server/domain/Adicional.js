import { ItemAdicional } from './ItemAdicional.js';

export const IVA_PORCENTAJE = 0.19;
export const HORAS_VENCIMIENTO_DEFAULT = 48;

export class Adicional {
  constructor({
    id,
    otId,
    tenantId,
    titulo,
    estado = 'PENDIENTE',
    venceAt,
    respondidoAt = null,
    createdAt = new Date().toISOString(),
    items = []
  }) {
    if (!otId) throw new Error('El otId es obligatorio');
    if (!tenantId) throw new Error('El tenantId es obligatorio');
    if (!titulo || !titulo.trim()) throw new Error('El título de la cotización es obligatorio');

    this.id = id;
    this.otId = otId;
    this.tenantId = tenantId;
    this.titulo = titulo.trim();
    this.estado = estado; // PENDIENTE, RESPONDIDO, VENCIDO
    this.venceAt = venceAt || new Date(Date.now() + HORAS_VENCIMIENTO_DEFAULT * 3600 * 1000).toISOString();
    this.respondidoAt = respondidoAt;
    this.createdAt = createdAt;
    this.items = items.map(it => it instanceof ItemAdicional ? it : new ItemAdicional(it));
  }

  haVencido(now = new Date()) {
    if (this.estado === 'VENCIDO') return true;
    if (this.estado === 'PENDIENTE') {
      const venceTime = new Date(this.venceAt).getTime();
      return now.getTime() >= venceTime;
    }
    return false;
  }

  horasRestantes(now = new Date()) {
    const venceTime = new Date(this.venceAt).getTime();
    const diff = (venceTime - now.getTime()) / (1000 * 60 * 60);
    return Math.max(0, Math.round(diff));
  }

  evaluarVencimiento(now = new Date()) {
    if (this.estado === 'PENDIENTE' && this.haVencido(now)) {
      this.estado = 'VENCIDO';
      return true;
    }
    return false;
  }

  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get iva() {
    return Math.round(this.subtotal * IVA_PORCENTAJE);
  }

  get total() {
    return this.subtotal + this.iva;
  }

  get subtotalAprobado() {
    return this.items
      .filter(it => it.estado === 'APROBADO')
      .reduce((sum, item) => sum + item.subtotal, 0);
  }

  get ivaAprobado() {
    return Math.round(this.subtotalAprobado * IVA_PORCENTAJE);
  }

  get totalAprobado() {
    return this.subtotalAprobado + this.ivaAprobado;
  }

  responder({ respuestas, now = new Date() }) {
    if (this.haVencido(now)) {
      this.estado = 'VENCIDO';
      throw new Error(
        'El plazo de 48 horas ha vencido. Por favor comuníquese por teléfono con el taller para coordinar el trabajo.'
      );
    }

    if (this.estado === 'RESPONDIDO') {
      throw new Error(
        'Esta cotización ya fue respondida anteriormente y es inmutable. Llame al taller si necesita una modificación.'
      );
    }

    for (const { itemId, estado } of respuestas) {
      const item = this.items.find(i => i.id === itemId);
      if (!item) {
        throw new Error(`Ítem con ID '${itemId}' no pertenece a este adicional`);
      }
      item.responder(estado);
    }

    this.estado = 'RESPONDIDO';
    this.respondidoAt = now.toISOString();
  }
}
