import React, { useState } from 'react';
import { useClinic, STAFF_SESSION_TOKEN_STORAGE_KEY } from '../../context/ClinicContext';
import { PortadaLogin, ImagenPortada, usePortadaImagenes } from './PortadaLogin';
import { loginStaff, verifyTotp, verifyStaffSession } from '../../services/staffAuthService';
import { PasswordRecovery } from './PasswordRecovery';
import {
  loadRecentAccounts,
  rememberAccount,
  forgetAccount,
  filterAccounts,
  type RecentStaffAccount
} from '../../services/recentStaffAccounts';
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CloudCheck,
  FlaskConical,
  Sparkles,
  ShieldAlert,
  Clock,
  Phone
} from 'lucide-react';

interface StaffLoginViewProps {
  onSuccess?: () => void;
  onBackToPatients?: () => void;
}

/**
 * Acceso del personal (Etapa 3).
 *
 * ANTES: aceptaba CUALQUIER contraseña no vacía para un usuario/"admin"
 * (`isValidPassword || cleanPass.length > 0`), además de una lista de
 * contraseñas fijas ('admin', '1234', 'admin1234', 'lis2026', 'password')
 * y botones de "Acceso Rápido" que autocompletaban esas credenciales en
 * pantalla. Cualquiera que abriera esta pantalla entraba al sistema LIS.
 * Luego (Firebase Authentication): se delegaba la verificación de
 * contraseña a un SDK externo y se volvía a confirmar contra el backend.
 *
 * AHORA: autenticación 100% propia (POST /api/auth/login, ver
 * server/routes/auth.ts) — sin SDK externo. Dos pasos posibles:
 *   1) Correo + contraseña. Si la cuenta no tiene TOTP, el backend ya
 *      devuelve la sesión completa aquí mismo.
 *   2) Si la cuenta SÍ tiene TOTP activado (obligatorio para
 *      director_laboratorio/administrador_ti, ver server/totp.ts), el
 *      backend responde `requiresTotp: true` + un ticket de 5 minutos, y
 *      esta pantalla muestra un segundo paso para el código de 6 dígitos
 *      antes de recibir la sesión real.
 */
