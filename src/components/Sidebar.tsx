import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { StaffTabType } from '../context/ClinicContext';
import { 
  FlaskConical, 
  Shield, 
  Search, 
  Bell, 
  FileText, 
  Plus, 
  Archive, 
  Clock, 
  Trash2, 
  Layers, 
  BadgePercent, 
  SlidersHorizontal, 
  BarChart3, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Cloud, 
  ChevronDown, 
  ChevronUp, 
  X, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Building2,
  Users,
  Activity,
  LayoutDashboard,
  FileSpreadsheet,
  Cpu,
  Lock,
  Fingerprint,
  Microscope,
  Database,
  FileEdit
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed
}) => {
  const { 
    staffActiveTab, 
    setStaffActiveTab, 
    episodes, 
    patients, 
    showNotification,
    unreadChatCount,
    currentStaffUser,
    logoutStaff,
    reagentsBelowMinThreshold
  } = useClinic();

  // Accordion collapsed state for groups
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    principal: true,
    pacientes: true,
    ordenes: true,
    archivo: true,
    catalogo: true,
    reportes: true,
    comunicacion: true,
    administracion: true
  });

  const [searchFilter, setSearchFilter] = useState('');

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleSelectTab = (tab: StaffTabType) => {
    if (tab === 'sincronizar') {
      showNotification('Sincronizando base de datos y catálogos en tiempo real...', 'info');
      setTimeout(() => {
        showNotification('¡Sincronización completada con éxito!', 'success');
      }, 1000);
      return;
    }
    setStaffActiveTab(tab);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity print:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 bottom-0 left-0 z-50 lg:z-30 print:hidden
          flex flex-col bg-[#0b1329] text-slate-200 border-r border-slate-800/80
          transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Top Header: VACLINIC PANEL DE PERSONAL */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Teal Flask Emblem */}
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/50 flex-shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm text-white tracking-tight leading-none">VACLINIC</span>
                <span className="text-[10px] font-black uppercase text-teal-400 mt-0.5 tracking-wider">
                  PANEL DE PERSONAL
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            title="Cerrar Menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card: Administrador VACLINIC */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-950 text-teal-400 flex items-center justify-center border border-teal-800/50 flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {currentStaffUser?.fullName || 'Administrador VACLINIC'}
                </div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {currentStaffUser?.role || 'ADMINISTRADOR'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar + Ctrl K + Notification Bell */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-3.5 pt-3 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar todo..."
                  className="w-full pl-8 pr-12 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-teal-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  Ctrl K
                </span>
              </div>

              {/* Notification Bell with 91 badge */}
              <button
                onClick={() => handleSelectTab('alertas')}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Alertas (91)"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white">
                  91
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* SECTION 0: PRINCIPAL */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={() => toggleSection('principal')}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span>PRINCIPAL</span>
                {openSections.principal ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}

            {openSections.principal && (
              <div className="space-y-1">
                <button
                  id="btn-nav-dashboard"
                  onClick={() => handleSelectTab('dashboard')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'dashboard' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Dashboard</span>}
                </button>
              </div>
            )}
          </div>

          {/* SECTION 0.5: GESTIÓN DE PACIENTES */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={() => toggleSection('pacientes')}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span>GESTIÓN DE PACIENTES</span>
                {openSections.pacientes ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}

            {openSections.pacientes && (
              <div className="space-y-1">
                <button
                  id="btn-nav-pacientes"
                  onClick={() => handleSelectTab('pacientes')}
                  title="Directorio de Pacientes (Alt+3 • Búsqueda rápida: Ctrl+B)"
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'pacientes' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Pacientes</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-slate-500 hidden xl:inline">
                          Alt+3
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          staffActiveTab === 'pacientes' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {patients.length}
                        </span>
                      </div>
                    </div>
                  )}
                </button>

                <button
                  id="btn-nav-solicitudes-precios"
                  onClick={() => {
                    handleSelectTab('catalogo_perfiles');
                    showNotification('Módulo de Solicitudes de Precios / Cotizaciones', 'info');
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left text-slate-300 hover:bg-slate-900/80 hover:text-white
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Solicitudes de Precios</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        0
                      </span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* SECTION 1: GESTIÓN DE ÓRDENES */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={() => toggleSection('ordenes')}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span>GESTIÓN DE ÓRDENES</span>
                {openSections.ordenes ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}

            {openSections.ordenes && (
              <div className="space-y-1">
                {/* Órdenes */}
                <button
                  id="btn-nav-ordenes"
                  onClick={() => handleSelectTab('ordenes')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'ordenes' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && (
                    <span>Órdenes ({episodes.length})</span>
                  )}
                </button>

                {/* Editor / Redactor de Informes */}
                <button
                  id="btn-nav-redactor"
                  onClick={() => handleSelectTab('redactor')}
                  title="Editor y Redactor de Informes Clínicos (Cargar pruebas y analizador Ozelle)"
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'redactor' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <FileEdit className="w-4 h-4 flex-shrink-0 text-violet-400" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Editor de Informes</span>
                      <span className="text-[9px] font-mono font-bold bg-violet-950 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30">
                        Ozelle / IA
                      </span>
                    </div>
                  )}
                </button>

                {/* Recepción & Rotulado de Tubos (Muestras) */}
                <button
                  id="btn-nav-muestras"
                  onClick={() => handleSelectTab('muestras')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'muestras' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <FlaskConical className="w-4 h-4 flex-shrink-0 text-teal-400" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Recepción & Tubos</span>
                      <span className="text-[9px] font-mono font-bold bg-teal-900/60 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                        LIS
                      </span>
                    </div>
                  )}
                </button>

                {/* + Nueva Orden (Highlighted in teal/emerald) */}
                <button
                  id="btn-nav-nueva-orden"
                  onClick={() => handleSelectTab('nueva_orden')}
                  title="Nueva Orden de Laboratorio (Ctrl+N)"
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'nueva_orden' 
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-950/50' 
                      : 'text-teal-400 hover:bg-teal-950/40 hover:text-teal-300'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Plus className="w-4 h-4 flex-shrink-0 stroke-[2.5]" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Nueva Orden</span>
                      <span className="text-[9px] font-mono font-bold bg-teal-950/80 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/40">
                        Ctrl+N
                      </span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: GESTIÓN Y ARCHIVO */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={() => toggleSection('archivo')}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span>GESTIÓN Y ARCHIVO</span>
                {openSections.archivo ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}

            {openSections.archivo && (
              <div className="space-y-0.5">
                <button
                  onClick={() => handleSelectTab('ordenes_archivadas')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'ordenes_archivadas' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Archive className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Órdenes Archivadas (34)</span>}
                </button>

                <button
                  onClick={() => handleSelectTab('historial_ordenes')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'historial_ordenes' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Historial de Órdenes</span>}
                </button>

                <button
                  onClick={() => handleSelectTab('papelera')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'papelera' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Papelera (0)</span>}
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3: CATÁLOGOS Y CONFIGURACIÓN */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={() => toggleSection('catalogo')}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span>CATÁLOGOS Y CONFIGURACIÓN</span>
                {openSections.catalogo ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}

            {openSections.catalogo && (
              <div className="space-y-0.5">
                <button
                  id="btn-nav-atlas-microscopico"
                  onClick={() => handleSelectTab('atlas_microscopico')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'atlas_microscopico' 
                      ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-950/40' 
                      : 'text-teal-300 hover:bg-teal-950/50 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Microscope className="w-4 h-4 flex-shrink-0 text-teal-400" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Atlas Microscópico</span>
                      <span className="text-[9px] font-mono font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded border border-teal-400/30">
                        IA
                      </span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleSelectTab('catalogo_perfiles')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'catalogo_perfiles' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Layers className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Catálogo y Perfiles</span>}
                </button>

                <button
                  onClick={() => handleSelectTab('promociones')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'promociones' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <BadgePercent className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Promociones (2)</span>}
                </button>

                <button
                  onClick={() => handleSelectTab('ajustes')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'ajustes' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between w-full">
                      <span>Ajustes</span>
                      {reagentsBelowMinThreshold.length > 0 && (
                        <span 
                          className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-2xs"
                          title={`${reagentsBelowMinThreshold.length} reactivos en nivel crítico de inventario`}
                        >
                          {reagentsBelowMinThreshold.length}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* SECTION 4: REPORTES Y ESTADÍSTICAS */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={() => toggleSection('reportes')}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span>REPORTES Y ESTADÍSTICAS</span>
                {openSections.reportes ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}

            {openSections.reportes && (
              <div className="space-y-0.5">
                <button
                  onClick={() => handleSelectTab('estadisticas')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'estadisticas' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <BarChart3 className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Estadísticas</span>}
                </button>

                <button
                  onClick={() => handleSelectTab('alertas')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'alertas' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  {(!isCollapsed || isMobileOpen) && <span>Alertas (91)</span>}
                </button>
              </div>
            )}
          </div>

          {/* SECTION 5: COMUNICACIÓN */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={() => toggleSection('comunicacion')}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span>COMUNICACIÓN</span>
                {openSections.comunicacion ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}

            {openSections.comunicacion && (
              <div className="space-y-0.5">
                <button
                  onClick={() => handleSelectTab('envios')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'envios' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Send className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Envíos (169)</span>}
                </button>

                <button
                  onClick={() => handleSelectTab('asistente_ia')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'asistente_ia' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-emerald-400 hover:bg-emerald-950/30'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  {(!isCollapsed || isMobileOpen) && <span>Asistente IA</span>}
                </button>

                <button
                  onClick={() => handleSelectTab('chat_interno')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'chat_interno' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>Chat Intercom</span>
                      {unreadChatCount > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-600 text-white">
                          {unreadChatCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* SECTION 6: ADMINISTRACIÓN */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={() => toggleSection('administracion')}
                className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span>ADMINISTRACIÓN</span>
                {openSections.administracion ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}

            {openSections.administracion && (
              <div className="space-y-0.5">
                <button
                  id="btn-nav-usuarios"
                  onClick={() => handleSelectTab('usuarios')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'usuarios' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Users className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Usuarios & Claves</span>
                      <span className="text-[9px] font-mono font-bold bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        PIN / RBAC
                      </span>
                    </div>
                  )}
                </button>

                <button
                  id="btn-nav-auditoria"
                  onClick={() => handleSelectTab('auditoria')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'auditoria' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-teal-400" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Auditoría & Modificaciones</span>
                      <span className="text-[9px] font-mono font-bold bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                        ISO 15189
                      </span>
                    </div>
                  )}
                </button>

                <button
                  id="btn-nav-biometria"
                  onClick={() => handleSelectTab('biometria')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'biometria' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Fingerprint className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Biometría & Acceso</span>
                      <span className="text-[9px] font-mono font-bold bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                        BIO
                      </span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleSelectTab('episodios')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'episodios' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Layers className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Flujo LABVACLINIC & Analizadores</span>}
                </button>

                <button
                  id="btn-nav-respaldos"
                  onClick={() => handleSelectTab('respaldos')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    ${staffActiveTab === 'respaldos' 
                      ? 'bg-teal-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Database className="w-4 h-4 flex-shrink-0 text-teal-400" />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center justify-between flex-1">
                      <span>Respaldos & Backup</span>
                      <span className="text-[9px] font-mono font-bold bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                        JSON
                      </span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleSelectTab('sincronizar')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 relative cursor-pointer text-left
                    text-slate-300 hover:bg-slate-900/80 hover:text-white
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <Cloud className="w-4 h-4 flex-shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span>Sincronizar Ahora</span>}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer Area: User Status & Desktop Collapse Button */}
        <div className="p-2 border-t border-slate-800/80 bg-slate-950/90 flex-shrink-0 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={logoutStaff}
            className={`
              flex items-center gap-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors text-xs font-semibold cursor-pointer
              ${isCollapsed && !isMobileOpen ? 'w-full justify-center' : ''}
            `}
            title={`Bloquear terminal (${currentStaffUser?.fullName || 'Personal'})`}
          >
            <Lock className="w-4 h-4 text-slate-400 hover:text-rose-400 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">Bloquear Terminal</span>}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer hidden lg:flex"
            title={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

      </aside>
    </>
  );
};
