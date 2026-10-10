import { calcularAlertasReales } from '../utils/alertasReales';
import { DEMO_MODE } from '../config/demoMode';
import React, { useState, useEffect } from 'react';
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

interface ItemNav {
  tab: StaffTabType;
  etiqueta: string;
  icono: React.ComponentType<{ className?: string }>;
  domId?: string;
  titulo?: string;
  atajo?: string;
  contador?: number;
  /** Contador en rojo (algo que atender) en lugar de gris (solo informativo). */
  alerta?: boolean;
  destacado?: boolean;
}
interface SeccionNav { id: string; titulo: string; items: ItemNav[]; }

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
    orders,
    showNotification,
    unreadChatCount,
    currentStaffUser,
    logoutStaff,
    reagentsBelowMinThreshold,
    reports,
    reagents
  } = useClinic();
  const totalAlertas = calcularAlertasReales(reports, reagents).length;

  // Órdenes Archivadas / Papelera: antes eran números fijos en el código
  // ("34" y "0") que nunca reflejaban el arreglo `orders` real -ver
  // OrdersMasterManager.tsx/TrashOrdersView.tsx para el mismo arreglo que
  // ahora alimenta estos contadores de verdad.
  const ordenesArchivadasCount = orders.filter(o => o.isArchived && !o.isDeleted).length;
  const ordenesEnPapeleraCount = orders.filter(o => o.isDeleted).length;

  // Accordion collapsed state for groups
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    principal: true,
    recepcion: true,
    resultados: true,
    entrega: true,
    archivo: false,
    catalogo: false,
    analisis: false,
    equipo: true,
    administracion: false
  });

  const [searchFilter, setSearchFilter] = useState('');

  // La barra superior (sticky, z-40) tapaba la parte alta del menú (logo y datos
  // del usuario). El menú se coloca justo debajo de ella en escritorio.
  useEffect(() => {
    const cabecera = document.querySelector('header');
    if (!cabecera) return;
    const aplicar = () => document.documentElement.style.setProperty('--navbar-h', `${Math.round(cabecera.getBoundingClientRect().height)}px`);
    aplicar();
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(aplicar) : null;
    obs?.observe(cabecera);
    window.addEventListener('resize', aplicar);
    return () => { obs?.disconnect(); window.removeEventListener('resize', aplicar); };
  }, []);

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

  // Contadores reales (nada de números fijos).
  const ordenesActivasCount = orders.filter(o => !o.isArchived && !o.isDeleted).length;

  const secciones: SeccionNav[] = [
    {
      id: 'principal', titulo: 'Inicio',
      items: [
        { tab: 'dashboard', etiqueta: 'Dashboard', icono: LayoutDashboard, domId: 'btn-nav-dashboard' }
      ]
    },
    {
      id: 'recepcion', titulo: '1 · Recepción',
      items: [
        { tab: 'nueva_orden', etiqueta: 'Nueva orden', icono: Plus, domId: 'btn-nav-nueva-orden', atajo: 'Ctrl+N', destacado: true, titulo: 'Nueva Orden de Laboratorio (Ctrl+N)' },
        { tab: 'pacientes', etiqueta: 'Pacientes', icono: Users, domId: 'btn-nav-pacientes', contador: patients.length, titulo: 'Directorio de Pacientes (Alt+3 • Búsqueda rápida: Ctrl+B)' },
        { tab: 'ordenes', etiqueta: 'Órdenes', icono: FileText, domId: 'btn-nav-ordenes', contador: ordenesActivasCount },
        { tab: 'muestras', etiqueta: 'Recepción de muestras', icono: FlaskConical, domId: 'btn-nav-muestras' }
      ]
    },
    {
      id: 'resultados', titulo: '2 · Resultados',
      items: [
        { tab: 'redactor', etiqueta: 'Ingresar resultados', icono: FileEdit, domId: 'btn-nav-redactor', titulo: 'Ingresar y validar resultados de una orden' },
        { tab: 'verificacion_criticos', etiqueta: 'Verificación de críticos', icono: ShieldCheck },
        { tab: 'alertas', etiqueta: 'Alertas', icono: AlertTriangle, contador: totalAlertas, alerta: true }
      ]
    },
    {
      id: 'entrega', titulo: '3 · Entrega',
      items: [
        { tab: 'envios', etiqueta: 'Entrega de resultados', icono: Send },
        { tab: 'historial_ordenes', etiqueta: 'Historial de órdenes', icono: Clock }
      ]
    },
    {
      id: 'archivo', titulo: 'Archivo',
      items: [
        { tab: 'ordenes_archivadas', etiqueta: 'Órdenes archivadas', icono: Archive, contador: ordenesArchivadasCount },
        { tab: 'papelera', etiqueta: 'Papelera', icono: Trash2, contador: ordenesEnPapeleraCount }
      ]
    },
    {
      id: 'catalogo', titulo: 'Catálogo',
      items: [
        { tab: 'catalogo_perfiles', etiqueta: 'Catálogo y perfiles', icono: Layers },
        { tab: 'promociones', etiqueta: 'Noticias y promociones', icono: BadgePercent, titulo: 'Lo que se muestra en el Portal del Paciente' },
        { tab: 'atlas_microscopico', etiqueta: 'Atlas microscópico', icono: Microscope, domId: 'btn-nav-atlas-microscopico' }
      ]
    },
    {
      id: 'analisis', titulo: 'Análisis',
      items: [
        { tab: 'estadisticas', etiqueta: 'Estadísticas', icono: BarChart3 }
      ]
    },
    {
      id: 'equipo', titulo: 'Equipo',
      items: [
        { tab: 'chat_interno', etiqueta: 'Chat interno', icono: MessageSquare, contador: unreadChatCount, alerta: true },
        { tab: 'episodios', etiqueta: 'Flujo de trabajo', icono: Activity }
      ]
    },
    {
      id: 'administracion', titulo: 'Administración',
      items: [
        { tab: 'usuarios', etiqueta: 'Usuarios y roles', icono: Users },
        { tab: 'auditoria', etiqueta: 'Auditoría', icono: ShieldCheck },
        { tab: 'ajustes', etiqueta: 'Ajustes', icono: SlidersHorizontal, contador: reagentsBelowMinThreshold.length, alerta: true, titulo: 'Ajustes del laboratorio (el contador son reactivos bajo el mínimo)' },
        { tab: 'respaldos', etiqueta: 'Respaldos', icono: Database },
        // Solo en demostración: simuladores sin datos reales.
        ...(DEMO_MODE ? [
          { tab: 'asistente_ia' as StaffTabType, etiqueta: 'Asistente IA (demo)', icono: Sparkles },
          { tab: 'biometria' as StaffTabType, etiqueta: 'Biometría (demo)', icono: Fingerprint, domId: 'btn-nav-biometria' }
        ] : [])
      ]
    }
  ];

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
          fixed top-0 lg:top-[var(--navbar-h,0px)] bottom-0 left-0 z-50 lg:z-30 print:hidden
          flex flex-col bg-canopy text-mint-wash border-r border-canopy-claro
          transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Top Header: VACLINIC PANEL DE PERSONAL */}
        <div className="p-4 border-b border-canopy-claro flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Teal Flask Emblem */}
            <div className="h-10 w-10 rounded-full bg-leaf flex items-center justify-center text-canopy flex-shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm text-white tracking-tight leading-none">VACLINIC</span>
                <span className="text-[10px] font-black uppercase text-leaf mt-0.5 tracking-wider">
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
          <div className="px-4 py-3 border-b border-canopy-claro bg-canopy-claro/40 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-canopy-claro text-leaf flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {currentStaffUser?.fullName || 'Sin sesión'}
                </div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {currentStaffUser?.roleName || ''}
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
                  className="w-full pl-8 pr-12 py-1.5 rounded-lg bg-canopy-claro border border-canopy-claro text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500 bg-canopy-claro px-1.5 py-0.5 rounded border border-leaf/30">
                  Ctrl K
                </span>
              </div>

              {/* Campana: abre las alertas reales (con contador solo si hay alertas) */}
              <button
                onClick={() => handleSelectTab('alertas')}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-canopy-claro transition-colors"
                title={`Alertas (${totalAlertas})`}
              >
                <Bell className="w-4 h-4" />
                {totalAlertas > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white">
                    {totalAlertas}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Navegación ordenada por flujo de trabajo: Recepción → Resultados → Entrega → Archivo → Catálogo → Análisis → Equipo → Administración */}
        <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
          {secciones.map((sec) => (
            <div key={sec.id} className="space-y-1">
              {(!isCollapsed || isMobileOpen) && (
                <button
                  onClick={() => toggleSection(sec.id)}
                  className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <span>{sec.titulo}</span>
                  {openSections[sec.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>
              )}

              {(openSections[sec.id] || (isCollapsed && !isMobileOpen)) && (
                <div className="space-y-0.5">
                  {sec.items.map((it) => {
                    const Icono = it.icono;
                    const activo = staffActiveTab === it.tab;
                    return (
                      <button
                        key={it.tab}
                        id={it.domId}
                        onClick={() => handleSelectTab(it.tab)}
                        title={it.titulo || it.etiqueta}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-semibold
                          transition-all duration-150 relative cursor-pointer text-left
                          ${activo
                            ? 'bg-leaf text-canopy font-bold'
                            : it.destacado
                              ? 'text-leaf hover:bg-canopy-claro'
                              : 'text-mint-wash hover:bg-canopy-claro hover:text-white'
                          }
                          ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                        `}
                      >
                        <Icono className="w-4 h-4 flex-shrink-0" />
                        {(!isCollapsed || isMobileOpen) && (
                          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                            <span className="truncate">{it.etiqueta}</span>
                            {it.contador != null && it.contador > 0 && (
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${it.alerta ? 'bg-rose-600 text-white' : 'bg-canopy-claro text-mint-wash'}`}>
                                {it.contador}
                              </span>
                            )}
                            {it.atajo && (
                              <span className="text-[9px] font-mono font-bold text-slate-500">{it.atajo}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Area: User Status & Desktop Collapse Button */}
        <div className="p-2 border-t border-canopy-claro bg-canopy flex-shrink-0 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={logoutStaff}
            className={`
              flex items-center gap-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-canopy-claro transition-colors text-xs font-semibold cursor-pointer
              ${isCollapsed && !isMobileOpen ? 'w-full justify-center' : ''}
            `}
            title={`Bloquear terminal (${currentStaffUser?.fullName || 'Personal'})`}
          >
            <Lock className="w-4 h-4 text-slate-400 hover:text-rose-400 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">Bloquear Terminal</span>}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-canopy-claro rounded-lg transition-colors cursor-pointer hidden lg:flex"
            title={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

      </aside>
    </>
  );
};
