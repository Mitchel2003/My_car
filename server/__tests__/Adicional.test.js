import { describe, it, expect } from 'vitest';
import { Adicional } from '../domain/Adicional.js';
import { ItemAdicional } from '../domain/ItemAdicional.js';

describe('Entidad de Dominio: Adicional y Cotización de Items', () => {
  const itemPastillas = new ItemAdicional({
    id: 'item-1',
    adicionalId: 'ad-1',
    descripcion: 'Pastillas de freno delanteras de cerámica',
    tipo: 'REPUESTO',
    esSeguridad: true,
    cantidad: 1,
    valorUnitario: 220000,
    estado: 'PENDIENTE'
  });

  const itemLiquido = new ItemAdicional({
    id: 'item-2',
    adicionalId: 'ad-1',
    descripcion: 'Líquido de frenos DOT 4 Bosch',
    tipo: 'REPUESTO',
    esSeguridad: true,
    cantidad: 1,
    valorUnitario: 50000,
    estado: 'PENDIENTE'
  });

  const itemAlineacion = new ItemAdicional({
    id: 'item-3',
    adicionalId: 'ad-1',
    descripcion: 'Alineación láser y balanceo 4 ruedas',
    tipo: 'SERVICIO',
    esSeguridad: false,
    cantidad: 1,
    valorUnitario: 100000,
    estado: 'PENDIENTE'
  });

  it('debe calcular subtotal, IVA 19% entero y total original de la cotización', () => {
    const adicional = new Adicional({
      id: 'ad-1',
      otId: 'ot-100',
      tenantId: 'tenant-1',
      titulo: 'Frenos delanteros y alineación',
      estado: 'PENDIENTE',
      venceAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      items: [itemPastillas, itemLiquido, itemAlineacion]
    });

    // Subtotal: 220.000 + 50.000 + 100.000 = 370.000 COP
    expect(adicional.subtotal).toBe(370000);
    // IVA 19%: Math.round(370.000 * 0.19) = 70.300 COP
    expect(adicional.iva).toBe(70300);
    // Total: 370.000 + 70.300 = 440.300 COP
    expect(adicional.total).toBe(440300);
  });

  it('debe permitir la aprobación parcial ítem a ítem y recalcular el total aprobado', () => {
    const ad = new Adicional({
      id: 'ad-1',
      otId: 'ot-100',
      tenantId: 'tenant-1',
      titulo: 'Mantenimiento preventivo',
      estado: 'PENDIENTE',
      venceAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      items: [
        new ItemAdicional({ id: 'it-1', descripcion: 'Repuesto A', valorUnitario: 100000 }),
        new ItemAdicional({ id: 'it-2', descripcion: 'Servicio B', valorUnitario: 50000 })
      ]
    });

    // El cliente aprueba Repuesto A pero rechaza Servicio B
    ad.responder({
      respuestas: [
        { itemId: 'it-1', estado: 'APROBADO' },
        { itemId: 'it-2', estado: 'RECHAZADO' }
      ]
    });

    expect(ad.estado).toBe('RESPONDIDO');
    expect(ad.respondidoAt).toBeDefined();

    // Solo se suma lo aprobado: 100.000 + IVA 19.000 = 119.000 COP
    expect(ad.subtotalAprobado).toBe(100000);
    expect(ad.ivaAprobado).toBe(19000);
    expect(ad.totalAprobado).toBe(119000);

    // Los ítems deben reflejar su decisión individual
    expect(ad.items[0].estado).toBe('APROBADO');
    expect(ad.items[1].estado).toBe('RECHAZADO');
  });

  it('debe garantizar la inmutabilidad: no permitir responder dos veces', () => {
    const ad = new Adicional({
      id: 'ad-1',
      otId: 'ot-100',
      tenantId: 'tenant-1',
      titulo: 'Prueba Inmutabilidad',
      estado: 'PENDIENTE',
      venceAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      items: [new ItemAdicional({ id: 'it-1', descripcion: 'Diagnóstico', valorUnitario: 50000 })]
    });

    ad.responder({ respuestas: [{ itemId: 'it-1', estado: 'APROBADO' }] });

    // Intento de segunda respuesta debe fallar
    expect(() => {
      ad.responder({ respuestas: [{ itemId: 'it-1', estado: 'RECHAZADO' }] });
    }).toThrow(/inmutable/);
  });

  it('debe rechazar respuesta si el adicional ya venció (>48h)', () => {
    const fechaPasada = new Date(Date.now() - 1000 * 60).toISOString(); // 1 minuto en el pasado
    const adVencido = new Adicional({
      id: 'ad-vencido',
      otId: 'ot-100',
      tenantId: 'tenant-1',
      titulo: 'Vencido',
      estado: 'PENDIENTE',
      venceAt: fechaPasada,
      items: [new ItemAdicional({ id: 'it-1', descripcion: 'Repuesto vencido', valorUnitario: 80000 })]
    });

    expect(adVencido.haVencido()).toBe(true);
    expect(() => {
      adVencido.responder({ respuestas: [{ itemId: 'it-1', estado: 'APROBADO' }] });
    }).toThrow(/ha vencido/);
  });

  it('debe calcular correctamente las horas restantes de vigencia', () => {
    const dentroDe10Horas = new Date(Date.now() + 10 * 3600 * 1000).toISOString();
    const ad = new Adicional({
      id: 'ad-timer',
      otId: 'ot-1',
      tenantId: 't1',
      titulo: 'Timer check',
      venceAt: dentroDe10Horas,
      items: []
    });

    expect(ad.horasRestantes()).toBe(10);
  });
});