export const StaffLoginView: React.FC<StaffLoginViewProps> = ({
  onSuccess,
  onBackToPatients
}) => {
  const {
    setRole,
    setIsStaffAuthenticated,
    staffUsers,
    setCurrentStaffUser,
    setStaffAuthMeta,
    logAuditEvent,
    showNotification
  } = useClinic();

  // Imágenes de la portada elegidas por el laboratorio (Ajustes → Portada del acceso).
  const imagenesPortada = usePortadaImagenes();
  const [email, setEmail] = useState('');
  // Recuperación de contraseña: se abre sola si llegó por el enlace del correo (?reset=...).
  const [modoRecuperacion, setModoRecuperacion] = useState<boolean>(() => new URLSearchParams(window.location.search).has('reset'));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Paso 2 (solo cuentas con TOTP activado): ticket de corto plazo emitido
  // por /login tras validar correo+contraseña, y el código de 6 dígitos que
  // el usuario escribe desde su app autenticadora.
  const [loginTicket, setLoginTicket] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');

  // Cuentas usadas antes en ESTE equipo (solo correo/nombre/rol, nunca
  // contraseñas): al enfocar o escribir el correo se ofrecen para elegirlas.
  const [recentAccounts, setRecentAccounts] = useState<RecentStaffAccount[]>(() => loadRecentAccounts());
  const [showAccountList, setShowAccountList] = useState(false);

  /**
   * Completa el login una vez que el backend ya emitió una sesión real
   * (directo desde /login si la cuenta no tiene TOTP, o desde /verify-totp
   * si sí lo tiene) — mismo comportamiento final que antes tenía el login
   * de Firebase exitoso: guarda el token, arma el perfil local, registra
   * la auditoría y entra al panel de personal.
   */
  const finalizarLogin = async (resultado: {
    token: string;
    mustChangePassword: boolean;
    idUsuario: number;
    nombreCompleto: string;
    roleId: string;
  }) => {
    try {
      localStorage.setItem(STAFF_SESSION_TOKEN_STORAGE_KEY, resultado.token);
    } catch (e) {
      console.error('[Auth] No se pudo guardar el token de sesión de personal:', e);
    }

    // Emparejar con el perfil local enriquecido (nombre, foto, licencia,
    // etc.) por el id real de `usuario` (remoteId) o, como respaldo, por
    // correo. El acceso real ya fue otorgado por el backend arriba; esto
    // solo decide qué datos de perfil se muestran en pantalla.
    const cleanEmail = email.trim().toLowerCase();
    const matchedUser =
      staffUsers.find(u => u.remoteId === resultado.idUsuario) ||
      staffUsers.find(u => u.email.toLowerCase() === cleanEmail);

    const activeUser = matchedUser || {
      id: `usr-${resultado.idUsuario}`,
      fullName: resultado.nombreCompleto,
      username: cleanEmail,
      email: cleanEmail,
      phone: '',
      roleId: resultado.roleId as any,
      roleName: resultado.roleId,
      specialty: '',
      licenseNumber: '',
      assignedBranch: 'todas' as any,
      status: 'activo' as any,
      pinCode: '',
      createdAt: new Date().toISOString(),
      remoteId: resultado.idUsuario
    };

    // IMPORTANTE: NO se puede armar `staffAuthMeta` a mano con
    // totpEnabled/totpSetupRequired/totpMandatory fijos (p. ej. `false`) —
    // esos tres campos dependen del ROL del usuario (server/totp.ts::
    // MANDATORY_TOTP_ROLES) y la respuesta de /login y /verify-totp no los
    // trae. Si se inventaran aquí, un director_laboratorio o
    // administrador_ti que todavía no activó TOTP quedaría con
    // totpSetupRequired=false en el cliente (aunque el backend SÍ lo exige,
    // ver server/routes/index.ts) hasta el próximo refresh de página —
    // viviría bloqueado con 403 TOTP_SETUP_REQUIRED en cada acción real sin
    // que la app lo redirija nunca a la pantalla de enrolamiento
    // (ForcedTotpEnrollmentView). Por eso se pide el estado autoritativo a
    // GET /api/auth/whoami (mismo endpoint/contrato que ya usa el efecto de
    // montaje en ClinicContext.tsx) antes de dar el login por completado.
    const verificacion = await verifyStaffSession(resultado.token);

    // Si el servidor no confirma la sesión recién emitida NO se entra al
    // sistema (antes se ignoraba este caso): se limpia el token y se avisa.
    if (verificacion.ok === false) {
      try { localStorage.removeItem(STAFF_SESSION_TOKEN_STORAGE_KEY); } catch { /* ignore */ }
      setPassword('');
      setTotpCode('');
      setLoginTicket(null);
      setError(
        verificacion.reason === 'network'
          ? 'No se pudo confirmar tu sesión con el servidor. Revisa tu conexión e inténtalo de nuevo.'
          : 'El servidor no aceptó la sesión. Inicia sesión de nuevo.'
      );
      return;
    }

    setCurrentStaffUser(activeUser);
    setStaffAuthMeta(
      verificacion.ok
        ? {
            mustChangePassword: verificacion.data.mustChangePassword,
            totpEnabled: verificacion.data.totpEnabled,
            totpSetupRequired: verificacion.data.totpSetupRequired,
            totpMandatory: verificacion.data.totpMandatory
          }
        : {
            // Respaldo improbable (whoami falló justo después de un login
            // exitoso): al menos se respeta mustChangePassword, que sí vino
            // en la respuesta de /login o /verify-totp. totpSetupRequired
            // quedaría sin reflejar hasta el próximo refresh, pero el
            // backend lo sigue exigiendo de todas formas.
            mustChangePassword: resultado.mustChangePassword,
            totpEnabled: false,
            totpSetupRequired: false,
            totpMandatory: false
          }
    );

    logAuditEvent({
      userId: activeUser.id,
      userName: activeUser.fullName,
      userRole: activeUser.roleName,
      action: 'Inicio de Sesión en Terminal LIS',
      module: 'autenticacion',
      severity: 'info',
      details: `Acceso autorizado vía autenticación propia (${cleanEmail}).`
    });

    // CAUSA RAÍZ del "regresa a la contraseña": aquí faltaba marcar la sesión
    // como autenticada. Sin esto `isStaffAuthenticated` seguía en false, App
    // seguía mostrando este mismo formulario (ya con la contraseña y el
    // código vaciados) y solo un refresco de la página -que relee el token
    // guardado- dejaba entrar.
    setIsStaffAuthenticated(true);
    setRecentAccounts(rememberAccount({ email: cleanEmail, fullName: activeUser.fullName, roleName: activeUser.roleName }));
    setRole('personal');
    showNotification(`Bienvenido al Sistema LIS, ${activeUser.fullName}`, 'success');
    setPassword('');
    setTotpCode('');
    setLoginTicket(null);

    if (onSuccess) {
      onSuccess();
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Ingresa tu correo institucional y tu contraseña.');
      return;
    }

    setIsLoading(true);
    const resultado = await loginStaff(cleanEmail, password);
    setIsLoading(false);

    if (resultado.ok === true) {
      if (resultado.requiresTotp === true) {
        // Paso 2: pedir el código de la app autenticadora antes de emitir la sesión real.
        setLoginTicket(resultado.loginTicket);
        return;
      }
      await finalizarLogin(resultado);
      return;
    }
    setError(resultado.message);
  };

  const handleVerifyTotp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!loginTicket) {
      setError('La sesión de verificación expiró. Inicia sesión de nuevo.');
      return;
    }
    if (!/^\d{6}$/.test(totpCode.trim())) {
      setError('Ingresa el código de 6 dígitos de tu app autenticadora.');
      return;
    }

    setIsLoading(true);
    const resultado = await verifyTotp(loginTicket, totpCode.trim());
    setIsLoading(false);

    if (resultado.ok === true) {
      if (resultado.requiresTotp === true) {
        // No debería ocurrir (verify-totp nunca vuelve a pedir TOTP), pero se
        // cubre explícitamente en vez de asumir el shape de la respuesta.
        setError('No se pudo completar la verificación. Inicia sesión de nuevo.');
        setLoginTicket(null);
        return;
      }
      await finalizarLogin(resultado);
      return;
    }
    setError(resultado.message);
  };

  const handleCancelTotp = () => {
    setLoginTicket(null);
    setTotpCode('');
    setError(null);
  };

  const handleBack = () => {
    if (onBackToPatients) {
      onBackToPatients();
    } else {
      setRole('paciente');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden">
      
      {/* 1. TOP GREEN INSTITUTIONAL ANNOUNCEMENT BAR */}
      <div className="bg-[#007065] text-white text-[11px] sm:text-xs px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs z-20">
        <div className="flex items-center gap-2 font-medium tracking-tight truncate">
          <span className="text-base leading-none">🧪</span>
          <span className="font-semibold text-white/95 truncate">
            Sistema Digital de Resultados de Laboratorio Clínico — Uso Interno
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-teal-100 font-normal ml-auto">
          <div className="flex items-center gap-1.5 bg-teal-800/60 px-2 py-0.5 rounded-full border border-teal-400/30 text-white font-semibold">
            <span className="text-xs">☁️</span>
            <span>Sincronizado</span>
          </div>

          <span className="font-bold text-white tracking-wider">
            56125563
          </span>

          <span className="hidden md:inline text-teal-200/70">•</span>
          
          <span className="hidden lg:inline text-teal-100/90">
            Lunes a Viernes: 7:00 a 16:00 · Sábado: 7:00 a 15:00 · Domingo: 7:00 a 11:00
          </span>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR (Dark Navy / Black) */}
      <header className="bg-[#0b1329] border-b border-slate-800 text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg z-20">
        <div className="flex items-center gap-3.5">
          {/* Official circular VACLINIC logo badge */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-cyan-500 via-teal-600 to-slate-900 flex items-center justify-center text-white font-black shadow-md border-2 border-cyan-400/60 flex-shrink-0 relative overflow-hidden">
            <span className="text-xs font-black tracking-tighter text-cyan-100">VC</span>
            <div className="absolute inset-0 border border-white/20 rounded-full" />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-wide leading-none">
              VACLINIC
            </h1>
            <p className="text-xs text-slate-300 font-normal mt-0.5 tracking-tight">
              Precisión que diagnostica, confianza que cuida
            </p>
          </div>
        </div>

        {/* Return to Patient Portal Button */}
        <button
          id="btn-volver-portal-pacientes"
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/90 text-xs sm:text-sm font-semibold transition-all duration-200 shadow-xs cursor-pointer active:scale-95"
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          <span>Volver a Portal Pacientes</span>
        </button>
      </header>

      {/* 3. MAIN LOGIN VIEWPORT AREA */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden bg-radial from-slate-100 via-slate-200/80 to-slate-300/60">
        
        {/* Fondo de pantalla elegido por el laboratorio (Ajustes → Portada del acceso) */}
        <ImagenPortada
          clave="fondo_pagina"
          imagenes={imagenesPortada}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          alternativa={null}
        />
        {imagenesPortada.fondo_pagina && <div className="absolute inset-0 bg-slate-100/70 pointer-events-none" />}

        {/* Soft Background High-Tech Lab Texture */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#007065 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient background glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Center Container: Side-by-Side (Poster Left + Login Card Right) */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 animate-fade-in">
          
          {/* LEFT SIDE: VACLINIC Official Clinical Graphic Poster */}
          <div className="w-full md:w-1/2 flex justify-center order-2 md:order-1">
            <PortadaLogin imagenes={imagenesPortada} />
          </div>

          {/* RIGHT SIDE: Acceso a Personal VACLINIC Card */}
          <div className="w-full md:w-1/2 max-w-md order-1 md:order-2">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-9 border border-slate-200/80 relative overflow-hidden">
              
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-[#007065]" />

              {/* Padlock Icon in Dark Rounded Square */}
              <div className="flex justify-center mt-1">
                <ImagenPortada
                  clave="escudo"
                  imagenes={imagenesPortada}
                  alt="Escudo de acceso de VACLINIC"
                  className="h-16 w-16 object-contain"
                  alternativa={
                    <div className="w-14 h-14 rounded-2xl bg-[#0a1924] flex items-center justify-center text-teal-400 shadow-lg border border-teal-500/30">
                      <Lock className="w-7 h-7 stroke-[2.2] text-teal-400" />
                    </div>
                  }
                />
              </div>

              {/* Header Titles */}
              <div className="text-center mt-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Acceso a Personal VACLINIC
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Módulo restringido para el personal administrador de VACLINIC.
                </p>
              </div>

              {modoRecuperacion ? (
                <PasswordRecovery onVolver={() => setModoRecuperacion(false)} />
              ) : !loginTicket ? (
              /* Login Form — paso 1: correo + contraseña (POST /api/auth/login) */
              <form onSubmit={handleLogin} className="mt-6 space-y-4">

                {/* Field: Correo institucional */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Correo institucional
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                        setShowAccountList(true);
                      }}
                      onFocus={() => setShowAccountList(true)}
                      onBlur={() => setTimeout(() => setShowAccountList(false), 150)}
                      placeholder="nombre.apellido@vaclinic.com"
                      required
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 bg-[#eef2fa] hover:bg-[#e6ecf8] focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                    />

                    {/* Cuentas usadas antes en este equipo (solo correo/nombre, nunca contraseñas) */}
                    {showAccountList && filterAccounts(recentAccounts, email).length > 0 && (
                      <div
                        id="lista-cuentas-recientes"
                        className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                      >
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                          Cuentas usadas en este equipo
                        </div>
                        {filterAccounts(recentAccounts, email).map((c) => (
                          <div key={c.email} className="flex items-center hover:bg-teal-50">
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setEmail(c.email);
                                setError(null);
                                setShowAccountList(false);
                                document.getElementById('password')?.focus();
                              }}
                              className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer"
                            >
                              <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center flex-shrink-0">
                                {c.fullName.trim().charAt(0).toUpperCase() || '?'}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800 truncate">{c.fullName}</span>
                                <span className="block text-[11px] text-slate-500 truncate">{c.email}{c.roleName ? ` · ${c.roleName}` : ''}</span>
                              </span>
                            </button>
                            <button
                              type="button"
                              title="Quitar de la lista de este equipo"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setRecentAccounts(forgetAccount(c.email))}
                              className="px-3 py-2 text-slate-300 hover:text-rose-600 text-sm cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Field: Contraseña */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 bg-[#eef2fa] hover:bg-[#e6ecf8] focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  id="btn-ingresar-al-sistema"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 px-4 bg-[#007065] hover:bg-[#005c53] active:bg-[#004740] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validando credenciales...</span>
                    </>
                  ) : (
                    <span>Ingresar al Sistema</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setModoRecuperacion(true)}
                  className="w-full text-center text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </form>
              ) : (
              /* Paso 2 (solo cuentas con TOTP activado): código de 6 dígitos (POST /api/auth/verify-totp) */
              <form onSubmit={handleVerifyTotp} className="mt-6 space-y-4">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-600" />
                  <span className="font-medium">
                    Esta cuenta tiene verificación en dos pasos activada. Ingresa el código de 6 dígitos de tu app autenticadora.
                  </span>
                </div>

                <div>
                  <label htmlFor="totp-code" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Código de verificación
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="totp-code"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                      value={totpCode}
                      onChange={(e) => {
                        setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setError(null);
                      }}
                      placeholder="000000"
                      className="w-full pl-10 pr-4 py-3 bg-[#eef2fa] hover:bg-[#e6ecf8] focus:bg-white border border-slate-200 rounded-xl text-base font-bold tracking-[0.3em] text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all font-mono"
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
                  id="btn-verificar-totp"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 px-4 bg-[#007065] hover:bg-[#005c53] active:bg-[#004740] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verificando código...</span>
                    </>
                  ) : (
                    <span>Verificar e ingresar</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelTotp}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-700 py-1 cursor-pointer"
                >
                  Volver a ingresar correo y contraseña
                </button>
              </form>
              )}

              {/* Aviso honesto: ya no hay credenciales de demostración visibles */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5 text-left">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Cada colaborador ingresa con su propia cuenta de personal VACLINIC.
                    Si no tienes credenciales, solicítalas al administrador del sistema —
                    no existen usuarios ni contraseñas de prueba en esta pantalla.
                  </span>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-3 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          VACLINIC — Laboratorio Clínico Automatizado
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          "Precisión que diagnostica, confianza que cuida" • 📍 Entrada de Pineda Oratorio Santa Rosa km 79.5
        </p>
      </footer>

    </div>
  );
};
