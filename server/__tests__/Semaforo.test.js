import { describe, it, expect } from 'vitest';
import { Semaforo } from '../domain/Semaforo.js';

describe('Servicio de Dominio: Cálculo de Semáforos (Semaforo.calcular)', () => {
  it('debe asignar ⚪ GRIS a vehículos en estado Entregado', () => {
    const orden = { estado: 'Entregado' };
    const res = Semaforo.calcular({ orden, adicionales: [] });
    expect(res.color).toBe('GRIS');
    expect(res.detalle).toMatch(/entregado/i);
  });

  it('debe asignar 🔴 ROJO con prioridad si el adicional venció (> 48h)', () => {
    const orden = { estado: 'Diagnóstico' };
    const adicionales = [
      {
        estado: 'PENDIENTE',
        haVencido: () => true,
        horasRestantes: () => 0
      }
    ];

    const res = Semaforo.calcular({ orden, adicionales });
    expect(res.color).toBe('ROJO');
    expect(res.detalle).toMatch(/venció/i);
  });

  it('debe asignar 🔴 ROJO si el adicional pendiente tiene <= 12 horas restantes (urgente)', () => {
    const orden = { estado: 'Diagnóstico' };
    const adicionales = [
      {
        estado: 'PENDIENTE',
        haVencido: () => false,
        horasRestantes: () => 8
      }
    ];

    const res = Semaforo.calcular({ orden, adicionales });
    expect(res.color).toBe('ROJO');
    expect(res.detalle).toMatch(/urgente/i);
  });

  it('debe asignar 🟡 AMARILLO si el adicional pendiente tiene más de 12 horas de vigencia', () => {
    const orden = { estado: 'Diagnóstico' };
    const adicionales = [
      {
        estado: 'PENDIENTE',
        haVencido: () => false,
        horasRestantes: () => 36
      }
    ];

    const res = Semaforo.calcular({ orden, adicionales });
    expect(res.color).toBe('AMARILLO');
    expect(res.detalle).toMatch(/esperando al cliente/i);
  });

  it('debe asignar 🟢 VERDE cuando el vehículo está Listo para entregar o en tiempo normal', () => {
    const ordenListo = { estado: 'Listo para entregar' };
    const resListo = Semaforo.calcular({ orden: ordenListo, adicionales: [] });
    expect(resListo.color).toBe('VERDE');

    const ordenReparacion = { estado: 'Reparación' };
    const adicionalesRespondidos = [
      {
        estado: 'RESPONDIDO',
        haVencido: () => false
      }
    ];
    const resNormal = Semaforo.calcular({ orden: ordenReparacion, adicionales: adicionalesRespondidos });
    expect(resNormal.color).toBe('VERDE');
    expect(resNormal.detalle).toMatch(/tiempo normal/i);
  });
});
