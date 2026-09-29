import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mcd_dev_secret_2026_mi_carro_al_dia';
const JWT_EXPIRES_IN = '8h';

export class LoginUseCase {
  constructor({ usuarioRepository }) {
    this.usuarioRepository = usuarioRepository;
  }

  async ejecutar({ email, password }) {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    const usuario = this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      throw new Error('Credenciales incorrectas');
    }

    if (!usuario.verificarPassword(password)) {
      throw new Error('Credenciales incorrectas');
    }

    // M8.4: El token JWT encapsula el rol y el tenantId para RBAC
    const token = jwt.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        tenantId: usuario.tenantId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        tenantId: usuario.tenantId
      }
    };
  }
}

export function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
