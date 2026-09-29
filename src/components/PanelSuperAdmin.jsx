import { useState, useEffect } from 'react';
import { Building2, Users, ShieldAlert, ArrowRight, RefreshCw, Car } from 'lucide-react';

export function PanelSuperAdmin({ tokenAuth, onSeleccionarTenant }) {
  const [tenants, setTenants] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarTenants = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/tenants', {
        headers: {
          'Authorization': `Bearer ${tokenAuth}`
        }
      });
      if (!res.ok) {
        throw new Error('Error al cargar la administración de tenants (requiere rol superadmin)');
      }
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTenants();
  }, [tokenAuth]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header del Panel Superadmin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Acceso Superadministrador (M7.7 Multitenant Global)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión Centralizada de Talleres
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Supervisa todos los talleres independientes registrados en la plataforma Mi Carro al Día con aislamiento de datos.
          </p>
        </div>
        <button
          onClick={cargarTenants}
          disabled={cargando}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-purple-600' : ''}`} />
          Refrescar Talleres
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Aviso de Autorización:</p>
            <p>{error}</p>
            <p className="text-xs mt-1 text-amber-700">Inicia sesión con credenciales de superadmin (ej. <code>superadmin@mi-carro-al-dia.co</code> / <code>super2026!</code>) para acceder.</p>
          </div>
        </div>
      )}

      {/* Grid de Talleres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-lg">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  slug: {t.slug}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-1">{t.name}</h2>
              <p className="text-xs text-slate-500 mb-4">{t.address} · Tel: {t.phone}</p>

              {/* Equipo del Taller */}
              <div className="border-t border-slate-100 pt-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Personal Asignado ({t.totalUsuarios || 0})
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {t.usuarios && t.usuarios.length > 0 ? (
                    t.usuarios.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50"
                      >
                        <span className="font-medium text-slate-800 truncate max-w-[140px]">{u.nombre}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          u.rol === 'asesor' ? 'bg-blue-100 text-blue-700' :
                          u.rol === 'jefe_taller' ? 'bg-amber-100 text-amber-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {u.rol}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin usuarios registrados</p>
                  )}
                </div>
              </div>
            </div>

            {/* Acción de navegación */}
            <button
              onClick={() => onSeleccionarTenant(t.slug)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Car className="w-4 h-4" />
              Ver Tablero Operativo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
