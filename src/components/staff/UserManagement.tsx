import React, { useState, useMemo, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  LabStaffUser, 
  LabStaffRole, 
  UserStatus, 
  BranchSiteId, 
  LabAuditLog,
  LabPermissionDefinition 
} from '../../types';
import { LAB_PERMISSIONS_CATALOG } from '../../data/staffUserData';
import { AuditExportService } from '../../services/auditExportService';
import { 
  Users, 
  ShieldCheck, 
  Key, 
  UserPlus, 
  Lock, 
  Unlock, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Building2, 
  FileText, 
  Activity, 
  Cpu, 
  FlaskConical, 
  Layers, 
  QrCode, 
  Eye, 
  EyeOff, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Phone, 
  Mail, 
  Award, 
  CheckCircle2,
  Sliders,
  Sparkles,
  ChevronRight,
  Info,
  Smartphone,
  FileSpreadsheet,
  Printer,
  Calendar,
  CalendarDays,
  UserCheck,
  FileCheck,
  ClipboardCheck,
  FileDown,
  ShieldQuestion
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { 
    staffUsers, 
    staffRoles, 
    auditLogs, 
    branches,
    isMultiBranchEnabled,
    addStaffUser, 
    updateStaffUser, 
    deleteStaffUser, 
    toggleUserStatus, 
    resetUserPin, 
    updateRolePermissions,
    logAuditEvent,
    showNotification,
    setStaffActiveTab
  } = useClinic();

  // Navigation Subtabs
  const [activeSubTab, setActiveSubTab] = useState<'usuarios' | 'roles_rbac' | 'firmas' | 'auditoria'>('usuarios');

  // Filters & Search for Users
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Reveal PIN states
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LabStaffUser | null>(null);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetUser, setPinTargetUser] = useState<LabStaffUser | null>(null);
  const [newPinValue, setNewPinValue] = useState('');

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<LabAuditLog | null>(null);

  // Form State for User Modal
  const [formData, setFormData] = useState<{
    fullName: string;
    username: string;
    email: string;
    phone: string;
    roleId: LabStaffRole;
    specialty: string;
    licenseNumber: string;
    assignedBranch: BranchSiteId | 'todas';
    status: UserStatus;
    pinCode: string;
    signatureStampText: string;
    twoFactorEnabled: boolean;
    notes: string;
    customPermissions: Record<string, boolean>;
  }>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    roleId: 'bioanalista',
    specialty: '',
    licenseNumber: '',
    assignedBranch: 'central',
    status: 'activo',
    pinCode: '1234',
    signatureStampText: '',
    twoFactorEnabled: false,
    notes: '',
    customPermissions: {}
  });

  // Audit Log Filters & Date Presets
  const [auditDatePreset, setAuditDatePreset] = useState<'all' | 'this_month' | 'last_month' | 'last_30_days' | 'last_90_days' | 'custom'>('all');
  const [auditStartDate, setAuditStartDate] = useState<string>('');
  const [auditEndDate, setAuditEndDate] = useState<string>('');
  const [auditUserFilter, setAuditUserFilter] = useState<string>('all');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>('all');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Monthly Quality Review Modal & Export State
  const [isMonthlyQualityModalOpen, setIsMonthlyQualityModalOpen] = useState(false);
  const [monthlyReportMonth, setMonthlyReportMonth] = useState('2026-08');
  const [monthlyAuditorUserId, setMonthlyAuditorUserId] = useState('usr-001');
  const [monthlyReviewNotes, setMonthlyReviewNotes] = useState(
    'Revisión mensual de conformidad y trazabilidad ISO 15189:2022 completada satisfactoriamente. Todos los accesos de personal, calibraciones de analizadores automatizados, disparos de valores de pánico y validaciones colegiadas han sido revisados y verificados conforme a los protocolos institucionales de VACLINIC.'
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const auditReportPrintRef = useRef<HTMLDivElement>(null);

  // Toggle PIN visibility
  const togglePinReveal = (userId: string) => {
    setRevealedPins(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return staffUsers.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.specialty.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.roleId === roleFilter;
      const matchesBranch = branchFilter === 'all' || user.assignedBranch === branchFilter || user.assignedBranch === 'todas';
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesBranch && matchesStatus;
    });
  }, [staffUsers, searchQuery, roleFilter, branchFilter, statusFilter]);

  // Unique actions for filtering dropdown
  const uniqueAuditActions = useMemo(() => {
    const actionsSet = new Set<string>();
    auditLogs.forEach(l => {
      if (l.action) actionsSet.add(l.action);
    });
    return Array.from(actionsSet).sort();
  }, [auditLogs]);

  // Human friendly period text
  const getPeriodLabel = () => {
    switch (auditDatePreset) {
      case 'this_month':
        return 'Mes Actual (Agosto 2026)';
      case 'last_month':
        return 'Mes Anterior (Julio 2026)';
      case 'last_30_days':
        return 'Últimos 30 días';
      case 'last_90_days':
        return 'Últimos 90 días';
      case 'custom':
        return `Personalizado: ${auditStartDate || 'Inicio'} al ${auditEndDate || 'Actual'}`;
      default:
        return 'Historial Completo';
    }
  };

  // Filtered Audit Logs with Date Range, User, Module, Severity, Action & Search
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // 1. Text Search
      const matchesSearch = 
        !auditSearch.trim() ||
        log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.userRole.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.module.toLowerCase().includes(auditSearch.toLowerCase());

      // 2. User filter
      const matchesUser = auditUserFilter === 'all' || log.userId === auditUserFilter;

      // 3. Module filter
      const matchesModule = auditModuleFilter === 'all' || log.module === auditModuleFilter;

      // 4. Severity filter
      const matchesSeverity = auditSeverityFilter === 'all' || log.severity === auditSeverityFilter;

      // 5. Action filter
      const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;

      // 6. Date filtering
      let matchesDate = true;
      const logTime = new Date(log.timestamp).getTime();
      const currentSimulatedTime = new Date('2026-08-29T11:41:54-07:00');

      if (auditDatePreset === 'this_month') {
        const startOfMonth = new Date(currentSimulatedTime.getFullYear(), currentSimulatedTime.getMonth(), 1, 0, 0, 0).getTime();
        const endOfMonth = new Date(currentSimulatedTime.getFullYear(), currentSimulatedTime.getMonth() + 1, 0, 23, 59, 59).getTime();
        matchesDate = logTime >= startOfMonth && logTime <= endOfMonth;
      } else if (auditDatePreset === 'last_month') {
        const startOfLastMonth = new Date(currentSimulatedTime.getFullYear(), currentSimulatedTime.getMonth() - 1, 1, 0, 0, 0).getTime();
        const endOfLastMonth = new Date(currentSimulatedTime.getFullYear(), currentSimulatedTime.getMonth(), 0, 23, 59, 59).getTime();
        matchesDate = logTime >= startOfLastMonth && logTime <= endOfLastMonth;
      } else if (auditDatePreset === 'last_30_days') {
        const thirtyDaysAgo = currentSimulatedTime.getTime() - (30 * 24 * 60 * 60 * 1000);
        matchesDate = logTime >= thirtyDaysAgo;
      } else if (auditDatePreset === 'last_90_days') {
        const ninetyDaysAgo = currentSimulatedTime.getTime() - (90 * 24 * 60 * 60 * 1000);
        matchesDate = logTime >= ninetyDaysAgo;
      } else if (auditDatePreset === 'custom') {
        if (auditStartDate) {
          const start = new Date(`${auditStartDate}T00:00:00`).getTime();
          if (logTime < start) matchesDate = false;
        }
        if (auditEndDate) {
          const end = new Date(`${auditEndDate}T23:59:59`).getTime();
          if (logTime > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesUser && matchesModule && matchesSeverity && matchesAction && matchesDate;
    });
  }, [
    auditLogs, 
    auditSearch, 
    auditUserFilter, 
    auditModuleFilter, 
    auditSeverityFilter, 
    auditActionFilter, 
    auditDatePreset, 
    auditStartDate, 
    auditEndDate
  ]);

  // Logs for specific month in Monthly Quality Assistant
  const monthlyAssistantLogs = useMemo(() => {
    if (!monthlyReportMonth) return auditLogs;
    const [yearStr, monthStr] = monthlyReportMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const start = new Date(year, month, 1, 0, 0, 0).getTime();
    const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();

    return auditLogs.filter(log => {
      const t = new Date(log.timestamp).getTime();
      return t >= start && t <= end;
    });
  }, [auditLogs, monthlyReportMonth]);

  // Audit CSV Export Handler
  const handleExportCsv = (customLogs?: LabAuditLog[], customPeriodLabel?: string) => {
    const logsToExport = customLogs || filteredAuditLogs;
    if (logsToExport.length === 0) {
      showNotification('No hay registros de auditoría que coincidan con los filtros seleccionados', 'warning');
      return;
    }

    const selectedUserObj = staffUsers.find(u => u.id === auditUserFilter);
    const success = AuditExportService.exportToCsv(logsToExport, {
      periodLabel: customPeriodLabel || getPeriodLabel(),
      userFilterName: selectedUserObj ? selectedUserObj.fullName : (auditUserFilter === 'all' ? 'Todos los Usuarios' : auditUserFilter),
      moduleFilterName: auditModuleFilter === 'all' ? 'Todos los Módulos' : auditModuleFilter,
      severityFilterName: auditSeverityFilter === 'all' ? 'Todas las Severidades' : auditSeverityFilter,
    });

    if (success) {
      showNotification(`Se exportaron exitosamente ${logsToExport.length} registros de auditoría a CSV (ISO 15189)`, 'success');
      logAuditEvent({
        userId: 'usr-001',
        userName: 'Dra. Carmen Alicia Morales V.',
        userRole: 'Director Técnico de Laboratorio',
        action: 'Exportación de Auditoría a CSV',
        module: 'seguridad',
        details: `Exportados ${logsToExport.length} eventos de auditoría a formato CSV para revisión de calidad.`,
        severity: 'info'
      });
    } else {
      showNotification('Hubo un problema al generar el archivo CSV', 'warning');
    }
  };

  // Audit PDF Export Handler
  const handleExportPdf = async (monthNameText?: string) => {
    if (!auditReportPrintRef.current) {
      showNotification('El visor de impresión no está listo para renderizar', 'warning');
      return;
    }

    setIsExportingPdf(true);
    showNotification('Generando informe mensual de auditoría PDF con acreditación ISO 15189...', 'info');

    const filename = `VACLINIC_Informe_Auditoria_Calidad_${(monthNameText || getPeriodLabel()).toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
    const success = await AuditExportService.exportElementToPdf(auditReportPrintRef.current, filename);

    setIsExportingPdf(false);

    if (success) {
      showNotification('Informe PDF de auditoría y calidad descargado exitosamente', 'success');
      logAuditEvent({
        userId: monthlyAuditorUserId || 'usr-001',
        userName: staffUsers.find(u => u.id === monthlyAuditorUserId)?.fullName || 'Dra. Carmen Alicia Morales V.',
        userRole: staffUsers.find(u => u.id === monthlyAuditorUserId)?.roleName || 'Director Técnico de Laboratorio',
        action: 'Emisión de Informe Mensual de Auditoría PDF',
        module: 'seguridad',
        details: `Generado dictamen oficial de auditoría mensual de calidad en PDF (${filename}) conforme a ISO 15189:2022.`,
        severity: 'info'
      });
    } else {
      showNotification('No se pudo generar el documento PDF', 'warning');
    }
  };

  // Direct Print
  const handlePrintAuditReport = () => {
    window.print();
  };

  // Open User Create/Edit Modal
  const handleOpenUserModal = (user?: LabStaffUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        specialty: user.specialty,
        licenseNumber: user.licenseNumber,
        assignedBranch: user.assignedBranch,
        status: user.status,
        pinCode: user.pinCode,
        signatureStampText: user.signatureStampText || '',
        twoFactorEnabled: user.twoFactorEnabled || false,
        notes: user.notes || '',
        customPermissions: user.customPermissions || {}
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        username: '',
        email: '',
        phone: '+502 ',
        roleId: 'bioanalista',
        specialty: '',
        licenseNumber: '',
        assignedBranch: 'central',
        status: 'activo',
        pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
        signatureStampText: '',
        twoFactorEnabled: false,
        notes: '',
        customPermissions: {}
      });
    }
    setIsUserModalOpen(true);
  };

  // Submit User Form
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showNotification('El nombre completo del personal es obligatorio', 'warning');
      return;
    }
    if (!formData.username.trim()) {
      showNotification('El identificador / usuario es obligatorio', 'warning');
      return;
    }
    if (!formData.pinCode || formData.pinCode.length < 4) {
      showNotification('El PIN debe tener al menos 4 dígitos numéricos', 'warning');
      return;
    }

    const selectedRole = staffRoles.find(r => r.id === formData.roleId);

    if (editingUser) {
      updateStaffUser(editingUser.id, {
        ...formData,
        roleName: selectedRole ? selectedRole.name : formData.roleId
      });
    } else {
      addStaffUser({
        ...formData,
        roleName: selectedRole ? selectedRole.name : formData.roleId,
        avatarColor: getRoleAvatarBg(formData.roleId)
      });
    }
    setIsUserModalOpen(false);
  };

  // Reset PIN submit
  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinTargetUser) return;
    if (!newPinValue || newPinValue.length < 4) {
      showNotification('El PIN debe tener mínimo 4 dígitos', 'warning');
      return;
    }
    resetUserPin(pinTargetUser.id, newPinValue);
    setIsPinModalOpen(false);
    setPinTargetUser(null);
    setNewPinValue('');
  };

  // Helper for role badge colors
  const getRoleBadgeClasses = (roleId: LabStaffRole) => {
    switch (roleId) {
      case 'director_laboratorio':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700';
      case 'bioanalista_senior':
        return 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700';
      case 'bioanalista':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-700';
      case 'tecnico_flebotomista':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700';
      case 'recepcionista':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700';
      case 'auditor_calidad':
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700';
      case 'administrador_ti':
        return 'bg-slate-800 text-white border-slate-700 dark:bg-slate-700 dark:text-slate-100';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getRoleAvatarBg = (roleId: LabStaffRole) => {
    switch (roleId) {
      case 'director_laboratorio': return 'bg-gradient-to-br from-amber-600 to-amber-700';
      case 'bioanalista_senior': return 'bg-gradient-to-br from-teal-600 to-teal-700';
      case 'bioanalista': return 'bg-gradient-to-br from-cyan-600 to-cyan-700';
      case 'tecnico_flebotomista': return 'bg-gradient-to-br from-emerald-600 to-emerald-700';
      case 'recepcionista': return 'bg-gradient-to-br from-indigo-600 to-indigo-700';
      case 'auditor_calidad': return 'bg-gradient-to-br from-purple-600 to-purple-700';
      case 'administrador_ti': return 'bg-gradient-to-br from-slate-700 to-slate-900';
      default: return 'bg-teal-600';
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'activo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Activo
          </span>
        );
      case 'inactivo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-400">
            Inactivo
          </span>
        );
      case 'suspendido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertTriangle className="w-3 h-3" />
            Suspendido
          </span>
        );
      case 'vacaciones':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            Vacaciones
          </span>
        );
    }
  };

  const getBranchLabel = (branchId: BranchSiteId | 'todas') => {
    if (branchId === 'todas') return '🌐 Todas las Sedes (Global)';
    const b = branches.find(item => item.id === branchId);
    return b ? `📍 ${b.name.split('-')[0].trim()}` : branchId;
  };

  // Group permissions by category
  const permissionCategories: { id: LabPermissionDefinition['category']; title: string; icon: any }[] = [
    { id: 'D1_admision', title: 'Dimensión 1: Admisión & Pacientes', icon: Layers },
    { id: 'D2_flebotomia', title: 'Dimensión 2: Flebotomía & Muestras', icon: FlaskConical },
    { id: 'D3_analizadores', title: 'Dimensión 3: Analizadores Automatizados', icon: Cpu },
    { id: 'D4_validacion', title: 'Dimensión 4: Validación & Firma Digital', icon: FileText },
    { id: 'calidad_qc', title: 'Control de Calidad (QC ISO 15189)', icon: ShieldCheck },
    { id: 'catalogo_tarifas', title: 'Catálogo de Estudios & Tarifas (Q)', icon: Sliders },
    { id: 'administracion_seguridad', title: 'Seguridad & Administración del Sistema', icon: Lock }
  ];

  // Stats calculation
  const totalUsers = staffUsers.length;
  const activeUsers = staffUsers.filter(u => u.status === 'activo').length;
  const totalRoles = staffRoles.length;
  const colegiadosCount = staffUsers.filter(u => u.licenseNumber && u.licenseNumber.length > 3).length;

  // Export Users & Roles JSON
  const handleExportUsersConfig = () => {
    const data = {
      institution: 'VACLINIC - Laboratorio Clínico',
      exportedAt: new Date().toISOString(),
      staffUsers,
      staffRoles,
      auditLogsCount: auditLogs.length
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaclinic-rbac-users-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showNotification('Configuración de personal y roles exportada exitosamente', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Breadcrumb & Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-black tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>SISTEMA DE SEGURIDAD & CONTROL DE ACCESO (RBAC)</span>
              <span className="bg-teal-500/20 text-teal-300 text-[10px] px-2 py-0.5 rounded-full border border-teal-500/30">
                ISO 15189
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gestión de Personal, Roles & Permisos
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Administre las credenciales de acceso, asignación de sedes, firmas digitales autorizadas con número de Colegiado y bitácora forense de auditoría clínica.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportUsersConfig}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-600/80 transition-all cursor-pointer shadow-sm"
              title="Descargar copia de seguridad del personal y permisos"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Exportar RBAC</span>
            </button>

            <button
              onClick={() => handleOpenUserModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-teal-900/30 cursor-pointer active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Personal</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Total Personal</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{totalUsers}</span>
              <span className="text-xs text-emerald-400 font-bold font-mono">({activeUsers} activos)</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Roles RBAC</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-teal-300">{totalRoles}</span>
              <span className="text-xs text-slate-400 font-medium">Perfiles clínicos</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Firmas Colegiadas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-300">{colegiadosCount}</span>
              <span className="text-xs text-cyan-400 font-medium font-mono">Col. QB / Méd.</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Trazabilidad ISO</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-purple-300">{auditLogs.length}</span>
              <span className="text-xs text-purple-400 font-medium">Eventos registrados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtabs Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('usuarios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'usuarios'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Directorio de Personal ({filteredUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roles_rbac')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'roles_rbac'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Matriz de Roles & Permisos (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('firmas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'firmas'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Sellos & Firmas Digitales</span>
          </button>

          <button
            onClick={() => setActiveSubTab('auditoria')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'auditoria'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Bitácora de Auditoría ({auditLogs.length})</span>
          </button>
        </div>

        {activeSubTab === 'usuarios' && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fichas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabla Detallada
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: USUARIOS & PERSONAL DIRECTORY */}
      {/* ========================================================================= */}
      {activeSubTab === 'usuarios' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, colegiado, rol, email..."
                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">Todos los Roles ({totalRoles})</option>
                {staffRoles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              {isMultiBranchEnabled && (
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">Todas las Sedes</option>
                  <option value="todas">🌐 Acceso Global</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name.split('-')[0].trim()}</option>
                  ))}
                </select>
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">Todos los Estados</option>
                <option value="activo">Solo Activos</option>
                <option value="vacaciones">En Vacaciones</option>
                <option value="inactivo">Inactivos</option>
                <option value="suspendido">Suspendidos</option>
              </select>

              {(searchQuery || roleFilter !== 'all' || branchFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setBranchFilter('all');
                    setStatusFilter('all');
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Limpiar filtros"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cards View Mode */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => {
                const isPinRevealed = !!revealedPins[user.id];
                const roleConfig = staffRoles.find(r => r.id === user.roleId);
                const activePermsCount = roleConfig ? roleConfig.defaultPermissions.length : 0;

                return (
                  <div 
                    key={user.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl ${user.avatarColor || getRoleAvatarBg(user.roleId)} text-white flex items-center justify-center font-black text-lg shadow-sm flex-shrink-0`}>
                            {user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 leading-tight">
                              {user.fullName}
                            </h3>
                            <span className="text-xs text-slate-500 font-mono block">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(user.status)}
                      </div>

                      {/* Role & Specialty Badge */}
                      <div className="mt-3 space-y-2">
                        <div className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold border ${getRoleBadgeClasses(user.roleId)}`}>
                          {user.roleName}
                        </div>

                        {user.specialty && (
                          <p className="text-xs text-slate-600 font-medium">
                            <span className="text-slate-400 font-normal">Especialidad: </span>
                            {user.specialty}
                          </p>
                        )}

                        {user.licenseNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-cyan-800 font-mono font-bold bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                            <Award className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                            <span>Colegiado: {user.licenseNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Contact & Branch Meta */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Sede de Trabajo:</span>
                          <span className="font-semibold text-slate-800">{getBranchLabel(user.assignedBranch)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-mono text-slate-700 truncate max-w-[170px]" title={user.email}>{user.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Teléfono / Celular:</span>
                          <span className="font-mono text-slate-700">{user.phone}</span>
                        </div>
                      </div>

                      {/* PIN & Security Block */}
                      <div className="mt-3 bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-xs text-slate-500 font-medium">PIN de Acceso:</span>
                          <span className="font-mono text-xs font-black text-slate-800">
                            {isPinRevealed ? user.pinCode : '••••'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => togglePinReveal(user.id)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded cursor-pointer transition-colors"
                            title={isPinRevealed ? 'Ocultar PIN' : 'Ver PIN'}
                          >
                            {isPinRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              setPinTargetUser(user);
                              setNewPinValue('');
                              setIsPinModalOpen(true);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 rounded cursor-pointer transition-colors"
                            title="Cambiar PIN"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={user.status}
                          onChange={(e) => toggleUserStatus(user.id, e.target.value as UserStatus)}
                          className="text-[11px] font-bold py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="activo">Activo</option>
                          <option value="vacaciones">Vacaciones</option>
                          <option value="inactivo">Inactivo</option>
                          <option value="suspendido">Suspendido</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenUserModal(user)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Editar información de usuario"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de eliminar al usuario ${user.fullName}?`)) {
                              deleteStaffUser(user.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar usuario del sistema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View Mode */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Personal</th>
                      <th className="py-3 px-4">Rol & Perfil</th>
                      <th className="py-3 px-4">Colegiado / Licencia</th>
                      <th className="py-3 px-4">Sede Asignada</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">PIN</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredUsers.map((user) => {
                      const isPinRevealed = !!revealedPins[user.id];
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl ${user.avatarColor || getRoleAvatarBg(user.roleId)} text-white flex items-center justify-center font-bold text-xs flex-shrink-0`}>
                                {user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{user.fullName}</span>
                                <span className="text-slate-400 font-mono text-[11px]">@{user.username} • {user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getRoleBadgeClasses(user.roleId)}`}>
                              {user.roleName}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {user.licenseNumber || <span className="text-slate-400 font-normal italic">N/A</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{getBranchLabel(user.assignedBranch)}</span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(user.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono font-bold">
                              <span>{isPinRevealed ? user.pinCode : '••••'}</span>
                              <button
                                onClick={() => togglePinReveal(user.id)}
                                className="text-slate-400 hover:text-slate-700 p-0.5"
                              >
                                {isPinRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenUserModal(user)}
                                className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Eliminar usuario ${user.fullName}?`)) {
                                    deleteStaffUser(user.id);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No se encontraron miembros del personal</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No hay resultados para los filtros seleccionados. Intente modificar el término de búsqueda o restablecer los filtros.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: MATRIZ DE ROLES & PERMISOS (RBAC) */}
      {/* ========================================================================= */}
      {activeSubTab === 'roles_rbac' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Matriz Interactiva de Permisos Clínicos (Role-Based Access Control)
                </h3>
                <p className="text-xs text-slate-500">
                  Defina los privilegios de operación por dimensión y módulo. Los cambios aplican de forma inmediata para todo el personal asociado al rol.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  Total Permisos en Catálogo: {LAB_PERMISSIONS_CATALOG.length}
                </span>
              </div>
            </div>

            {/* Interactive RBAC Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px]">
                    <th className="py-3 px-4 w-72 min-w-[260px] sticky left-0 bg-slate-900 z-10">
                      Módulo / Permiso Clínico
                    </th>
                    {staffRoles.map(role => (
                      <th key={role.id} className="py-3 px-3 text-center min-w-[130px]">
                        <span className="block font-bold text-white leading-tight">{role.name}</span>
                        <span className="text-[9px] text-teal-300 font-mono block mt-0.5">
                          ({role.defaultPermissions.length} act.)
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {permissionCategories.map(cat => {
                    const categoryPermissions = LAB_PERMISSIONS_CATALOG.filter(p => p.category === cat.id);
                    const CatIcon = cat.icon;

                    return (
                      <React.Fragment key={cat.id}>
                        {/* Category Divider Header */}
                        <tr className="bg-slate-100/90 font-black text-slate-800 text-xs">
                          <td colSpan={staffRoles.length + 1} className="py-2.5 px-4">
                            <div className="flex items-center gap-2 text-teal-800">
                              <CatIcon className="w-4 h-4 text-teal-600" />
                              <span>{cat.title}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({categoryPermissions.length} operaciones)
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Category Permission Rows */}
                        {categoryPermissions.map(perm => (
                          <tr key={perm.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4 sticky left-0 bg-white shadow-xs z-5">
                              <span className="font-bold text-slate-900 block">{perm.name}</span>
                              <span className="text-[11px] text-slate-500 leading-tight block">{perm.description}</span>
                            </td>

                            {staffRoles.map(role => {
                              const isGranted = role.defaultPermissions.includes(perm.id);

                              const handleTogglePermission = () => {
                                const newPerms = isGranted
                                  ? role.defaultPermissions.filter(p => p !== perm.id)
                                  : [...role.defaultPermissions, perm.id];
                                updateRolePermissions(role.id, newPerms);
                              };

                              return (
                                <td key={role.id} className="py-2.5 px-3 text-center">
                                  <button
                                    onClick={handleTogglePermission}
                                    className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                      isGranted
                                        ? 'bg-teal-600 text-white shadow-xs hover:bg-teal-700'
                                        : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400'
                                    }`}
                                    title={`${isGranted ? 'Revocar' : 'Otorgar'} "${perm.name}" para ${role.name}`}
                                  >
                                    {isGranted ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: FIRMAS DIGITALES & COLEGIADOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'firmas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Acreditación Profesional & Firmas Digitales Autorizadas
              </h3>
              <p className="text-xs text-slate-500">
                Los informes clínicos emitidos por VACLINIC llevan estampado el número de Colegiado Activo, sello digital institucional y código QR de validación criptográfica conforme a los estándares de salud de Guatemala.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffUsers
                .filter(u => u.roleId === 'director_laboratorio' || u.roleId === 'bioanalista_senior' || u.licenseNumber)
                .map(user => (
                  <div key={user.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                          Firma Autorizada para Informes
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">{user.fullName}</h4>
                        <p className="text-xs text-slate-500">{user.specialty}</p>
                      </div>
                      <Award className="w-8 h-8 text-teal-600 flex-shrink-0" />
                    </div>

                    {/* Stamp Simulation Badge */}
                    <div className="bg-white p-3.5 rounded-xl border-2 border-dashed border-teal-600/40 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                        <span>No. Colegiado: {user.licenseNumber || 'PENDIENTE'}</span>
                        <span className="text-emerald-600 text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ACTIVO
                        </span>
                      </div>
                      <p className="text-xs italic text-slate-600 font-serif">
                        "{user.signatureStampText || `${user.fullName} • ${user.roleName} • VACLINIC Laboratorio Clínico`}"
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Sede: {getBranchLabel(user.assignedBranch)}</span>
                        <span>Hash Criptográfico SHA-256</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">Última validación de firma:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Hoy'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: BITÁCORA DE AUDITORÍA FORENSE & CONTROL DE CALIDAD (ISO 15189) */}
      {/* ========================================================================= */}
      {activeSubTab === 'auditoria' && (
        <div className="space-y-4">
          {/* Header Action & Notification Card */}
          <div className="bg-gradient-to-r from-teal-900/90 via-slate-900 to-slate-900 text-white rounded-2xl p-5 border border-teal-700/30 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-teal-500/20 text-teal-300 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-teal-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  TRAZABILIDAD FORENSE • ISO 15189:2022
                </span>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {filteredAuditLogs.length} Registros Activos
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                Registro de Auditoría & Trazabilidad de Calidad
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                Supervisión cronológica inmutable de accesos, validaciones colegiadas, modificación de tarifas y disparos de valores de pánico en analizadores.
              </p>
            </div>

            {/* Quick Export Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleExportCsv()}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer active:scale-98"
                title="Descargar archivo CSV compatible con Excel y software de Calidad"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMonthlyQualityModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-teal-950/40 cursor-pointer active:scale-98"
                title="Generar dictamen mensual de calidad y exportar a PDF oficial"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Revisión Mensual & PDF</span>
              </button>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              
              {/* Text Search */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Buscar por usuario, acción, detalle..."
                  className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {/* Date Preset Filter */}
              <div className="relative">
                <select
                  value={auditDatePreset}
                  onChange={(e) => setAuditDatePreset(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">📅 Todo el Historial</option>
                  <option value="this_month">🗓️ Este Mes (Agosto 2026)</option>
                  <option value="last_month">🗓️ Mes Anterior (Julio 2026)</option>
                  <option value="last_30_days">⏳ Últimos 30 días</option>
                  <option value="last_90_days">⏳ Últimos 90 días</option>
                  <option value="custom">⚙️ Rango Personalizado...</option>
                </select>
              </div>

              {/* Responsible Staff Filter */}
              <div className="relative">
                <select
                  value={auditUserFilter}
                  onChange={(e) => setAuditUserFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">👤 Todos los Usuarios</option>
                  {staffUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Module Filter */}
              <div className="relative">
                <select
                  value={auditModuleFilter}
                  onChange={(e) => setAuditModuleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">🧩 Todos los Módulos</option>
                  <option value="usuarios">Usuarios & RBAC</option>
                  <option value="reportes">Informes & Firmas</option>
                  <option value="control_calidad">Control de Calidad QC</option>
                  <option value="catalogo">Catálogo & Tarifas</option>
                  <option value="episodios">Admisión & Muestras</option>
                  <option value="analizadores">Analizadores Automatizados</option>
                  <option value="seguridad">Seguridad & PIN</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="relative">
                <select
                  value={auditSeverityFilter}
                  onChange={(e) => setAuditSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">⚡ Todas las Severidades</option>
                  <option value="info">🟢 Informativo (Info)</option>
                  <option value="warning">🟡 Advertencia (Warning)</option>
                  <option value="critical">🔴 Crítico (Critical)</option>
                </select>
              </div>

            </div>

            {/* Custom Date Selector Row (Visible when Custom is selected) */}
            {auditDatePreset === 'custom' && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-fade-in text-xs bg-slate-50 p-3 rounded-xl">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-teal-600" />
                  Rango de Fechas Específico:
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-slate-500 text-[11px]">Desde:</label>
                  <input
                    type="date"
                    value={auditStartDate}
                    onChange={(e) => setAuditStartDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-slate-500 text-[11px]">Hasta:</label>
                  <input
                    type="date"
                    value={auditEndDate}
                    onChange={(e) => setAuditEndDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Filter Summary & Quick Reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Periodo activo:</span>
                <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                  {getPeriodLabel()}
                </span>
                <span>•</span>
                <span>Informativos: <b className="text-teal-700">{filteredAuditLogs.filter(l => l.severity === 'info').length}</b></span>
                <span>•</span>
                <span>Advertencias: <b className="text-amber-700">{filteredAuditLogs.filter(l => l.severity === 'warning').length}</b></span>
                <span>•</span>
                <span>Críticos: <b className="text-rose-700">{filteredAuditLogs.filter(l => l.severity === 'critical').length}</b></span>
              </div>

              {(auditSearch || auditDatePreset !== 'all' || auditUserFilter !== 'all' || auditModuleFilter !== 'all' || auditSeverityFilter !== 'all' || auditActionFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setAuditSearch('');
                    setAuditDatePreset('all');
                    setAuditStartDate('');
                    setAuditEndDate('');
                    setAuditUserFilter('all');
                    setAuditModuleFilter('all');
                    setAuditSeverityFilter('all');
                    setAuditActionFilter('all');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Audit Logs List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShieldQuestion className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No se encontraron registros de auditoría</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No hay eventos registrados que coincidan con los filtros de fecha, módulo o usuario seleccionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Fecha & Hora</th>
                      <th className="py-3 px-4">Severidad</th>
                      <th className="py-3 px-4">Personal Responsable</th>
                      <th className="py-3 px-4">Acción Realizada</th>
                      <th className="py-3 px-4">Detalle Forense</th>
                      <th className="py-3 px-4">Módulo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('es-GT', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit' 
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.severity === 'critical' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3 h-3" />
                              CRÍTICO
                            </span>
                          ) : log.severity === 'warning' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              ADVERTENCIA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                              INFO
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{log.userName}</span>
                          <span className="text-slate-400 text-[10px]">{log.userRole}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-md">
                          {log.details}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-block bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                            {log.module}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR / EDITAR USUARIO */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  {editingUser ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingUser ? 'Editar Miembro del Personal' : 'Registrar Nuevo Personal'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure las credenciales de acceso, asignación y perfil clínico en VACLINIC.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Ej. Licda. Sofía Morales"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Usuario / Identificador *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="Ej. smorales"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Institucional
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="smorales@vacliniclab.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+502 5612-5563"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rol Principal (RBAC) *
                  </label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value as LabStaffRole })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white cursor-pointer"
                  >
                    {staffRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sede Asignada *
                  </label>
                  <select
                    value={formData.assignedBranch}
                    onChange={(e) => setFormData({ ...formData, assignedBranch: e.target.value as BranchSiteId | 'todas' })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white cursor-pointer"
                  >
                    <option value="todas">🌐 Todas las Sedes (Global)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>📍 {b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Especialidad Clínica
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Ej. Bioquímica Clínica / Hematología"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Colegiado / Licencia Profesional
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="Ej. COL-QB-4892-GT"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN de Seguridad (4 Dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white cursor-pointer"
                  >
                    <option value="activo">Activo (Acceso Total)</option>
                    <option value="vacaciones">En Vacaciones</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Texto del Sello Profesional / Firma Digital
                </label>
                <input
                  type="text"
                  value={formData.signatureStampText}
                  onChange={(e) => setFormData({ ...formData, signatureStampText: e.target.value })}
                  placeholder="Ej. Dra. Carmen Alicia Morales • Col. QB 4892 • Directora Técnica VACLINIC"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-teal-900/20 cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios' : 'Registrar Personal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESETEAR PIN */}
      {/* ========================================================================= */}
      {isPinModalOpen && pinTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Restablecer PIN</h3>
                <p className="text-xs text-slate-500">{pinTargetUser.fullName}</p>
              </div>
            </div>

            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nuevo PIN Numérico (4 Dígitos)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  value={newPinValue}
                  onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Confirmar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REVISIÓN MENSUAL DE CALIDAD & EXPORTACIÓN PDF (ISO 15189) */}
      {/* ========================================================================= */}
      {isMonthlyQualityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-6 space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-md shadow-teal-900/20">
                  <Award className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      Control de Calidad Mensual
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      ISO 15189:2022
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    Dictamen Mensual de Auditoría & Trazabilidad
                  </h3>
                  <p className="text-xs text-slate-500">
                    Genere informes ejecutivos certificados para auditorías periódicas y revisiones de la dirección.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMonthlyQualityModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Mes de Revisión de Calidad
                </label>
                <select
                  value={monthlyReportMonth}
                  onChange={(e) => setMonthlyReportMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-xs"
                >
                  <option value="2026-08">Agosto 2026 (Mes Actual)</option>
                  <option value="2026-07">Julio 2026 (Mes Anterior)</option>
                  <option value="2026-06">Junio 2026</option>
                  <option value="2026-05">Mayo 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  Auditor / Director que Emite el Dictamen
                </label>
                <select
                  value={monthlyAuditorUserId}
                  onChange={(e) => setMonthlyAuditorUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-xs"
                >
                  {staffUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.licenseNumber ? `Col. ${user.licenseNumber}` : user.roleName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly Metrics KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Eventos en Mes</span>
                <span className="text-xl font-black text-slate-900">{monthlyAssistantLogs.length}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Bitácora completa</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Acciones Críticas</span>
                <span className="text-xl font-black text-rose-800">
                  {monthlyAssistantLogs.filter(l => l.severity === 'critical').length}
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5">Valores de pánico</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Advertencias QC</span>
                <span className="text-xl font-black text-amber-800">
                  {monthlyAssistantLogs.filter(l => l.severity === 'warning').length}
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">Calibraciones / PIN</span>
              </div>
              <div className="bg-teal-50 border border-teal-200 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-teal-700 uppercase block">Conformidad</span>
                <span className="text-xl font-black text-teal-800">100%</span>
                <span className="text-[10px] text-teal-600 block mt-0.5">ISO 15189 Trazable</span>
              </div>
            </div>

            {/* Auditor Quality Notes / Conclusions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Conclusiones y Dictamen del Auditor de Calidad (Aparecerá en el PDF)
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Editable</span>
              </label>
              <textarea
                rows={3}
                value={monthlyReviewNotes}
                onChange={(e) => setMonthlyReviewNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
                placeholder="Escriba las observaciones del dictamen de calidad..."
              />
            </div>

            {/* Visual Document Preview Header */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-teal-600" />
                  Vista Previa del Documento Certificado (A4)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {monthlyAssistantLogs.length} registros incluidos
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-inner space-y-2.5 max-h-48 overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="font-bold text-slate-900">VACLINIC — Laboratorio Clínico Especializado</div>
                  <div className="text-[10px] text-slate-500 font-mono">Periodo: {monthlyReportMonth}</div>
                </div>
                <div className="text-[11px] text-slate-600 italic">
                  "{monthlyReviewNotes}"
                </div>
                <div className="text-[10px] text-slate-500">
                  Firmante: <b>{staffUsers.find(u => u.id === monthlyAuditorUserId)?.fullName}</b> • No. Colegiado: {staffUsers.find(u => u.id === monthlyAuditorUserId)?.licenseNumber || 'Col. Activo'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportCsv(monthlyAssistantLogs, `Mes de ${monthlyReportMonth}`)}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Exportar CSV de {monthlyReportMonth}
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMonthlyQualityModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={() => handleExportPdf(monthlyReportMonth)}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-teal-900/20 cursor-pointer flex items-center gap-2"
                >
                  {isExportingPdf ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar Informe PDF Oficial (A4)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ELEMENTO OCULTO PARA EXPORTACIÓN DIRECTA A PDF (ESTILO OFICIAL A4) */}
      {/* ========================================================================= */}
      <div className="overflow-hidden h-0 w-0 pointer-events-none opacity-0">
        <div 
          ref={auditReportPrintRef}
          style={{ width: '800px', backgroundColor: '#ffffff', color: '#0f172a', padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Header */}
          <div style={{ borderBottom: '2px solid #0d9488', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
                VACLINIC • LABORATORIO CLÍNICO & BIOLOGÍA MOLECULAR
              </div>
              <div style={{ fontSize: '11px', color: '#0d9488', fontWeight: 'bold', marginTop: '2px' }}>
                DEPARTAMENTO DE GESTIÓN DE CALIDAD & AUDITORÍA FORENSE (ISO 15189:2022)
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                Guatemala, C.A. • PBX: (502) 2234-5678 • Registro Sanitario MSPAS No. LAB-2026-089
              </div>
            </div>
            <div style={{ textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>DICTAMEN No.</div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', fontFamily: 'monospace' }}>AUD-{monthlyReportMonth.replace('-', '')}-089</div>
              <div style={{ fontSize: '9px', color: '#0d9488', fontWeight: 'bold', marginTop: '2px' }}>ACREDITACIÓN VIGENTE</div>
            </div>
          </div>

          {/* Document Meta */}
          <div style={{ backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Periodo de Auditoría</span>
              <strong style={{ color: '#0f172a' }}>{monthlyReportMonth === '2026-08' ? 'Agosto 2026' : monthlyReportMonth === '2026-07' ? 'Julio 2026' : monthlyReportMonth}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Auditor Responsable</span>
              <strong style={{ color: '#0f172a' }}>{staffUsers.find(u => u.id === monthlyAuditorUserId)?.fullName || 'Dra. Carmen Alicia Morales'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Fecha de Emisión</span>
              <strong style={{ color: '#0f172a' }}>29 de Agosto de 2026</strong>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px', fontSize: '11px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold' }}>TOTAL EVENTOS</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>{monthlyAssistantLogs.length}</div>
            </div>
            <div style={{ border: '1px solid #fecdd3', backgroundColor: '#fff1f2', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#be123c', fontWeight: 'bold' }}>EVENTOS CRÍTICOS</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#be123c', marginTop: '2px' }}>{monthlyAssistantLogs.filter(l => l.severity === 'critical').length}</div>
            </div>
            <div style={{ border: '1px solid #fde68a', backgroundColor: '#fffbeb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#b45309', fontWeight: 'bold' }}>ADVERTENCIAS</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#b45309', marginTop: '2px' }}>{monthlyAssistantLogs.filter(l => l.severity === 'warning').length}</div>
            </div>
            <div style={{ border: '1px solid #99f6e4', backgroundColor: '#f0fdfa', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#0f766e', fontWeight: 'bold' }}>TRAZABILIDAD</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f766e', marginTop: '2px' }}>100% ISO</div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Extracto de Registro Cronológico & Bitácora de Acciones
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', border: '1px solid #334155' }}>Fecha/Hora</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #334155' }}>Sev.</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #334155' }}>Personal Responsable</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #334155' }}>Acción</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #334155' }}>Detalle Forense</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #334155' }}>Módulo</th>
                </tr>
              </thead>
              <tbody>
                {monthlyAssistantLogs.slice(0, 15).map((log, idx) => (
                  <tr key={log.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString('es-GT', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: log.severity === 'critical' ? '#e11d48' : log.severity === 'warning' ? '#d97706' : '#0d9488' }}>
                      {log.severity.toUpperCase()}
                    </td>
                    <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                      {log.userName}
                    </td>
                    <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', color: '#475569', maxWidth: '240px' }}>
                      {log.details}
                    </td>
                    <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '8.5px' }}>
                      {log.module}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {monthlyAssistantLogs.length > 15 && (
              <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', marginTop: '6px', fontStyle: 'italic' }}>
                * Mostrando los 15 eventos más relevantes del periodo evaluado. El registro íntegro de {monthlyAssistantLogs.length} eventos queda resguardado en la base de datos inmutable.
              </div>
            )}
          </div>

          {/* Auditor Conclusion */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc', marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginBottom: '4px' }}>
              Dictamen y Conclusiones del Comité de Calidad:
            </div>
            <div style={{ fontSize: '10px', color: '#334155', lineHeight: '1.5', fontStyle: 'italic' }}>
              "{monthlyReviewNotes}"
            </div>
          </div>

          {/* Signatures & Stamp */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', fontSize: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#0d9488', fontFamily: 'cursive', fontSize: '15px' }}>
                  {staffUsers.find(u => u.id === monthlyAuditorUserId)?.fullName || 'Dra. Carmen Alicia Morales'}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 'bold', color: '#0f172a' }}>
                {staffUsers.find(u => u.id === monthlyAuditorUserId)?.fullName || 'Dra. Carmen Alicia Morales V.'}
              </div>
              <div style={{ color: '#64748b' }}>
                {staffUsers.find(u => u.id === monthlyAuditorUserId)?.licenseNumber ? `Colegiado No. ${staffUsers.find(u => u.id === monthlyAuditorUserId)?.licenseNumber}` : 'Director de Laboratorio'}
              </div>
              <div style={{ fontSize: '9px', color: '#0d9488', fontWeight: 'bold', marginTop: '2px' }}>
                Firma Digital & Sello Criptográfico SHA-256
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ border: '1.5px dashed #0d9488', borderRadius: '4px', padding: '4px 10px', color: '#0d9488', fontSize: '9px', fontWeight: 'bold' }}>
                  SELLO INSTITUCIONAL CALIDAD ISO 15189
                </div>
              </div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 'bold', color: '#0f172a' }}>
                Comité de Acreditación & Control de Calidad
              </div>
              <div style={{ color: '#64748b' }}>
                VACLINIC Laboratorio Clínico Central
              </div>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                Documento de Control Interno y Auditoría Externa
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
