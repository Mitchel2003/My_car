import { useState, useEffect } from 'react';
import { 
  Clock, ShieldAlert, CheckCircle2, XCircle, Phone, 
  Car, AlertTriangle, ArrowRight, Check, Wrench
} from 'lucide-react';
import { VisorAuto3D } from './VisorAuto3D';


const ESTADOS_INFO = {
  'Recibido': {
    titulo: 'Vehículo recibido',
    mensaje: 'Tu carro ya está en nuestras instalaciones y entró en turno de revisión.',
    paso: 1
  },
  'Diagnóstico': {
    titulo: 'En revisión y diagnóstico',
    mensaje: 'Nuestros técnicos están revisando minuciosamente cada parte para evaluar su estado.',
    paso: 2
  },
  'Reparación': {
    titulo: 'Trabajos en progreso',
    mensaje: 'Estamos realizando las reparaciones mecánicas y servicios autorizados.',
    paso: 3
  },
  'Control de calidad': {
    titulo: 'Revisión de control de calidad',
    mensaje: 'El jefe de taller está verificando que todo haya quedado impecable y seguro.',
    paso: 4
  },
  'Listo para entregar': {
    titulo: '¡Tu carro está listo!',
    mensaje: 'Los trabajos finalizaron con éxito. Puedes pasar a retirarlo cuando desees.',
    paso: 5
  },
  'Entregado': {
    titulo: 'Servicio completado',
    mensaje: 'Vehículo entregado a satisfacción. ¡Gracias por confiar en nosotros!',
    paso: 6
  }
};

const PASOS_LISTA = [
  'Recibido',
  'Diagnóstico',
  'Reparación',
  'Control de calidad',
  'Listo para entregar',
  'Entregado'
];

