import { randomUUID } from 'node:crypto';
import { Orden } from '../domain/Orden.js';

export class CrearOrdenUseCase {
  constructor({ ordenRepository, tenantRepository }) {
    this.ordenRepository = ordenRepository;
    this.tenantRepository = tenantRepository;
  }

  async ejecutar({ tenantSlug, placa, clienteNombre, clienteTelefono, vehiculoModelo, avanceNota }) {
    const tenant = this.tenantRepository.buscarPorSlug(tenantSlug);
    if (!tenant) {
      throw new Error(`Taller con slug '${tenantSlug}' no encontrado`);
    }

    const id = randomUUID();
    const token = randomUUID();

    const nuevaOrden = new Orden({
      id,
      tenantId: tenant.id,
      token,
      placa,
      clienteNombre,
      clienteTelefono,
      vehiculoModelo,
      estado: 'Recibido',
      avanceNota: avanceNota || 'Vehículo ingresado a patio para revisión.'
    });

    this.ordenRepository.guardar(nuevaOrden);

    return {
      id: nuevaOrden.id,
      token: nuevaOrden.token,
      placa: nuevaOrden.placa,
      estado: nuevaOrden.estado
    };
  }
}
