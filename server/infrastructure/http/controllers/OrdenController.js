export class OrdenController {
  constructor({
    obtenerOrdenesTallerUseCase,
    crearOrdenUseCase,
    avanzarEstadoUseCase,
    obtenerDetalleClienteUseCase,
    ordenRepository,
    tenantRepository
  }) {
    this.obtenerOrdenesTallerUseCase = obtenerOrdenesTallerUseCase;
    this.crearOrdenUseCase = crearOrdenUseCase;
    this.avanzarEstadoUseCase = avanzarEstadoUseCase;
    this.obtenerDetalleClienteUseCase = obtenerDetalleClienteUseCase;
    this.ordenRepository = ordenRepository;
    this.tenantRepository = tenantRepository;
  }

  listar = async (req, res) => {
    try {
      const { tenantSlug } = req.params;
      const resultado = await this.obtenerOrdenesTallerUseCase.ejecutar({ tenantSlug });
      res.json(resultado);
    } catch (err) {
      const status = err.message.includes('no encontrado') ? 404 : 500;
      res.status(status).json({ error: err.message });
    }
  };

  crear = async (req, res) => {
    try {
      const { tenantSlug } = req.params;
      const { placa, cliente_nombre, cliente_telefono, vehiculo_modelo, avance_nota } = req.body;

      const resultado = await this.crearOrdenUseCase.ejecutar({
        tenantSlug,
        placa,
        clienteNombre: cliente_nombre,
        clienteTelefono: cliente_telefono,
        vehiculoModelo: vehiculo_modelo,
        avanceNota: avance_nota
      });

      res.status(201).json(resultado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  avanzarEstado = async (req, res) => {
    try {
      const { tenantSlug, id } = req.params;
      const { nuevo_estado } = req.body;

      const resultado = await this.avanzarEstadoUseCase.ejecutar({
        tenantSlug,
        ordenId: id,
        nuevoEstado: nuevo_estado
      });

      res.json(resultado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  actualizarAvance = async (req, res) => {
    try {
      const { tenantSlug, id } = req.params;
      const { avance_nota } = req.body;

      const tenant = this.tenantRepository.buscarPorSlug(tenantSlug);
      if (!tenant) return res.status(404).json({ error: 'Taller no encontrado' });

      const orden = this.ordenRepository.buscarPorIdYTenant(id, tenant.id);
      if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

      orden.actualizarAvance(avance_nota);
      this.ordenRepository.actualizar(orden);

      res.json({ message: 'Avance actualizado', avanceNota: orden.avanceNota });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  verCliente = async (req, res) => {
    try {
      const { token } = req.params;
      const resultado = await this.obtenerDetalleClienteUseCase.ejecutar({ token });
      res.json(resultado);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };
}
