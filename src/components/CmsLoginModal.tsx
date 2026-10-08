import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface CmsLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (adminEmail: string) => void;
  currentEmail?: string;
}

export const CmsLoginModal: React.FC<CmsLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentEmail = 'mebolanos@cem.edu.co',
}) => {
  const [activeTab, setActiveTab] = useState<'password' | 'google'>('password');
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
      setError('Por favor ingresa la contraseña de administrador.');
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

      if (resp.ok && data?.ok && data?.isAdmin) {
        onLoginSuccess(cleanEmail);
        return;
      }

      setError(data?.error || 'Credenciales inválidas o contraseña incorrecta. Verifica tus permisos de Administrador.');
    } catch {
      setError('Error al conectar con el servidor de autenticación. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSsoLogin = async () => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.endsWith('@cem.edu.co')) {
      setError('Por favor ingresa un correo institucional @cem.edu.co válido para iniciar sesión con Google.');
      return;
    }

    setIsLoading(true);

    try {
      const resp = await fetch('/api/auth/google-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await resp.json().catch(() => null);

      if (resp.ok && data?.ok && data?.isAdmin) {
        onLoginSuccess(cleanEmail);
        return;
      }

      setError(data?.error || 'La cuenta institucional no cuenta con privilegios de Administrador del CMS.');
    } catch {
      setError('Error al verificar la cuenta de Google con el servidor.');
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
              <h3 className="font-bold text-base leading-tight">Administración CMS</h3>
              <p className="text-[11px] text-violet-200">
                Iniciar Sesión de Administrador · Colegio Ekirayá
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

        {/* Pestañas de Método de Autenticación */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setError(null);
            }}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'border-[#664d88] text-[#664d88] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Correo &amp; Contraseña</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setError(null);
            }}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'google'
                ? 'border-[#664d88] text-[#664d88] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google SSO (@cem)</span>
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Institucional de Administrador
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
                  Administrador autorizado: <strong>mebolanos@cem.edu.co</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contraseña de Administrador
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
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#f8c62e]" />
                    <span>Iniciar Sesión en CMS</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 py-1">
              <div className="p-3.5 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#664d88]" />
                  <span>Google Workspace Single Sign-On</span>
                </div>
                <p className="text-violet-700">
                  Accede automáticamente con tu cuenta institucional de Google del Colegio Ekirayá (<code>@cem.edu.co</code>).
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSsoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Acceder con Google (@cem.edu.co)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('mebolanos@cem.edu.co');
                  handleGoogleSsoLogin();
                }}
                className="w-full py-2 px-3 rounded-xl bg-violet-100/60 hover:bg-violet-100 text-[#664d88] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#664d88]" />
                <span>Continuar como mebolanos@cem.edu.co</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Colegio Ekirayá · Acceso restringido al personal directivo y de administración
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
