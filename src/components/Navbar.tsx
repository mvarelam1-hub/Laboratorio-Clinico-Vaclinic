import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { PatientNotificationCenter } from './patient/PatientNotificationCenter';
import { 
  UserCheck, 
  PlusCircle, 
  FlaskConical, 
  Lock, 
  LogOut, 
  Bell,
  Menu,
  Sparkles,
  MapPin,
  MessageSquare,
  Keyboard,
  Database
} from 'lucide-react';
import { KeyboardShortcutsHelpModal } from './staff/KeyboardShortcutsHelpModal';
import { ConnectionStatusIndicator, OfflineWarningBanner } from './common/ConnectionStatusIndicator';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { 
    role, 
    setRole, 
    staffActiveTab, 
    setStaffActiveTab, 
    currentPatient, 
    currentBranch,
    isMultiBranchEnabled,
    currentStaffUser,
    setActiveReportToEdit,
    logoutPatient,
    isStaffAuthenticated,
    setIsStaffAuthenticated,
    logoutStaff,
    showNotification,
    pushNotifications,
    unreadChatCount,
    isChatFloatingOpen,
    setIsChatFloatingOpen,
    setIsBackupModalOpen
  } = useClinic();

  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const unreadPushCount = pushNotifications.filter(n => !n.read && (!currentPatient || n.patientId === currentPatient.id || n.patientId === 'all')).length;

  const handleRequestStaffRole = () => {
    setRole('personal');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
      {/* Offline Alert Persistent Banner */}
      <OfflineWarningBanner />

      {/* Top VACLINIC Institutional Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-black tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            VACLINIC • LABORATORIO CLÍNICO
          </span>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="hidden md:inline text-cyan-200/90 text-[11px] italic font-medium">
            "Precisión que diagnostica, confianza que cuida"
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-cyan-950/80 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/40 text-[11px] font-bold">
            <span>📞 Tel / WhatsApp: 56125563</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 text-[11px] hidden lg:inline">
            📍 Entrada de Pineda Oratorio Santa Rosa km 79.5
          </span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 gap-4">
          
          {/* Left: Mobile Menu Toggle & Logo */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger button for mobile staff navigation */}
            {role === 'personal' && (
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                title="Abrir menú de navegación lateral"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Styled VACLINIC circular micro-emblem */}
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-600 via-teal-600 to-slate-900 flex items-center justify-center text-white shadow-md shadow-cyan-600/30 flex-shrink-0 font-black relative overflow-hidden border border-cyan-400/40">
              <span className="text-sm font-black tracking-tighter text-cyan-100">VC</span>
              <span className="absolute bottom-0.5 right-1 text-[7px] font-mono text-cyan-300">LAB</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                  VACLINIC
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-300 hidden xs:inline-block">
                  Laboratorio Clínico
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block truncate mt-0.5 font-medium">
                Hematología • Química Sanguínea • Uroanálisis • Inmunología • ISO 15189
              </p>
            </div>
          </div>

          {/* Center: Main Role Switcher (Personal de Laboratorio vs Vista Paciente) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              id="btn-vista-personal"
              onClick={handleRequestStaffRole}
              title={role === 'paciente' ? 'Requiere PIN de personal de laboratorio' : 'Panel de laboratorio LABVACLINIC'}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                role === 'personal'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 text-teal-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FlaskConical className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${role === 'personal' ? 'text-teal-600' : 'text-slate-500'}`} />
              <span className="hidden xs:inline">Personal</span>
              <span>LABVACLINIC</span>
              {role === 'paciente' ? (
                <span className="flex items-center gap-1 text-[10px] bg-slate-200/80 text-slate-700 font-bold px-1.5 py-0.2 rounded">
                  <Lock className="w-2.5 h-2.5" />
                  PIN
                </span>
              ) : (
                <span className="hidden sm:inline-block text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                  Staff
                </span>
              )}
            </button>

            <button
              id="btn-vista-paciente"
              onClick={() => setRole('paciente')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                role === 'paciente'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 text-cyan-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <UserCheck className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${role === 'paciente' ? 'text-cyan-600' : 'text-slate-500'}`} />
              <span>Pacientes</span>
              {currentPatient && (
                <span className="hidden md:inline-block text-[10px] bg-cyan-100 text-cyan-800 font-bold px-1.5 py-0.2 rounded truncate max-w-[90px]">
                  {currentPatient.fullName.split(' ')[0]}
                </span>
              )}
            </button>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2">
            {/* Visual Connection Status Indicator & Offline Queue Trigger */}
            <ConnectionStatusIndicator />

            {/* Active Branch indicator (Desktop) */}
            {role === 'personal' && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer hover:bg-slate-100 transition-all"
                title={isMultiBranchEnabled ? `Sede Activa: ${currentBranch.name}` : "Operando en Modo Sede Única (Multi-sede desactivado por el momento)"}
                onClick={() => setStaffActiveTab('ajustes')}
              >
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-bold">
                  {isMultiBranchEnabled ? currentBranch.name : 'Sede Única: VACLINIC'}
                </span>
                {!isMultiBranchEnabled && (
                  <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.2 rounded border border-teal-200">
                    Única
                  </span>
                )}
              </div>
            )}

            {/* Notifications Bell Hub Button */}
            <button
              onClick={() => setShowNotificationCenter(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 border border-slate-200 transition-all cursor-pointer"
              title="Avisos y Notificaciones Push"
            >
              <Bell className="w-4 h-4" />
              {unreadPushCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white animate-pulse">
                  {unreadPushCount}
                </span>
              )}
            </button>

            {/* Internal Staff Chat Button */}
            {role === 'personal' && (
              <button
                id="btn-navbar-internal-chat"
                onClick={() => setIsChatFloatingOpen(!isChatFloatingOpen)}
                className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${
                  isChatFloatingOpen
                    ? 'bg-teal-50 text-teal-700 border-teal-300 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50 border-slate-200'
                }`}
                title="Chat Intercom (Escribir mensaje a Recepción, Analistas o Admón)"
              >
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white animate-pulse">
                      {unreadChatCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-xs font-bold">Chat</span>
              </button>
            )}

            {/* Global Keyboard Shortcuts Help Button */}
            {role === 'personal' && (
              <button
                id="btn-navbar-shortcuts-help"
                type="button"
                onClick={() => setShowShortcutsHelp(true)}
                className="flex items-center gap-1 text-slate-600 hover:text-teal-700 hover:bg-teal-50 p-2 rounded-xl border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
                title="Atajos de Teclado Globales (Ctrl+N, Ctrl+B, etc.)"
              >
                <Keyboard className="w-4 h-4 text-teal-600" />
                <span className="hidden 2xl:inline text-[11px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                  Ctrl+B / N
                </span>
              </button>
            )}

            {/* Quick Backup & Restore Hub Trigger */}
            {role === 'personal' && (
              <button
                id="btn-navbar-backup-hub"
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="flex items-center gap-1.5 text-slate-700 hover:text-teal-700 hover:bg-teal-50 px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Copia de Seguridad y Respaldo de Datos (.json)"
              >
                <Database className="w-4 h-4 text-teal-600" />
                <span className="hidden lg:inline text-xs font-bold">Respaldo</span>
              </button>
            )}

            {role === 'personal' ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nueva-redaccion"
                  onClick={() => {
                    setActiveReportToEdit(null);
                    setStaffActiveTab('redactor');
                  }}
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-teal-600/30 transition-all cursor-pointer"
                  title="Abrir Editor de Informes Clínicos y Analizador Ozelle"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Editor de Informes</span>
                </button>

                {/* Staff Lock / Logout Button */}
                <button
                  id="btn-lock-staff-terminal"
                  type="button"
                  onClick={logoutStaff}
                  title={`Sesión activa: ${currentStaffUser?.fullName || 'Staff'}. Clic para bloquear terminal LIS`}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 hover:text-rose-600" />
                  <span className="hidden xl:inline">Bloquear Terminal</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {currentPatient ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                        {currentPatient.fullName}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-700 font-semibold">
                        Código: {currentPatient.accessCode}
                      </span>
                    </div>
                    <button
                      onClick={logoutPatient}
                      title="Cerrar sesión de paciente"
                      className="flex items-center gap-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg border border-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden md:inline">Cerrar Sesión</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic hidden sm:inline">
                    Portal del Paciente
                  </span>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Push Notification Center Modal */}
      <PatientNotificationCenter 
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <KeyboardShortcutsHelpModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </header>
  );
};
