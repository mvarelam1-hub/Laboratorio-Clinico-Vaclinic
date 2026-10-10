import React, { useState } from 'react';
import { Mail, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { solicitarRecuperacion, restablecerConToken } from '../../services/staffAuthService';

/**
 * Recuperación de contraseña del personal (cuerpo de la tarjeta del login).
 *
 *  - Sin token en la URL: pide el correo y solicita el enlace
 *    (POST /api/auth/forgot-password). El enlace llega por correo y vence a
 *    los 5 minutos.
 *  - Con `?reset=<token>` en la URL (el enlace del correo): pide la nueva
 *    contraseña (POST /api/auth/reset-password). El token se pasa a la
 *    memoria del componente y se quita de la barra de direcciones al
 *    instante, para que no quede en el historial ni se filtre por Referer.
 *
 * Recuperar la contraseña no salta el segundo factor: al volver a entrar se
 * sigue pidiendo el código de la app autenticadora.
 */
interface PasswordRecoveryProps {
  onVolver: () => void;
}

// El token se conserva en memoria del módulo: así sobrevive a que React ejecute
// el inicializador dos veces (modo estricto) aunque la URL ya se haya limpiado.
let tokenEnMemoria: string | null = null;

function tomarTokenDeLaUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const token = new URLSearchParams(window.location.search).get('reset');
  if (token) {
    tokenEnMemoria = token;
    window.history.replaceState({}, '', window.location.pathname);
  }
  return tokenEnMemoria;
}

const CLASE_INPUT =
  'w-full pl-10 pr-11 py-3 bg-[#eef2fa] hover:bg-[#e6ecf8] focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all';
const CLASE_BOTON =
  'w-full py-3.5 px-4 bg-[#007065] hover:bg-[#005c53] active:bg-[#004740] text-white font-bold text-sm rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed';

export const PasswordRecovery: React.FC<PasswordRecoveryProps> = ({ onVolver }) => {
  const [token] = useState<string | null>(() => tomarTokenDeLaUrl());
  const [correo, setCorreo] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const pedirEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const limpio = correo.trim();
    if (!limpio) {
      setError('Ingresa tu correo institucional.');
      return;
    }
    setCargando(true);
    const r = await solicitarRecuperacion(limpio);
    setCargando(false);
    if (r.ok === true) setAviso(r.mensaje);
    else setError(r.message);
  };

  const guardarNueva = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!token) return;
    setCargando(true);
    const r = await restablecerConToken(token, nueva);
    setCargando(false);
    if (r.ok === true) {
      setNueva('');
      setConfirmar('');
      setListo(true);
    } else {
      setError(r.message);
    }
  };

  const bloqueError = error && (
    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
      <span className="font-medium">{error}</span>
    </div>
  );

  const botonVolver = (
    <button
      type="button"
      onClick={onVolver}
      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Volver al inicio de sesión
    </button>
  );

  if (listo) {
    return (
      <div className="mt-6 space-y-4">
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
          <span className="font-medium">
            Contraseña actualizada. Se cerraron las sesiones abiertas de tu cuenta. Inicia sesión con la nueva contraseña.
          </span>
        </div>
        <button type="button" onClick={onVolver} className={CLASE_BOTON}>
          Ir al inicio de sesión
        </button>
      </div>
    );
  }

  if (token) {
    return (
      <form onSubmit={guardarNueva} className="mt-6 space-y-4">
        <p className="text-xs text-slate-600 font-medium">Crea tu nueva contraseña (mínimo 8 caracteres).</p>
        <div>
          <label htmlFor="reset-nueva" className="block text-xs font-bold text-slate-700 mb-1.5">Nueva contraseña</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              id="reset-nueva"
              type={verClave ? 'text' : 'password'}
              value={nueva}
              onChange={(e) => { setNueva(e.target.value); setError(null); }}
              autoComplete="new-password"
              required
              className={CLASE_INPUT}
            />
            <button
              type="button"
              onClick={() => setVerClave(!verClave)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title={verClave ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {verClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="reset-confirmar" className="block text-xs font-bold text-slate-700 mb-1.5">Repite la contraseña</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              id="reset-confirmar"
              type={verClave ? 'text' : 'password'}
              value={confirmar}
              onChange={(e) => { setConfirmar(e.target.value); setError(null); }}
              autoComplete="new-password"
              required
              className={CLASE_INPUT}
            />
          </div>
        </div>
        {bloqueError}
        <button type="submit" disabled={cargando} className={CLASE_BOTON}>
          {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
        {botonVolver}
      </form>
    );
  }

  if (aviso) {
    return (
      <div className="mt-6 space-y-4">
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-600" />
          <span className="font-medium">{aviso}</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Si no te llega, revisa la carpeta de spam o pide a un administrador que restablezca tu contraseña desde Usuarios y roles.
        </p>
        {botonVolver}
      </div>
    );
  }

  return (
    <form onSubmit={pedirEnlace} className="mt-6 space-y-4">
      <p className="text-xs text-slate-600 font-medium">
        Escribe tu correo institucional y te enviaremos un enlace para crear una contraseña nueva. El enlace vence en 5 minutos.
      </p>
      <div>
        <label htmlFor="recuperar-correo" className="block text-xs font-bold text-slate-700 mb-1.5">Correo institucional</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="recuperar-correo"
            type="email"
            value={correo}
            onChange={(e) => { setCorreo(e.target.value); setError(null); }}
            autoComplete="username"
            required
            className={CLASE_INPUT}
          />
        </div>
      </div>
      {bloqueError}
      <button type="submit" disabled={cargando} className={CLASE_BOTON}>
        {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
      </button>
      {botonVolver}
    </form>
  );
};
