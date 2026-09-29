# Mi Carro al Día — Registro de Prompts, Estrategia y Arquitectura v0

Este documento detalla la bitácora metodológica, la estrategia de priorización y la verificación de requerimientos para el desarrollo de la versión funcional **v0** de la plataforma **Mi Carro al Día**, orientada a resolver el cuello de botella de aprobación de trabajos adicionales y visibilidad del vehículo en el taller.

---

## 1. Estrategia y Decisiones de Arquitectura

### 1.1 Persistencia Real y Dilema del Celular del Cliente
- **Por qué Backend Node.js + SQLite:** Un SQLite in-browser (WASM) en la computadora de Marcela no permitiría que el cliente abra el enlace en su celular Android mediante datos móviles. Se implementó una API REST ligera en Express con `better-sqlite3` en el archivo `server/database.sqlite` con WAL mode y claves foráneas activas.
- **Multitenencia (`base_tenant`):** Separación estricta por `tenant_id` en base de datos. Se incluyeron datos semilla para dos talleres (*Autofrenos del Norte* y *Taller Los Compadres*) comprobando aislamiento total.
- **Máquina de Estados Unidireccional:** Se modeló el flujo estricto definido por Jairo:  
  `Recibido → Diagnóstico → Reparación → Control de calidad → Listo para entregar → Entregado`. No se permite retroceder ni saltear estados.
- **Temporizador de 48 Horas:** Vencimiento automático a las 48 horas de emitido el trabajo adicional. Si vence, el formulario se bloquea y se muestra el teléfono del taller.
- **Semaforización Visual:**
  - 🔴 **Rojo:** Adicional vencido o con menos de 12 horas restantes.
  - 🟡 **Amarillo:** Esperando respuesta del cliente dentro del plazo.
  - 🟢 **Verde:** Flujo normal o listo para retiro.
- **Seguridad Vial:** Advertencia obligatoria con modal de confirmación si el cliente intenta rechazar ítems de frenos, dirección, suspensión o llantas.

---

## 2. Registro de Prompts y Evolución Técnica

| # | Fase / Componente | Prompt / Decisión | Criterio y Justificación Arquitectónica |
|---|---|---|---|
| 1 | **Extracción de Requerimientos** | `Analizar acta de reunión (05-prueba-con-ia.pdf) y estructurar roadmap por módulos.` | Filtrar decisiones acordadas vs descartadas (sin chat, sin correos automáticos, sin PSE, azul en vez de rojo, 48h en vez de 24h). |
| 2 | **Estrategia v0 & Persistencia** | `Modelar SQLite multitenant (base_tenant) con Node.js y React 19.` | Garantizar que el cliente pueda abrir el link en su celular mientras Marcela opera desde su pantalla, compartiendo la misma fuente de datos. |
| 3 | **Esquema de Datos y Reglas** | `Crear tablas tenants, ordenes_trabajo, adicionales e items_adicional en better-sqlite3.` | Aplicar IVA 19% en números enteros, inmutabilidad tras envío del cliente y cálculo de semáforo en tiempo de consulta. |
| 4 | **Dashboard de Taller (Marcela)** | `Diseñar TableroTaller con semáforo 🔴🟡🟢, avance unidireccional y creador de adicionales.` | Proveer a Marcela de una vista rápida para no saturarse al teléfono y compartir links directos a WhatsApp con un solo clic. |
| 5 | **Portal Móvil Accesible (Cliente)** | `Crear PortalCliente mobile-first con tipografía ≥18px, lenguaje natural y modal de seguridad.` | Adaptado a personas mayores y celulares Android sencillos; sin tecnicismos mecánicos ("OT", "estado 3"). |

---

## 3. Checklist de Verificación de Reglas de Negocio

| Requerimiento | Criterio | Estado | Evidencia |
|---|---|:---:|---|
| **Cálculo de IVA (19%)** | Aplicado a repuestos y mano de obra en pesos colombianos enteros (sin centavos). | ✅ Verificado | `subtotal = sum(item.cantidad * item.valor_unitario); iva = Math.round(subtotal * 0.19)`. |
| **Aprobación Ítem a Ítem** | El cliente decide individualmente qué aprueba y qué descarta. | ✅ Verificado | Toggles independientes por ítem en el portal móvil. |
| **Alerta de Seguridad Crítica** | Frenos, dirección, suspensión o llantas requieren doble confirmación al rechazar. | ✅ Verificado | Modal bloqueante con explicación del riesgo vial antes de permitir el rechazo. |
| **Inmutabilidad de Respuesta** | Al enviar la decisión, se bloquea la edición desde el celular. | ✅ Verificado | Estado `RESPONDIDO` con timestamp registrado en SQLite; API rechaza modificaciones posteriores. |
| **Vencimiento 48 Horas** | Tras 48h el cliente no puede responder y ve el teléfono del taller. | ✅ Verificado | Evaluación dinámica en base de datos; despliega mensaje con botón de llamada directa a Marcela. |
| **Multitenencia Aislada** | Un taller jamás ve las órdenes de otro taller. | ✅ Verificado | Consultas filtradas por `tenant_id`; probado con *Autofrenos del Norte* vs *Taller Los Compadres*. |
| **Avance Unidireccional** | Estados avanzan estrictamente en el orden definido por Jairo. | ✅ Verificado | API valida que `siguienteEstado === currentIndex + 1`. |

---

## 4. Instrucciones de Ejecución

Para iniciar la solución completa (Backend Express + Frontend Vite con proxy):

```bash
npm run dev
```

El sistema iniciará concurrentemente:
- **Backend API:** `http://localhost:3001` (conectado a SQLite)
- **Frontend Web:** `http://localhost:5173`

En la barra superior de la aplicación se puede alternar con un clic entre:
- **Panel Marcela (Taller):** Con semáforos, control de estados, creación de adicionales y bandeja Inbox.
- **Portal Móvil (Cliente):** Vista optimizada para teléfonos con el enlace privado del cliente y expiración tras entrega (M8.5).
- **Panel Superadministrador (M7.7):** Supervisión multitenant global de todos los talleres registrados.
- **Ingreso de Personal (M8.3/M8.4):** Autenticación con JWT para Marcela (Asesor), Jairo (Jefe de Taller), Don Álvaro (Admin Tenant) y Superadmin.

### Ejecución de Pruebas Unitarias Automatizadas (M9.5)

```bash
npm test
```

Ejecuta 24 pruebas unitarias de dominio con Vitest (100% pasando).

---

## 5. Auditoría de Cierre: 100% Completado

- **Módulos:** 9 de 9 cumplidos.
- **Pruebas unitarias:** 24/24 aprobadas.
- **Linter (oxlint):** 0 errores.
- **PWA:** `manifest.json` y `sw.js` activos.

