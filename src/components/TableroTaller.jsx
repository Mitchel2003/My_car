import { useState, useEffect } from 'react';
import { 
  Car, PlusCircle, 
  Share2, ArrowRight, ShieldAlert, 
  Search, RefreshCw, Smartphone, Wrench, Building2, User, Copy,
  Inbox, Bell, AlertTriangle, CheckCircle2, MessageSquare, PhoneCall
} from 'lucide-react';

const ESTADOS_ORDEN = [
  'Recibido',
  'Diagnóstico',
  'Reparación',
  'Control de calidad',
  'Listo para entregar',
  'Entregado'
];

export function TableroTaller({ onVerComoCliente, tenantSlug, usuarioActual }) {
  const [tenants, setTenants] = useState([]);
  const [tenantActivo, setTenantActivo] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [inboxItems, setInboxItems] = useState([]);
  const [pestañaActiva, setPestañaActiva] = useState('vehiculos'); // 'vehiculos' | 'inbox'
  const [loading, setLoading] = useState(true);
  const [filtroSemaforo, setFiltroSemaforo] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalNuevaOt, setModalNuevaOt] = useState(false);
  const [modalNuevoAdicionalOt, setModalNuevoAdicionalOt] = useState(null);

  // Formulario nueva OT
  const [formOt, setFormOt] = useState({
    placa: '',
    cliente_nombre: '',
    cliente_telefono: '',
    vehiculo_modelo: '',
    avance_nota: 'Vehículo ingresado a patio para revisión.'
  });

  // Formulario nuevo adicional
  const [formAdicional, setFormAdicional] = useState({
    titulo: '',
    items: [
      { descripcion: '', tipo: 'REPUESTO', es_seguridad: false, cantidad: 1, valor_unitario: '' }
    ]
  });

  // 1. Cargar Tenants disponibles
  const cargarTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      setTenants(data);
      if (data.length > 0) {
        const buscado = tenantSlug ? data.find(t => t.slug === tenantSlug) : null;
        setTenantActivo(buscado || data[0]);
      }
    } catch (err) {
      console.error('Error al cargar talleres:', err);
    }
  };

  // 2. Cargar órdenes y bandeja de entrada del taller activo
  const cargarDatosTaller = async () => {
    if (!tenantActivo) return;
    try {
      setLoading(true);
      const [resOrdenes, resInbox] = await Promise.all([
        fetch(`/api/${tenantActivo.slug}/ordenes`),
        fetch(`/api/${tenantActivo.slug}/inbox`)
      ]);

      const dataOrdenes = await resOrdenes.json();
      const dataInbox = await resInbox.json();

      setOrdenes(dataOrdenes.ordenes || []);
      setInboxItems(dataInbox.inbox || []);
    } catch (err) {
      console.error('Error al cargar datos del taller:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTenants();
  }, []);

  useEffect(() => {
    if (tenantActivo) {
      cargarDatosTaller();
    }
  }, [tenantActivo]);

  // Avanzar estado de la orden (Regla no negociable de la reunión: solo hacia adelante)
  const avanzarEstado = async (orden) => {
    const currentIndex = ESTADOS_ORDEN.indexOf(orden.estado);
    if (currentIndex >= ESTADOS_ORDEN.length - 1) return;

    const siguienteEstado = ESTADOS_ORDEN[currentIndex + 1];
    try {
      const res = await fetch(`/api/${tenantActivo.slug}/ordenes/${orden.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevo_estado: siguienteEstado })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      cargarDatosTaller();
    } catch (err) {
      alert(`No se pudo avanzar: ${err.message}`);
    }
  };

  // Guardar nueva orden de trabajo
  const handleCrearOt = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/${tenantActivo.slug}/ordenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formOt)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setModalNuevaOt(false);
      setFormOt({
        placa: '',
        cliente_nombre: '',
        cliente_telefono: '',
        vehiculo_modelo: '',
        avance_nota: 'Vehículo ingresado a patio para revisión.'
      });
      cargarDatosTaller();
    } catch (err) {
      alert(err.message);
    }
  };

  // Agregar ítem en formulario de adicional
  const agregarItemAdicional = () => {
    setFormAdicional(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { descripcion: '', tipo: 'REPUESTO', es_seguridad: false, cantidad: 1, valor_unitario: '' }
      ]
    }));
  };

  // Modificar ítem en formulario de adicional
  const updateItemField = (index, field, value) => {
    const nuevosItems = [...formAdicional.items];
    nuevosItems[index][field] = value;
    setFormAdicional(prev => ({ ...prev, items: nuevosItems }));
  };

  // Guardar adicional con 48h timer
  const handleCrearAdicional = async (e) => {
    e.preventDefault();
    if (!modalNuevoAdicionalOt) return;

    try {
      const res = await fetch(`/api/${tenantActivo.slug}/ordenes/${modalNuevoAdicionalOt.id}/adicionales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formAdicional)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setModalNuevoAdicionalOt(null);
      setFormAdicional({
        titulo: '',
        items: [{ descripcion: '', tipo: 'REPUESTO', es_seguridad: false, cantidad: 1, valor_unitario: '' }]
      });
      cargarDatosTaller();
    } catch (err) {
      alert(err.message);
    }
  };

  // Copiar link público o abrir WhatsApp para Marcela
  const copiarLinkCliente = (token) => {
    const url = `${window.location.origin}/?token=${token}`;
    navigator.clipboard.writeText(url);
    alert('¡Enlace copiado! Marcela ya puede pegarlo directamente en el chat con el cliente.');
  };

  const abrirWhatsappCliente = (ot) => {
    const url = `${window.location.origin}/?token=${ot.token}`;
    const texto = encodeURIComponent(
      `Hola ${ot.cliente_nombre}, te saludamos de ${tenantActivo.name}. Puedes ver el avance de tu ${ot.vehiculo_modelo} (Placa ${ot.placa}) en este enlace: ${url}`
    );
    window.open(`https://wa.me/57${ot.cliente_telefono.replace(/\s+/g, '')}?text=${texto}`, '_blank');
  };

  // Filtros de búsqueda y semáforo
  const ordenesFiltradas = ordenes.filter(ot => {
    const coincideTexto = 
      ot.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
      ot.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      ot.vehiculo_modelo.toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideTexto) return false;

    if (filtroSemaforo === 'ROJO') return ot.semaforo === 'ROJO';
    if (filtroSemaforo === 'AMARILLO') return ot.semaforo === 'AMARILLO';
    if (filtroSemaforo === 'VERDE') return ot.semaforo === 'VERDE';
    return true;
  });

  const conteoRojo = ordenes.filter(o => o.semaforo === 'ROJO').length;
  const conteoAmarillo = ordenes.filter(o => o.semaforo === 'AMARILLO').length;
  const conteoVerde = ordenes.filter(o => o.semaforo === 'VERDE').length;
  const conteoInboxAlta = inboxItems.filter(i => i.prioridad === 'ALTA').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Barra Superior de Multitenencia */}
      <header className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
            <Building2 className="w-4 h-4" />
            Multitenencia Operativa (`base_tenant`)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            {tenantActivo?.name || 'Cargando taller...'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Panel del Asesor & Taller · {tenantActivo?.address} · Tel: {tenantActivo?.phone}
          </p>
        </div>

        {/* Banner de Operador y Rol Activo */}
        {usuarioActual && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Operando como: <strong>{usuarioActual.nombre}</strong></span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-200 text-blue-800">
              Rol: {usuarioActual.rol}
            </span>
          </div>
        )}

        {/* Switcher de Talleres para verificar aislamiento */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 pl-2">Taller Activo:</span>
          {tenants.map(t => (
            <button
              key={t.id}
              onClick={() => setTenantActivo(t)}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold transition min-h-[38px] ${
                tenantActivo?.id === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </header>

      {/* Selector de Pestaña Principal: Tablero de Autos vs Inbox de Marcela */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setPestañaActiva('vehiculos')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-base transition border-b-2 -mb-[2px] min-h-[48px] ${
            pestañaActiva === 'vehiculos'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Car className="w-5 h-5" />
          Tablero de Vehículos ({ordenes.length})
        </button>

        <button
          onClick={() => setPestañaActiva('inbox')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-base transition border-b-2 -mb-[2px] min-h-[48px] relative ${
            pestañaActiva === 'inbox'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-5 h-5" />
          Bandeja del Asesor (Inbox)
          {inboxItems.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              conteoInboxAlta > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-blue-100 text-blue-800'
            }`}>
              {inboxItems.length}
            </span>
          )}
        </button>
      </div>

      {pestañaActiva === 'inbox' ? (
        /* VISTA 1: BANDEJA DE ENTRADA DEL ASESOR (Marcela Gestora de su Inbox) */
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-700" />
                Novedades y Acciones Prioritarias
              </h2>
              <p className="text-sm text-blue-800 mt-0.5">
                Central de alertas operativas: respuestas de clientes, cotizaciones por vencer y autos listos para entrega.
              </p>
            </div>
            <button
              onClick={cargarDatosTaller}
              className="p-2.5 bg-white border border-blue-200 text-blue-800 rounded-xl font-semibold text-xs flex items-center gap-1.5 hover:bg-blue-100 transition min-h-[40px]"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>

          {inboxItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">¡Bandeja al día!</h3>
              <p className="text-slate-500 text-sm mt-1">No hay alertas pendientes ni cotizaciones por vencer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inboxItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl p-5 border-2 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    item.prioridad === 'ALTA'
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl shrink-0 ${
                      item.prioridad === 'ALTA'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.tipo === 'RESPUESTA_CLIENTE' && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                      {item.tipo === 'ADICIONAL_VENCIDO' && <AlertTriangle className="w-6 h-6 text-rose-600" />}
                      {item.tipo === 'ADICIONAL_POR_VENCER' && <ShieldAlert className="w-6 h-6 text-amber-600" />}
                      {item.tipo === 'ORDEN_LISTA' && <Car className="w-6 h-6 text-blue-600" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm bg-slate-900 text-white px-2.5 py-0.5 rounded-lg">
                          {item.placa}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {item.vehiculoModelo} · {item.clienteNombre}
                        </span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md uppercase ${
                          item.prioridad === 'ALTA'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          Prioridad {item.prioridad}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{item.titulo}</h3>
                      <p className="text-slate-600 text-sm mt-0.5">{item.mensaje}</p>

                      <div className="mt-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                        Acción sugerida: {item.accionSugerida}
                      </div>
                    </div>
                  </div>

                  {/* Acciones Rápidas para el Asesor */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                    <a
                      href={`https://wa.me/57${item.clienteTelefono.replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[44px] transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </a>

                    <a
                      href={`tel:${item.clienteTelefono}`}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[44px] transition"
                    >
                      <PhoneCall className="w-4 h-4 text-slate-600" />
                      Llamar
                    </a>

                    <button
                      onClick={() => onVerComoCliente(item.token)}
                      className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 min-h-[44px] transition"
                    >
                      <Smartphone className="w-4 h-4 text-blue-700" />
                      Ver Portal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VISTA 2: TABLERO DE VEHÍCULOS (Semáforo & Órdenes) */
        <div className="space-y-6">
          {/* Tarjetas de Semáforo y Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setFiltroSemaforo('TODOS')}
              className={`p-5 rounded-3xl border-2 text-left transition ${
                filtroSemaforo === 'TODOS'
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">Total Vehículos</div>
              <div className="text-3xl font-extrabold text-slate-900">{ordenes.length}</div>
              <div className="text-xs text-slate-500 mt-1">Capacidad taller (meta 40/mes)</div>
            </button>

            <button
              onClick={() => setFiltroSemaforo('ROJO')}
              className={`p-5 rounded-3xl border-2 text-left transition ${
                filtroSemaforo === 'ROJO'
                  ? 'border-rose-600 bg-rose-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-rose-800">🔴 Urgente / Vencidos</span>
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
              </div>
              <div className="text-3xl font-extrabold text-rose-900 mt-1">{conteoRojo}</div>
              <div className="text-xs text-rose-700 mt-1">Carros detenidos o &lt;12h</div>
            </button>

            <button
              onClick={() => setFiltroSemaforo('AMARILLO')}
              className={`p-5 rounded-3xl border-2 text-left transition ${
                filtroSemaforo === 'AMARILLO'
                  ? 'border-amber-500 bg-amber-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-xs uppercase font-bold text-amber-800">🟡 Esperando Cliente</div>
              <div className="text-3xl font-extrabold text-amber-900 mt-1">{conteoAmarillo}</div>
              <div className="text-xs text-amber-700 mt-1">En plazo de 48h activo</div>
            </button>

            <button
              onClick={() => setFiltroSemaforo('VERDE')}
              className={`p-5 rounded-3xl border-2 text-left transition ${
                filtroSemaforo === 'VERDE'
                  ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-xs uppercase font-bold text-emerald-800">🟢 En Flujo Normal</div>
              <div className="text-3xl font-extrabold text-emerald-900 mt-1">{conteoVerde}</div>
              <div className="text-xs text-emerald-700 mt-1">Trabajándose sin demoras</div>
            </button>
          </div>

          {/* Controles de Búsqueda y Acción */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por placa, cliente o modelo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] text-base"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={cargarDatosTaller}
                className="p-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center min-h-[48px] transition"
                title="Refrescar lista"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={() => setModalNuevaOt(true)}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm min-h-[48px] transition"
              >
                <PlusCircle className="w-5 h-5" />
                Nueva Orden de Trabajo
              </button>
            </div>
          </div>

          {/* Grid de Órdenes */}
          {loading ? (
            <div className="p-12 text-center text-slate-500">Cargando vehículos...</div>
          ) : ordenesFiltradas.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Car className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No hay vehículos con este filtro</h3>
              <p className="text-slate-500 text-sm mt-1">Prueba seleccionando "Todos" o limpiando la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ordenesFiltradas.map((ot) => {
                const indexEstado = ESTADOS_ORDEN.indexOf(ot.estado);
                const siguienteEstado = indexEstado < ESTADOS_ORDEN.length - 1 ? ESTADOS_ORDEN[indexEstado + 1] : null;

                return (
                  <div 
                    key={ot.id}
                    className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-slate-300 transition shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Encabezado con Semáforo y Placa */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="font-mono font-black text-2xl bg-slate-900 text-white px-3.5 py-1 rounded-xl shadow-xs">
                          {ot.placa}
                        </span>

                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          ot.semaforo === 'ROJO'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : ot.semaforo === 'AMARILLO'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : ot.semaforo === 'VERDE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            ot.semaforo === 'ROJO' ? 'bg-rose-600' :
                            ot.semaforo === 'AMARILLO' ? 'bg-amber-500' :
                            ot.semaforo === 'VERDE' ? 'bg-emerald-600' : 'bg-slate-400'
                          }`} />
                          {ot.semaforo}
                        </div>
                      </div>

                      <div className="font-bold text-xl text-slate-900 leading-tight mb-1">
                        {ot.vehiculoModelo}
                      </div>
                      <div className="text-sm text-slate-600 flex items-center gap-1 mb-4">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {ot.clienteNombre} · <span className="font-mono">{ot.clienteTelefono}</span>
                      </div>

                      {/* Estado Actual en Máquina de Estados */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-4">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Fase Actual ({indexEstado + 1} de {ESTADOS_ORDEN.length})
                        </div>
                        <div className="font-extrabold text-blue-900 text-lg flex items-center justify-between">
                          {ot.estado}
                          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                            {ot.detalleSemaforo}
                          </span>
                        </div>
                        {ot.avanceNota && (
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic border-t border-slate-200/60 pt-1.5">
                            "{ot.avanceNota}"
                          </p>
                        )}
                      </div>

                      {/* Adicionales Activos */}
                      {ot.adicionales && ot.adicionales.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Cotizaciones adicionales
                          </div>
                          {ot.adicionales.map(ad => (
                            <div key={ad.id} className="text-xs bg-blue-50/60 border border-blue-100 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="font-semibold text-slate-800 truncate mr-2">{ad.titulo}</span>
                              <span className={`shrink-0 font-bold px-2 py-0.5 rounded-md ${
                                ad.estado === 'PENDIENTE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ad.estado === 'VENCIDO'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {ad.estado === 'PENDIENTE' ? 'Esperando' : ad.estado}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Acciones de Operación */}
                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      {/* Avance Unidireccional */}
                      {siguienteEstado ? (
                        <button
                          onClick={() => avanzarEstado(ot)}
                          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 min-h-[44px] transition"
                        >
                          Avanzar a: {siguienteEstado}
                          <ArrowRight className="w-4 h-4 text-blue-300" />
                        </button>
                      ) : (
                        <div className="w-full py-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                          ✓ Proceso de taller completado
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <button
                          onClick={() => setModalNuevoAdicionalOt(ot)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 border border-blue-200 min-h-[48px] transition"
                          title="Crear trabajo adicional para enviar al cliente"
                        >
                          <Wrench className="w-4 h-4 text-blue-700" />
                          + Adicional
                        </button>

                        <button
                          onClick={() => copiarLinkCliente(ot.token)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 border border-slate-300 min-h-[48px] transition"
                          title="Copiar enlace para Marcela"
                        >
                          <Copy className="w-4 h-4 text-slate-700" />
                          Copiar Link
                        </button>

                        <button
                          onClick={() => abrirWhatsappCliente(ot)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 border border-emerald-200 min-h-[48px] transition"
                          title="Enviar link al cliente por WhatsApp"
                        >
                          <Share2 className="w-4 h-4 text-emerald-700" />
                          WhatsApp
                        </button>

                        <button
                          onClick={() => onVerComoCliente(ot.token)}
                          className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 border border-sky-200 min-h-[48px] transition"
                          title="Ver exactamente lo que ve el cliente en su móvil"
                        >
                          <Smartphone className="w-4 h-4 text-sky-700" />
                          Ver Cliente
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR NUEVA OT */}
      {modalNuevaOt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Ingresar Nuevo Vehículo</h3>
            <p className="text-slate-500 text-sm mb-4">Genera automáticamente el enlace privado para el cliente.</p>

            <form onSubmit={handleCrearOt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Placa del Carro</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ABC-123"
                  value={formOt.placa}
                  onChange={(e) => setFormOt({ ...formOt, placa: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-lg font-bold uppercase text-slate-900 focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Modelo y Línea</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mazda 3 Skyactiv (2021)"
                  value={formOt.vehiculo_modelo}
                  onChange={(e) => setFormOt({ ...formOt, vehiculo_modelo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Nombre del Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Andrés Rodríguez"
                    value={formOt.cliente_nombre}
                    onChange={(e) => setFormOt({ ...formOt, cliente_nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 310 123 4567"
                    value={formOt.cliente_telefono}
                    onChange={(e) => setFormOt({ ...formOt, cliente_telefono: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base text-slate-900 focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Nota Inicial de Entrada</label>
                <textarea
                  rows={2}
                  value={formOt.avance_nota}
                  onChange={(e) => setFormOt({ ...formOt, avance_nota: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevaOt(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl min-h-[48px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md min-h-[48px]"
                >
                  Crear y Generar Enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR TRABAJO ADICIONAL CON IVA Y 48H */}
      {modalNuevoAdicionalOt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Cotizar Trabajo Adicional</h3>
                <p className="text-slate-500 text-sm">
                  Para {modalNuevoAdicionalOt.vehiculoModelo} ({modalNuevoAdicionalOt.placa})
                </p>
              </div>
              <div className="bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl text-xs font-bold">
                Plazo: 48 Horas
              </div>
            </div>

            <form onSubmit={handleCrearAdicional} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Título del Daño o Trabajo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cambio de Discos y Pastillas de Freno"
                  value={formAdicional.titulo}
                  onChange={(e) => setFormAdicional({ ...formAdicional, titulo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                />
              </div>

              {/* Lista dinámica de ítems */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase text-slate-700">Ítems a Cotizar</label>
                {formAdicional.items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Ítem #{idx + 1}</span>
                      <label className="flex items-center gap-2 cursor-pointer bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                        <input
                          type="checkbox"
                          checked={item.es_seguridad}
                          onChange={(e) => updateItemField(idx, 'es_seguridad', e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
                          Es ítem de seguridad vial (Frenos/Dirección)
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          required
                          placeholder="Descripción del repuesto o labor"
                          value={item.descripcion}
                          onChange={(e) => updateItemField(idx, 'descripcion', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <select
                          value={item.tipo}
                          onChange={(e) => updateItemField(idx, 'tipo', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                        >
                          <option value="REPUESTO">Repuesto</option>
                          <option value="MANO_OBRA">Mano de Obra</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          required
                          placeholder="Valor unitario ($)"
                          value={item.valor_unitario}
                          onChange={(e) => updateItemField(idx, 'valor_unitario', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={agregarItemAdicional}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-dashed border-slate-300"
                >
                  <PlusCircle className="w-4 h-4" />
                  Agregar Otro Ítem
                </button>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNuevoAdicionalOt(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl min-h-[48px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md min-h-[48px]"
                >
                  Crear y Enviar al Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
