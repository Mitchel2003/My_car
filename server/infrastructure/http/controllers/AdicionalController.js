export class AdicionalController {
  constructor({ crearAdicionalUseCase, responderAdicionalUseCase }) {
    this.crearAdicionalUseCase = crearAdicionalUseCase;
    this.responderAdicionalUseCase = responderAdicionalUseCase;
  }

  crear = async (req, res) => {
    try {
      const { tenantSlug, id } = req.params;
      const { titulo, items } = req.body;

      const resultado = await this.crearAdicionalUseCase.ejecutar({
        tenantSlug,
        ordenId: id,
        titulo,
        items
      });

      res.status(201).json(resultado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  responder = async (req, res) => {
    try {
      const { token, adicionalId } = req.params;
      const { respuestas } = req.body;

      const resultado = await this.responderAdicionalUseCase.ejecutar({
        token,
        adicionalId,
        respuestas
      });

      res.json(resultado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}
