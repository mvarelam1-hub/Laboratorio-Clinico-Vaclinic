import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { useClinic, STAFF_SESSION_TOKEN_STORAGE_KEY } from '../../context/ClinicContext';
import { changePassword } from '../../services/staffAuthService';

/**
 * Pantalla de bloqueo por cambio de contraseña obligatorio
 * (usuario.must_change_password = TRUE, ver migración 0012 y
 * server/routes/auth.ts). Se muestra para CUALQUIER cuenta recién creada
 * (incluida la cuenta de arranque de scripts/migrate.mjs) hasta que fija su
 * propia contraseña — mientras tanto, la sesión emitida es "limitada": el
 * backend (server/routes/index.ts) rechaza con 403 MUST_CHANGE_PASSWORD
 * cualquier endpoint que no sea /api/auth/*, así que esta pantalla es la
 * ÚNICA forma de avanzar más allá de ella.
 */
export const ForcedPasswordChangeView: React.FC = () => {
  const { showNotification, setStaffAuthMeta, logoutStaff } = useClinic();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Completa los tres campos.');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    let token: string | null = null;
    try {
      token = localStorage.getItem(STAFF_SESSION_TOKEN_STORAGE_KEY);
    } catch { /* ignore */ }
    if (!token) {
      setError('No se encontró una sesión activa. Vuelve a iniciar sesión.');
      return;
    }

    setIsLoading(true);
    const resultado = await changePassword(token, currentPassword, newPassword);
    setIsLoading(false);

    if (resultado.ok === false) {
      setError(resultado.message);
      return;
    }

    // El claim mustChangePassword vive DENTRO del token firmado ya emitido
    // (ver server/session.ts): aunque el servidor ya actualizó la columna,
    // este token seguiría trayendo mustChangePassword=true hasta vencer. La
    // forma simple y segura de resolverlo es forzar un login limpio, que
    // emite una sesión nueva con el claim correcto — en vez de intentar
    // mutar un token ya firmado en el cliente.
    setStaffAuthMeta(null);
    showNotification('Contraseña actualizada. Inicia sesión de nuevo con tu nueva contraseña.', 'success');
    logoutStaff();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-9 border border-slate-200/80 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        <div className="flex justify-center mt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#0a1924] flex items-center justify-center text-amber-400 shadow-lg border border-amber-500/30">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>

        <div className="text-center mt-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Debes cambiar tu contraseña
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Por seguridad, esta cuenta todavía usa una contraseña inicial o temporal. Fija una propia antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Contraseña actual
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="current-password"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setError(null); }}
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#eef2fa] hover:bg-[#e6ecf8] focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="new-password"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full pl-10 pr-11 py-3 bg-[#eef2fa] hover:bg-[#e6ecf8] focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPasswords ? 'Ocultar contraseñas' : 'Ver contraseñas'}
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Mínimo 8 caracteres.</p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                autoComplete="new-password"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#eef2fa] hover:bg-[#e6ecf8] focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all font-mono"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando…</span>
              </>
            ) : (
              <span>Guardar nueva contraseña</span>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5 text-left">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>No podrás usar el resto del sistema hasta completar este paso.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
