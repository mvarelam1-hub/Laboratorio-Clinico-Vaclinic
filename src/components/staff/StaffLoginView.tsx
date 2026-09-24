import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useClinic } from '../../context/ClinicContext';
import { VaclinicPosterGraphic } from '../common/VaclinicPosterGraphic';
import { getFirebaseAuth } from '../../services/firebaseConfig';
import { verifyStaffSession } from '../../services/staffAuthService';
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
 *
 * AHORA: se autentica contra Firebase Authentication con correo y
 * contraseña reales, y el resultado se vuelve a verificar contra el
 * backend (`GET /api/auth/whoami`, ver server/auth-firebase.ts) antes de
 * considerar la sesión válida — el frontend nunca decide esto por sí solo.
 */
export const StaffLoginView: React.FC<StaffLoginViewProps> = ({
  onSuccess,
  onBackToPatients
}) => {
  const {
    setRole,
    staffUsers,
    setCurrentStaffUser,
    logAuditEvent,
    showNotification
  } = useClinic();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mapFirebaseError = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'El correo ingresado no tiene un formato válido.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Correo o contraseña incorrectos.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentar.';
      case 'auth/user-disabled':
        return 'Esta cuenta fue deshabilitada. Contacta al administrador de VACLINIC.';
      case 'auth/network-request-failed':
        return 'No hay conexión con Firebase Authentication. Verifica tu red.';
      default:
        return `No se pudo iniciar sesión (${code}).`;
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
    const auth = getFirebaseAuth();

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const idToken = await credential.user.getIdToken();

      // El backend, no Firebase por sí solo, decide si esta cuenta puede
      // entrar al LIS (debe existir y estar activa en la tabla `usuario`).
      const verification = await verifyStaffSession(idToken);

      if (verification.ok === false) {
        await signOut(auth).catch(() => undefined);
        setError(verification.message);
        setIsLoading(false);
        return;
      }

      // Emparejar con el perfil local enriquecido (nombre, foto, licencia,
      // etc.) por UID de Firebase si ya se vinculó, o por correo como
      // respaldo mientras se completa esa vinculación manual en Firebase
      // Console. El acceso real ya fue otorgado por el backend arriba;
      // esto solo decide qué datos de perfil se muestran en pantalla.
      const uid = credential.user.uid;
      const matchedUser =
        staffUsers.find(u => u.firebaseUid && u.firebaseUid === uid) ||
        staffUsers.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());

      const activeUser = matchedUser || {
        id: `fb-${verification.data.idUsuario}`,
        fullName: verification.data.nombreCompleto,
        username: cleanEmail,
        email: cleanEmail,
        phone: '',
        roleId: verification.data.roleId as any,
        roleName: verification.data.roleId,
        specialty: '',
        licenseNumber: '',
        assignedBranch: 'todas' as any,
        status: 'activo' as any,
        pinCode: '',
        createdAt: new Date().toISOString(),
        firebaseUid: uid
      };

      setCurrentStaffUser(activeUser);

      logAuditEvent({
        userId: activeUser.id,
        userName: activeUser.fullName,
        userRole: activeUser.roleName,
        action: 'Inicio de Sesión en Terminal LIS',
        module: 'autenticacion',
        details: `Acceso autorizado vía Firebase Authentication (${cleanEmail}), verificado contra el backend.`
      });

      setRole('personal');
      showNotification(`Bienvenido al Sistema LIS, ${activeUser.fullName}`, 'success');
      setPassword('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const code = err?.code || 'auth/unknown';
      setError(mapFirebaseError(code));
      setIsLoading(false);
    }
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
            <VaclinicPosterGraphic size="md" className="shadow-2xl hover:shadow-cyan-900/20 transition-all duration-300" />
          </div>

          {/* RIGHT SIDE: Acceso a Personal VACLINIC Card */}
          <div className="w-full md:w-1/2 max-w-md order-1 md:order-2">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-9 border border-slate-200/80 relative overflow-hidden">
              
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-[#007065]" />

              {/* Padlock Icon in Dark Rounded Square */}
              <div className="flex justify-center mt-1">
                <div className="w-14 h-14 rounded-2xl bg-[#0a1924] flex items-center justify-center text-teal-400 shadow-lg border border-teal-500/30">
                  <Lock className="w-7 h-7 stroke-[2.2] text-teal-400" />
                </div>
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

              {/* Login Form */}
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                
                {/* Field: Correo institucional (Firebase Authentication) */}
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
                      }}
                      placeholder="nombre.apellido@vaclinic.com"
                      required
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 bg-[#eef2fa] hover:bg-[#e6ecf8] focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                    />
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
              </form>

              {/* Aviso honesto: ya no hay credenciales de demostración visibles */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5 text-left">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Cada colaborador ingresa con su propia cuenta de Firebase Authentication.
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
