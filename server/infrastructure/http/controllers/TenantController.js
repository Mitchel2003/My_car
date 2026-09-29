export class TenantController {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  obtenerTodos = (req, res) => {
    try {
      const tenants = this.tenantRepository.obtenerTodos();
      res.json(tenants);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}
