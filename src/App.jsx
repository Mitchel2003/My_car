import { useState, useEffect } from 'react';
import { TableroTaller } from './components/TableroTaller';
import { PortalCliente } from './components/PortalCliente';
import { PanelSuperAdmin } from './components/PanelSuperAdmin';
import { ModalLogin } from './components/ModalLogin';
import { Wrench, Smartphone, LayoutDashboard, Shield, LogIn, LogOut } from 'lucide-react';

export function App() {
  const [tokenActivo, setTokenActivo] = useState(() => {
    return new URLSearchParams(window.location.search).get('token');
  });
  const [vista, setVista] = useState(() => {
    return new URLSearchParams(window.location.search).get('token') ? 'cliente' : 'taller';
  });

  // M8.3 / M8.4: Sesión de usuario persistente
  const [sesion, setSesion] = useState(() => {
    try {
      const saved = localStorage.getItem('mcd_sesion');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [modalLoginAbierto, setModalLoginAbierto] = useState(false);
  const [tenantActivo, setTenantActivo] = useState('autofrenos-norte');

  useEffect(() => {
    if (sesion) {
      localStorage.setItem('mcd_sesion', JSON.stringify(sesion));
    } else {
      localStorage.removeItem('mcd_sesion');
    }
  }, [sesion]);

  const abrirVistaCliente = (token) => {
    setTokenActivo(token);
    setVista('cliente');
    window.history.pushState({}, '', `?token=${token}`);
  };

  const volverAlTablero = () => {
    setVista('taller');
    setTokenActivo(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleLogout = () => {
    setSesion(null);
    if (vista === 'superadmin') {
      setVista('taller');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Barra de Navegación Global */}
      <nav className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block leading-tight">
                Mi Carro al Día
              </span>
              <span className="text-[11px] text-blue-300 uppercase tracking-wider font-semibold block">
                Plataforma de Taller y Transparencia
              </span>
            </div>
          </div>

          {/* Selector de Perspectiva (Taller vs Portal Cliente vs Superadmin) */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700">
            <button
              onClick={volverAlTablero}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition min-h-[40px] ${
                vista === 'taller'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Panel Asesor/Taller</span>
            </button>

            <button
              onClick={() => {
                if (!tokenActivo) setTokenActivo('token-carlos-001');
                setVista('cliente');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition min-h-[40px] ${
                vista === 'cliente'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Portal Móvil</span> (Cliente)
            </button>

            {sesion?.usuario?.rol === 'superadmin' && (
              <button
                onClick={() => setVista('superadmin')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition min-h-[40px] ${
                  vista === 'superadmin'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Super Admin</span> (M7.7)
              </button>
            )}
          </div>

          {/* M8.3 / M8.4: Autenticación y Control de Personal */}
          <div className="flex items-center gap-2">
            {sesion ? (
              <div className="flex items-center gap-2 bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-700">
                <div className="text-right">
                  <span className="block text-xs font-bold text-white leading-tight">
                    {sesion.usuario.nombre}
                  </span>
                  <span className="block text-[10px] text-blue-300 font-semibold uppercase">
                    {sesion.usuario.rol}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setModalLoginAbierto(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                <span>Ingresar Personal</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="flex-1">
        {vista === 'taller' ? (
          <TableroTaller 
            onVerComoCliente={abrirVistaCliente} 
            tenantSlug={tenantActivo}
            usuarioActual={sesion?.usuario}
          />
        ) : vista === 'superadmin' ? (
          <PanelSuperAdmin 
            tokenAuth={sesion?.token} 
            onSeleccionarTenant={(slug) => {
              setTenantActivo(slug);
              setVista('taller');
            }}
          />
        ) : (
          <PortalCliente 
            token={tokenActivo || 'token-carlos-001'} 
            onVolverAlPanel={volverAlTablero} 
          />
        )}
      </main>

      {/* Modal de Login */}
      <ModalLogin
        abierto={modalLoginAbierto}
        alCerrar={() => setModalLoginAbierto(false)}
        alLoginExitoso={(data) => {
          setSesion(data);
          if (data.usuario.rol === 'superadmin') {
            setVista('superadmin');
          }
        }}
      />

      {/* Footer minimalista */}
      <footer className="bg-slate-200 border-t border-slate-300 py-4 text-center text-xs text-slate-600">
        Mi Carro al Día · Arquitectura Limpia Multitenant (`base_tenant`) · Conectado a SQLite Local · PWA Offline Ready
      </footer>
    </div>
  );
}

export default App;
