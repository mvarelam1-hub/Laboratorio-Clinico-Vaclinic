import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { TotpEnrollmentSection } from './TotpEnrollmentSection';

/**
 * Pantalla de bloqueo por TOTP obligatorio
 * (server/totp.ts::MANDATORY_TOTP_ROLES — hoy director_laboratorio y
 * administrador_ti). Mismo patrón que ForcedPasswordChangeView.tsx: el
 * backend (server/routes/index.ts) ya rechaza con 403 TOTP_SETUP_REQUIRED
 * cualquier endpoint que no sea /api/auth/* mientras
 * `staffUser.totpSetupRequired` sea true, así que esta pantalla es la ÚNICA
 * forma de avanzar más allá de ella para esos roles — antes de esta
 * pantalla, server/routes/auth.ts::whoami ya devolvía `totpSetupRequired`,
 * pero nada en el cliente lo usaba para bloquear el resto de la app: solo
 * aparecía como un aviso dentro de Biometría y Acceso Seguro
 * (TotpEnrollmentSection), una pantalla a la que el usuario podía nunca
 * entrar.
 *
 * Reutiliza TotpEnrollmentSection tal cual (mismo flujo de enroll/confirm
 * que ya usa la pantalla de Biometría y Acceso Seguro) en vez de duplicar
 * su lógica — en cuanto confirma el primer código válido,
 * TotpEnrollmentSection actualiza `staffAuthMeta.totpSetupRequired` a
 * false y App.tsx deja de mostrar esta pantalla automáticamente.
 */
export const ForcedTotpEnrollmentView: React.FC = () => {
  const { logoutStaff } = useClinic();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg space-y-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-9 border border-slate-200/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600" />

          <div className="text-center mb-5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Activa la verificación en dos pasos
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              Tu rol exige obligatoriamente TOTP además de tu contraseña. Complétalo para continuar.
            </p>
          </div>

          <TotpEnrollmentSection />
        </div>

        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-slate-500 flex items-start gap-1.5 text-left">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>No podrás usar el resto del sistema hasta completar este paso.</span>
          </p>
          <button
            type="button"
            onClick={logoutStaff}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
