import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { PatientPortalNavTab } from './PatientSidebar';
import { WhatsAppCodeModal } from './WhatsAppCodeModal';
import { 
  Menu, 
  User, 
  Phone, 
  ExternalLink, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  Bell,
  Sparkles,
  FileText,
  FlaskConical,
  BookOpen,
  Microscope,
  MessageCircle
} from 'lucide-react';

interface PatientHeaderProps {
  activeTab: PatientPortalNavTab;
  onSelectTab: (tab: PatientPortalNavTab) => void;
  onToggleMobileMenu: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  activeTab,
  onSelectTab,
  onToggleMobileMenu
}) => {
  const { currentPatient, logoutPatient, pushNotifications } = useClinic();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const unreadCount = pushNotifications.filter(
    (n) => !n.read && (!currentPatient || n.patientId === currentPatient.id || n.patientId === 'all')
  ).length;

  const topNavLinks: Array<{ id: PatientPortalNavTab; label: string }> = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'resultados', label: 'Mis resultados' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'preparacion', label: 'Preparación' }
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name[0] || 'P').toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-30">
      {/* Top subtle branding banner matching reference: VACLINIC | Portal del Paciente */}
      <div className="bg-slate-50 border-b border-slate-200/60 px-4 sm:px-6 py-1 text-xs text-slate-500 hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-[#0f2237] tracking-tight">VACLINIC</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-600">Portal del Paciente</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-800 font-medium">
          <span className="w-4 h-0.5 bg-cyan-500 rounded-full" />
          <span>Tu salud, más cerca de ti</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              title="Abrir menú"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo & Slogan matching reference */}
            <button
              onClick={() => onSelectTab('inicio')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
            >
              <div className="h-10 w-10 rounded-xl bg-[#0f2237] text-cyan-400 flex items-center justify-center shadow-md shadow-cyan-950/20 flex-shrink-0 font-black relative overflow-hidden border border-cyan-500/30">
                <Microscope className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-[#0f2237] tracking-tight leading-none group-hover:text-cyan-700 transition-colors">
                    VACLINIC
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">
                  Laboratorio Clínico
                </p>
              </div>
            </button>
          </div>

          {/* Center: Top Navigation Links (Desktop) matching reference design */}
          <nav className="hidden md:flex items-center gap-6 h-full">
            {topNavLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`h-full relative px-1 flex items-center text-sm font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#0f2237]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: WhatsApp CTA & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* WhatsApp Quick Request / Reenviar Código */}
            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Solicitar o reenviar código por WhatsApp (5612 5563)"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => onSelectTab('cuenta')}
              className="relative p-2 rounded-xl text-slate-600 hover:text-cyan-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Patient Profile Pill & Dropdown */}
            {currentPatient ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {getInitials(currentPatient.fullName)}
                  </div>
                  <div className="hidden md:block max-w-[140px]">
                    <span className="text-xs font-bold text-slate-900 truncate block leading-tight">
                      {currentPatient.fullName}
                    </span>
                    <span className="text-[10px] text-teal-700 font-semibold block leading-tight">
                      Paciente verificado
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Profile dropdown menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentPatient.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">DNI: {currentPatient.nationalId || 'Registrado'}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                        <ShieldCheck className="w-3 h-3" /> Sesión Segura
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTab('cuenta');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-cyan-600" />
                      <span>Mi perfil y cuenta</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectTab('ayuda');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Asistente y ayuda</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logoutPatient();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}

          </div>

        </div>
      </div>

      {/* WhatsApp Code Re-send Modal */}
      <WhatsAppCodeModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        defaultTopic="recuperar_pin"
        initialPatientName={currentPatient?.fullName || ''}
        initialNationalId={currentPatient?.nationalId || ''}
        initialAccessCode={currentPatient?.accessCode || ''}
      />
    </header>
  );
};
