import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface CmsLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (adminEmail: string, token: string) => void;
  currentEmail?: string;
}

export const CmsLoginModal: React.FC<CmsLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentEmail = 'mebolanos@cem.edu.co',
}) => {
  const [email, setEmail] = useState<string>(currentEmail || 'mebolanos@cem.edu.co');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Por favor ingresa tu correo institucional.');
      return;
    }

    if (!cleanEmail.endsWith('@cem.edu.co')) {
      setError('Acceso restringido: Solo administradores con dominio @cem.edu.co pueden gestionar el CMS.');
      return;
    }

    if (!password) {
      setError('Por favor ingresa la contraseña registrada en Google Sheets.');
      return;
    }

    try {
      setIsLoading(true);

      const resp = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await resp.json().catch(() => null);

      if (resp.ok && data?.ok && data?.isAdmin && data?.token) {
        onLoginSuccess(cleanEmail, data.token);
        return;
      }

      setError(
        data?.error ||
          'Credenciales inválidas o contraseña incorrecta. Verifica la contraseña en la columna Pass de la hoja "Usuarios" en Google Sheets.'
      );
    } catch {
      setError('Error al conectar con el servidor de autenticación. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Cabecera del Modal */}
        <div className="bg-[#664d88] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 text-[#f8c62e]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Acceso Administrativo CMS</h3>
              <p className="text-[11px] text-violet-200">
                Autenticación por Usuario y Contraseña (Google Sheets)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Informativo */}
        <div className="bg-violet-50 px-5 py-3 border-b border-violet-100 flex items-center gap-2 text-xs text-violet-900">
          <KeyRound className="w-4 h-4 text-[#664d88] shrink-0" />
          <span>
            Ingresa con tu correo <strong>@cem.edu.co</strong> y la clave de la columna <strong>Pass</strong> en Google Sheets.
          </span>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Institucional (Usuario)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mebolanos@cem.edu.co"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#664d88] focus:border-[#664d88]"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Administrador registrado: <strong>mebolanos@cem.edu.co</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña (Columna Pass en Google Sheets)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#664d88] focus:border-[#664d88]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#664d88] hover:bg-[#533e6f] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sincronizando con Google Sheets y verificando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#f8c62e]" />
                  <span>Acceder al Panel CMS</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Colegio Ekirayá · Acceso verificado en tiempo real con la pestaña "Usuarios" de Google Sheets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
