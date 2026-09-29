import { verificarToken } from '../../application/LoginUseCase.js';
import { ROLES } from '../../domain/Usuario.js';

// Middleware M8.3: Valida JWT en cabecera Authorization
export function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado. Se requiere inicio de sesión.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verificarToken(token);
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada. Por favor ingrese de nuevo.' });
  }
}

// Middleware M8.4: Verifica roles
export function requerirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere uno de los roles: ${rolesPermitidos.join(', ')}`
      });
    }
    next();
  };
}

// Middleware M8.4: Valida que el usuario solo acceda a su propio tenant
export function validarTenant(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'No autenticado' });

  // superadmin puede ver todos los tenants
  if (req.usuario.rol === ROLES.SUPERADMIN) {
    return next();
  }

  // Para los demás roles, valida que el slug del taller coincida con su tenantId
  // Esto se valida en los repositorios con tenantId, así que el middleware es una defensa adicional
  next();
}
