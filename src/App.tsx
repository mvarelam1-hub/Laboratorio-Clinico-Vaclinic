import React, { useState } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { FourDimensionControlHub } from './components/staff/FourDimensionControlHub';
import { MultisiteManager } from './components/staff/MultisiteManager';
import { ReportEditor } from './components/staff/ReportEditor';
import { PatientManager } from './components/staff/PatientManager';
import { TemplateManager } from './components/staff/TemplateManager';
import { CatalogAndProfilesManager } from './components/staff/CatalogAndProfilesManager';
import { SampleReception } from './components/staff/SampleReception';
import { AnalyzerBatchEntry } from './components/staff/AnalyzerBatchEntry';
import { QualityControlQC } from './components/staff/QualityControlQC';
import { UserManagement } from './components/staff/UserManagement';
import { InternalChatView } from './components/chat/InternalChatView';
import { InternalChatDrawer } from './components/chat/InternalChatDrawer';
import { PatientPortal } from './components/patient/PatientPortal';
import { PrintReportModal } from './components/common/PrintReportModal';
import { PushNotificationToast } from './components/common/PushNotificationToast';

// New Navigation Modules
import { NewOrderRegistration } from './components/staff/NewOrderRegistration';
import { OrdersListView } from './components/staff/OrdersListView';
import { ArchivedOrdersView } from './components/staff/ArchivedOrdersView';
import { OrderHistoryView } from './components/staff/OrderHistoryView';
import { TrashOrdersView } from './components/staff/TrashOrdersView';
import { PromotionsManagerView } from './components/staff/PromotionsManagerView';
import { LabSettingsView } from './components/staff/LabSettingsView';
import { LabStatisticsView } from './components/staff/LabStatisticsView';
import { LabAlertsView } from './components/staff/LabAlertsView';
import { LabDispatchesView } from './components/staff/LabDispatchesView';
import { AiLabAssistantView } from './components/staff/AiLabAssistantView';
import { AuditLogsView } from './components/staff/AuditLogsView';
import { StaffLoginView } from './components/staff/StaffLoginView';
import { BiometricSecuritySection } from './components/staff/BiometricSecuritySection';
import { GlobalShortcutsManager } from './components/staff/GlobalShortcutsManager';
import { MicroscopicAtlasView } from './components/staff/MicroscopicAtlasView';
import { BackupRestoreView } from './components/staff/BackupRestoreView';
import { BackupRestoreModal } from './components/staff/BackupRestoreModal';

import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { role, staffActiveTab, notification, isStaffAuthenticated, isBackupModalOpen, setIsBackupModalOpen } = useClinic();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If in staff mode and not authenticated, show the official Staff Login screen
  if (role === 'personal' && !isStaffAuthenticated) {
    return <StaffLoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)} />

      {/* Main Layout Area */}
      <div className="flex-1 flex w-full relative">
        {/* Left Sidebar for Staff Mode */}
        {role === 'personal' && (
          <Sidebar 
            isMobileOpen={isMobileSidebarOpen}
            setIsMobileOpen={setIsMobileSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        )}

        {/* Content Viewport Container */}
        <div 
          className={`
            flex-1 flex flex-col w-full min-w-0 transition-all duration-300 ease-in-out print:pl-0 print:m-0 print:p-0
            ${role === 'personal' ? (isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64') : ''}
          `}
        >
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 print:p-0 print:m-0 print:max-w-none">
            {role === 'personal' ? (
              <div className="animate-fade-in">
                {/* 1. Gestión de Órdenes */}
                {staffActiveTab === 'nueva_orden' && <NewOrderRegistration />}
                {staffActiveTab === 'ordenes' && <OrdersListView />}

                {/* 2. Gestión y Archivo */}
                {staffActiveTab === 'ordenes_archivadas' && <ArchivedOrdersView />}
                {staffActiveTab === 'historial_ordenes' && <OrderHistoryView />}
                {staffActiveTab === 'papelera' && <TrashOrdersView />}

                {/* 3. Catálogos y Configuración */}
                {staffActiveTab === 'atlas_microscopico' && <MicroscopicAtlasView />}
                {staffActiveTab === 'catalogo_perfiles' && <CatalogAndProfilesManager />}
                {staffActiveTab === 'promociones' && <PromotionsManagerView />}
                {staffActiveTab === 'ajustes' && <LabSettingsView />}

                {/* 4. Reportes y Estadísticas */}
                {staffActiveTab === 'estadisticas' && <LabStatisticsView />}
                {staffActiveTab === 'alertas' && <LabAlertsView />}

                {/* 5. Comunicación */}
                {staffActiveTab === 'envios' && <LabDispatchesView />}
                {staffActiveTab === 'asistente_ia' && <AiLabAssistantView />}
                {staffActiveTab === 'chat_interno' && <InternalChatView />}

                {/* 6. Administración & Flujo */}
                {staffActiveTab === 'auditoria' && <AuditLogsView />}
                {staffActiveTab === 'biometria' && <BiometricSecuritySection />}
                {staffActiveTab === 'episodios' && <FourDimensionControlHub />}
                {staffActiveTab === 'dashboard' && <StaffDashboard />}
                {staffActiveTab === 'multisucursal' && <MultisiteManager />}
                {staffActiveTab === 'muestras' && <SampleReception />}
                {staffActiveTab === 'analizadores' && <AnalyzerBatchEntry />}
                {staffActiveTab === 'control_calidad' && <QualityControlQC />}
                {staffActiveTab === 'redactor' && <ReportEditor />}
                {staffActiveTab === 'pacientes' && <PatientManager />}
                {staffActiveTab === 'usuarios' && <UserManagement />}
                {staffActiveTab === 'plantillas' && <TemplateManager />}
                {staffActiveTab === 'respaldos' && <BackupRestoreView />}
              </div>
            ) : (
              <div className="animate-fade-in">
                <PatientPortal />
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200/80 bg-white py-4 text-xs text-slate-500 text-center print:hidden mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-left">
                <span className="font-bold text-slate-800">VACLINIC - LABORATORIO CLÍNICO</span>
                <span className="text-slate-400 block sm:inline sm:ml-2 text-[11px]">
                  "Precisión que diagnostica, confianza que cuida" • 📍 Entrada de Pineda Oratorio Santa Rosa km 79.5
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 font-medium">
                <span className="text-teal-700 font-bold">📞 56125563</span>
                <span>•</span>
                <span>Trazabilidad Total ISO 15189</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Official Print Modal */}
      <PrintReportModal />

      {/* Backup and Recovery Full Modal */}
      <BackupRestoreModal 
        isOpen={isBackupModalOpen} 
        onClose={() => setIsBackupModalOpen(false)} 
      />

      {/* Interactive Push Notification Banner */}
      <PushNotificationToast />

      {/* Floating Internal Staff Chat Widget */}
      <InternalChatDrawer />

      {/* Global Staff Keyboard Shortcuts Listener & Modals */}
      <GlobalShortcutsManager />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-slate-900/95 text-white border-teal-500/40 shadow-teal-900/20'
                : notification.type === 'warning'
                ? 'bg-amber-900/95 text-amber-100 border-amber-500/40'
                : notification.type === 'error'
                ? 'bg-rose-900/95 text-rose-100 border-rose-500/40'
                : 'bg-slate-900/95 text-slate-100 border-slate-700'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />}
            {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <MainContent />
    </ClinicProvider>
  );
}
