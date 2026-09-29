import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Base de datos
import { inicializarEsquema } from './infrastructure/database/schema.js';

// 2. Repositorios
import { SQLiteTenantRepository } from './infrastructure/repositories/SQLiteTenantRepository.js';
import { SQLiteOrdenRepository } from './infrastructure/repositories/SQLiteOrdenRepository.js';
import { SQLiteUsuarioRepository } from './infrastructure/repositories/SQLiteUsuarioRepository.js';

// 3. Casos de Uso
import { CrearOrdenUseCase } from './application/CrearOrdenUseCase.js';
import { AvanzarEstadoUseCase } from './application/AvanzarEstadoUseCase.js';
import { CrearAdicionalUseCase } from './application/CrearAdicionalUseCase.js';
import { ResponderAdicionalUseCase } from './application/ResponderAdicionalUseCase.js';
import { ObtenerInboxAsesorUseCase } from './application/ObtenerInboxAsesorUseCase.js';
import { ObtenerOrdenesTallerUseCase } from './application/ObtenerOrdenesTallerUseCase.js';
import { ObtenerDetalleClienteUseCase } from './application/ObtenerDetalleClienteUseCase.js';
import { LoginUseCase } from './application/LoginUseCase.js';

// 4. Controladores HTTP
import { TenantController } from './infrastructure/http/controllers/TenantController.js';
import { OrdenController } from './infrastructure/http/controllers/OrdenController.js';
import { AdicionalController } from './infrastructure/http/controllers/AdicionalController.js';
import { InboxController } from './infrastructure/http/controllers/InboxController.js';
import { AuthController } from './infrastructure/http/controllers/AuthController.js';
import { SuperAdminController } from './infrastructure/http/controllers/SuperAdminController.js';
import { configurarRutas } from './infrastructure/http/routes.js';

// Inicialización de la base de datos relacional
inicializarEsquema();

// Composición de dependencias (Dependency Injection / Inversion of Control)
const tenantRepository = new SQLiteTenantRepository();
const ordenRepository = new SQLiteOrdenRepository();
const usuarioRepository = new SQLiteUsuarioRepository();

const crearOrdenUseCase = new CrearOrdenUseCase({ ordenRepository, tenantRepository });
const avanzarEstadoUseCase = new AvanzarEstadoUseCase({ ordenRepository, tenantRepository });
const crearAdicionalUseCase = new CrearAdicionalUseCase({ ordenRepository, tenantRepository });
const responderAdicionalUseCase = new ResponderAdicionalUseCase({ ordenRepository });
const obtenerInboxAsesorUseCase = new ObtenerInboxAsesorUseCase({ ordenRepository, tenantRepository });
const obtenerOrdenesTallerUseCase = new ObtenerOrdenesTallerUseCase({ ordenRepository, tenantRepository });
const obtenerDetalleClienteUseCase = new ObtenerDetalleClienteUseCase({ ordenRepository });
const loginUseCase = new LoginUseCase({ usuarioRepository });

const tenantController = new TenantController({ tenantRepository });
const ordenController = new OrdenController({
  obtenerOrdenesTallerUseCase,
  crearOrdenUseCase,
  avanzarEstadoUseCase,
  obtenerDetalleClienteUseCase,
  ordenRepository,
  tenantRepository
});
const adicionalController = new AdicionalController({
  crearAdicionalUseCase,
  responderAdicionalUseCase
});
const inboxController = new InboxController({ obtenerInboxAsesorUseCase });
const authController = new AuthController({ loginUseCase, tenantRepository, usuarioRepository });
const superAdminController = new SuperAdminController({ tenantRepository, usuarioRepository });

// Servidor Express
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const apiRoutes = configurarRutas({
  tenantController,
  ordenController,
  adicionalController,
  inboxController,
  authController,
  superAdminController
});

app.use('/api', apiRoutes);

// Servir frontend compilado en producción (despliegue en Render)
const distPath = path.resolve(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback para SPA en Express 5 (evita error de path-to-regexp con wildcard '*')
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}


app.listen(PORT, () => {
  console.log(`[Clean Architecture] Servidor ejecutándose en http://localhost:${PORT}`);
});

