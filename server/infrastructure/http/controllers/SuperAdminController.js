export class SuperAdminController {
  constructor({ tenantRepository, usuarioRepository }) {
    this.tenantRepository = tenantRepository;
    this.usuarioRepository = usuarioRepository;
  }

  // M7.7: Panel de administración de tenants (solo superadmin)
  listarTenants = (req, res) => {
    try {
      const tenants = this.tenantRepository.obtenerTodos();
      // Enriquecer con usuarios de cada taller
      const tenantsEnriquecidos = tenants.map(t => {
        const usuarios = this.usuarioRepository.listarPorTenant(t.id);
        return {
          ...t,
          totalUsuarios: usuarios.length,
          usuarios: usuarios.map(u => ({
            id: u.id,
            nombre: u.nombre,
            email: u.email,
            rol: u.rol
          }))
        };
      });
      res.json({ tenants: tenantsEnriquecidos, total: tenantsEnriquecidos.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  obtenerTenant = (req, res) => {
    try {
      const { slug } = req.params;
      const tenant = this.tenantRepository.buscarPorSlug(slug);
      if (!tenant) return res.status(404).json({ error: 'Taller no encontrado' });
      const usuarios = this.usuarioRepository.listarPorTenant(tenant.id);
      res.json({ ...tenant, usuarios });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}
