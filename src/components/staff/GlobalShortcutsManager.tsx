import React, { useEffect, useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { QuickPatientSearchModal } from './QuickPatientSearchModal';
import { KeyboardShortcutsHelpModal } from './KeyboardShortcutsHelpModal';
import { playNotificationChime } from '../../utils/audioChime';

export const GlobalShortcutsManager: React.FC = () => {
  const { 
    role, 
    isStaffAuthenticated, 
    setStaffActiveTab, 
    showNotification 
  } = useClinic();

  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  useEffect(() => {
    // Only listen for staff shortcuts when in personal role and authenticated
    if (role !== 'personal' || !isStaffAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is currently typing inside an input/textarea/select
      const target = e.target as HTMLElement;
      const isInputFocused = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.isContentEditable
      );

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // 1. Ctrl + B / ⌘ + B : Búsqueda Rápida de Pacientes
      if (modifier && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        e.stopPropagation();
        setIsPatientSearchOpen(prev => !prev);
        return;
      }

      // 2. Ctrl + N / ⌘ + N : Nueva Orden de Laboratorio
      if (modifier && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        e.stopPropagation();
        playNotificationChime('normal');
        setStaffActiveTab('nueva_orden');
        showNotification('Acceso rápido: Nueva Orden de Laboratorio (Ctrl+N)', 'info');

        // Focus patient name input after transition
        setTimeout(() => {
          const inputEl = document.getElementById('input-patient-fullname') as HTMLInputElement | null;
          if (inputEl) {
            inputEl.focus();
            inputEl.select();
          }
        }, 150);
        return;
      }

      // 3. Ctrl + F / ⌘ + F : Enfoque en el buscador activo del módulo actual
      if (modifier && (e.key === 'f' || e.key === 'F')) {
        // Look for the most relevant active search input on current screen
        const searchInput = (
          document.getElementById('input-search-orders') ||
          document.getElementById('input-search-tests') ||
          document.getElementById('input-search-patients') ||
          document.querySelector('input[type="search"]') ||
          document.querySelector('input[placeholder*="Buscar"]')
        ) as HTMLInputElement | null;

        if (searchInput) {
          e.preventDefault();
          e.stopPropagation();
          searchInput.focus();
          searchInput.select();
          showNotification('Foco en búsqueda rápida (Ctrl+F)', 'info');
          return;
        }
      }

      // 4. Ctrl + S / ⌘ + S : Registrar / Guardar Orden en pantalla de Nueva Orden
      if (modifier && (e.key === 's' || e.key === 'S')) {
        const submitBtn = document.getElementById('btn-submit-order') as HTMLButtonElement | null;
        if (submitBtn) {
          e.preventDefault();
          e.stopPropagation();
          submitBtn.click();
          return;
        }
      }

      // 5. Ctrl + K / ⌘ + K : Acceso a Muestras / Recepción y Rotulado de Tubos
      if (modifier && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        setStaffActiveTab('muestras');
        showNotification('Acceso rápido: Recepción & Tubos (Ctrl+K)', 'info');
        return;
      }

      // 6. Shift + ? / Help : Ver todos los atajos
      if ((e.key === '?' && !isInputFocused) || (e.shiftKey && e.key === '?' && !isInputFocused)) {
        e.preventDefault();
        setIsHelpModalOpen(true);
        return;
      }

      // 7. Alt + 1, Alt + 2, Alt + 3, Alt + 4 : Navegación entre pestañas de recepción
      if (e.altKey && !modifier) {
        if (e.key === '1') {
          e.preventDefault();
          setStaffActiveTab('nueva_orden');
          showNotification('Módulo: Nueva Orden (Alt+1)', 'info');
          setTimeout(() => {
            const inputEl = document.getElementById('input-patient-fullname') as HTMLInputElement | null;
            if (inputEl) inputEl.focus();
          }, 150);
        } else if (e.key === '2') {
          e.preventDefault();
          setStaffActiveTab('ordenes');
          showNotification('Módulo: Lista de Órdenes (Alt+2)', 'info');
        } else if (e.key === '3') {
          e.preventDefault();
          setStaffActiveTab('pacientes');
          showNotification('Módulo: Gestión de Pacientes (Alt+3)', 'info');
        } else if (e.key === '4') {
          e.preventDefault();
          setStaffActiveTab('muestras');
          showNotification('Módulo: Recepción & Tubos (Alt+4)', 'info');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [role, isStaffAuthenticated, setStaffActiveTab, showNotification]);

  return (
    <>
      <QuickPatientSearchModal
        isOpen={isPatientSearchOpen}
        onClose={() => setIsPatientSearchOpen(false)}
      />

      <KeyboardShortcutsHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
};
