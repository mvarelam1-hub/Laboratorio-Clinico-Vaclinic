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
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  ScrollText
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

  const claseCampo =
    'w-full py-3 bg-cloud hover:bg-[#ebebeb] focus:bg-white border border-frost rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-canopy focus:border-transparent transition-colors';

  return (
    <div className="tema-vaclinic min-h-screen bg-lavender-mist flex flex-col select-none relative overflow-x-hidden">

      {/* 1. BARRA SUPERIOR BLANCA */}
      <header className="bg-white px-4 sm:px-8 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-canopy flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold tracking-tight text-leaf">VC</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-canopy leading-none tracking-tight">VACLINIC</h1>
            <p className="hidden sm:block text-xs text-graphite mt-1">Precisión que diagnostica, confianza que cuida</p>
          </div>
        </div>

        <button
          id="btn-volver-portal-pacientes"
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-3 sm:px-5 py-2 rounded-full bg-white hover:bg-cloud text-canopy border border-black text-sm font-medium transition-colors cursor-pointer flex-shrink-0"
        >
          <User className="w-4 h-4" />
          <span className="whitespace-nowrap"><span className="hidden sm:inline">Volver a </span>Portal Pacientes</span>
        </button>
      </header>

      {/* 2. HÉROE VERDE BOSQUE */}
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-canopy">
          {/* Fondo de pantalla elegido por el laboratorio (Ajustes → Portada del acceso) */}
          <ImagenPortada
            clave="fondo_pagina"
            imagenes={imagenesPortada}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            alternativa={null}
          />
          {imagenesPortada.fondo_pagina && <div className="absolute inset-0 -z-10 bg-canopy/85 pointer-events-none" />}

          <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-14 sm:pb-20 animate-fade-in">
            <p className="inline-block rounded-full bg-mint-wash px-3.5 py-1 text-xs font-semibold text-canopy">
              Uso interno del laboratorio
            </p>
            <h2 className="titulo-display mt-5 text-5xl sm:text-7xl text-white">
              Acceso a <span className="text-leaf">Personal</span>
            </h2>
            <p className="mt-4 max-w-xl text-lg text-mint-wash">
              Sistema digital de resultados de laboratorio clínico. Ingresa con tu cuenta para trabajar con órdenes, muestras y resultados.
            </p>

            <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
              {/* Portada con las imágenes elegidas por el laboratorio */}
              <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
                <PortadaLogin imagenes={imagenesPortada} />
              </div>

              {/* Tarjeta de acceso */}
              <div className="order-1 lg:order-2 w-full max-w-md lg:max-w-none lg:justify-self-end mx-auto lg:mx-0">
                <div className="bg-white rounded-3xl p-6 sm:p-9 lg:max-w-md">
                  <div className="flex justify-center">
                    <ImagenPortada
                      clave="escudo"
                      imagenes={imagenesPortada}
                      alt="Escudo de acceso de VACLINIC"
                      className="h-16 w-16 object-contain"
                      alternativa={
                        <div className="w-14 h-14 rounded-full bg-mint-wash flex items-center justify-center text-canopy">
                          <Lock className="w-7 h-7" />
                        </div>
                      }
                    />
                  </div>

                  <div className="text-center mt-4">
                    <h3 className="text-2xl font-bold text-canopy tracking-tight">Ingresa a tu cuenta</h3>
                    <p className="text-sm text-graphite mt-1">
                      Módulo restringido para el personal de VACLINIC.
                    </p>
                  </div>

                  {modoRecuperacion ? (
                    <PasswordRecovery onVolver={() => setModoRecuperacion(false)} />
                  ) : !loginTicket ? (
                  /* Paso 1: correo + contraseña (POST /api/auth/login) */
                  <form onSubmit={handleLogin} className="mt-6 space-y-4">

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-1.5">
                        Correo institucional
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="w-4 h-4 text-graphite" />
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
                          className={`${claseCampo} pl-11 pr-4`}
                        />

                        {/* Cuentas usadas antes en este equipo (solo correo/nombre, nunca contraseñas) */}
                        {showAccountList && filterAccounts(recentAccounts, email).length > 0 && (
                          <div
                            id="lista-cuentas-recientes"
                            className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-frost rounded-2xl overflow-hidden"
                          >
                            <div className="px-4 py-1.5 text-xs font-semibold text-graphite bg-cloud border-b border-frost">
                              Cuentas usadas en este equipo
                            </div>
                            {filterAccounts(recentAccounts, email).map((c) => (
                              <div key={c.email} className="flex items-center hover:bg-sage-wash">
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setEmail(c.email);
                                    setError(null);
                                    setShowAccountList(false);
                                    document.getElementById('password')?.focus();
                                  }}
                                  className="flex-1 min-w-0 flex items-center gap-2.5 px-4 py-2 text-left cursor-pointer"
                                >
                                  <span className="w-8 h-8 rounded-full bg-mint-wash text-canopy text-sm font-bold flex items-center justify-center flex-shrink-0">
                                    {c.fullName.trim().charAt(0).toUpperCase() || '?'}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-slate-900 truncate">{c.fullName}</span>
                                    <span className="block text-xs text-graphite truncate">{c.email}{c.roleName ? ` · ${c.roleName}` : ''}</span>
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  title="Quitar de la lista de este equipo"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => setRecentAccounts(forgetAccount(c.email))}
                                  className="px-4 py-2 text-slate-400 hover:text-rose-600 text-sm cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-1.5">
                        Contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <KeyRound className="w-4 h-4 text-graphite" />
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
                          className={`${claseCampo} pl-11 pr-12 tracking-wider font-mono`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-graphite hover:text-canopy cursor-pointer"
                          title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2 animate-shake">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                        <span className="font-medium">{error}</span>
                      </div>
                    )}

                    {/* Única acción principal: botón coral */}
                    <button
                      id="btn-ingresar-al-sistema"
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 px-6 bg-coral-pulse hover:bg-coral-hover active:bg-coral-pulse text-[#1a1a1a] font-semibold text-base rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          <span>Validando credenciales...</span>
                        </>
                      ) : (
                        <span>Ingresar al Sistema</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setModoRecuperacion(true)}
                      className="w-full text-center text-sm font-medium text-canopy hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </form>
                  ) : (
                  /* Paso 2 (solo cuentas con TOTP activado): código de 6 dígitos (POST /api/auth/verify-totp) */
                  <form onSubmit={handleVerifyTotp} className="mt-6 space-y-4">
                    <div className="p-3 rounded-2xl bg-mint-wash text-canopy text-sm flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">
                        Esta cuenta tiene verificación en dos pasos activada. Ingresa el código de 6 dígitos de tu app autenticadora.
                      </span>
                    </div>

                    <div>
                      <label htmlFor="totp-code" className="block text-sm font-semibold text-slate-900 mb-1.5">
                        Código de verificación
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <KeyRound className="w-4 h-4 text-graphite" />
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
                          className={`${claseCampo} pl-11 pr-4 text-base font-bold tracking-[0.3em] text-center font-mono`}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2 animate-shake">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                        <span className="font-medium">{error}</span>
                      </div>
                    )}

                    <button
                      id="btn-verificar-totp"
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 px-6 bg-coral-pulse hover:bg-coral-hover active:bg-coral-pulse text-[#1a1a1a] font-semibold text-base rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          <span>Verificando código...</span>
                        </>
                      ) : (
                        <span>Verificar e ingresar</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelTotp}
                      className="w-full text-sm font-medium text-graphite hover:text-canopy py-1 cursor-pointer"
                    >
                      Volver a ingresar correo y contraseña
                    </button>
                  </form>
                  )}

                  <p className="mt-6 pt-4 border-t border-frost text-xs text-graphite leading-relaxed">
                    Si no tienes credenciales, solicítalas al administrador del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TARJETAS PASTEL SOBRE EL LIENZO LAVANDA */}
        <section aria-label="Cómo cuidamos el acceso" className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <h2 className="titulo-display text-3xl sm:text-5xl text-canopy">Un acceso cuidado, para cada persona del equipo</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            <li className="rounded-3xl bg-mint-wash p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-canopy"><UserCheck className="h-5 w-5" /></span>
              <h3 className="mt-4 text-2xl font-bold text-canopy tracking-tight">Cuenta personal</h3>
              <p className="mt-2 text-base text-graphite">Cada colaborador ingresa con su propia cuenta. No existen usuarios ni contraseñas de prueba.</p>
            </li>
            <li className="rounded-3xl bg-sky-wash p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-deep-teal"><ShieldCheck className="h-5 w-5" /></span>
              <h3 className="mt-4 text-2xl font-bold text-deep-teal tracking-tight">Verificación en dos pasos</h3>
              <p className="mt-2 text-base text-graphite">Es obligatoria para el director del laboratorio y el administrador de sistemas.</p>
            </li>
            <li className="rounded-3xl bg-peach-wash p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-canopy"><ScrollText className="h-5 w-5" /></span>
              <h3 className="mt-4 text-2xl font-bold text-canopy tracking-tight">Todo queda registrado</h3>
              <p className="mt-2 text-base text-graphite">Cada inicio de sesión se guarda en la bitácora de auditoría del sistema.</p>
            </li>
          </ul>
        </section>
      </main>

      {/* 4. PIE */}
      <footer className="bg-cloud py-5 px-4 text-center text-sm text-graphite">
        <p className="font-semibold text-canopy">VACLINIC — Laboratorio Clínico Automatizado</p>
        <p className="text-xs mt-1">
          Lunes a Viernes: 7:00 a 16:00 · Sábado: 7:00 a 15:00 · Domingo: 7:00 a 11:00 · Tel. 56125563 · Entrada de Pineda, Oratorio, Santa Rosa km 79.5
        </p>
      </footer>

    </div>
  );
};
