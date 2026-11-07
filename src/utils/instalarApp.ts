import { useEffect, useState } from 'react';

/**
 * Instalar VACLINIC como aplicación (PWA).
 *
 * El navegador avisa con el evento `beforeinstallprompt` una sola vez y muy
 * temprano, por eso este módulo se importa desde main.tsx: guarda el evento
 * y lo entrega después a los componentes que quieran ofrecer el botón
 * «Instalar aplicación». Si el navegador no permite instalar (o la app ya
 * está instalada), `puedeInstalar` es false y no se muestra nada.
 */
type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let evento: EventoInstalacion | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    evento = e as EventoInstalacion;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    evento = null;
    avisar();
  });
}

export function useInstalarApp(): { puedeInstalar: boolean; instalar: () => Promise<boolean> } {
  const [, forzar] = useState(0);
  useEffect(() => {
    const f = () => forzar((n) => n + 1);
    oyentes.add(f);
    return () => { oyentes.delete(f); };
  }, []);

  const instalar = async (): Promise<boolean> => {
    if (!evento) return false;
    const actual = evento;
    evento = null; // el navegador solo deja usar el evento una vez
    avisar();
    await actual.prompt();
    const { outcome } = await actual.userChoice;
    return outcome === 'accepted';
  };

  return { puedeInstalar: evento !== null, instalar };
}
