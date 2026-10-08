import React, { useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, ShieldAlert, KeyRound, Smartphone, Copy, Check, AlertCircle } from 'lucide-react';
import { useClinic, STAFF_SESSION_TOKEN_STORAGE_KEY } from '../../context/ClinicContext';
import { enrollTotp, confirmTotp } from '../../services/staffAuthService';

/**
 * Enrolamiento de TOTP (segundo factor, RFC 6238) para la cuenta de
 * personal actualmente autenticada — ver server/routes/auth.ts
 * (POST /totp/enroll, POST /totp/confirm) y server/totp.ts.
 *
 * Reemplaza por completo la idea de "doble_factor_habilitado" como un
 * simple interruptor administrativo (ver server/routes/personal.ts): antes
 * un administrador podía marcar esa columna en TRUE sin que existiera
 * ningún secreto real detrás — ahora sí hay un secreto TOTP real, generado
 * y confirmado por el propio usuario, y `usuario.totp_enabled` solo se
 * activa después de que la app autenticadora demuestre que lo tiene.
 *
 * Se renderiza el código QR con la librería `qrcode` (YA estaba instalada
 * en package.json para el QR de verificación de VaclinicOfficialReportSheet.tsx
 * — se reutiliza en vez de agregar una dependencia nueva) y, debajo, el
 * secreto en texto plano para quien prefiera escribirlo a mano en su app
 * autenticadora.
 */
export const TotpEnrollmentSection: React.FC = () => {
  const { staffAuthMeta, setStaffAuthMeta, showNotification } = useClinic();

  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getSessionToken = (): string | null => {
    try {
      return localStorage.getItem(STAFF_SESSION_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const handleStartEnroll = async () => {
    setError(null);
    const token = getSessionToken();
    if (!token) {
      setError('No se encontró una sesión activa. Vuelve a iniciar sesión.');
      return;
    }

    setIsEnrolling(true);
    const resultado = await enrollTotp(token);
    setIsEnrolling(false);

    if (resultado.ok === false) {
      setError(resultado.message);
      return;
    }

    setSecret(resultado.secret);
    setOtpauthUri(resultado.otpauthUri);
    try {
      const dataUrl = await QRCode.toDataURL(resultado.otpauthUri, { width: 220, margin: 1 });
      setQrDataUrl(dataUrl);
    } catch (e) {
      // Si falla el render del QR (entorno sin canvas, etc.), igual queda
      // el secreto y la URI en texto plano para enrolar a mano — ver el
      // bloque de abajo, nunca se bloquea el flujo por esto.
      console.warn('[TOTP] No se pudo generar el QR, se deja el enrolamiento manual como respaldo:', e);
      setQrDataUrl(null);
    }
  };

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const token = getSessionToken();
    if (!token) {
      setError('No se encontró una sesión activa. Vuelve a iniciar sesión.');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Ingresa el código de 6 dígitos que muestra tu app autenticadora.');
      return;
    }

    setIsConfirming(true);
    const resultado = await confirmTotp(token, code.trim());
    setIsConfirming(false);

    if (resultado.ok === false) {
      setError(resultado.message);
      return;
    }

    setStaffAuthMeta(
      staffAuthMeta
        ? { ...staffAuthMeta, totpEnabled: true, totpSetupRequired: false }
        : { mustChangePassword: false, totpEnabled: true, totpSetupRequired: false, totpMandatory: false }
    );
    setSecret(null);
    setQrDataUrl(null);
    setOtpauthUri(null);
    setCode('');
    showNotification('Verificación en dos pasos (TOTP) activada correctamente', 'success');
  };

  const handleCopySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el portapapeles puede no estar disponible (http, permisos); no es crítico */
    }
  };

  const totpEnabled = Boolean(staffAuthMeta?.totpEnabled);
  const totpMandatory = Boolean(staffAuthMeta?.totpMandatory);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
          totpEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
        }`}>
          {totpEnabled ? <ShieldCheck className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
            Verificación en dos pasos (TOTP)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Código de 6 dígitos generado por una app autenticadora (Google Authenticator, Authy, etc.), además de tu contraseña.
          </p>
        </div>
        {totpEnabled && (
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-300/50 shrink-0">
            Activado
          </span>
        )}
      </div>

      {!totpEnabled && totpMandatory && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="font-medium">Tu rol exige obligatoriamente tener activada la verificación en dos pasos.</span>
        </div>
      )}

      {totpEnabled ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Esta cuenta ya exige un código TOTP además de la contraseña en cada inicio de sesión.
        </p>
      ) : !secret ? (
        <button
          onClick={handleStartEnroll}
          disabled={isEnrolling}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <KeyRound className="w-4 h-4" />
          {isEnrolling ? 'Generando secreto…' : 'Activar verificación en dos pasos'}
        </button>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Código QR para enrolar TOTP"
                className="w-[160px] h-[160px] rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 bg-white p-1"
              />
            ) : (
              // Respaldo sin librería de QR disponible (ver comentario del
              // componente): se muestra la URI otpauth:// como texto
              // seleccionable. Una librería de renderizado de QR offline
              // podría agregarse después si se necesita en más lugares.
              <div className="w-[160px] shrink-0 p-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[10px] font-mono break-all text-slate-500">
                {otpauthUri}
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-3">
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                <li>Abre tu app autenticadora y escanea el código QR.</li>
                <li>O ingresa este secreto manualmente:</li>
              </ol>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 break-all">
                  {secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  title="Copiar secreto"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600 hover:border-teal-300 cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label htmlFor="totp-confirm-code" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Código de 6 dígitos de la app
                </label>
                <input
                  id="totp-confirm-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError(null);
                  }}
                  placeholder="000000"
                  className="w-full max-w-[180px] px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isConfirming}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4" />
            {isConfirming ? 'Verificando…' : 'Confirmar y activar'}
          </button>
        </form>
      )}

      {!totpEnabled && !secret && error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};
