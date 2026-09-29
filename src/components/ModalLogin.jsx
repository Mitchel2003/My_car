import { useState } from 'react';
import { LogIn, Lock, Mail, AlertCircle, X, ShieldCheck } from 'lucide-react';

export function ModalLogin({ abierto, alCerrar, alLoginExitoso }) {
  const [email, setEmail] = useState('marcela@autofrenos.co');
  const [password, setPassword] = useState('marcela123');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  if (!abierto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }
      alLoginExitoso(data);
      alCerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const setCredencialRapida = (correo, pass) => {
    setEmail(correo);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
        <button
          onClick={alCerrar}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Iniciar Sesión de Personal</h2>
            <p className="text-xs text-slate-500">M8.3 / M8.4 — Autenticación y Control de Roles</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@autofrenos.co"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {cargando ? 'Verificando credenciales...' : 'Ingresar al Sistema'}
          </button>
        </form>

        {/* Cuentas de demostración preconfiguradas */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Accesos de Demostración Sembrados:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setCredencialRapida('marcela@autofrenos.co', 'marcela123')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-left border border-slate-200 transition"
            >
              <span className="font-bold block text-slate-800">Marcela Ríos</span>
              <span className="text-[10px] text-blue-600">Asesora (Inbox/OTs)</span>
            </button>
            <button
              type="button"
              onClick={() => setCredencialRapida('jairo@autofrenos.co', 'jairo123')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 text-left border border-slate-200 transition"
            >
              <span className="font-bold block text-slate-800">Jairo Medina</span>
              <span className="text-[10px] text-amber-600">Jefe de Taller</span>
            </button>
            <button
              type="button"
              onClick={() => setCredencialRapida('admin@autofrenos.co', 'alvaro123')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left border border-slate-200 transition"
            >
              <span className="font-bold block text-slate-800">Don Álvaro</span>
              <span className="text-[10px] text-slate-600">Admin Autofrenos</span>
            </button>
            <button
              type="button"
              onClick={() => setCredencialRapida('superadmin@mi-carro-al-dia.co', 'super2026!')}
              className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-left border border-purple-200 transition"
            >
              <span className="font-bold block text-purple-900">Super Admin</span>
              <span className="text-[10px] text-purple-700">M7.7 Multi-Taller</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
