export class HealthController {
  constructor(db) {
    this.db = db;
  }

  check = (_req, res) => {
    try {
      let dbStatus = 'disconnected';
      if (this.db) {
        const row = this.db.prepare('SELECT 1 as alive').get();
        if (row && row.alive === 1) {
          dbStatus = 'connected';
        }
      }

      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        service: 'mi-carro-al-dia',
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus
      });
    } catch (error) {
      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  };
}
