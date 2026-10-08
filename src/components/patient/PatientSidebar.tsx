import React from 'react';
import { 
  Home, 
  FileText, 
  Clock, 
  User, 
  HelpCircle, 
  FlaskConical, 
  BookOpen, 
  LogOut, 
  Phone, 
  Heart,
  X,
  ExternalLink
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

export type PatientPortalNavTab = 
  | 'inicio' 
  | 'ordenes' 
  | 'resultados' 
  | 'catalogo' 
  | 'preparacion' 
  | 'historial' 
  | 'cuenta' 
  | 'ayuda';

interface PatientSidebarProps {
  activeTab: PatientPortalNavTab;
  onSelectTab: (tab: PatientPortalNavTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  ordersCount?: number;
  resultsCount?: number;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  ordersCount = 0,
  resultsCount = 0
}) => {
  const { currentPatient, logoutPatient } = useClinic();

  const navItems: Array<{
    id: PatientPortalNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }> = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'ordenes', label: 'Mis órdenes', icon: FileText, badge: ordersCount > 0 ? ordersCount : undefined },
    { id: 'resultados', label: 'Mis resultados', icon: FileText, badge: resultsCount > 0 ? resultsCount : undefined },
    { id: 'catalogo', label: 'Catálogo de pruebas', icon: FlaskConical },
    { id: 'preparacion', label: 'Guía de preparación', icon: BookOpen },
    { id: 'historial', label: 'Historial', icon: Clock },
    { id: 'cuenta', label: 'Mi cuenta', icon: User },
    { id: 'ayuda', label: 'Ayuda', icon: HelpCircle }
  ];

  const handleNavClick = (tab: PatientPortalNavTab) => {
    onSelectTab(tab);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200">
      {/* Mobile close header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
            VC
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 block leading-none">VACLINIC</span>
            <span className="text-[10px] text-slate-500 font-medium">Laboratorio Clínico</span>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`patient-nav-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Institutional Slogan Card matching visual reference exactly */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        <div className="bg-[#e6f4fa] border border-[#cbe4f4] rounded-2xl p-4 text-center space-y-2.5">
          <div className="w-8 h-8 rounded-full bg-white text-cyan-600 flex items-center justify-center mx-auto shadow-2xs border border-[#cbe4f4]">
            <Heart className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-xs font-semibold text-slate-700 leading-snug">
            Precisión que diagnostica, confianza que cuida.
          </p>
        </div>

        {/* User signout button */}
        {currentPatient && (
          <button
            onClick={logoutPatient}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 self-stretch sticky top-20 h-[calc(100vh-6rem)]">
        <div className="h-full rounded-2xl shadow-xs overflow-hidden border border-slate-200">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full shadow-2xl z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
