export class AuthController {
  constructor({ loginUseCase, tenantRepository, usuarioRepository }) {
    this.loginUseCase = loginUseCase;
    this.tenantRepository = tenantRepository;
    this.usuarioRepository = usuarioRepository;
  }

  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const resultado = await this.loginUseCase.ejecutar({ email, password });
      res.json(resultado);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  };

  perfil = (req, res) => {
    res.json({ usuario: req.usuario });
  };
}
