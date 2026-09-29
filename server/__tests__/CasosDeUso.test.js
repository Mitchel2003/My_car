import { describe, it, expect } from 'vitest';
import { CrearOrdenUseCase } from '../application/CrearOrdenUseCase.js';
import { AvanzarEstadoUseCase } from '../application/AvanzarEstadoUseCase.js';
import { ResponderAdicionalUseCase } from '../application/ResponderAdicionalUseCase.js';
import { LoginUseCase } from '../application/LoginUseCase.js';
import { Orden } from '../domain/Orden.js';
import { Usuario, ROLES } from '../domain/Usuario.js';

describe('Casos de Uso de Aplicación (Clean Architecture)', () => {
  it('CrearOrdenUseCase: debe validar tenant y crear OT con token único', async () => {
    let ordenGuardada = null;
    const fakeTenantRepo = {
      buscarPorSlug: (slug) => (slug === 'taller-1' ? { id: 'tid-1', slug: 'taller-1' } : null)
    };
    const fakeOrdenRepo = {
      guardar: (orden) => { ordenGuardada = orden; }
    };

    const useCase = new CrearOrdenUseCase({
      ordenRepository: fakeOrdenRepo,
      tenantRepository: fakeTenantRepo
    });

    const resultado = await useCase.ejecutar({
      tenantSlug: 'taller-1',
      placa: 'XYZ-789',
      clienteNombre: 'Ana María',
      clienteTelefono: '310 999 8888',
      vehiculoModelo: 'Chevrolet Tracker',
      avanceNota: 'Ingreso inicial'
    });

    expect(resultado.placa).toBe('XYZ-789');
    expect(resultado.token).toBeDefined();
    expect(ordenGuardada).not.toBeNull();
    expect(ordenGuardada.estado).toBe('Recibido');
  });

  it('AvanzarEstadoUseCase: debe avanzar orden y persistirla', async () => {
    let ordenActualizada = null;
    const ordenExistente = new Orden({
      id: 'ot-55',
      tenantId: 'tid-1',
      token: 'tok-55',
      placa: 'XYZ-789',
      clienteNombre: 'Ana',
      clienteTelefono: '310',
      vehiculoModelo: 'Tracker',
      estado: 'Recibido'
    });

    const fakeTenantRepo = {
      buscarPorSlug: () => ({ id: 'tid-1' })
    };
    const fakeOrdenRepo = {
      buscarPorIdYTenant: (id, tenantId) => (id === 'ot-55' && tenantId === 'tid-1' ? ordenExistente : null),
      actualizar: (orden) => { ordenActualizada = orden; }
    };

    const useCase = new AvanzarEstadoUseCase({
      ordenRepository: fakeOrdenRepo,
      tenantRepository: fakeTenantRepo
    });

    const res = await useCase.ejecutar({
      tenantSlug: 'taller-1',
      ordenId: 'ot-55',
      nuevoEstado: 'Diagnóstico'
    });

    expect(res.estado).toBe('Diagnóstico');
    expect(ordenActualizada.estado).toBe('Diagnóstico');
  });

  it('ResponderAdicionalUseCase: debe bloquear si la orden ya fue entregada (M8.5)', async () => {
    const ordenEntregada = new Orden({
      id: 'ot-fin',
      tenantId: 'tid-1',
      token: 'tok-fin',
      placa: 'FIN-001',
      clienteNombre: 'Carlos',
      clienteTelefono: '300',
      vehiculoModelo: 'Sandero',
      estado: 'Entregado'
    });

    const fakeOrdenRepo = {
      buscarPorToken: () => ordenEntregada,
      obtenerAdicionalesPorOt: () => []
    };

    const useCase = new ResponderAdicionalUseCase({
      ordenRepository: fakeOrdenRepo
    });

    await expect(
      useCase.ejecutar({
        token: 'tok-fin',
        adicionalId: 'ad-1',
        respuestas: [{ itemId: 'it-1', estado: 'APROBADO' }]
      })
    ).rejects.toThrow(/El servicio ya fue entregado y este enlace ha expirado/);
  });

  it('LoginUseCase: debe autenticar credenciales válidas y devolver JWT con rol', async () => {
    const usuarioValido = new Usuario({
      id: 'usr-1',
      tenantId: 'tid-1',
      nombre: 'Marcela Asesora',
      email: 'marcela@autofrenos.co',
      passwordHash: Usuario.hashPassword('clave123'),
      rol: ROLES.ASESOR
    });

    const fakeUsuarioRepo = {
      buscarPorEmail: (email) => (email === 'marcela@autofrenos.co' ? usuarioValido : null)
    };

    const useCase = new LoginUseCase({ usuarioRepository: fakeUsuarioRepo });

    const resultado = await useCase.ejecutar({
      email: 'marcela@autofrenos.co',
      password: 'clave123'
    });

    expect(resultado.token).toBeDefined();
    expect(resultado.usuario.nombre).toBe('Marcela Asesora');
    expect(resultado.usuario.rol).toBe('asesor');

    // Credenciales incorrectas
    await expect(
      useCase.ejecutar({ email: 'marcela@autofrenos.co', password: 'otra' })
    ).rejects.toThrow(/Credenciales incorrectas/);
  });
});
