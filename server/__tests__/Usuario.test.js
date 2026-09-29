import { describe, it, expect } from 'vitest';
import { Usuario, ROLES } from '../domain/Usuario.js';

describe('Entidad de Dominio: Usuario y Control de Acceso RBAC (M8.3, M8.4)', () => {
  it('debe crear un usuario con hash de contraseña seguro', () => {
    const rawPass = 'secreto123';
    const hash = Usuario.hashPassword(rawPass);

    const usuario = new Usuario({
      id: 'usr-1',
      tenantId: 'tenant-autofrenos',
      nombre: 'Marcela Ríos',
      email: 'marcela@autofrenos.co',
      passwordHash: hash,
      rol: ROLES.ASESOR
    });

    expect(usuario.nombre).toBe('Marcela Ríos');
    expect(usuario.rol).toBe('asesor');
    expect(usuario.verificarPassword('secreto123')).toBe(true);
    expect(usuario.verificarPassword('incorrecta')).toBe(false);
  });

  it('debe rechazar roles inválidos', () => {
    expect(() => {
      new Usuario({
        id: 'usr-bad',
        tenantId: 't1',
        nombre: 'Fantasma',
        email: 'bad@test.co',
        passwordHash: 'abc',
        rol: 'hacker'
      });
    }).toThrow(/Rol inválido/);
  });

  it('debe aislar permisos de tenant para asesor o jefe de taller', () => {
    const asesor = new Usuario({
      id: 'u-marcela',
      tenantId: 'taller-norte',
      nombre: 'Marcela',
      email: 'm@norte.co',
      passwordHash: 'hash',
      rol: ROLES.ASESOR
    });

    expect(asesor.puedeGestionarTenant('taller-norte')).toBe(true);
    expect(asesor.puedeGestionarTenant('taller-sur')).toBe(false);
  });

  it('debe permitir a superadmin gestionar cualquier tenant (M7.7)', () => {
    const superadmin = new Usuario({
      id: 'u-super',
      tenantId: null,
      nombre: 'Root',
      email: 'root@mcd.co',
      passwordHash: 'hash',
      rol: ROLES.SUPERADMIN
    });

    expect(superadmin.puedeGestionarTenant('taller-norte')).toBe(true);
    expect(superadmin.puedeGestionarTenant('cualquier-otro-taller')).toBe(true);
  });
});
