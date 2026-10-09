import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { estadoInactividad, segundosRestantes } from '../../utils/inactividad';

/**
 * Cierra la sesión de PERSONAL tras 30 minutos sin actividad (ratón, teclado,
 * toque o desplazamiento), con un aviso de 1 minuto antes. Protege los datos
 * de pacientes cuando alguien deja la computadora abierta.
 *
 * Al expirar llama a `logoutStaff`, que borra el token local y revoca la
 * sesión también en el servidor. No hace nada fuera de la sesión de personal.
 */
const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;

export const InactivityGuard: React.FC = () => {
  const { role, isStaffAuthenticated, logoutStaff } = useClinic();
  const activa = role === 'personal' && isStaffAuthenticated;
  const ultimaActividad = useRef<number>(Date.now());
  const [segundos, setSegundos] = useState<number | null>(null);

  useEffect(() => {
    if (!activa) {
      setSegundos(null);
      return;
    }
    ultimaActividad.current = Date.now();

    const marcar = () => {
      ultimaActividad.current = Date.now();
    };
    const revisar = () => {
      const ahora = Date.now();
      const estado = estadoInactividad(ultimaActividad.current, ahora);
      if (estado === 'expirado') {
        setSegundos(null);
        logoutStaff();
      } else if (estado === 'aviso') {
        setSegundos(segundosRestantes(ultimaActividad.current, ahora));
      } else {
        setSegundos(null);
      }
    };

    EVENTOS_ACTIVIDAD.forEach((e) => window.addEventListener(e, marcar, { passive: true }));
    // Al volver a la pestaña tras mucho rato, se revisa de inmediato.
    document.addEventListener('visibilitychange', revisar);
    const intervalo = window.setInterval(revisar, 1000);

    return () => {
      EVENTOS_ACTIVIDAD.forEach((e) => window.removeEventListener(e, marcar));
      document.removeEventListener('visibilitychange', revisar);
      window.clearInterval(intervalo);
    };
    // logoutStaff cambia en cada render del contexto; se usa solo al expirar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa]);

  if (!activa || segundos === null) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center"
        role="alertdialog"
        aria-modal="true"
        aria-label="Sesión por cerrarse"
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">Tu sesión se cerrará por inactividad</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Para proteger los datos de los pacientes, se cerrará en <strong>{segundos} s</strong> si no hay actividad.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            ultimaActividad.current = Date.now();
            setSegundos(null);
          }}
          className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
        >
          Seguir conectado
        </button>
      </div>
    </div>
  );
};
