import { describe, it, expect, vi } from 'vitest';
import { HealthController } from '../infrastructure/http/controllers/HealthController.js';

describe('HealthController (UptimeRobot & Render Health Checks)', () => {
  it('debe responder 200 OK y estado healthy con la base de datos conectada', () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({ alive: 1 })
      })
    };

    const controller = new HealthController(mockDb);

    let statusCode = null;
    let jsonResponse = null;

    const mockRes = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResponse = data;
            return data;
          }
        };
      }
    };

    controller.check({}, mockRes);

    expect(statusCode).toBe(200);
    expect(jsonResponse.status).toBe('healthy');
    expect(jsonResponse.database).toBe('connected');
    expect(jsonResponse.service).toBe('mi-carro-al-dia');
    expect(typeof jsonResponse.uptime).toBe('number');
  });

  it('debe responder 503 si ocurre una excepción crítica en la base de datos', () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn().mockImplementation(() => {
          throw new Error('SQLite disk I/O failure');
        })
      })
    };

    const controller = new HealthController(mockDb);

    let statusCode = null;
    let jsonResponse = null;

    const mockRes = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            jsonResponse = data;
            return data;
          }
        };
      }
    };

    controller.check({}, mockRes);

    expect(statusCode).toBe(503);
    expect(jsonResponse.status).toBe('unhealthy');
    expect(jsonResponse.error).toBe('SQLite disk I/O failure');
  });
});
