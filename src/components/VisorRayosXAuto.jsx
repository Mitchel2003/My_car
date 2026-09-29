import { useState, useMemo } from 'react';
import { CheckCircle2, Eye, Sparkles } from 'lucide-react';


export function VisorRayosXAuto({ adicionales = [], modeloVehiculo = 'Vehículo', placa = '' }) {
  const [zonaSeleccionada, setZonaSeleccionada] = useState('frenos_delanteros');
  const [modoRayosX, setModoRayosX] = useState(true);

  // Mapear los adicionales e ítems reales a zonas anatómicas del vehículo
  const zonasData = useMemo(() => {
    const todosLosItems = adicionales.flatMap(ad => ad.items || []);

    const buscarItemsPorPalabra = (palabras) => {
      return todosLosItems.filter(it => 
        palabras.some(p => it.descripcion.toLowerCase().includes(p.toLowerCase()))
      );
    };

    const itemsFrenosDel = buscarItemsPorPalabra(['freno', 'pastilla', 'disco', 'delanter']);
    const itemsFrenosTras = buscarItemsPorPalabra(['freno trasero', 'campana', 'banda']);
    const itemsSuspension = buscarItemsPorPalabra(['suspens', 'amortiguador', 'alineac', 'balanceo', 'direccion', 'terminal']);
    const itemsMotor = buscarItemsPorPalabra(['aceite', 'filtro', 'motor', 'refrigerante', 'bujia', 'liquido']);
    const itemsLlantas = buscarItemsPorPalabra(['llanta', 'neumatico', 'valvula']);

    const evaluarEstadoZona = (items) => {
      if (!items || items.length === 0) return { estado: 'NORMAL', etiqueta: 'En buen estado', color: 'emerald' };
      if (items.some(i => i.estado === 'PENDIENTE')) return { estado: 'PENDIENTE', etiqueta: 'Cotización pendiente', color: 'amber' };
      if (items.some(i => i.estado === 'APROBADO')) return { estado: 'EN_TRABAJO', etiqueta: 'En intervención / Aprobado', color: 'sky' };
      if (items.some(i => i.estado === 'RECHAZADO')) return { estado: 'RECHAZADO', etiqueta: 'Descartado por cliente', color: 'slate' };
      return { estado: 'NORMAL', etiqueta: 'Verificado', color: 'emerald' };
    };

    return {
      frenos_delanteros: {
        id: 'frenos_delanteros',
        nombre: 'Frenos Delanteros',
        tipo: 'Sistema de Seguridad Crítica',
        descripcionCorta: 'Discos, mordazas y pastillas de freno en eje frontal.',
        items: itemsFrenosDel,
        ...evaluarEstadoZona(itemsFrenosDel),
        cx: 200, cy: 115, r: 18
      },
      suspension_direccion: {
        id: 'suspension_direccion',
        nombre: 'Suspensión y Dirección',
        tipo: 'Tren Delantero y Estabilidad',
        descripcionCorta: 'Amortiguadores, terminales, tijeras y sistema de alineación láser.',
        items: itemsSuspension,
        ...evaluarEstadoZona(itemsSuspension),
        cx: 200, cy: 165, r: 16
      },
      motor_fluidos: {
        id: 'motor_fluidos',
        nombre: 'Motor y Compartimiento de Fluidos',
        tipo: 'Mecánica y Lubricación',
        descripcionCorta: 'Conjunto motriz, lubricante sintético, filtros y fluidos hidráulicos.',
        items: itemsMotor,
        ...evaluarEstadoZona(itemsMotor),
        cx: 200, cy: 75, r: 20
      },
      frenos_traseros: {
        id: 'frenos_traseros',
        nombre: 'Eje y Frenos Traseros',
        tipo: 'Frenado Auxiliar y Retención',
        descripcionCorta: 'Conjunto de frenos traseros, rodamientos y freno de parqueo.',
        items: itemsFrenosTras,
        ...evaluarEstadoZona(itemsFrenosTras),
        cx: 200, cy: 300, r: 16
      },
      neumaticos: {
        id: 'neumaticos',
        nombre: 'Llantas y Calibración',
        tipo: 'Contacto y Rodamiento',
        descripcionCorta: 'Neumáticos, presión de aire y balanceo dinámico.',
        items: itemsLlantas,
        ...evaluarEstadoZona(itemsLlantas),
        cx: 120, cy: 200, r: 14
      }
    };
  }, [adicionales]);

  const zonaActivaInfo = zonasData[zonaSeleccionada] || zonasData.frenos_delanteros;

  return (
    <section className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 mb-6 overflow-hidden relative">
      {/* Fondo estético tipo cuadrícula Blueprint */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Cabecera del Visor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Diagnóstico Visual Interactivo · Estilo Rayos X
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Anatomía del {modeloVehiculo}
            {placa && <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">[{placa}]</span>}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Toca los puntos iluminados para ver exactamente qué piezas están siendo reparadas o cotizadas.
          </p>
        </div>

        {/* Toggle Rayos X vs Chasis */}
        <button
          onClick={() => setModoRayosX(!modoRayosX)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition self-start sm:self-auto min-h-[38px] ${
            modoRayosX 
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' 
              : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
          }`}
        >
          <Eye className="w-4 h-4" />
          {modoRayosX ? 'Rayos X Activo' : 'Carrocería'}
        </button>
      </div>

      {/* Área Gráfica Isométrica y Chasis SVG */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-4 relative z-10">
        <div className="md:col-span-7 flex justify-center relative py-2">
          {/* SVG Vectorial Automotriz Optimizado */}
          <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
            <svg
              viewBox="0 0 400 420"
              className="w-full h-auto filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            >
              <defs>
                {/* Gradientes Blueprint */}
                <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity={modoRayosX ? "0.4" : "0.9"} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity={modoRayosX ? "0.2" : "0.95"} />
                </linearGradient>
                <linearGradient id="neonSky" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="neonAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Contorno / Carrocería del Vehículo */}
              <path
                d="M 140 40 
                   C 160 25, 240 25, 260 40 
                   C 285 55, 305 100, 310 150 
                   C 315 200, 315 270, 310 320 
                   C 305 370, 280 395, 260 400 
                   C 230 405, 170 405, 140 400 
                   C 120 395, 95 370, 90 320 
                   C 85 270, 85 200, 90 150 
                   C 95 100, 115 55, 140 40 Z"
                fill="url(#chassisGrad)"
                stroke={modoRayosX ? "#38bdf8" : "#64748b"}
                strokeWidth={modoRayosX ? "2" : "3"}
                strokeDasharray={modoRayosX ? "4 3" : "none"}
                className="transition-all duration-500"
              />

              {/* Ruedas y Neumáticos */}
              {/* Delantera Izquierda */}
              <rect x="70" y="85" width="24" height="60" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              {/* Delantera Derecha */}
              <rect x="306" y="85" width="24" height="60" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              {/* Trasera Izquierda */}
              <rect x="70" y="270" width="24" height="60" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              {/* Trasera Derecha */}
              <rect x="306" y="270" width="24" height="60" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />

              {/* Ejes y Chasis Interno (Rayos X) */}
              {modoRayosX && (
                <g stroke="#334155" strokeWidth="3" opacity="0.8">
                  {/* Eje Delantero */}
                  <line x1="94" y1="115" x2="306" y2="115" />
                  {/* Eje Trasero */}
                  <line x1="94" y1="300" x2="306" y2="300" />
                  {/* Eje de Transmisión Cardán */}
                  <line x1="200" y1="95" x2="200" y2="300" strokeDasharray="3 3" />
                  {/* Compartimiento de Motor */}
                  <rect x="150" y="55" width="100" height="40" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
                  {/* Cabina / Parabrisas */}
                  <path d="M 130 140 L 270 140 L 255 190 L 145 190 Z" fill="#0284c7" opacity="0.15" stroke="#38bdf8" strokeWidth="1" />
                </g>
              )}

              {/* Hotspots / Nodos Sensibles */}
              {Object.values(zonasData).map((zona) => {
                const esActiva = zonaSeleccionada === zona.id;
                const tieneAtencion = zona.estado === 'PENDIENTE' || zona.estado === 'EN_TRABAJO';

                return (
                  <g
                    key={zona.id}
                    onClick={() => setZonaSeleccionada(zona.id)}
                    className="cursor-pointer group"
                  >
                    {/* Anillo Pulsante de Atención */}
                    {tieneAtencion && (
                      <circle
                        cx={zona.cx}
                        cy={zona.cy}
                        r={zona.r + 8}
                        fill="none"
                        stroke={zona.estado === 'PENDIENTE' ? '#fbbf24' : '#38bdf8'}
                        strokeWidth="2"
                        className="animate-ping opacity-75 origin-center"
                      />
                    )}

                    {/* Círculo Principal */}
                    <circle
                      cx={zona.cx}
                      cy={zona.cy}
                      r={zona.r}
                      fill={
                        zona.estado === 'PENDIENTE' ? 'url(#neonAmber)' :
                        zona.estado === 'EN_TRABAJO' ? 'url(#neonSky)' :
                        esActiva ? '#38bdf8' : '#334155'
                      }
                      stroke={esActiva ? '#ffffff' : '#0f172a'}
                      strokeWidth={esActiva ? '3' : '2'}
                      filter={tieneAtencion || esActiva ? 'url(#glow)' : undefined}
                      className="transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Icono central de Hotspot */}
                    <circle
                      cx={zona.cx}
                      cy={zona.cy}
                      r="4"
                      fill="#ffffff"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Panel Lateral con Información del Componente Tocado */}
        <div className="md:col-span-5 bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-inner flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
                {zonaActivaInfo.tipo}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                zonaActivaInfo.estado === 'PENDIENTE' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : zonaActivaInfo.estado === 'EN_TRABAJO'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {zonaActivaInfo.etiqueta}
              </span>
            </div>

            <h4 className="text-lg font-bold text-white mb-1">
              {zonaActivaInfo.nombre}
            </h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {zonaActivaInfo.descripcionCorta}
            </p>

            {/* Ítems reales asociados a esta zona en la OT actual */}
            <div className="space-y-2 mb-4">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                Trabajos en esta zona ({zonaActivaInfo.items.length}):
              </span>

              {zonaActivaInfo.items.length > 0 ? (
                zonaActivaInfo.items.map((it) => (
                  <div
                    key={it.id}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-white block leading-tight">
                        {it.descripcion}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {it.tipo} · Cant: {it.cantidad}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-white block">
                        ${Number(it.valorUnitario || it.valor_unitario || 0).toLocaleString('es-CO')}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                        it.estado === 'APROBADO' ? 'bg-sky-500/20 text-sky-400' :
                        it.estado === 'PENDIENTE' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {it.estado}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sin reparaciones pendientes en esta zona en esta visita.</span>
                </div>
              )}
            </div>
          </div>

          {/* Selector Rápido de Componentes */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Explorar otros subsistemas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(zonasData).map(z => (
                <button
                  key={z.id}
                  onClick={() => setZonaSeleccionada(z.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    zonaSeleccionada === z.id
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {z.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