export function PortalCliente({ token, onVolverAlPanel }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de decisión por ítem { [itemId]: 'APROBADO' | 'RECHAZADO' }
  const [decisiones, setDecisiones] = useState({});
  const [modalSeguridadItem, setModalSeguridadItem] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/public/ver/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'No se pudo cargar la información');
      }
      const json = await res.json();
      setData(json);

      // Si hay un adicional pendiente, inicializar respuestas
      const adPendiente = json.adicionales?.find(a => a.estado === 'PENDIENTE');
      if (adPendiente) {
        const initDec = {};
        adPendiente.items.forEach(it => {
          initDec[it.id] = it.estado === 'PENDIENTE' ? 'APROBADO' : it.estado;
        });
        setDecisiones(initDec);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [token]);

  const handleSeleccionItem = (item, estadoDeseado) => {
    // Si intenta rechazar un ítem de seguridad crítica, exigir confirmación
    if (estadoDeseado === 'RECHAZADO' && item.es_seguridad === 1) {
      setModalSeguridadItem(item);
      return;
    }

    setDecisiones(prev => ({
      ...prev,
      [item.id]: estadoDeseado
    }));
  };

  const confirmarRechazoSeguridad = () => {
    if (modalSeguridadItem) {
      setDecisiones(prev => ({
        ...prev,
        [modalSeguridadItem.id]: 'RECHAZADO'
      }));
      setModalSeguridadItem(null);
    }
  };

  const enviarRespuestas = async (adicionalId) => {
    try {
      setEnviando(true);
      const respuestasArray = Object.entries(decisiones).map(([itemId, estado]) => ({
        itemId,
        estado
      }));

      const res = await fetch(`/api/public/ver/${token}/adicionales/${adicionalId}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuestas: respuestasArray })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Error al guardar respuesta');
      }

      setMensajeExito(resJson.message);
      await cargarDatos();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center text-slate-600">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-medium">Consultando estado de tu vehículo...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-2xl shadow-lg border border-slate-200 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No pudimos encontrar tu orden</h2>
        <p className="text-slate-600 text-lg mb-6 leading-relaxed">
          {error || 'El enlace puede haber expirado o contener un error de escritura.'}
        </p>
        {onVolverAlPanel && (
          <button 
            onClick={onVolverAlPanel}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-lg min-h-[48px]"
          >
            Regresar al panel
          </button>
        )}
      </div>
    );
  }

  const { orden, adicionales } = data;

  // M8.5: Si el token ya expiró (OT completada y entregada), mostrar vista segura de servicio finalizado
  if (orden.tokenExpirado) {
    return (
      <div className="max-w-xl mx-auto pb-16 px-4 pt-6">
        {onVolverAlPanel && (
          <button
            onClick={onVolverAlPanel}
            className="mb-4 text-blue-700 font-medium text-base flex items-center gap-1 hover:underline min-h-[44px]"
          >
            ← Volver al Panel de Gestión
          </button>
        )}
        <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-200 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">M8.5 — Ciclo Completado</span>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Vehículo Entregado</h2>
          <p className="text-slate-600 text-base leading-relaxed mb-6">
            La orden para el vehículo <strong>{orden.vehiculo_modelo}</strong> (Placa: <span className="font-mono font-bold text-slate-800">{orden.placa}</span>) finalizó con éxito.
            Por políticas de privacidad, este enlace temporal ha expirado y se encuentra cerrado para modificaciones.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 mb-6 space-y-1">
            <p><strong>Taller:</strong> {orden.tenant_name || 'Taller Autorizado'}</p>
            <p><strong>Teléfono:</strong> {orden.tenant_phone || 'Línea de atención'}</p>
            <p><strong>Cliente:</strong> {orden.cliente_nombre}</p>
          </div>
          <a
            href={`tel:${orden.tenant_phone}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition shadow-sm"
          >
            <Phone className="w-5 h-5" />
            Llamar al Taller
          </a>
        </div>
      </div>
    );
  }

  const estadoActualInfo = ESTADOS_INFO[orden.estado] || {
    titulo: orden.estado,
    mensaje: 'Estamos trabajando en tu auto.',
    paso: 1
  };

  return (
    <div className="max-w-xl mx-auto pb-16 px-4 pt-4 sm:pt-6">
      {/* Botón flotante para regresar al panel administrativo */}
      {onVolverAlPanel && (
        <button
          onClick={onVolverAlPanel}
          className="mb-4 text-blue-700 font-medium text-base flex items-center gap-1 hover:underline min-h-[44px]"
        >
          ← Volver al Panel de Gestión
        </button>
      )}

      {/* Cabecera del Taller y Vehículo */}
      <header className="bg-gradient-to-r from-blue-700 to-sky-800 text-white rounded-3xl p-6 shadow-md mb-6">
        <div className="flex items-center justify-between border-b border-blue-500/40 pb-3 mb-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold block">Taller Autorizado</span>
            <h1 className="text-xl sm:text-2xl font-bold">{orden.tenant_name}</h1>
          </div>
          <a 
            href={`tel:${orden.tenant_phone}`} 
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm font-semibold transition min-h-[44px]"
          >
            <Phone className="w-4 h-4" />
            Llamar
          </a>
        </div>

        <div className="flex items-start gap-4 pt-1">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Car className="w-8 h-8 text-blue-100" />
          </div>
          <div>
            <div className="text-sm text-blue-200">Vehículo de {orden.cliente_nombre}</div>
            <div className="text-2xl font-bold tracking-tight">{orden.vehiculo_modelo}</div>
            <div className="inline-block mt-1 bg-white text-blue-900 font-mono font-bold text-base px-3 py-0.5 rounded-lg shadow-sm">
              Placa: {orden.placa}
            </div>
          </div>
        </div>
      </header>

      {/* Visor 3D WebGL Real Estilo Clay Render */}
      <VisorAuto3D
        adicionales={adicionales}
        modeloVehiculo={orden.vehiculo_modelo || orden.vehiculoModelo}
        placa={orden.placa}
      />


      {/* Progreso del Auto (Lenguaje Natural) */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="text-xs uppercase font-bold text-slate-500 tracking-wide mb-1">Estado en vivo</div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{estadoActualInfo.titulo}</h2>
        <p className="text-slate-600 text-lg leading-relaxed mb-6">
          {orden.avance_nota ? orden.avance_nota : estadoActualInfo.mensaje}
        </p>

        {/* Barra de progreso de 6 estados */}
        <div className="relative pt-2">
          <div className="flex justify-between items-center mb-2">
            {PASOS_LISTA.map((pasoNombre, idx) => {
              const pasoNumero = idx + 1;
              const completado = pasoNumero < estadoActualInfo.paso;
              const actual = pasoNumero === estadoActualInfo.paso;

              return (
                <div key={pasoNombre} className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      completado 
                        ? 'bg-blue-600 text-white' 
                        : actual 
                          ? 'bg-sky-500 text-white ring-4 ring-sky-100 scale-110' 
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {completado ? <Check className="w-4 h-4 stroke-[3]" /> : pasoNumero}
                  </div>
                  <span className={`text-[11px] mt-1 text-center font-medium line-clamp-1 px-0.5 ${
                    actual ? 'text-blue-700 font-bold' : 'text-slate-500'
                  }`}>
                    {pasoNombre}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MENSAJE DE ÉXITO RECIENTE */}
      {mensajeExito && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 mb-6 text-emerald-950 flex items-start gap-3">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-lg">¡Decisión registrada con éxito!</div>
            <p className="text-emerald-800 text-base">{mensajeExito}</p>
          </div>
        </div>
      )}

      {/* SECCIÓN DE COTIZACIONES ADICIONALES (El punto neurálgico) */}
      {adicionales && adicionales.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            Trabajos y Repuestos Extras
          </h3>

          {adicionales.map((ad) => {
            const esPendiente = ad.estado === 'PENDIENTE';
            const esVencido = ad.haVencido || ad.estado === 'VENCIDO';
            const esRespondido = ad.estado === 'RESPONDIDO';

            return (
              <div 
                key={ad.id} 
                className={`bg-white rounded-3xl p-6 shadow-sm border-2 transition-all ${
                  esPendiente 
                    ? 'border-blue-400 ring-2 ring-blue-100' 
                    : esVencido 
                      ? 'border-slate-300 bg-slate-50/50' 
                      : 'border-emerald-300'
                }`}
              >
                {/* Encabezado del adicional */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Cotización</span>
                    <h4 className="text-xl font-bold text-slate-800">{ad.titulo}</h4>
                  </div>

                  {/* Estado / Temporizador */}
                  {esPendiente && (
                    <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl font-semibold text-sm">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      Tienes {ad.horasRestantes}h para responder
                    </div>
                  )}

                  {esVencido && (
                    <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-xl font-medium text-sm">
                      <Clock className="w-4 h-4 text-slate-500" />
                      Plazo vencido (48h cumplidas)
                    </div>
                  )}

                  {esRespondido && (
                    <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Respuesta enviada
                    </div>
                  )}
                </div>

                {/* Si venció: Instrucción de comunicarse por teléfono */}
                {esVencido && (
                  <div className="p-4 bg-slate-100 rounded-2xl mb-4 text-slate-700">
                    <p className="text-base font-medium mb-2">
                      El plazo para autorizar estos trabajos desde el celular venció para no demorar la entrega del carro.
                    </p>
                    <a 
                      href={`tel:${orden.tenant_phone}`}
                      className="inline-flex items-center gap-2 text-blue-700 font-bold text-lg hover:underline min-h-[44px]"
                    >
                      <Phone className="w-5 h-5" />
                      Llamar a Marcela al {orden.tenant_phone}
                    </a>
                  </div>
                )}

                {/* Desglose de ítems */}
                <div className="space-y-4 mb-6">
                  {ad.items.map((it) => {
                    const decision = decisiones[it.id] || it.estado;
                    const estaAprobado = decision === 'APROBADO';
                    const estaRechazado = decision === 'RECHAZADO';
                    const valorTotalItem = it.cantidad * it.valor_unitario;

                    return (
                      <div 
                        key={it.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          it.es_seguridad === 1 
                            ? 'bg-blue-50/40 border-blue-200' 
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            {it.es_seguridad === 1 && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-md mb-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
                                Seguridad Crítica (Frenos/Dirección)
                              </span>
                            )}
                            <div className="font-semibold text-slate-900 text-lg leading-snug">
                              {it.descripcion}
                            </div>
                            <div className="text-sm text-slate-500 mt-0.5">
                              {it.tipo === 'REPUESTO' ? 'Repuesto' : 'Mano de obra'} · Cantidad: {it.cantidad}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-slate-900">
                              ${valorTotalItem.toLocaleString('es-CO')}
                            </div>
                            <div className="text-xs text-slate-500">COP sin IVA</div>
                          </div>
                        </div>

                        {/* Controles de Aprobación ítem por ítem (Si está pendiente) */}
                        {esPendiente && (
                          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleSeleccionItem(it, 'RECHAZADO')}
                              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-base font-semibold transition min-h-[48px] ${
                                estaRechazado
                                  ? 'bg-slate-800 text-white shadow-sm'
                                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <XCircle className="w-5 h-5 text-slate-400" />
                              Rechazar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSeleccionItem(it, 'APROBADO')}
                              className={`flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-base font-bold transition min-h-[48px] ${
                                estaAprobado
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-white border border-slate-300 text-blue-700 hover:bg-blue-50'
                              }`}
                            >
                              <CheckCircle2 className="w-5 h-5 text-white" />
                              Aprobar
                            </button>
                          </div>
                        )}

                        {/* Si ya fue respondido: Mostrar resultado inmutable */}
                        {!esPendiente && (
                          <div className="mt-2 text-right">
                            {it.estado === 'APROBADO' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg text-sm font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                Aprobado por ti
                              </span>
                            ) : it.estado === 'RECHAZADO' ? (
                              <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-200 px-3 py-1 rounded-lg text-sm font-semibold">
                                <XCircle className="w-4 h-4 text-slate-600" />
                                Rechazado
                              </span>
                            ) : (
                              <span className="text-slate-500 text-sm">Sin respuesta</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Resumen Financiero con IVA del 19% acordado */}
                <div className="bg-slate-100/80 rounded-2xl p-4 text-slate-700 space-y-1.5 mb-6 text-base">
                  <div className="flex justify-between">
                    <span>Subtotal trabajos:</span>
                    <span className="font-semibold">${ad.subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (19%):</span>
                    <span className="font-semibold">${ad.iva.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-lg font-extrabold text-slate-900 border-t border-slate-300 pt-2 mt-2">
                    <span>Total estimado:</span>
                    <span className="text-blue-800">${ad.total.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                {/* Botón de Envío Inmutable (Solo si está pendiente) */}
                {esPendiente && (
                  <div>
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => enviarRespuestas(ad.id)}
                      className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 min-h-[52px] transition active:scale-[0.98]"
                    >
                      {enviando ? 'Guardando respuesta...' : 'Confirmar y Enviar Decisión al Taller'}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-2">
                      Una vez enviada, la respuesta no podrá modificarse desde el celular.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN OBLIGATORIA PARA ÍTEMS DE SEGURIDAD (Jairo) */}
      {modalSeguridadItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-400 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-800 mb-3">
              <div className="p-3 bg-amber-100 rounded-2xl">
                <ShieldAlert className="w-8 h-8 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-900">Aviso Importante de Seguridad</h4>
                <p className="text-sm text-slate-600">Requerimiento técnico del taller</p>
              </div>
            </div>

            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              Estás a punto de rechazar: <br />
              <strong className="text-slate-900">"{modalSeguridadItem.descripcion}"</strong>.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-sm leading-relaxed mb-6">
              Este trabajo afecta directamente sistemas de <strong>frenos, dirección o suspensión</strong>. 
              Manejar el auto sin esta reparación representa un riesgo vial. ¿Confirmas que entiendes el riesgo y deseas rechazarlo?
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setModalSeguridadItem(null)}
                className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-base min-h-[48px]"
              >
                Volver y dejarlo Aprobado
              </button>
              <button
                type="button"
                onClick={confirmarRechazoSeguridad}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-base min-h-[48px]"
              >
                Sí, rechazar de todos modos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
