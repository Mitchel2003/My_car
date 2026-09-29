import { describe, it, expect } from 'vitest';
import { Orden } from '../domain/Orden.js';

describe('Entidad de Dominio: Orden de Trabajo', () => {
  const datosBase = {
    id: 'ot-101',
    tenantId: 'tenant-autofrenos',
    token: 'token-test-123',
    placa: 'ABC-123',
    clienteNombre: 'Pedro Gómez',
    clienteTelefono: '300 123 4567',
    vehiculoModelo: 'Mazda 3',
    estado: 'Recibido',
    avanceNota: 'Vehículo en patio.'
  };

  it('debe crearse correctamente en estado inicial Recibido', () => {
    const orden = new Orden(datosBase);
    expect(orden.id).toBe('ot-101');
    expect(orden.estado).toBe('Recibido');
    expect(orden.placa).toBe('ABC-123');
  });

  it('debe rechazar estados inexistentes', () => {
    expect(() => {
      new Orden({ ...datosBase, estado: 'EstadoInvalido' });
    }).toThrow(/Estado inválido/);
  });

  it('debe permitir avanzar al siguiente estado en secuencia estricta', () => {
    const orden = new Orden(datosBase);
    
    // Recibido -> Diagnóstico
    orden.avanzarEstado('Diagnóstico', 'Iniciando escaneo computarizado.');
    expect(orden.estado).toBe('Diagnóstico');
    expect(orden.avanceNota).toBe('Iniciando escaneo computarizado.');

    // Diagnóstico -> Reparación
    orden.avanzarEstado('Reparación');
    expect(orden.estado).toBe('Reparación');

    // Reparación -> Control de calidad
    orden.avanzarEstado('Control de calidad');
    expect(orden.estado).toBe('Control de calidad');

    // Control de calidad -> Listo para entregar
    orden.avanzarEstado('Listo para entregar');
    expect(orden.estado).toBe('Listo para entregar');

    // Listo para entregar -> Entregado
    orden.avanzarEstado('Entregado');
    expect(orden.estado).toBe('Entregado');
    expect(orden.estaFinalizada()).toBe(true);
  });

  it('debe impedir transiciones hacia atrás (Regla No Negociable de Taller)', () => {
    const orden = new Orden({ ...datosBase, estado: 'Reparación' });
    
    expect(() => {
      orden.avanzarEstado('Diagnóstico');
    }).toThrow(/Transición no permitida/);

    expect(() => {
      orden.avanzarEstado('Recibido');
    }).toThrow(/Transición no permitida/);
  });

  it('debe impedir saltarse estados intermedios', () => {
    const orden = new Orden({ ...datosBase, estado: 'Recibido' });
    
    expect(() => {
      orden.avanzarEstado('Reparación');
    }).toThrow(/Transición no permitida/);
  });

  it('debe reportar correctamente el siguiente estado disponible', () => {
    const orden = new Orden({ ...datosBase, estado: 'Control de calidad' });
    expect(orden.siguienteEstado()).toBe('Listo para entregar');

    const ordenFinal = new Orden({ ...datosBase, estado: 'Entregado' });
    expect(ordenFinal.siguienteEstado()).toBeNull();
  });
});
