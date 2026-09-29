export class InboxController {
  constructor({ obtenerInboxAsesorUseCase }) {
    this.obtenerInboxAsesorUseCase = obtenerInboxAsesorUseCase;
  }

  obtenerInbox = async (req, res) => {
    try {
      const { tenantSlug } = req.params;
      const items = await this.obtenerInboxAsesorUseCase.ejecutar({ tenantSlug });
      res.json({ inbox: items, total: items.length });
    } catch (err) {
      const status = err.message.includes('no encontrado') ? 404 : 500;
      res.status(status).json({ error: err.message });
    }
  };
}
