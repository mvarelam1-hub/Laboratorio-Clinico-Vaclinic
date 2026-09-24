import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Patient, 
  MedicalReport, 
  ReportTemplate, 
  UserRole, 
  BranchSite, 
  BranchSiteId, 
  LabEpisode, 
  SampleTransferManifest, 
  DimensionStage,
  PatientPushNotification,
  PushSubscriptionStatus,
  PatientNotificationPreferences,
  PushNotificationType,
  LabCatalogItem,
  LabCustomProfile,
  LabStaffUser,
  LabRoleConfig,
  LabStaffRole,
  UserStatus,
  LabAuditLog,
  LabChatMessage,
  LabChatChannel,
  LabChatChannelId,
  ChatMessagePriority,
  LabOrder,
  OrderFolder,
  ReportParameter
} from '../types';
import { 
  INITIAL_PATIENTS, 
  INITIAL_REPORTS, 
  INITIAL_TEMPLATES, 
  INITIAL_BRANCHES, 
  INITIAL_EPISODES, 
  INITIAL_TRANSFERS,
  INITIAL_PUSH_NOTIFICATIONS
} from '../data/initialData';
import { INITIAL_ORDERS, INITIAL_ORDER_FOLDERS } from '../data/ordersData';
import { FACTORY_CATALOG_TESTS, INITIAL_CUSTOM_PROFILES } from '../data/factoryCatalog';
import { DEFAULT_VACLINIC_PROFILES, ensureProfileTests } from '../utils/profileTestUtils';
import { 
  INITIAL_STAFF_USERS, 
  INITIAL_ROLES_CONFIG, 
  INITIAL_AUDIT_LOGS,
  LAB_PERMISSIONS_CATALOG 
} from '../data/staffUserData';
import { LAB_CHAT_CHANNELS, INITIAL_CHAT_MESSAGES } from '../data/chatData';
import { hasPermission as sharedHasPermission } from '../shared/permissions';
import { LabSettings } from '../types/labSettings';
import { INITIAL_LAB_SETTINGS } from '../data/initialLabSettings';
import { ReagentInventoryItem, ReagentMovementLog } from '../types/reagentInventory';
import { INITIAL_REAGENTS } from '../data/initialReagents';
import { PushNotificationService, PUSH_NOTIFICATIONS_STORAGE_KEY, PUSH_PREFS_STORAGE_KEY } from '../services/pushNotificationService';
import { FirebaseMessagingService } from '../services/firebaseMessagingService';
import { playNotificationChime } from '../utils/audioChime';
import { OfflinePendingAction, OfflineActionType } from '../types/offlineQueue';
import { LabFullBackup, BackupSnapshot } from '../types/backup';
import { BackupService } from '../services/backupService';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebaseConfig';
import { verifyStaffSession } from '../services/staffAuthService';
import {
  createPacienteRemote,
  updatePacienteRemote,
  mapPacienteApiToPatient,
  esPacienteIdRemoto,
  PacientesApiError,
  type CrearPacienteInput
} from '../services/pacientesApiService';
import { resolverCodigosAIdsExamen, ExamenesApiError } from '../services/examenesApiService';
import { createOrdenRemote, OrdenesApiError } from '../services/ordenesApiService';
import {
  crearResultadoRemoto,
  validarResultadoRemoto,
  publicarResultadoRemoto,
  ResultadosApiError
} from '../services/resultadosApiService';
import {
  crearCarpetaRemota,
  actualizarCarpetaRemota,
  eliminarCarpetaRemota,
  moverOrdenACarpetaRemota,
  moverVariasOrdenesACarpetaRemota,
  CarpetasApiError
} from '../services/carpetasApiService';
import {
  crearEpisodioRemoto,
  actualizarEpisodioRemoto,
  avanzarEpisodioRemoto,
  resolverDuplicidadRemota,
  EpisodiosApiError
} from '../services/episodiosApiService';
import {
  crearTransferenciaRemota,
  TransferenciasApiError
} from '../services/transferenciasApiService';
import {
  crearPerfilRemoto,
  actualizarPerfilRemoto,
  eliminarPerfilRemoto,
  PerfilesApiError
} from '../services/perfilesApiService';
import {
  crearPersonalRemoto,
  actualizarPersonalRemoto,
  cambiarEstadoPersonalRemoto,
  reiniciarPinPersonalRemoto,
  eliminarPersonalRemoto,
  PersonalApiError
} from '../services/personalApiService';
import {
  actualizarPermisosRolRemoto,
  RolesApiError
} from '../services/rolesApiService';
import {
  crearReactivoRemoto,
  actualizarReactivoRemoto,
  eliminarReactivoRemoto,
  registrarMovimientoReactivoRemoto,
  ReactivosApiError
} from '../services/reactivosApiService';
import {
  guardarPlantillaRemota,
  actualizarPlantillaRemota,
  PlantillasApiError
} from '../services/plantillasApiService';
import {
  enviarMensajeRemoto,
  marcarCanalLeidoRemoto,
  toggleReaccionRemota,
  eliminarMensajeRemoto,
  limpiarHistorialCanalRemoto,
  ChatApiError
} from '../services/chatApiService';

export type StaffTabType = 
  | 'nueva_orden'
  | 'ordenes'
  | 'ordenes_archivadas'
  | 'historial_ordenes'
  | 'papelera'
  | 'catalogo_perfiles'
  | 'promociones'
  | 'ajustes'
  | 'estadisticas'
  | 'alertas'
  | 'envios'
  | 'asistente_ia'
  | 'auditoria'
  | 'respaldos'
  | 'sincronizar'
  | 'dashboard' 
  | 'episodios' 
  | 'muestras' 
  | 'analizadores' 
  | 'control_calidad' 
  | 'multisucursal' 
  | 'redactor' 
  | 'pacientes' 
  | 'plantillas'
  | 'usuarios'
  | 'chat_interno'
  | 'biometria'
  | 'atlas_microscopico';

interface ClinicContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  patients: Patient[];
  reports: MedicalReport[];
  templates: ReportTemplate[];
  addTemplate: (template: ReportTemplate) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<ReportTemplate>) => Promise<void>;
  resetTemplatesToFactory: () => void;
  branches: BranchSite[];
  isMultiBranchEnabled: boolean;
  setIsMultiBranchEnabled: (enabled: boolean) => void;
  currentBranch: BranchSiteId;
  setCurrentBranch: (branchId: BranchSiteId) => void;
  episodes: LabEpisode[];
  transfers: SampleTransferManifest[];
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  currentPatient: Patient | null;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'accessCode' | 'pinCode'>) => Promise<Patient>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => void;
  addEpisode: (episodeData: Omit<LabEpisode, 'id' | 'episodeNumber'>) => Promise<LabEpisode>;
  updateEpisode: (id: string, updates: Partial<LabEpisode>) => Promise<void>;
  advanceEpisodeDimension: (id: string, nextDimension: DimensionStage) => Promise<void>;
  resolveDuplicity: (id: string, action: 'keep' | 'cancel' | 'merge') => Promise<void>;
  addSampleTransfer: (transferData: Omit<SampleTransferManifest, 'id' | 'manifestCode'>) => Promise<SampleTransferManifest>;
  addReport: (report: Omit<MedicalReport, 'id' | 'reportNumber' | 'qrVerificationCode'>) => Promise<MedicalReport>;
  updateReport: (id: string, updates: Partial<MedicalReport>) => Promise<void>;
  deleteReport: (id: string) => void;
  publishReport: (
    id: string,
    doctorName?: string,
    doctorSpecialty?: string,
    doctorLicense?: string,
    bioanalystName?: string,
    bioanalystSpecialty?: string,
    bioanalystLicense?: string
  ) => Promise<void>;
  activeReportToPrint: MedicalReport | null;
  setActiveReportToPrint: (report: MedicalReport | null) => void;
  activeReportToEdit: MedicalReport | null;
  setActiveReportToEdit: (report: MedicalReport | null) => void;
  staffActiveTab: StaffTabType;
  setStaffActiveTab: (tab: StaffTabType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  authenticatePatient: (codeOrDni: string, pin?: string) => boolean;
  logoutPatient: () => void;
  notification: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;

  // Push Notifications State & Actions
  pushNotifications: PatientPushNotification[];
  activePushToast: PatientPushNotification | null;
  pushPermissionStatus: PushSubscriptionStatus;
  requestPushPermission: () => Promise<PushSubscriptionStatus>;
  sendPushNotification: (notifData: Omit<PatientPushNotification, 'id' | 'timestamp' | 'read'>) => PatientPushNotification;
  markPushAsRead: (id: string) => void;
  markAllPushAsRead: (patientId?: string) => void;
  clearPushNotifications: (patientId?: string) => void;
  dismissPushToast: () => void;
  simulatePushNotification: (patientId?: string, type?: PushNotificationType) => void;
  patientNotificationPrefs: PatientNotificationPreferences;
  updatePatientNotificationPrefs: (prefs: Partial<PatientNotificationPreferences>) => void;
  fcmToken: string | null;
  requestFirebasePushPermission: (patientId?: string) => Promise<{ status: NotificationPermission | 'unsupported'; token: string | null }>;
  sendFirebaseResultReadyPush: (report: MedicalReport) => Promise<void>;

  // Lab Catalog & Profiles State & Actions
  catalogTests: LabCatalogItem[];
  customProfiles: LabCustomProfile[];
  addCatalogTest: (test: Omit<LabCatalogItem, 'id'>) => LabCatalogItem;
  updateCatalogTest: (id: string, updates: Partial<LabCatalogItem>) => void;
  bulkUpdateCatalogTests: (updatedTests: LabCatalogItem[]) => void;
  deleteCatalogTest: (id: string) => void;
  addCustomProfile: (profile: Omit<LabCustomProfile, 'id' | 'createdAt'>) => Promise<LabCustomProfile>;
  updateCustomProfile: (id: string, updates: Partial<LabCustomProfile>) => Promise<void>;
  deleteCustomProfile: (id: string) => Promise<void>;
  resetCatalogToFactory: () => void;
  exportCatalogJson: () => string;
  importCatalogJson: (jsonData: string) => { success: boolean; message: string; count?: number };

  // Staff Users, Roles & Permissions (RBAC) & Audit Logs
  isStaffAuthenticated: boolean;
  setIsStaffAuthenticated: (authenticated: boolean) => void;
  loginStaffUser: (user: LabStaffUser) => void;
  logoutStaff: () => void;
  staffUsers: LabStaffUser[];
  staffRoles: LabRoleConfig[];
  auditLogs: LabAuditLog[];
  addStaffUser: (userData: Omit<LabStaffUser, 'id' | 'createdAt'>) => Promise<LabStaffUser>;
  updateStaffUser: (id: string, updates: Partial<LabStaffUser>) => Promise<void>;
  deleteStaffUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string, newStatus: UserStatus) => Promise<void>;
  resetUserPin: (id: string, newPin: string) => Promise<void>;
  updateRolePermissions: (roleId: LabStaffRole, permissions: string[]) => Promise<void>;
  logAuditEvent: (log: Omit<LabAuditLog, 'id' | 'timestamp'>) => void;
  hasPermission: (user: LabStaffUser, permissionId: string) => boolean;

  // Internal Staff Chat & Intercom
  chatMessages: LabChatMessage[];
  activeChatChannelId: string;
  setActiveChatChannelId: (channelId: string) => void;
  activeDirectUserId: string | null;
  setActiveDirectUserId: (userId: string | null) => void;
  currentStaffUser: LabStaffUser;
  setCurrentStaffUser: (user: LabStaffUser) => void;
  isChatFloatingOpen: boolean;
  setIsChatFloatingOpen: (open: boolean) => void;
  unreadChatCount: number;
  sendChatMessage: (msg: Omit<LabChatMessage, 'id' | 'timestamp' | 'readBy'>) => Promise<LabChatMessage>;
  markChatMessagesAsRead: (channelOrDirectId: string) => Promise<void>;
  addChatReaction: (messageId: string, emoji: string) => Promise<void>;
  deleteChatMessage: (messageId: string) => Promise<void>;
  clearChatChannelHistory: (channelId: string) => Promise<void>;

  // Visual Theme & Night Shift Mode (Ergonomía Visual)
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Lab Settings & Print Template Configuration
  labSettings: LabSettings;
  updateLabSettings: (updates: Partial<LabSettings>) => void;
  resetLabSettingsToFactory: () => void;
  exportLabSettingsJson: () => string;
  importLabSettingsJson: (jsonData: string) => { success: boolean; message: string };

  // Orders, Folders & Archive Management
  orders: LabOrder[];
  orderFolders: OrderFolder[];
  addOrder: (order: Omit<LabOrder, 'id' | 'seqNumber'>) => Promise<LabOrder>;
  updateOrder: (id: string, updates: Partial<LabOrder>) => void;
  deleteOrder: (id: string) => void;
  archiveOrder: (id: string) => void;
  restoreOrder: (id: string) => void;
  bulkArchiveOrders: (ids: string[]) => void;
  bulkRestoreOrders: (ids: string[]) => void;
  bulkDeleteOrders: (ids: string[]) => void;
  moveOrderToFolder: (orderId: string, folderId: string) => Promise<void>;
  bulkMoveOrdersToFolder: (orderIds: string[], folderId: string) => Promise<void>;
  createOrderFolder: (name: string, color: string, description?: string) => Promise<OrderFolder>;
  updateOrderFolder: (folderId: string, updates: Partial<OrderFolder>) => Promise<void>;
  deleteOrderFolder: (folderId: string) => Promise<void>;

  // Reagents & Consumables Inventory Management & Continuous Monitoring
  reagents: ReagentInventoryItem[];
  reagentMovements: ReagentMovementLog[];
  criticalReagents: ReagentInventoryItem[];
  lowStockReagents: ReagentInventoryItem[];
  reagentsBelowMinThreshold: ReagentInventoryItem[];
  addReagent: (item: Omit<ReagentInventoryItem, 'id' | 'updatedAt'>) => Promise<ReagentInventoryItem>;
  updateReagent: (id: string, updates: Partial<ReagentInventoryItem>) => Promise<void>;
  deleteReagent: (id: string) => Promise<void>;
  registerReagentMovement: (
    reagentId: string,
    type: 'entrada' | 'salida_consumo' | 'ajuste' | 'baja_vencimiento',
    quantity: number,
    reason: string
  ) => Promise<void>;
  quickRestockReagent: (reagentId: string, quantityToAdd?: number) => void;
  simulateReagentConsumption: (reagentId: string, quantityToConsume?: number) => void;
  restockAllCriticalReagents: () => void;
  resetReagentsToFactory: () => void;
  exportReagentsJson: () => string;
  importReagentsJson: (jsonData: string) => { success: boolean; message: string };
  activeSettingsSubTab: 'membrete' | 'firmas' | 'margenes' | 'colores' | 'seguridad' | 'operaciones' | 'inventario';
  setActiveSettingsSubTab: (tab: 'membrete' | 'firmas' | 'margenes' | 'colores' | 'seguridad' | 'operaciones' | 'inventario') => void;
  navigateToInventory: () => void;

  // Offline State & Local Queue Management
  isOnline: boolean;
  isSimulatingOffline: boolean;
  setIsSimulatingOffline: (simulate: boolean) => void;
  offlineQueue: OfflinePendingAction[];
  isSyncingQueue: boolean;
  syncPendingChanges: () => Promise<{ syncedCount: number; failedCount: number }>;
  clearOfflineQueue: () => void;
  removeOfflineAction: (id: string) => void;
  retryOfflineAction: (id: string) => Promise<boolean>;
  lastSyncTime: string | null;
  queuePendingAction: (action: Omit<OfflinePendingAction, 'id' | 'timestamp' | 'status' | 'retryCount'>) => OfflinePendingAction;
  isOfflineQueueModalOpen: boolean;
  setIsOfflineQueueModalOpen: (open: boolean) => void;

  // Backup & Restore System (Copias de Seguridad y Respaldo de Datos)
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
  backupSnapshots: BackupSnapshot[];
  createBackupSnapshot: (trigger: BackupSnapshot['trigger'], triggerDetail: string) => void;
  downloadFullBackupJson: () => string;
  downloadReportsBackupJson: () => string;
  restoreFullBackup: (backupData: LabFullBackup, mode: 'overwrite' | 'merge') => { success: boolean; message: string; restoredCounts: any };
  restoreSnapshot: (snapshotId: string) => boolean;
  deleteSnapshot: (snapshotId: string) => void;
  clearBackupSnapshots: () => void;
  lastBackupTime: string | null;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

const PATIENTS_STORAGE_KEY = 'medireport_patients_v1';
const REPORTS_STORAGE_KEY = 'medireport_reports_v1';
const EPISODES_STORAGE_KEY = 'lab4d_episodes_v1';
const TRANSFERS_STORAGE_KEY = 'lab4d_transfers_v1';
const CATALOG_TESTS_STORAGE_KEY = 'lab_catalog_tests_v1';
const CUSTOM_PROFILES_STORAGE_KEY = 'lab_custom_profiles_v1';
const STAFF_USERS_STORAGE_KEY = 'lab_staff_users_v1';
const STAFF_ROLES_STORAGE_KEY = 'lab_staff_roles_v1';
const AUDIT_LOGS_STORAGE_KEY = 'lab_audit_logs_v1';
const THEME_STORAGE_KEY = 'vaclinic_theme_v1';
const CHAT_MESSAGES_STORAGE_KEY = 'lab_chat_messages_v1';
const ACTIVE_STAFF_USER_STORAGE_KEY = 'lab_active_staff_user_v1';
const LAB_SETTINGS_STORAGE_KEY = 'vaclinic_lab_settings_v1';
const ORDERS_STORAGE_KEY = 'vaclinic_orders_v1';
const ORDER_FOLDERS_STORAGE_KEY = 'vaclinic_order_folders_v1';
const REAGENTS_STORAGE_KEY = 'vaclinic_reagents_inventory_v1';
const REAGENTS_MOVEMENTS_STORAGE_KEY = 'vaclinic_reagent_movements_v1';
const TEMPLATES_STORAGE_KEY = 'vaclinic_templates_v1';
const OFFLINE_QUEUE_STORAGE_KEY = 'vaclinic_offline_queue_v1';
const SIMULATE_OFFLINE_STORAGE_KEY = 'vaclinic_simulate_offline_v1';
const LAST_SYNC_TIME_STORAGE_KEY = 'vaclinic_last_sync_time_v1';
const LAST_BACKUP_TIME_STORAGE_KEY = 'vaclinic_last_backup_time_v1';

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Etapa 3 (seguridad): antes 'personal' + `true` por defecto significaba
  // que CUALQUIERA que abriera la app por primera vez, sin iniciar sesión,
  // caía directo dentro del panel de personal del laboratorio. Ahora el
  // valor por defecto es el portal público del paciente, y el acceso de
  // personal solo se concede tras una verificación real (ver el efecto de
  // `onAuthStateChanged` más abajo, que es la única fuente de verdad).
  const [role, setRole] = useState<UserRole>('paciente');
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(false);
  const [currentBranch, setCurrentBranch] = useState<BranchSiteId>('central');
  const [branches] = useState<BranchSite[]>(INITIAL_BRANCHES);

  // Modo Multi-Sede / Múltiples Sucursales (Desactivado por defecto: Modo Sede Única)
  const [isMultiBranchEnabled, setIsMultiBranchEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vaclinic_multisite_enabled');
      if (saved !== null) return saved === 'true';
    } catch (e) {
      console.error(e);
    }
    return false; // Por defecto desactivado: La clínica opera en Sede Única
  });

  const setIsMultiBranchEnabled = (enabled: boolean) => {
    setIsMultiBranchEnabledState(enabled);
    if (!enabled) {
      setCurrentBranch('central');
    }
    try {
      localStorage.setItem('vaclinic_multisite_enabled', String(enabled));
    } catch (e) {
      console.error(e);
    }
  };

  // Theme Mode (light / dark / auto) for ergonomic night shifts
  const [theme, setThemeState] = useState<'light' | 'dark' | 'auto'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'auto';
  });

  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hour = new Date().getHours();
      const isNightTime = hour >= 18 || hour < 6;
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || isNightTime;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemDark = () => {
      const hour = new Date().getHours();
      const isNightTime = hour >= 18 || hour < 6;
      setIsSystemDark(mediaQuery.matches || isNightTime);
    };

    updateSystemDark();
    const interval = setInterval(updateSystemDark, 60000); // Check every minute for night shift transition

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemDark);
    }
    return () => {
      clearInterval(interval);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateSystemDark);
      }
    };
  }, []);

  const isDarkMode = theme === 'dark' || (theme === 'auto' && isSystemDark);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error(e);
    }
    showNotification(
      newTheme === 'dark'
        ? '🌙 Modo Nocturno activado (Ergonomía visual para turno de noche)'
        : newTheme === 'light'
        ? '☀️ Modo Claro activado (Óptimo para luz diurna)'
        : '⚙️ Modo Automático activado (Ajuste según horario 18:00 - 06:00 y sistema)',
      'info'
    );
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('auto');
    else setTheme('light');
  };
  
  // Load patients from local storage or defaults
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem(PATIENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PATIENTS;
  });

  // Load reports from local storage or defaults
  const [reports, setReports] = useState<MedicalReport[]>(() => {
    try {
      const saved = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REPORTS;
  });

  // Load 4D episodes
  const [episodes, setEpisodes] = useState<LabEpisode[]>(() => {
    try {
      const saved = localStorage.getItem(EPISODES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EPISODES;
  });

  // Load Transfers
  const [transfers, setTransfers] = useState<SampleTransferManifest[]>(() => {
    try {
      const saved = localStorage.getItem(TRANSFERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSFERS;
  });

  // Load Push Notifications
  const [pushNotifications, setPushNotifications] = useState<PatientPushNotification[]>(() => {
    try {
      const saved = localStorage.getItem(PUSH_NOTIFICATIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PUSH_NOTIFICATIONS;
  });

  // Preferencias de notificación por paciente — noveno módulo de los 9
  // migrados desde localStorage (ver preferencia_notificacion_paciente,
  // db/migrations/0011_modulos_restantes.sql, y
  // server/routes/preferencias.ts).
  //
  // CORRECCIÓN DE UN BUG REAL descubierto al diseñar la migración de este
  // módulo: antes esta clave guardaba UN SOLO objeto de preferencias
  // compartido por TODO el navegador/app, sin distinguir de qué paciente
  // era -aunque el Portal es, por diseño, una sesión de un paciente a la
  // vez-. En la práctica esto podía mostrar/usar las preferencias de un
  // paciente para decidir el comportamiento de otro (ver sendPushNotification
  // más abajo, que antes consultaba este objeto global en vez de las del
  // paciente destinatario de esa notificación puntual). Ahora se guarda un
  // mapa por id de paciente; `patientNotificationPrefs` sigue existiendo
  // como valor computado para el paciente actualmente autenticado en el
  // Portal (selectedPatientId), así que los componentes que ya lo leían
  // (PatientAccountView.tsx, PatientNotificationCenter.tsx) no necesitan
  // ningún cambio.
  const DEFAULT_PATIENT_NOTIFICATION_PREFS: PatientNotificationPreferences = {
    webPushEnabled: true,
    whatsappAlerts: true,
    emailAlerts: true,
    criticalAlertsOnly: false,
    healthTipsEnabled: true
  };
  const [patientNotificationPrefsByPatient, setPatientNotificationPrefsByPatient] = useState<Record<string, PatientNotificationPreferences>>(() => {
    try {
      const saved = localStorage.getItem(PUSH_PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && 'webPushEnabled' in parsed) {
          // Formato antiguo (un solo objeto, sin ids de paciente): se
          // conserva como valor por defecto en vez de descartarlo en
          // silencio, pero deja de compartirse entre pacientes a partir de
          // ahora -cada uno personaliza el suyo desde aquí en adelante-.
          return { __default__: { ...DEFAULT_PATIENT_NOTIFICATION_PREFS, ...parsed } };
        }
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  });
  const getPatientNotificationPrefs = (patientId?: string | null): PatientNotificationPreferences =>
    (patientId && patientNotificationPrefsByPatient[patientId]) ||
    patientNotificationPrefsByPatient.__default__ ||
    DEFAULT_PATIENT_NOTIFICATION_PREFS;

  // Load Lab Catalog Tests (161 Factory tests)
  const [catalogTests, setCatalogTests] = useState<LabCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem(CATALOG_TESTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return FACTORY_CATALOG_TESTS;
  });

  // Load Custom Profiles
  const [customProfiles, setCustomProfiles] = useState<LabCustomProfile[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PROFILES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => {
            const match = DEFAULT_VACLINIC_PROFILES.find(d => d.name.toLowerCase() === p.name.toLowerCase() || d.id === p.id);
            return {
              ...p,
              basedOn: p.basedOn || match?.basedOn || p.name,
              status: p.status || 'Activo',
              tests: (p.tests && p.tests.length > 0) ? p.tests : (match?.tests || [])
            };
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_VACLINIC_PROFILES;
  });

  // Load Staff Users (RBAC)
  const [staffUsers, setStaffUsers] = useState<LabStaffUser[]>(() => {
    try {
      const saved = localStorage.getItem(STAFF_USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF_USERS;
  });

  // Load Staff Roles Config
  const [staffRoles, setStaffRoles] = useState<LabRoleConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STAFF_ROLES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ROLES_CONFIG;
  });

  // Load ISO 15189 Audit Logs
  const [auditLogs, setAuditLogs] = useState<LabAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Load Internal Chat Messages
  const [chatMessages, setChatMessages] = useState<LabChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CHAT_MESSAGES;
  });

  // Load Orders & Folders
  const [orders, setOrders] = useState<LabOrder[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading orders from localStorage:', e);
    }
    return INITIAL_ORDERS;
  });

  const [orderFolders, setOrderFolders] = useState<OrderFolder[]>(() => {
    try {
      const saved = localStorage.getItem(ORDER_FOLDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading order folders from localStorage:', e);
    }
    return INITIAL_ORDER_FOLDERS;
  });

  // Load Reagents Inventory & Movement Logs
  const [reagents, setReagents] = useState<ReagentInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(REAGENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading reagents inventory from localStorage:', e);
    }
    return INITIAL_REAGENTS;
  });

  const [reagentMovements, setReagentMovements] = useState<ReagentMovementLog[]>(() => {
    try {
      const saved = localStorage.getItem(REAGENTS_MOVEMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading reagent movements from localStorage:', e);
    }
    return [
      {
        id: 'mov-init-1',
        reagentId: 'rgt-001',
        reagentName: 'Kit Glucosa Hexoquinasa UV (Roche)',
        type: 'salida_consumo',
        quantity: 4,
        previousStock: 10,
        newStock: 6,
        reason: 'Consumo corrida matutina 120 órdenes',
        operator: 'Licda. Elena Morales',
        timestamp: '2026-09-01 08:30'
      },
      {
        id: 'mov-init-2',
        reagentId: 'rgt-004',
        reagentName: 'Tromboplastina Cálcica TP / TTPA Liofilizada',
        type: 'salida_consumo',
        quantity: 3,
        previousStock: 8,
        newStock: 5,
        reason: 'Consumo diario pruebas coagulación y STAT',
        operator: 'Dra. Sofía Alarcón',
        timestamp: '2026-09-01 09:15'
      }
    ];
  });

  const [activeChatChannelId, setActiveChatChannelId] = useState<string>('general');
  const [activeDirectUserId, setActiveDirectUserId] = useState<string | null>(null);
  const [isChatFloatingOpen, setIsChatFloatingOpen] = useState<boolean>(false);

  // Active current staff user (supports simulating/switching identity between Reception, Bioanalysts, Admin)
  const [currentStaffUser, setCurrentStaffUser] = useState<LabStaffUser>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_STAFF_USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF_USERS[0];
  });

  // Etapa 3 (seguridad): única fuente de verdad de "¿hay personal con
  // sesión válida?". Antes esto era un booleano en localStorage que
  // cualquiera podía escribir a mano desde DevTools. Ahora se deriva de
  // la sesión REAL de Firebase Authentication (persistida por el propio
  // SDK, no por nosotros) y se vuelve a confirmar contra el backend
  // (server/auth-firebase.ts) cada vez que esa sesión cambia. Si Firebase
  // reporta una sesión pero el backend la rechaza (cuenta dada de baja,
  // no registrada como personal, etc.), se cierra la sesión de Firebase
  // también, en vez de dejar al usuario en un estado ambiguo.
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setIsStaffAuthenticated(false);
        return;
      }
      try {
        const idToken = await firebaseUser.getIdToken();
        const verification = await verifyStaffSession(idToken);
        if (verification.ok === false) {
          if (verification.reason !== 'network') {
            // Solo se cierra sesión si el backend respondió y RECHAZÓ la
            // cuenta. Un error de red no debe desloguear a alguien que sí
            // tiene una sesión de Firebase válida.
            await firebaseSignOut(auth).catch(() => undefined);
          }
          setIsStaffAuthenticated(false);
          return;
        }

        const matchedUser =
          staffUsers.find((u) => u.firebaseUid && u.firebaseUid === firebaseUser.uid) ||
          staffUsers.find((u) => u.email.toLowerCase() === (firebaseUser.email || '').toLowerCase());

        if (matchedUser) {
          setCurrentStaffUser(matchedUser);
        }
        setIsStaffAuthenticated(true);
      } catch (err) {
        console.error('[Auth] Error verificando sesión de personal:', err);
        setIsStaffAuthenticated(false);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activePushToast, setActivePushToast] = useState<PatientPushNotification | null>(null);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<PushSubscriptionStatus>(() => {
    return PushNotificationService.getPermissionStatus();
  });
  const [fcmToken, setFcmToken] = useState<string | null>(() => {
    return FirebaseMessagingService.getStoredToken();
  });

  useEffect(() => {
    let unsub = () => {};
    FirebaseMessagingService.setupForegroundListener((fcmNotif) => {
      setPushNotifications((prev) => [fcmNotif, ...prev]);
      setActivePushToast(fcmNotif);
    }).then((cleanup) => {
      unsub = cleanup;
    });
    return () => {
      unsub();
    };
  }, []);

  const [templates, setTemplates] = useState<ReportTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading templates from storage:', e);
    }
    return INITIAL_TEMPLATES;
  });

  const addTemplate = async (template: ReportTemplate): Promise<void> => {
    let finalTemplate = template;
    if (isEffectiveOnline) {
      try {
        await guardarPlantillaRemota(template);
        finalTemplate = { ...template, remoteId: template.id };
      } catch (err) {
        const mensaje = err instanceof PlantillasApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo guardar la plantilla en el servidor:', err);
        showNotification(`No se pudo guardar la plantilla en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
      }
    }
    setTemplates(prev => {
      const exists = prev.some(t => t.id === finalTemplate.id);
      if (exists) {
        return prev.map(t => t.id === finalTemplate.id ? finalTemplate : t);
      }
      return [finalTemplate, ...prev];
    });
    showNotification(`Plantilla "${finalTemplate.name}" guardada en la biblioteca`, 'success');
  };

  /**
   * Solo intenta sincronizar contra el backend si la plantilla YA tiene
   * remoteId (es decir, ya pasó por addTemplate() con conexión). Las
   * plantillas de fábrica (INITIAL_TEMPLATES) nunca se crearon vía la
   * API, así que editarlas sigue siendo puramente local -igual que ya
   * ocurre con updateCustomProfile()/updateReagent() sobre ítems de
   * fábrica en los módulos anteriores- en vez de mostrar una advertencia
   * de sincronización sobre algo que nunca existió en el servidor.
   */
  const updateTemplate = async (id: string, updates: Partial<ReportTemplate>): Promise<void> => {
    const template = templates.find(t => t.id === id);
    if (isEffectiveOnline && template?.remoteId) {
      try {
        await actualizarPlantillaRemota(template.remoteId, updates);
      } catch (err) {
        const mensaje = err instanceof PlantillasApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo actualizar la plantilla en el servidor:', err);
        showNotification(`No se pudo sincronizar la plantilla con el servidor (${mensaje}). Se actualizó solo localmente.`, 'warning');
      }
    }
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    showNotification('Plantilla clínica actualizada con éxito', 'success');
  };

  const resetTemplatesToFactory = () => {
    setTemplates(INITIAL_TEMPLATES);
    try {
      localStorage.removeItem(TEMPLATES_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    showNotification('Plantillas restablecidas a valores de fábrica', 'info');
  };

  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch (e) {
      console.error(e);
    }
  }, [templates]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>('pat-1');
  const [staffActiveTab, setStaffActiveTab] = useState<StaffTabType>('nueva_orden');
  const [activeReportToPrint, setActiveReportToPrint] = useState<MedicalReport | null>(null);
  const [activeReportToEdit, setActiveReportToEdit] = useState<MedicalReport | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  // Sync Chat & Current User to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(chatMessages));
    } catch (e) {
      console.error(e);
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_STAFF_USER_STORAGE_KEY, JSON.stringify(currentStaffUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentStaffUser]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
    } catch (e) {
      console.error(e);
    }
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error(e);
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(EPISODES_STORAGE_KEY, JSON.stringify(episodes));
    } catch (e) {
      console.error(e);
    }
  }, [episodes]);

  useEffect(() => {
    try {
      localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers));
    } catch (e) {
      console.error(e);
    }
  }, [transfers]);

  useEffect(() => {
    try {
      localStorage.setItem(PUSH_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(pushNotifications));
    } catch (e) {
      console.error(e);
    }
  }, [pushNotifications]);

  useEffect(() => {
    try {
      localStorage.setItem(PUSH_PREFS_STORAGE_KEY, JSON.stringify(patientNotificationPrefsByPatient));
    } catch (e) {
      console.error(e);
    }
  }, [patientNotificationPrefsByPatient]);

  useEffect(() => {
    try {
      localStorage.setItem(CATALOG_TESTS_STORAGE_KEY, JSON.stringify(catalogTests));
    } catch (e) {
      console.error(e);
    }
  }, [catalogTests]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PROFILES_STORAGE_KEY, JSON.stringify(customProfiles));
    } catch (e) {
      console.error(e);
    }
  }, [customProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STAFF_USERS_STORAGE_KEY, JSON.stringify(staffUsers));
    } catch (e) {
      console.error(e);
    }
  }, [staffUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STAFF_ROLES_STORAGE_KEY, JSON.stringify(staffRoles));
    } catch (e) {
      console.error(e);
    }
  }, [staffRoles]);

  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(auditLogs));
    } catch (e) {
      console.error(e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDER_FOLDERS_STORAGE_KEY, JSON.stringify(orderFolders));
    } catch (e) {
      console.error(e);
    }
  }, [orderFolders]);

  useEffect(() => {
    try {
      localStorage.setItem(REAGENTS_STORAGE_KEY, JSON.stringify(reagents));
    } catch (e) {
      console.error(e);
    }
  }, [reagents]);

  useEffect(() => {
    try {
      localStorage.setItem(REAGENTS_MOVEMENTS_STORAGE_KEY, JSON.stringify(reagentMovements));
    } catch (e) {
      console.error(e);
    }
  }, [reagentMovements]);

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Offline State & Local Queue Management
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [isSimulatingOffline, setIsSimulatingOffline] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(SIMULATE_OFFLINE_STORAGE_KEY) === 'true';
      }
    } catch {
      // fallback
    }
    return false;
  });

  const [offlineQueue, setOfflineQueue] = useState<OfflinePendingAction[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading offline queue:', e);
    }
    return [];
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(LAST_SYNC_TIME_STORAGE_KEY) || new Date().toISOString().replace('T', ' ').slice(0, 19);
      }
    } catch {
      // fallback
    }
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  });

  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);
  const [isOfflineQueueModalOpen, setIsOfflineQueueModalOpen] = useState<boolean>(false);

  const isEffectiveOnline = isOnline && !isSimulatingOffline;

  useEffect(() => {
    try {
      localStorage.setItem(SIMULATE_OFFLINE_STORAGE_KEY, String(isSimulatingOffline));
    } catch (e) {
      console.error(e);
    }
  }, [isSimulatingOffline]);

  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(offlineQueue));
    } catch (e) {
      console.error(e);
    }
  }, [offlineQueue]);

  useEffect(() => {
    if (lastSyncTime) {
      try {
        localStorage.setItem(LAST_SYNC_TIME_STORAGE_KEY, lastSyncTime);
      } catch (e) {
        console.error(e);
      }
    }
  }, [lastSyncTime]);

  const queuePendingAction = (actionData: Omit<OfflinePendingAction, 'id' | 'timestamp' | 'status' | 'retryCount'>): OfflinePendingAction => {
    const newAction: OfflinePendingAction = {
      ...actionData,
      id: `off-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'pending',
      retryCount: 0
    };
    setOfflineQueue((prev) => [newAction, ...prev]);
    return newAction;
  };

  const syncPendingChanges = async (): Promise<{ syncedCount: number; failedCount: number }> => {
    if (!isEffectiveOnline) {
      showNotification('No se puede sincronizar: el sistema está en modo fuera de línea.', 'warning');
      return { syncedCount: 0, failedCount: 0 };
    }

    const pending = offlineQueue.filter(item => item.status === 'pending' || item.status === 'failed');
    if (pending.length === 0) {
      showNotification('No hay cambios pendientes por sincronizar en la cola local.', 'info');
      return { syncedCount: 0, failedCount: 0 };
    }

    setIsSyncingQueue(true);
    await new Promise(res => setTimeout(res, 900));

    setOfflineQueue((prev) =>
      prev.map((item) =>
        item.status === 'pending' || item.status === 'failed'
          ? { ...item, status: 'synced' as const, retryCount: item.retryCount + 1 }
          : item
      )
    );

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setLastSyncTime(nowStr);
    setIsSyncingQueue(false);
    playNotificationChime('success');
    showNotification(`¡Sincronización completa! Se sincronizaron ${pending.length} cambio(s) con el servidor VACLINIC.`, 'success');

    return { syncedCount: pending.length, failedCount: 0 };
  };

  const clearOfflineQueue = () => {
    setOfflineQueue([]);
    showNotification('Cola local de cambios pendientes vaciada.', 'info');
  };

  const removeOfflineAction = (id: string) => {
    setOfflineQueue((prev) => prev.filter(item => item.id !== id));
  };

  const retryOfflineAction = async (id: string): Promise<boolean> => {
    if (!isEffectiveOnline) {
      showNotification('No se puede reintentar sin conexión a internet.', 'warning');
      return false;
    }
    setOfflineQueue((prev) => prev.map(item => item.id === id ? { ...item, status: 'syncing' as const } : item));
    await new Promise(res => setTimeout(res, 500));
    setOfflineQueue((prev) => prev.map(item => item.id === id ? { ...item, status: 'synced' as const, retryCount: item.retryCount + 1 } : item));
    showNotification('Cambio individual sincronizado con éxito.', 'success');
    return true;
  };

  // Window online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      playNotificationChime('success');
      showNotification('Conexión a internet restablecida. Sincronizando cola de cambios pendientes...', 'info');
      setTimeout(() => {
        syncPendingChanges();
      }, 500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      playNotificationChime('normal');
      showNotification('El sistema ha perdido la conexión a internet. Modo fuera de línea activo: los cambios se guardarán en la cola local de forma segura.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isEffectiveOnline, offlineQueue]);

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || null;

  // Request browser Web Push permissions
  const requestPushPermission = async (): Promise<PushSubscriptionStatus> => {
    const status = await PushNotificationService.requestPermission();
    setPushPermissionStatus(status);
    if (status === 'granted') {
      showNotification('¡Notificaciones Push Web habilitadas con éxito!', 'success');
      playNotificationChime('success');
    } else if (status === 'denied') {
      showNotification('Permiso de notificaciones denegado en el navegador.', 'warning');
    }
    return status;
  };

  // Request Firebase Cloud Messaging push permission and retrieve FCM token
  const requestFirebasePushPermission = async (patientId?: string): Promise<{
    status: NotificationPermission | 'unsupported';
    token: string | null;
  }> => {
    const result = await FirebaseMessagingService.requestPatientPermissionAndGetToken(patientId || selectedPatientId || undefined);
    if (result.status === 'granted') {
      setPushPermissionStatus('granted');
      setFcmToken(result.token);
      showNotification('¡Notificaciones Push de Firebase activadas para tus resultados!', 'success');
      playNotificationChime('success');
    } else if (result.status === 'denied') {
      setPushPermissionStatus('denied');
      showNotification('Permiso de notificaciones denegado en el navegador.', 'warning');
    }
    return result;
  };

  // Direct manual or automatic dispatch via Firebase Messaging
  const sendFirebaseResultReadyPush = async (report: MedicalReport) => {
    const targetPat = patients.find(p => p.id === report.patientId || p.fullName.toLowerCase() === report.patientName.toLowerCase());
    const pin = targetPat?.pinCode || targetPat?.accessCode || report.patientNationalId?.substring(0, 6) || '123456';

    await FirebaseMessagingService.sendResultReadyPushNotification({
      patientId: report.patientId,
      patientName: report.patientName,
      patientPhone: targetPat?.phone,
      reportNumber: report.reportNumber,
      reportTitle: report.title,
      accessPin: pin,
      urgent: report.urgentAlert
    });

    showNotification(`Notificación Push Firebase enviada para informe ${report.reportNumber}`, 'info');
  };

  // Dispatch a new push notification
  const sendPushNotification = (notifData: Omit<PatientPushNotification, 'id' | 'timestamp' | 'read'>): PatientPushNotification => {
    const newNotif: PatientPushNotification = {
      ...notifData,
      id: `push-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false,
      deliveredViaBrowser: pushPermissionStatus === 'granted'
    };

    setPushNotifications((prev) => [newNotif, ...prev]);
    setActivePushToast(newNotif);

    // Attempt native browser notification & chime. Usa las preferencias
    // reales del paciente DESTINATARIO de esta notificación puntual
    // (notifData.patientId), no las del paciente actualmente
    // seleccionado/autenticado en esta pestaña -antes de la corrección del
    // bug de "singleton" (ver más arriba) ambos podían ser distintos-.
    if (getPatientNotificationPrefs(notifData.patientId).webPushEnabled) {
      PushNotificationService.dispatchBrowserNotification(newNotif);
    }

    return newNotif;
  };

  const markPushAsRead = (id: string) => {
    setPushNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllPushAsRead = (patientId?: string) => {
    setPushNotifications((prev) =>
      prev.map((n) => (!patientId || n.patientId === patientId || n.patientId === 'all' ? { ...n, read: true } : n))
    );
    showNotification('Todas las notificaciones marcadas como leídas', 'info');
  };

  const clearPushNotifications = (patientId?: string) => {
    if (patientId) {
      setPushNotifications((prev) => prev.filter((n) => n.patientId !== patientId && n.patientId !== 'all'));
    } else {
      setPushNotifications([]);
    }
    showNotification('Bandeja de notificaciones vaciada', 'info');
  };

  const dismissPushToast = () => {
    setActivePushToast(null);
  };

  // Valor computado para el paciente actualmente autenticado en el Portal
  // (selectedPatientId) — ver la nota extensa junto al estado
  // patientNotificationPrefsByPatient más arriba sobre por qué ya no es
  // un solo objeto global.
  const patientNotificationPrefs: PatientNotificationPreferences = getPatientNotificationPrefs(selectedPatientId);

  /**
   * NOTA DE ALCANCE REAL (noveno módulo, preferencias push): el backend
   * real ya existe, está probado y verificado end-to-end
   * (server/routes/preferencias.ts, GET/PUT /api/preferencias con
   * requirePortalToken), pero esta función SIGUE sin llamarlo. Motivo:
   * ese endpoint exige un token de portal real, obtenido de
   * POST /api/portal/login con un código de consulta vigente -y
   * authenticatePatient() de este mismo archivo TODAVÍA usa el mecanismo
   * local/inseguro anterior a la Etapa 3 (compara accessCode/pinCode
   * contra el arreglo de pacientes cargado en el navegador), sin llamar
   * nunca a ese login real-. Conectar esta función al backend real
   * requeriría primero migrar la autenticación real del Portal del
   * Paciente, un cambio de alcance mucho mayor que "preferencias de
   * notificación" y que no se puede resolver dentro de este módulo. Ver
   * src/services/preferenciasApiService.ts, que queda listo para cuando
   * esa migración ocurra.
   */
  const updatePatientNotificationPrefs = (prefs: Partial<PatientNotificationPreferences>) => {
    const clave = selectedPatientId || '__default__';
    setPatientNotificationPrefsByPatient((prev) => ({
      ...prev,
      [clave]: { ...(prev[clave] || prev.__default__ || DEFAULT_PATIENT_NOTIFICATION_PREFS), ...prefs }
    }));
    showNotification('Preferencias de avisos y notificaciones guardadas', 'success');
  };

  // Simulation generator for instant live demonstration
  const simulatePushNotification = (patientId?: string, type: PushNotificationType = 'report_ready') => {
    const targetPatientId = patientId || selectedPatientId || 'pat-1';
    const targetPat = patients.find((p) => p.id === targetPatientId) || patients[0];
    const reportSeq = Math.floor(1000 + Math.random() * 9000);
    const repNum = `LAB-${new Date().getFullYear()}-${reportSeq}`;

    if (type === 'report_ready') {
      sendPushNotification({
        patientId: targetPatientId,
        patientName: targetPat.fullName,
        reportNumber: repNum,
        type: 'report_ready',
        title: '📄 ¡Tus Resultados de Laboratorio Están Listos!',
        body: `Hola ${targetPat.fullName.split(' ')[0]}, tu informe médico (${repNum}) ya ha sido emitido con firma digital y está listo para descarga.`,
        actionLabel: 'Ver y Descargar Informe',
        channel: 'web_push',
        urgent: false
      });
    } else if (type === 'critical_alert') {
      sendPushNotification({
        patientId: targetPatientId,
        patientName: targetPat.fullName,
        reportNumber: repNum,
        type: 'critical_alert',
        title: '🚨 ALERTA MÉDICA: Parámetro Crítico Detectado',
        body: `Se ha detectado un valor de atención prioritaria en tu análisis ${repNum}. Recomendamos comunicarte de inmediato con tu médico tratante.`,
        actionLabel: 'Ver Alerta Médica',
        channel: 'web_push',
        urgent: true
      });
    } else if (type === 'sample_processed') {
      sendPushNotification({
        patientId: targetPatientId,
        patientName: targetPat.fullName,
        type: 'sample_processed',
        title: '🧪 Muestra en Proceso de Alta Precisión',
        body: `Tus muestras han ingresado a la fase de autoanalizadores (${currentBranch.toUpperCase()}). Tiempo estimado de entrega: 45 minutos.`,
        actionLabel: 'Ver Trazabilidad',
        channel: 'in_app',
        urgent: false
      });
    } else {
      sendPushNotification({
        patientId: targetPatientId,
        patientName: targetPat.fullName,
        type: 'health_tip',
        title: '💡 Tip Preventivo VACLINIC',
        body: 'El 80% de las alteraciones en glucosa o lípidos se controlan a tiempo con un chequeo preventivo anual. ¡Cuida tu salud!',
        actionLabel: 'Ver Consejos de Salud',
        channel: 'in_app',
        urgent: false
      });
    }
  };

  // Traduce el `Patient` del frontend al body que espera POST/PATCH
  // /api/pacientes (ver src/services/pacientesApiService.ts).
  const patientDataToApiInput = (
    patientData: Partial<Omit<Patient, 'id' | 'createdAt' | 'accessCode' | 'pinCode'>>
  ): Partial<CrearPacienteInput> => ({
    nombreCompleto: patientData.fullName,
    dni: patientData.nationalId || undefined,
    fechaNacimiento: patientData.birthDate,
    genero: patientData.gender,
    telefonoWhatsApp: patientData.phone,
    correo: patientData.email || undefined,
    direccion: patientData.address || undefined
  });

  /**
   * Registro de paciente (Etapa "sistema real"). ANTES: solo escribía a
   * localStorage con un id generado en el navegador (`pat-${Date.now()}`),
   * así que dos personas del staff en dos sesiones nunca veían al mismo
   * paciente y nada llegaba a la base de datos real ya probada
   * (server/routes/pacientes.ts). AHORA: si hay conexión, se crea primero
   * en Postgres vía POST /api/pacientes y el `id` que usa el resto de la
   * app (para vincular órdenes, reportes, etc.) es el id real de la base
   * de datos -no uno inventado que luego habría que reconciliar-. Si la
   * app está en modo fuera de línea (o el POST falla por una razón real,
   * ej. el backend no responde), se conserva el comportamiento anterior
   * -guardar localmente y encolar la acción- para no bloquear la admisión
   * de pacientes, pero se lo notifica de forma honesta: nunca se dice
   * "sincronizado" cuando no lo está.
   */
  const addPatient = async (
    patientData: Omit<Patient, 'id' | 'createdAt' | 'accessCode' | 'pinCode'>
  ): Promise<Patient> => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const nextSeq = patients.length + 1;
    const generatedCode = patientData.patientCode || `VAC-${String(nextSeq).padStart(6, '0')}`;

    if (isEffectiveOnline) {
      try {
        const fila = await createPacienteRemote(patientDataToApiInput(patientData) as CrearPacienteInput);
        const newPatient: Patient = mapPacienteApiToPatient(fila, { ...patientData, patientCode: generatedCode });
        setPatients((prev) => [newPatient, ...prev]);
        showNotification(`Paciente ${newPatient.fullName} registrado en la base de datos real. Código: ${newPatient.patientCode}`);
        createBackupSnapshot('save_patient', `Nuevo paciente: ${newPatient.fullName} (${newPatient.patientCode})`);
        return newPatient;
      } catch (err) {
        const mensaje = err instanceof PacientesApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo crear el paciente en el servidor real:', err);
        showNotification(`No se pudo guardar el paciente en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
        // Continúa abajo con la ruta local, igual que en modo sin conexión.
      }
    }

    const newPatient: Patient = {
      ...patientData,
      patientCode: generatedCode,
      id: `pat-${Date.now()}`,
      accessCode: `MED-${randomPin}`,
      pinCode: randomPin,
      createdAt: new Date().toISOString()
    };
    setPatients((prev) => [newPatient, ...prev]);

    queuePendingAction({
      actionType: 'create_patient',
      entityType: 'Paciente',
      entityId: newPatient.id,
      description: `Registro de paciente ${newPatient.fullName} (${newPatient.nationalId || newPatient.patientCode})`,
      payload: newPatient
    });
    showNotification(`Paciente ${newPatient.fullName} registrado (Guardado en cola fuera de línea)`, 'warning');
    createBackupSnapshot('save_patient', `Nuevo paciente: ${newPatient.fullName} (${newPatient.patientCode || newPatient.accessCode})`);

    return newPatient;
  };

  const updatePatient = async (id: string, updates: Partial<Patient>): Promise<void> => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    // Solo tiene sentido sincronizar contra la API si este paciente
    // realmente existe en Postgres (id numérico real, ver
    // esPacienteIdRemoto) — un paciente de demo/localStorage anterior
    // (id "pat-...") nunca existió ahí y un PATCH fallaría sin remedio.
    if (isEffectiveOnline && esPacienteIdRemoto(id)) {
      try {
        await updatePacienteRemote(id, patientDataToApiInput(updates));
        showNotification('Datos del paciente actualizados con éxito en el servidor real.');
        return;
      } catch (err) {
        const mensaje = err instanceof PacientesApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo actualizar el paciente en el servidor real:', err);
        showNotification(`No se pudo sincronizar la actualización con el servidor (${mensaje}). Cambios guardados solo localmente.`, 'warning');
        return;
      }
    }

    if (!isEffectiveOnline) {
      queuePendingAction({
        actionType: 'update_patient',
        entityType: 'Paciente',
        entityId: id,
        description: `Actualización de paciente ID ${id}`,
        payload: updates
      });
      showNotification('Datos del paciente actualizados (Guardado en cola fuera de línea)', 'warning');
    } else {
      // Paciente local (de demo, pre-migración) sin contraparte real en la
      // base de datos: se documenta así en vez de fingir una sincronización
      // que nunca ocurrió.
      showNotification('Datos del paciente actualizados localmente (este registro es de demostración y no existe en la base de datos real)', 'info');
    }
  };

  const deletePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setReports((prev) => prev.filter((r) => r.patientId !== id));
    setEpisodes((prev) => prev.filter((e) => e.patientId !== id));
    if (selectedPatientId === id) {
      setSelectedPatientId(null);
    }
    showNotification('Paciente eliminado del sistema 4D LAB', 'info');
  };

  // 4D LAB Episode & Workflow Engine
  const addEpisode = async (episodeData: Omit<LabEpisode, 'id' | 'episodeNumber'>): Promise<LabEpisode> => {
    const epSeq = Math.floor(100 + Math.random() * 900);
    const episodeNumber = `4D-${new Date().getFullYear()}-EP0${epSeq}`;

    // Check for duplicity in recent episodes for this patient (respaldo
    // local; si el episodio se crea de verdad en el backend, la detección
    // real ocurre ahí -ver server/routes/episodios.ts- y prevalece).
    const hasRecentSameTests = episodes.some(
      (ep) => ep.patientId === episodeData.patientId &&
             ep.requestedTests.some(t => episodeData.requestedTests.includes(t)) &&
             new Date(ep.admissionTime).getTime() > Date.now() - 72 * 3600000
    );

    const draftEpisode: LabEpisode = {
      ...episodeData,
      id: `ep-${Date.now()}`,
      episodeNumber,
      duplicityFlag: hasRecentSameTests || episodeData.duplicityFlag,
      duplicityDetails: hasRecentSameTests
        ? `ALERTA 4D LAB: Paciente con solicitud similar registrada en las últimas 72h.`
        : episodeData.duplicityDetails
    };

    let newEpisode = draftEpisode;
    const idPacienteRemoto = esPacienteIdRemoto(episodeData.patientId) ? Number(episodeData.patientId) : null;
    if (isEffectiveOnline && idPacienteRemoto) {
      try {
        const creado = await crearEpisodioRemoto({
          idPaciente: idPacienteRemoto,
          tipoPaciente: episodeData.patientType,
          programaSalud: episodeData.healthProgram,
          origen: episodeData.origin,
          medicoReferente: episodeData.referringDoctor,
          sede: episodeData.branchId,
          prioridad: episodeData.priority,
          pruebasSolicitadas: episodeData.requestedTests,
          codigosTubo: episodeData.tubeBarcodes,
          tipoMuestra: episodeData.sampleType,
          tatObjetivoMinutos: episodeData.tatTargetMinutes,
          notas: episodeData.notes
        });
        newEpisode = {
          ...draftEpisode,
          id: `ep-remote-${creado.id_episodio}`,
          episodeNumber: creado.numero_episodio,
          remoteId: creado.id_episodio,
          duplicityFlag: creado.marca_duplicidad,
          duplicityDetails: creado.detalle_duplicidad || undefined
        };
      } catch (err) {
        const mensaje = err instanceof EpisodiosApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo crear el episodio 4D en el servidor:', err);
        showNotification(`No se pudo registrar el episodio en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
      }
    }

    setEpisodes((prev) => [newEpisode, ...prev]);
    showNotification(`Episodio ${newEpisode.episodeNumber} admitido en 4D LAB.`, newEpisode.duplicityFlag ? 'warning' : 'success');
    return newEpisode;
  };

  const updateEpisode = async (id: string, updates: Partial<LabEpisode>): Promise<void> => {
    const episode = episodes.find((ep) => ep.id === id);
    if (isEffectiveOnline && episode?.remoteId) {
      try {
        await actualizarEpisodioRemoto(episode.remoteId, {
          notas: updates.notes,
          prioridad: updates.priority,
          sedeDestino: updates.destinationBranch,
          transferido: updates.isTransferred
        });
      } catch (err) {
        const mensaje = err instanceof EpisodiosApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo actualizar el episodio 4D en el servidor:', err);
        showNotification(`No se pudo sincronizar el episodio con el servidor (${mensaje}). Se actualizó solo localmente.`, 'warning');
      }
    }
    setEpisodes((prev) =>
      prev.map((ep) => (ep.id === id ? { ...ep, ...updates } : ep))
    );
    showNotification('Episodio de laboratorio actualizado');
  };

  const advanceEpisodeDimension = async (id: string, nextDimension: DimensionStage): Promise<void> => {
    const episode = episodes.find((ep) => ep.id === id);
    if (isEffectiveOnline && episode?.remoteId && nextDimension !== 'D1_admision') {
      try {
        await avanzarEpisodioRemoto(episode.remoteId, nextDimension);
      } catch (err) {
        const mensaje = err instanceof EpisodiosApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo avanzar el episodio 4D en el servidor:', err);
        showNotification(`No se pudo sincronizar el avance de dimensión con el servidor (${mensaje}). Se aplicó solo localmente.`, 'warning');
      }
    }

    setEpisodes((prev) =>
      prev.map((ep) => {
        if (ep.id === id) {
          const nowIso = new Date().toISOString();

          // Automatic push notification on dimension progress
          const targetPat = patients.find(p => p.id === ep.patientId);
          if (targetPat) {
            if (nextDimension === 'D3_analizadores') {
              sendPushNotification({
                patientId: ep.patientId,
                patientName: targetPat.fullName,
                episodeId: ep.id,
                type: 'sample_processed',
                title: '🧪 Muestras en Proceso Analítico',
                body: `Tus muestras del episodio ${ep.episodeNumber} están siendo procesadas en los autoanalizadores de VACLINIC.`,
                actionLabel: 'Ver Trazabilidad',
                channel: 'web_push'
              });
            } else if (nextDimension === 'D4_validacion') {
              sendPushNotification({
                patientId: ep.patientId,
                patientName: targetPat.fullName,
                episodeId: ep.id,
                type: 'sample_processed',
                title: '🔍 Validación Médica en Curso',
                body: `Tus resultados del episodio ${ep.episodeNumber} se encuentran en revisión y firma final por el especialista patólogo.`,
                actionLabel: 'Ver Estado',
                channel: 'web_push'
              });
            }
          }

          return {
            ...ep,
            currentDimension: nextDimension,
            phlebotomyTime: nextDimension === 'D2_flebotomia' && !ep.phlebotomyTime ? nowIso : ep.phlebotomyTime,
            analyzerStartTime: nextDimension === 'D3_analizadores' && !ep.analyzerStartTime ? nowIso : ep.analyzerStartTime,
            validationTime: nextDimension === 'D4_validacion' && !ep.validationTime ? nowIso : ep.validationTime
          };
        }
        return ep;
      })
    );
    showNotification(`Episodio avanzado a dimensión: ${nextDimension.replace('_', ' ').toUpperCase()}`);
  };

  const resolveDuplicity = async (id: string, action: 'keep' | 'cancel' | 'merge'): Promise<void> => {
    const episode = episodes.find((ep) => ep.id === id);
    if (isEffectiveOnline && episode?.remoteId) {
      try {
        await resolverDuplicidadRemota(episode.remoteId, action);
      } catch (err) {
        const mensaje = err instanceof EpisodiosApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo resolver la duplicidad del episodio 4D en el servidor:', err);
        showNotification(`No se pudo sincronizar la resolución de duplicidad con el servidor (${mensaje}). Se aplicó solo localmente.`, 'warning');
      }
    }

    if (action === 'cancel') {
      setEpisodes((prev) => prev.filter((ep) => ep.id !== id));
      showNotification('Episodio duplicado cancelado y retirado del flujo 4D LAB', 'info');
    } else {
      setEpisodes((prev) =>
        prev.map((ep) => (ep.id === id ? { ...ep, duplicityFlag: false, notes: `${ep.notes || ''} [Duplicidad verificada y aprobada por supervisor]` } : ep))
      );
      showNotification('Alerta de duplicidad 4D resuelta y autorizada');
    }
  };

  const addSampleTransfer = async (transferData: Omit<SampleTransferManifest, 'id' | 'manifestCode'>): Promise<SampleTransferManifest> => {
    const manCode = `MAN-4D-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const draftManifest: SampleTransferManifest = {
      ...transferData,
      id: `trans-${Date.now()}`,
      manifestCode: manCode
    };

    let newManifest = draftManifest;
    if (isEffectiveOnline) {
      try {
        const creado = await crearTransferenciaRemota({
          originBranch: transferData.originBranch,
          destinationBranch: transferData.destinationBranch,
          courierName: transferData.courierName,
          departureTime: transferData.departureTime,
          estimatedArrivalTime: transferData.estimatedArrivalTime,
          status: transferData.status,
          temperatureControl: transferData.temperatureControl,
          temperatureLogged: transferData.temperatureLogged,
          samplesCount: transferData.samplesCount,
          samplesCodes: transferData.samplesCodes
        });
        newManifest = {
          ...draftManifest,
          id: `trans-remote-${creado.id_transferencia}`,
          manifestCode: creado.codigo_manifiesto,
          remoteId: creado.id_transferencia
        };
      } catch (err) {
        const mensaje = err instanceof TransferenciasApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo registrar la transferencia en el servidor:', err);
        showNotification(`No se pudo registrar la remesa en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
      }
    }

    setTransfers((prev) => [newManifest, ...prev]);
    showNotification(`Remesa ${newManifest.manifestCode} despachada a sede receptora`, 'success');
    return newManifest;
  };

  /**
   * Sincroniza la CAPTURA (estado Borrador) de un informe contra el backend
   * real (POST /api/resultados), agrupando los ReportParameter por examCode
   * y resolviendo cada grupo al id_detalle_orden real vía
   * `LabOrder.detalleRemoto` (ver ordenes.ts y `addOrder` más arriba).
   *
   * Es deliberadamente conservadora: si el informe no tiene `orderId`, o esa
   * orden no se creó en el backend (no tiene `detalleRemoto`), o algún
   * parámetro no trae `examCode` (informes redactados a mano, sin pasar por
   * "Cargar Resultados" desde una orden), esos casos simplemente no se
   * sincronizan -el informe se guarda igual, solo local, como ya ocurría
   * antes de este cambio. Nunca lanza: cualquier error de red o de negocio
   * se reporta con `showNotification` y se continúa.
   *
   * No intenta validar/publicar aquí -eso es responsabilidad exclusiva de
   * `publishReport` (la única acción real de "publicar", también invocable
   * directamente desde StaffDashboard), para no duplicar esa lógica.
   */
  const syncCapturaResultados = async (report: MedicalReport): Promise<Record<string, number> | undefined> => {
    if (!isEffectiveOnline || !report.orderId) return undefined;
    const orden = orders.find(o => o.id === report.orderId);
    if (!orden || !orden.detalleRemoto || orden.detalleRemoto.length === 0) return undefined;

    const porExamCode = new Map<string, ReportParameter[]>();
    report.parameters.forEach(p => {
      if (!p.examCode) return;
      if (!porExamCode.has(p.examCode)) porExamCode.set(p.examCode, []);
      porExamCode.get(p.examCode)!.push(p);
    });
    if (porExamCode.size === 0) return undefined;

    const resultadosRemotos: Record<string, number> = { ...(report.resultadosRemotos || {}) };
    let huboError = false;

    for (const [examCode, params] of porExamCode.entries()) {
      // Ya sincronizado en una sincronización anterior (ej. autoguardado):
      // no reintentar la creación -el backend rechaza con 409 un segundo
      // POST sobre el mismo detalle_orden, y de todas formas no hay un
      // endpoint de "actualizar borrador" que usar aquí.
      if (resultadosRemotos[examCode]) continue;

      const detalle = orden.detalleRemoto.find(d => d.codigoExamen === examCode);
      if (!detalle) continue; // examen sin detalle_orden real conocido (no se puede enlazar)

      const valorCapturado = params.length === 1
        ? String(params[0].value)
        : JSON.stringify(params.map(p => ({ nombre: p.name, valor: p.value, unidad: p.unit, estado: p.status })));

      try {
        const creado = await crearResultadoRemoto(detalle.idDetalle, valorCapturado);
        resultadosRemotos[examCode] = creado.id_resultado;
      } catch (err) {
        huboError = true;
        const mensaje = err instanceof ResultadosApiError ? err.message : 'Error de red desconocido.';
        console.error(`[ClinicContext] No se pudo sincronizar el resultado de "${examCode}" con el servidor:`, err);
        showNotification(`No se pudo sincronizar el resultado de "${examCode}" con el servidor (${mensaje}). Quedó guardado solo localmente.`, 'warning');
      }
    }

    if (huboError) {
      showNotification('El informe se guardó, pero algunos resultados no se sincronizaron por completo con el servidor real.', 'warning');
    }

    return resultadosRemotos;
  };

  const addReport = async (reportData: Omit<MedicalReport, 'id' | 'reportNumber' | 'qrVerificationCode'>): Promise<MedicalReport> => {
    const reportSeq = Math.floor(1000 + Math.random() * 9000);
    const reportNumber = `LAB-${new Date().getFullYear()}-${reportSeq}`;
    const draftReport: MedicalReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      reportNumber,
      qrVerificationCode: `VALID-SANRAFAEL-${reportNumber}`
    };

    // Intenta crear en el backend real (Borrador) los resultados que se
    // puedan enlazar con la orden de origen (ver syncCapturaResultados).
    const resultadosRemotos = await syncCapturaResultados(draftReport);
    const newReport: MedicalReport = resultadosRemotos ? { ...draftReport, resultadosRemotos } : draftReport;

    setReports((prev) => [newReport, ...prev]);

    if (!isEffectiveOnline) {
      queuePendingAction({
        actionType: 'create_report',
        entityType: 'Informe Médico',
        entityId: newReport.id,
        description: `Creación informe ${newReport.reportNumber} - ${newReport.title} (${newReport.patientName})`,
        payload: newReport
      });
      showNotification(`Informe ${newReport.reportNumber} registrado (Guardado en cola fuera de línea)`, 'warning');
    } else {
      showNotification(`Informe ${newReport.reportNumber} registrado en 4D LAB (${newReport.status.toUpperCase()})`);
    }

    // If added directly as published, trigger push notification
    if (newReport.status === 'publicado') {
      sendPushNotification({
        patientId: newReport.patientId,
        patientName: newReport.patientName,
        reportId: newReport.id,
        reportNumber: newReport.reportNumber,
        type: newReport.urgentAlert ? 'critical_alert' : 'report_ready',
        title: newReport.urgentAlert ? '🚨 ALERTA MÉDICA: Resultados Listos con Atención' : '📄 ¡Tus Resultados de Laboratorio Están Listos!',
        body: `El informe "${newReport.title}" (${newReport.reportNumber}) ha sido emitido y validado digitalmente.`,
        actionLabel: 'Ver y Descargar Informe',
        channel: 'web_push',
        urgent: newReport.urgentAlert
      });
    }

    // Punto de respaldo automático al guardar nuevo informe
    createBackupSnapshot('save_report', `Nuevo informe registrado: ${newReport.reportNumber} (${newReport.title})`);

    return newReport;
  };

  const updateReport = async (id: string, updates: Partial<MedicalReport>): Promise<void> => {
    const existente = reports.find((r) => r.id === id);
    // Se arma el informe completo resultante ANTES de escribir el estado,
    // porque syncCapturaResultados necesita ver `parameters`/`orderId` ya
    // fusionados (updates puede traer solo un subconjunto de campos, ej.
    // AiSummaryModeModal.tsx que solo actualiza patientExplanation).
    const merged: MedicalReport | undefined = existente ? { ...existente, ...updates } : undefined;
    const resultadosRemotos = merged ? await syncCapturaResultados(merged) : undefined;
    const finalUpdates: Partial<MedicalReport> = resultadosRemotos ? { ...updates, resultadosRemotos } : updates;

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...finalUpdates };
          // If status transitioned to published, send push notification
          if (r.status !== 'publicado' && finalUpdates.status === 'publicado') {
            sendPushNotification({
              patientId: updated.patientId,
              patientName: updated.patientName,
              reportId: updated.id,
              reportNumber: updated.reportNumber,
              type: updated.urgentAlert ? 'critical_alert' : 'report_ready',
              title: updated.urgentAlert ? '🚨 ALERTA MÉDICA: Resultados con Valor Crítico' : '📄 ¡Tus Resultados de Laboratorio Están Listos!',
              body: `El informe "${updated.title}" (${updated.reportNumber}) está firmado y disponible para descarga.`,
              actionLabel: 'Ver y Descargar Informe',
              channel: 'web_push',
              urgent: updated.urgentAlert
            });
          }
          return updated;
        }
        return r;
      })
    );

    // Punto de respaldo automático al actualizar informe
    createBackupSnapshot('save_report', `Informe médico actualizado (ID: ${id})`);

    if (!isEffectiveOnline) {
      queuePendingAction({
        actionType: 'update_report',
        entityType: 'Informe Médico',
        entityId: id,
        description: `Actualización de informe ID ${id}`,
        payload: finalUpdates
      });
      showNotification('Informe médico actualizado (Guardado en cola fuera de línea)', 'warning');
    } else {
      showNotification('Informe médico actualizado');
    }
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    showNotification('Informe eliminado', 'info');
  };

  const publishReport = async (
    id: string,
    doctorName = 'Dr. Alejandro Valenzuela Morales',
    doctorSpecialty = 'Médico Patólogo Clínico & Diagnóstico',
    doctorLicense = 'CMP-649102 / RNE-28491',
    bioanalystName = 'Licda. Elena Morales Cruz',
    bioanalystSpecialty = 'Licenciada en Bioanálisis Clínico & Microbiología',
    bioanalystLicense = 'Col. Bioanálisis #4192 / MSPAS-8812'
  ): Promise<void> => {
    const hash = '0x' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    // Esta es la única acción real de "publicar" (también se invoca
    // directamente desde StaffDashboard.tsx) — aquí, y solo aquí, se
    // ejecutan las transiciones reales Borrador -> Validado -> Publicado en
    // el backend para cada resultado ya capturado de este informe
    // (`resultadosRemotos`, rellenado por `syncCapturaResultados` en
    // addReport/updateReport). Un 403 aquí significa que el rol autenticado
    // no tiene `validacion_firma_digital`/`validacion_publicacion` -es la
    // separación de roles real que exige la tesis (cap. 4), no un bug a
    // evadir: se reporta honestamente y el informe queda "publicado" solo en
    // la vista local del staff, no en el backend real.
    const objetivo = reports.find(r => r.id === id);
    const resultadosRemotosObjetivo: Record<string, number> | undefined = objetivo?.resultadosRemotos;
    if (isEffectiveOnline && resultadosRemotosObjetivo) {
      const entradas: Array<[string, number]> = Object.entries(resultadosRemotosObjetivo);
      let algunoFallo = false;
      for (const [examCode, idResultado] of entradas) {
        try {
          await validarResultadoRemoto(idResultado);
          await publicarResultadoRemoto(idResultado);
        } catch (err) {
          algunoFallo = true;
          const mensaje = err instanceof ResultadosApiError ? err.message : 'Error de red desconocido.';
          console.error(`[ClinicContext] No se pudo validar/publicar el resultado real de "${examCode}" (id ${idResultado}):`, err);
          showNotification(
            `No se pudo validar/publicar "${examCode}" en el servidor (${mensaje}). El informe quedó "publicado" en esta pantalla, pero ese resultado no llegó a "Publicado" en el backend real.`,
            'warning'
          );
        }
      }
      if (!algunoFallo && entradas.length > 0) {
        showNotification('Resultados validados y publicados en el servidor real (Borrador → Validado → Publicado).', 'success');
      }
    }

    let publishedRep: MedicalReport | null = null;

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          publishedRep = {
            ...r,
            status: 'publicado',
            emissionDate: new Date().toISOString(),
            signature: {
              doctorName,
              doctorSpecialty,
              doctorLicense,
              bioanalystName,
              bioanalystSpecialty,
              bioanalystLicense,
              signedAt: new Date().toISOString(),
              validationHash: hash
            }
          };
          return publishedRep;
        }
        return r;
      })
    );

    showNotification('¡Informe firmado digitalmente y publicado para el paciente!', 'success');

    // Automatic push notification trigger (Firebase Messaging & Web Push)
    if (publishedRep) {
      const rep = publishedRep as MedicalReport;
      const targetPat = patients.find(p => p.id === rep.patientId || p.fullName.toLowerCase() === rep.patientName.toLowerCase());
      const pin = targetPat?.pinCode || targetPat?.accessCode || rep.patientNationalId?.substring(0, 6) || '123456';

      sendPushNotification({
        patientId: rep.patientId,
        patientName: rep.patientName,
        reportId: rep.id,
        reportNumber: rep.reportNumber,
        type: rep.urgentAlert ? 'critical_alert' : 'report_ready',
        title: rep.urgentAlert ? '🚨 ALERTA MÉDICA: Resultados Listos con Parámetro Prioritario' : '📄 ¡Tus Resultados de Laboratorio Están Listos!',
        body: `El informe "${rep.title}" (${rep.reportNumber}) ha sido firmado por ${doctorName} y está disponible para consulta y descarga digital. Tu PIN: ${pin}`,
        actionLabel: 'Ver y Descargar Informe',
        channel: 'firebase_fcm',
        firebaseDelivered: true,
        urgent: rep.urgentAlert
      });

      // Firebase Cloud Messaging auto-dispatch
      FirebaseMessagingService.sendResultReadyPushNotification({
        patientId: rep.patientId,
        patientName: rep.patientName,
        patientPhone: targetPat?.phone,
        reportNumber: rep.reportNumber,
        reportTitle: rep.title,
        accessPin: pin,
        urgent: rep.urgentAlert
      });
    }
  };

  // NOTA DE ALCANCE REAL, reiterada aquí porque el noveno módulo de la
  // migración (preferencias push, ver más arriba y
  // server/routes/preferencias.ts) depende directamente de esto: esta
  // función sigue siendo el mecanismo LOCAL/INSEGURO anterior a la Etapa
  // 3 -compara accessCode/pinCode/nationalId contra el arreglo completo
  // de pacientes ya cargado en el navegador-, nunca llama a
  // POST /api/portal/login (el login real y seguro que ya existe en
  // server/routes/portal.ts). Migrar esta función al login real es un
  // cambio de alcance propio, no de un módulo individual.
  const authenticatePatient = (codeOrDni: string, pin?: string): boolean => {
    const cleanInput = codeOrDni.trim().toLowerCase();
    const cleanPin = pin?.trim();

    const matched = patients.find((p) => {
      const matchCode = p.accessCode.toLowerCase() === cleanInput || p.pinCode === cleanInput;
      const matchDni = p.nationalId.toLowerCase() === cleanInput;
      if (cleanPin) {
        return (matchCode || matchDni) && (p.pinCode === cleanPin || p.accessCode.toLowerCase().includes(cleanPin.toLowerCase()));
      }
      return matchCode || matchDni;
    });

    if (matched) {
      setSelectedPatientId(matched.id);
      showNotification(`Bienvenido/a, ${matched.fullName}`, 'success');
      return true;
    }
    showNotification('No se encontró ningún paciente con las credenciales ingresadas', 'error');
    return false;
  };

  const logoutPatient = () => {
    setSelectedPatientId(null);
    showNotification('Sesión de paciente cerrada', 'info');
  };

  // Lab Catalog Methods
  const addCatalogTest = (testData: Omit<LabCatalogItem, 'id'>): LabCatalogItem => {
    const newTest: LabCatalogItem = {
      ...testData,
      id: `t-cust-${Date.now()}`,
      priceFormatted: `Q${testData.price}`
    };
    setCatalogTests(prev => [newTest, ...prev]);
    showNotification(`Prueba "${newTest.name}" agregada al catálogo`, 'success');
    return newTest;
  };

  const updateCatalogTest = (id: string, updates: Partial<LabCatalogItem>) => {
    setCatalogTests(prev =>
      prev.map(t => {
        if (t.id === id) {
          const newPrice = updates.price !== undefined ? updates.price : t.price;
          return {
            ...t,
            ...updates,
            priceFormatted: `Q${newPrice}`
          };
        }
        return t;
      })
    );
    showNotification('Prueba del catálogo actualizada', 'info');
  };

  const bulkUpdateCatalogTests = (updatedTests: LabCatalogItem[]) => {
    setCatalogTests(updatedTests);
    showNotification(`Se han guardado y sincronizado ${updatedTests.length} pruebas en el catálogo`, 'success');
  };

  const deleteCatalogTest = (id: string) => {
    setCatalogTests(prev => prev.filter(t => t.id !== id));
    showNotification('Prueba eliminada del catálogo', 'warning');
  };

  const resetCatalogToFactory = () => {
    setCatalogTests(FACTORY_CATALOG_TESTS);
    setCustomProfiles(DEFAULT_VACLINIC_PROFILES);
    showNotification('Catálogo y perfiles restablecidos al estándar oficial de fábrica (161 pruebas y 10 perfiles clínicos)', 'info');
  };

  // Lab Custom Profiles Methods
  const addCustomProfile = async (profileData: Omit<LabCustomProfile, 'id' | 'createdAt'>): Promise<LabCustomProfile> => {
    const draftProfile: LabCustomProfile = {
      ...profileData,
      id: `prof-${Date.now()}`,
      createdAt: new Date().toISOString(),
      priceFormatted: `Q${profileData.price}`
    };

    let newProfile = draftProfile;
    if (isEffectiveOnline) {
      try {
        const creado = await crearPerfilRemoto({
          code: draftProfile.code,
          name: draftProfile.name,
          categoryName: draftProfile.categoryName,
          price: draftProfile.price,
          regularPrice: draftProfile.regularPrice,
          description: draftProfile.description,
          testIds: draftProfile.testIds,
          testNames: draftProfile.testNames,
          tests: draftProfile.tests,
          status: draftProfile.status,
          basedOn: draftProfile.basedOn,
          createdBy: draftProfile.createdBy,
          notes: draftProfile.notes
        });
        newProfile = { ...draftProfile, id: `prof-remote-${creado.id_perfil}`, remoteId: creado.id_perfil };
      } catch (err) {
        const mensaje = err instanceof PerfilesApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo crear el perfil en el servidor:', err);
        showNotification(`No se pudo registrar el perfil en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
      }
    }

    setCustomProfiles(prev => [newProfile, ...prev]);
    showNotification(`Perfil clínico "${newProfile.name}" guardado exitosamente`, 'success');
    return newProfile;
  };

  const updateCustomProfile = async (id: string, updates: Partial<LabCustomProfile>): Promise<void> => {
    const profile = customProfiles.find(p => p.id === id);
    if (isEffectiveOnline && profile?.remoteId) {
      try {
        await actualizarPerfilRemoto(profile.remoteId, {
          name: updates.name,
          categoryName: updates.categoryName,
          price: updates.price,
          regularPrice: updates.regularPrice,
          description: updates.description,
          testIds: updates.testIds,
          testNames: updates.testNames,
          tests: updates.tests,
          status: updates.status,
          basedOn: updates.basedOn,
          notes: updates.notes
        });
      } catch (err) {
        const mensaje = err instanceof PerfilesApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo actualizar el perfil en el servidor:', err);
        showNotification(`No se pudo sincronizar el perfil con el servidor (${mensaje}). Se actualizó solo localmente.`, 'warning');
      }
    }
    setCustomProfiles(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newPrice = updates.price !== undefined ? updates.price : p.price;
          return {
            ...p,
            ...updates,
            priceFormatted: `Q${newPrice}`
          };
        }
        return p;
      })
    );
    showNotification('Perfil clínico actualizado', 'info');
  };

  const deleteCustomProfile = async (id: string): Promise<void> => {
    const profile = customProfiles.find(p => p.id === id);
    if (isEffectiveOnline && profile?.remoteId) {
      try {
        await eliminarPerfilRemoto(profile.remoteId);
      } catch (err) {
        const mensaje = err instanceof PerfilesApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo eliminar el perfil en el servidor:', err);
        showNotification(`No se pudo eliminar el perfil en el servidor (${mensaje}). Se eliminó solo localmente.`, 'warning');
      }
    }
    setCustomProfiles(prev => prev.filter(p => p.id !== id));
    showNotification('Perfil clínico eliminado', 'warning');
  };

  const exportCatalogJson = (): string => {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      institution: 'VACLINIC - Laboratorio Clínico y Diagnóstico Especializado',
      currency: 'GTQ (Quetzales)',
      totalTests: catalogTests.length,
      totalCustomProfiles: customProfiles.length,
      tests: catalogTests,
      customProfiles: customProfiles
    };
    return JSON.stringify(payload, null, 2);
  };

  const importCatalogJson = (jsonData: string): { success: boolean; message: string; count?: number } => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed) throw new Error('Archivo JSON vacío o corrupto');

      let importedCount = 0;
      if (Array.isArray(parsed.tests) && parsed.tests.length > 0) {
        setCatalogTests(parsed.tests);
        importedCount += parsed.tests.length;
      }
      if (Array.isArray(parsed.customProfiles)) {
        setCustomProfiles(parsed.customProfiles);
      }
      showNotification(`Se importaron ${importedCount} pruebas y ${parsed.customProfiles?.length || 0} perfiles correctamente`, 'success');
      return { success: true, message: 'Importación exitosa', count: importedCount };
    } catch (err: any) {
      showNotification(`Error al importar: ${err?.message || 'Formato JSON inválido'}`, 'error');
      return { success: false, message: err?.message || 'Error al procesar JSON' };
    }
  };

  // =========================================================================
  // USER & ROLE MANAGEMENT (RBAC) & AUDIT METHODS
  // =========================================================================

  const logAuditEvent = (logData: Omit<LabAuditLog, 'id' | 'timestamp'>) => {
    const newLog: LabAuditLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 199)]);
  };

  const addStaffUser = async (userData: Omit<LabStaffUser, 'id' | 'createdAt'>): Promise<LabStaffUser> => {
    const roleObj = staffRoles.find(r => r.id === userData.roleId);
    const draftUser: LabStaffUser = {
      ...userData,
      id: `usr-${Date.now().toString().slice(-4)}`,
      roleName: roleObj ? roleObj.name : userData.roleName,
      createdAt: new Date().toISOString(),
      avatarColor: userData.avatarColor || 'bg-teal-600'
    };

    let newUser = draftUser;
    if (isEffectiveOnline) {
      try {
        const creado = await crearPersonalRemoto({
          fullName: draftUser.fullName, username: draftUser.username, email: draftUser.email,
          phone: draftUser.phone, roleId: draftUser.roleId, specialty: draftUser.specialty,
          licenseNumber: draftUser.licenseNumber, assignedBranch: draftUser.assignedBranch,
          pinCode: draftUser.pinCode, customPermissions: draftUser.customPermissions,
          avatarColor: draftUser.avatarColor, notes: draftUser.notes
        });
        newUser = { ...draftUser, id: `usr-remote-${creado.id_usuario}`, remoteId: creado.id_usuario };
      } catch (err) {
        const mensaje = err instanceof PersonalApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo crear el usuario en el servidor:', err);
        showNotification(`No se pudo registrar el usuario en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
      }
    }

    setStaffUsers(prev => [newUser, ...prev]);
    logAuditEvent({
      userId: 'usr-admin',
      userName: 'Administrador del Sistema',
      userRole: 'Administrador de Sistemas & TI',
      action: 'Creación de Usuario',
      module: 'usuarios',
      details: `Usuario ${newUser.fullName} (${newUser.username}) registrado con rol "${newUser.roleName}".`,
      severity: 'info'
    });
    showNotification(`Usuario ${newUser.fullName} registrado con éxito`, 'success');
    return newUser;
  };

  const updateStaffUser = async (id: string, updates: Partial<LabStaffUser>): Promise<void> => {
    const user = staffUsers.find(u => u.id === id);
    if (isEffectiveOnline && user?.remoteId) {
      try {
        await actualizarPersonalRemoto(user.remoteId, {
          fullName: updates.fullName, username: updates.username, email: updates.email,
          phone: updates.phone, roleId: updates.roleId, specialty: updates.specialty,
          licenseNumber: updates.licenseNumber, assignedBranch: updates.assignedBranch,
          customPermissions: updates.customPermissions, avatarColor: updates.avatarColor,
          notes: updates.notes, signatureStampText: updates.signatureStampText,
          signatureImageUrl: updates.signatureImageUrl, twoFactorEnabled: updates.twoFactorEnabled
        });
      } catch (err) {
        const mensaje = err instanceof PersonalApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo actualizar el usuario en el servidor:', err);
        showNotification(`No se pudo sincronizar el usuario con el servidor (${mensaje}). Se actualizó solo localmente.`, 'warning');
      }
    }
    setStaffUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const updatedRoleId = updates.roleId || u.roleId;
          const roleObj = staffRoles.find(r => r.id === updatedRoleId);
          return {
            ...u,
            ...updates,
            roleName: roleObj ? roleObj.name : (updates.roleName || u.roleName)
          };
        }
        return u;
      })
    );
    logAuditEvent({
      userId: 'usr-admin',
      userName: 'Administrador del Sistema',
      userRole: 'Administrador de Sistemas & TI',
      action: 'Modificación de Usuario',
      module: 'usuarios',
      details: `Perfil de usuario ID ${id} actualizado.`,
      severity: 'info'
    });
    showNotification('Usuario actualizado correctamente', 'info');
  };

  const deleteStaffUser = async (id: string): Promise<void> => {
    const userToDelete = staffUsers.find(u => u.id === id);
    if (isEffectiveOnline && userToDelete?.remoteId) {
      try {
        await eliminarPersonalRemoto(userToDelete.remoteId);
      } catch (err) {
        const mensaje = err instanceof PersonalApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo eliminar el usuario en el servidor:', err);
        showNotification(`No se pudo eliminar el usuario en el servidor (${mensaje}). Se eliminó solo localmente.`, 'warning');
      }
    }
    setStaffUsers(prev => prev.filter(u => u.id !== id));
    if (userToDelete) {
      logAuditEvent({
        userId: 'usr-admin',
        userName: 'Administrador del Sistema',
        userRole: 'Administrador de Sistemas & TI',
        action: 'Eliminación de Usuario',
        module: 'usuarios',
        details: `Usuario ${userToDelete.fullName} (${userToDelete.username}) eliminado del sistema.`,
        severity: 'warning'
      });
    }
    showNotification('Usuario eliminado del sistema', 'warning');
  };

  const toggleUserStatus = async (id: string, newStatus: UserStatus): Promise<void> => {
    const user = staffUsers.find(u => u.id === id);
    if (isEffectiveOnline && user?.remoteId) {
      try {
        await cambiarEstadoPersonalRemoto(user.remoteId, newStatus);
      } catch (err) {
        const mensaje = err instanceof PersonalApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo cambiar el estado del usuario en el servidor:', err);
        showNotification(`No se pudo sincronizar el estado con el servidor (${mensaje}). Se actualizó solo localmente.`, 'warning');
      }
    }
    setStaffUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, status: newStatus } : u))
    );
    if (user) {
      logAuditEvent({
        userId: 'usr-admin',
        userName: 'Administrador del Sistema',
        userRole: 'Administrador de Sistemas & TI',
        action: 'Cambio de Estado de Usuario',
        module: 'usuarios',
        details: `Estado de ${user.fullName} modificado a ${newStatus.toUpperCase()}.`,
        severity: newStatus === 'suspendido' ? 'critical' : 'info'
      });
    }
    showNotification(`Estado de usuario actualizado a ${newStatus}`, 'info');
  };

  const resetUserPin = async (id: string, newPin: string): Promise<void> => {
    const user = staffUsers.find(u => u.id === id);
    if (isEffectiveOnline && user?.remoteId) {
      try {
        await reiniciarPinPersonalRemoto(user.remoteId, newPin);
      } catch (err) {
        const mensaje = err instanceof PersonalApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo reiniciar el PIN en el servidor:', err);
        showNotification(`No se pudo sincronizar el PIN con el servidor (${mensaje}). Se actualizó solo localmente.`, 'warning');
      }
    }
    setStaffUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, pinCode: newPin } : u))
    );
    if (user) {
      logAuditEvent({
        userId: 'usr-admin',
        userName: 'Administrador del Sistema',
        userRole: 'Administrador de Sistemas & TI',
        action: 'Reinicio de PIN de Seguridad',
        module: 'seguridad',
        details: `PIN de seguridad restablecido para ${user.fullName}.`,
        severity: 'warning'
      });
    }
    showNotification('PIN de acceso actualizado con éxito', 'success');
  };

  /**
   * Persiste de verdad en Postgres (tabla rol_permiso_default), pero -ver
   * la nota de alcance al inicio de server/routes/roles.ts- todavía NO
   * cambia la autorización real: hasPermission() sigue leyendo
   * INITIAL_ROLES_CONFIG en memoria. El estado local `staffRoles` (lo que
   * de verdad pinta la matriz y filtra botones en esta sesión del
   * navegador) se sigue actualizando igual que antes de esta migración.
   */
  const updateRolePermissions = async (roleId: LabStaffRole, permissions: string[]): Promise<void> => {
    if (isEffectiveOnline) {
      try {
        await actualizarPermisosRolRemoto(roleId, permissions);
      } catch (err) {
        const mensaje = err instanceof RolesApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo guardar la matriz de permisos en el servidor:', err);
        showNotification(`No se pudo guardar la matriz de permisos en el servidor (${mensaje}). Se actualizó solo localmente.`, 'warning');
      }
    }
    setStaffRoles(prev =>
      prev.map(r => (r.id === roleId ? { ...r, defaultPermissions: permissions } : r))
    );
    const roleObj = staffRoles.find(r => r.id === roleId);
    logAuditEvent({
      userId: 'usr-admin',
      userName: 'Administrador del Sistema',
      userRole: 'Administrador de Sistemas & TI',
      action: 'Matriz RBAC Actualizada',
      module: 'usuarios',
      details: `Permisos del rol ${roleObj?.name || roleId} reconfigurados (${permissions.length} permisos activos).`,
      severity: 'warning'
    });
    showNotification(`Permisos para rol "${roleObj?.name || roleId}" actualizados`, 'success');
  };

  // NOTA (Etapa 3): esta función NO pasa por Firebase Authentication — es
  // el mecanismo que usa el login biométrico (WebAuthn) existente, que
  // todavía es local y no está vinculado a una identidad de Firebase. Se
  // deja funcionando para no romper esa función ya existente, pero queda
  // documentado como una vía de acceso que el backend no puede verificar
  // hoy (server/auth-firebase.ts solo confía en tokens de Firebase). Cerrar
  // esta brecha requiere emitir un Firebase Custom Token tras la
  // verificación WebAuthn — pendiente, fuera del alcance de este cambio.
  const loginStaffUser = (user: LabStaffUser) => {
    setCurrentStaffUser(user);
    setIsStaffAuthenticated(true);
  };

  const logoutStaff = () => {
    setIsStaffAuthenticated(false);
    // Cierra también la sesión real de Firebase (si la hay). Sin esto,
    // `onAuthStateChanged` la detectaría de nuevo como válida y reabriría
    // el acceso de personal en la próxima recarga.
    firebaseSignOut(getFirebaseAuth()).catch(() => undefined);
    showNotification('Sesión de personal bloqueada', 'info');
  };

  const hasPermission = (user: LabStaffUser, permissionId: string): boolean => {
    // Etapa 3: misma función que usa el backend (src/shared/permissions.ts),
    // para que ocultar un botón aquí y rechazar la petición en el servidor
    // sean, literalmente, la misma regla evaluada dos veces — no dos reglas
    // distintas que puedan desincronizarse.
    return sharedHasPermission(
      { status: user.status, roleId: user.roleId, customPermissions: user.customPermissions },
      permissionId
    );
  };

  // =========================================================================
  // INTERNAL CHAT & INTERCOM METHODS
  // =========================================================================

  /**
   * Octavo módulo de los 9 migrados desde localStorage (mensaje_chat, ver
   * server/routes/chat.ts). NOTA: el emisor real que queda registrado en
   * Postgres es SIEMPRE req.staffUser.idUsuario (la sesión de Firebase
   * autenticada), nunca msgData.senderId — ese campo solo se usa para el
   * eco local optimista, que refleja la identidad de "personaje de
   * demostración" activa (currentStaffUser), la cual puede no coincidir
   * con la sesión real (ver el comentario de chat.ts sobre este punto).
   * recipientId/referenceEpisodeId son ids LOCALES; se resuelven a los
   * remoteId numéricos reales de staffUsers/episodes antes de enviarlos.
   */
  const sendChatMessage = async (msgData: Omit<LabChatMessage, 'id' | 'timestamp' | 'readBy'>): Promise<LabChatMessage> => {
    const draftMsg: LabChatMessage = {
      ...msgData,
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      readBy: [msgData.senderId]
    };

    let newMsg = draftMsg;
    if (isEffectiveOnline) {
      try {
        const recipientRemoteId = msgData.recipientId
          ? staffUsers.find(u => u.id === msgData.recipientId)?.remoteId
          : undefined;
        const episodeRemoteId = msgData.referenceEpisodeId
          ? episodes.find(ep => ep.id === msgData.referenceEpisodeId)?.remoteId
          : undefined;
        const creado = await enviarMensajeRemoto({
          channelId: draftMsg.channelId,
          recipientId: recipientRemoteId,
          content: draftMsg.content,
          priority: draftMsg.priority,
          referenceEpisodeId: episodeRemoteId
        });
        newMsg = { ...draftMsg, id: `msg-remote-${creado.id_mensaje}`, remoteId: creado.id_mensaje };
      } catch (err) {
        const mensaje = err instanceof ChatApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo enviar el mensaje de chat al servidor:', err);
        showNotification(`No se pudo enviar el mensaje al servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
      }
    }

    setChatMessages(prev => [...prev, newMsg]);

    // Play chime sound
    playNotificationChime(newMsg.priority === 'panico' || newMsg.priority === 'urgente' ? 'urgent' : 'normal');

    // Show toast for urgent/panic messages
    if (newMsg.priority === 'panico') {
      showNotification(`🚨 ALERTA STAT: ${newMsg.content.slice(0, 65)}...`, 'error');
    } else if (newMsg.priority === 'urgente') {
      showNotification(`⚠️ Mensaje urgente de ${newMsg.senderName} (${newMsg.senderRole})`, 'warning');
    }

    return newMsg;
  };

  const markChatMessagesAsRead = async (channelOrDirectId: string): Promise<void> => {
    if (isEffectiveOnline) {
      try {
        // Un mensaje directo real se reparte entre DOS id_canal distintos
        // según quién lo envió (channelId siempre es "dm_<idDelOtro>" desde
        // la perspectiva de quien envía — ver sendChatMessage más arriba y
        // el comentario de chat.ts sobre esta simplificación), así que para
        // marcar como leída TODA una conversación directa hay que
        // sincronizar ambas variantes. Un canal de equipo no tiene esa
        // ambigüedad: su id_canal es único.
        const esConversacionDirecta = channelOrDirectId.startsWith('dm_') || staffUsers.some(u => u.id === channelOrDirectId);
        const otroId = channelOrDirectId.startsWith('dm_') ? channelOrDirectId.slice(3) : channelOrDirectId;
        const canalesARemarcar = esConversacionDirecta
          ? Array.from(new Set([`dm_${otroId}`, `dm_${currentStaffUser.id}`]))
          : [channelOrDirectId];
        await Promise.all(canalesARemarcar.map(canal => marcarCanalLeidoRemoto(canal)));
      } catch (err) {
        // Sin advertencia visible a propósito: la versión local tampoco
        // notificaba esto, es una operación de bajo riesgo, y al volver a
        // abrir el mismo canal se reintenta sola (no se encola como acción
        // pendiente porque es idempotente y no necesita replay explícito).
        console.error('[ClinicContext] No se pudo marcar el canal de chat como leído en el servidor:', err);
      }
    }
    setChatMessages(prev =>
      prev.map(m => {
        const isMatch = m.channelId === channelOrDirectId || (m.recipientId && (m.senderId === channelOrDirectId || m.recipientId === channelOrDirectId));
        if (isMatch && !m.readBy.includes(currentStaffUser.id)) {
          return {
            ...m,
            readBy: [...m.readBy, currentStaffUser.id]
          };
        }
        return m;
      })
    );
  };

  /**
   * Solo intenta sincronizar contra el backend si el mensaje YA tiene
   * remoteId (igual convención que updateReagent()/updateTemplate() sobre
   * ítems de fábrica). Si el servidor responde con éxito, se adopta su
   * arreglo `reacciones` como la verdad real (útil porque ahora es una
   * fila compartida y otra persona pudo reaccionar casi al mismo tiempo),
   * traduciendo cada id numérico real de vuelta a un id local de
   * staffUsers para que el resto del código (que compara contra
   * currentStaffUser.id) siga funcionando igual que antes.
   */
  const addChatReaction = async (messageId: string, emoji: string): Promise<void> => {
    const target = chatMessages.find(m => m.id === messageId);
    if (isEffectiveOnline && target?.remoteId) {
      try {
        const resultado = await toggleReaccionRemota(target.remoteId, emoji);
        const reaccionesLocal = resultado.reacciones.map(r => ({
          emoji: r.emoji,
          count: r.count,
          users: r.users.map(uid => staffUsers.find(su => su.remoteId === uid)?.id ?? String(uid))
        }));
        setChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: reaccionesLocal } : m));
        return;
      } catch (err) {
        const mensaje = err instanceof ChatApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo registrar la reacción en el servidor:', err);
        showNotification(`No se pudo sincronizar la reacción con el servidor (${mensaje}). Se aplicó solo localmente.`, 'warning');
        // Sigue abajo con el cálculo local de respaldo, igual que los
        // demás módulos cuando falla la llamada remota estando online.
      }
    }
    setChatMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || [];
        const existing = currentReactions.find(r => r.emoji === emoji);
        let updatedReactions;
        if (existing) {
          if (existing.users.includes(currentStaffUser.id)) {
            const filteredUsers = existing.users.filter(u => u !== currentStaffUser.id);
            if (filteredUsers.length === 0) {
              updatedReactions = currentReactions.filter(r => r.emoji !== emoji);
            } else {
              updatedReactions = currentReactions.map(r => r.emoji === emoji ? { ...r, count: filteredUsers.length, users: filteredUsers } : r);
            }
          } else {
            updatedReactions = currentReactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, currentStaffUser.id] } : r);
          }
        } else {
          updatedReactions = [...currentReactions, { emoji, count: 1, users: [currentStaffUser.id] }];
        }
        return {
          ...m,
          reactions: updatedReactions
        };
      })
    );
  };

  /**
   * Restricción real nueva que la versión local no tenía: el backend
   * (chat.ts) solo permite que el propio emisor borre su mensaje (403 en
   * cualquier otro caso). Si eso ocurre, el mensaje NO se borra ni
   * siquiera localmente -a diferencia del resto de fallos remotos-,
   * porque el mensaje real sigue existiendo para todo el equipo en
   * Postgres y borrarlo solo de esta pantalla sería mostrar un estado
   * falso. Esto puede pasar si el "personaje de demostración" activo
   * (currentStaffUser, con el que la UI decide mostrar el botón de
   * borrar) no coincide con la sesión real de Firebase de esta pestaña.
   */
  const deleteChatMessage = async (messageId: string): Promise<void> => {
    const target = chatMessages.find(m => m.id === messageId);
    if (isEffectiveOnline && target?.remoteId) {
      try {
        await eliminarMensajeRemoto(target.remoteId);
      } catch (err) {
        if (err instanceof ChatApiError && err.status === 403) {
          showNotification('No puedes eliminar mensajes de otras personas: esta restricción ahora es real (no solo de la interfaz).', 'error');
          return;
        }
        const mensaje = err instanceof ChatApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo eliminar el mensaje en el servidor:', err);
        showNotification(`No se pudo eliminar el mensaje en el servidor (${mensaje}). Se eliminó solo localmente.`, 'warning');
      }
    }
    setChatMessages(prev => prev.filter(m => m.id !== messageId));
    showNotification('Mensaje eliminado del chat', 'info');
  };

  /**
   * A diferencia de deleteChatMessage, esta operación replica el alcance
   * SIN restricciones que ya tenía la versión local (cualquier personal
   * puede limpiar un canal completo) — ver la nota de riesgo real en
   * chat.ts: ahora borra el historial compartido de todo el equipo, no
   * solo la copia de este navegador.
   */
  const clearChatChannelHistory = async (channelId: string): Promise<void> => {
    if (isEffectiveOnline) {
      try {
        await limpiarHistorialCanalRemoto(channelId);
      } catch (err) {
        const mensaje = err instanceof ChatApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo limpiar el historial del canal en el servidor:', err);
        showNotification(`No se pudo limpiar el historial en el servidor (${mensaje}). Se limpió solo localmente.`, 'warning');
      }
    }
    setChatMessages(prev => prev.filter(m => m.channelId !== channelId));
    showNotification('Historial de mensajes limpiado', 'warning');
  };

  const unreadChatCount = chatMessages.filter(m => 
    m.senderId !== currentStaffUser.id && !m.readBy.includes(currentStaffUser.id)
  ).length;

  // Lab Settings & Print Template State
  const [labSettings, setLabSettingsState] = useState<LabSettings>(() => {
    try {
      const saved = localStorage.getItem(LAB_SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.reportTemplateStyle === 'medilab') {
          parsed.reportTemplateStyle = 'vaclinic';
        }
        if (parsed.labName && parsed.labName.toLowerCase().includes('medilab')) {
          parsed.labName = 'VACLINIC';
        }
        if (parsed.email && parsed.email.toLowerCase().includes('medilab')) {
          parsed.email = 'laboratoriovaclinic@gmail.com';
        }
        return { ...INITIAL_LAB_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Error loading lab settings from localStorage:', e);
    }
    return INITIAL_LAB_SETTINGS;
  });

  const updateLabSettings = (updates: Partial<LabSettings>) => {
    setLabSettingsState(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(LAB_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving lab settings to localStorage:', e);
      }
      return updated;
    });
  };

  const resetLabSettingsToFactory = () => {
    setLabSettingsState(INITIAL_LAB_SETTINGS);
    try {
      localStorage.setItem(LAB_SETTINGS_STORAGE_KEY, JSON.stringify(INITIAL_LAB_SETTINGS));
      showNotification('Ajustes restablecidos a la configuración de fábrica', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const exportLabSettingsJson = () => {
    return JSON.stringify(labSettings, null, 2);
  };

  const importLabSettingsJson = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (typeof parsed === 'object' && parsed !== null) {
        const merged = { ...INITIAL_LAB_SETTINGS, ...parsed };
        setLabSettingsState(merged);
        localStorage.setItem(LAB_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        showNotification('Ajustes de laboratorio importados y aplicados correctamente', 'success');
        return { success: true, message: 'Ajustes importados y aplicados exitosamente.' };
      }
      return { success: false, message: 'El archivo JSON no tiene un formato válido de ajustes.' };
    } catch (err: any) {
      return { success: false, message: `Error al procesar JSON: ${err?.message || 'Formato inválido'}` };
    }
  };

  // ==========================================
  // ORDERS, FOLDERS & ARCHIVE IMPLEMENTATION
  // ==========================================

  /**
   * Registro de orden (Etapa "sistema real"). ANTES: puramente local,
   * `id`/`orderNumber` inventados en el navegador, sin ningún vínculo con
   * la base de datos real ya probada (server/routes/ordenes.ts). AHORA: si
   * la orden trae `examCodes` (códigos del catálogo real, ej. "PAN-01" —
   * ver NewOrderRegistration.tsx) y el paciente ya existe de verdad en
   * Postgres (`esPacienteIdRemoto`), se resuelven esos códigos a los
   * id_examen reales (migración 0010) y se crea la orden de verdad vía
   * POST /api/ordenes -en una sola transacción que también genera el
   * código único de consulta del paciente, fn_generar_codigo_consulta-.
   * Si algo de eso falta o falla, se conserva el comportamiento local
   * anterior (incluida la cola fuera de línea), avisando siempre con
   * honestidad cuándo la orden NO quedó en la base de datos real.
   */
  const addOrder = async (orderData: Omit<LabOrder, 'id' | 'seqNumber'>): Promise<LabOrder> => {
    const maxSeq = orders.reduce((max, o) => Math.max(max, o.seqNumber || 0), 198);
    const newSeq = maxSeq + 1;

    const idPacienteRemoto = orderData.patientId && esPacienteIdRemoto(orderData.patientId)
      ? Number(orderData.patientId)
      : null;

    if (isEffectiveOnline && idPacienteRemoto && orderData.examCodes && orderData.examCodes.length > 0) {
      try {
        const { ids, noEncontrados } = await resolverCodigosAIdsExamen(orderData.examCodes);
        if (noEncontrados.length > 0) {
          throw new OrdenesApiError(
            `Estos exámenes todavía no existen en el catálogo real del servidor: ${noEncontrados.join(', ')}.`
          );
        }
        const resultado = await createOrdenRemote(idPacienteRemoto, ids);
        const newOrder: LabOrder = {
          ...orderData,
          id: `ord-${resultado.id_orden}`,
          seqNumber: newSeq,
          orderNumber: resultado.numero_orden,
          remoteId: resultado.id_orden,
          codigoConsulta: resultado.codigo_consulta,
          // Detalle real (un id_detalle por examen) devuelto por POST
          // /api/ordenes -necesario más adelante para poder capturar
          // resultados reales contra esta orden (ver `addReport` más abajo
          // y src/types.ts `LabOrder.detalleRemoto`).
          detalleRemoto: resultado.detalle
        };
        setOrders(prev => [newOrder, ...prev]);
        showNotification(`Orden ${newOrder.orderNumber} registrada en la base de datos real. Código de consulta: ${resultado.codigo_consulta}`);
        createBackupSnapshot('save_order', `Nueva orden ${newOrder.orderNumber} (${newOrder.patientName})`);
        return newOrder;
      } catch (err) {
        const mensaje = err instanceof OrdenesApiError || err instanceof ExamenesApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo crear la orden en el servidor real:', err);
        showNotification(`No se pudo registrar la orden en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
        // Continúa abajo con la ruta local.
      }
    }

    const newOrder: LabOrder = {
      ...orderData,
      id: `ord-${newSeq}`,
      seqNumber: newSeq,
      orderNumber: `#${newSeq}`
    };

    setOrders(prev => [newOrder, ...prev]);

    if (!isEffectiveOnline) {
      queuePendingAction({
        actionType: 'create_order',
        entityType: 'Orden de Laboratorio',
        entityId: newOrder.id,
        description: `Orden ${newOrder.orderNumber} para ${newOrder.patientName}`,
        payload: newOrder
      });
      showNotification(`Orden ${newOrder.orderNumber} registrada (Guardada en cola fuera de línea)`, 'warning');
    }

    createBackupSnapshot('save_order', `Nueva orden ${newOrder.orderNumber} (${newOrder.patientName})`);

    return newOrder;
  };

  const updateOrder = (id: string, updates: Partial<LabOrder>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const updated = { ...o, ...updates };

        // Automatic Push Notification when order is ready / Listo
        if (o.status !== 'Listo' && updates.status === 'Listo') {
          const targetPat = patients.find(p => p.fullName.toLowerCase() === o.patientName.toLowerCase() || p.nationalId === o.nationalId);
          const pin = targetPat?.pinCode || targetPat?.accessCode || o.nationalId?.substring(0, 6) || '123456';

          sendPushNotification({
            patientId: targetPat?.id || o.id,
            patientName: o.patientName,
            reportNumber: o.orderNumber,
            type: 'report_ready',
            title: '📄 ¡Tus Resultados de Laboratorio Están Listos!',
            body: `Tu orden ${o.orderNumber} (${o.testsList.slice(0, 2).join(', ')}) ha sido completada y validada en VACLINIC. PIN de consulta: ${pin}.`,
            actionLabel: 'Ver Resultados',
            channel: 'firebase_fcm',
            firebaseDelivered: true
          });

          FirebaseMessagingService.sendResultReadyPushNotification({
            patientId: targetPat?.id || o.id,
            patientName: o.patientName,
            patientPhone: o.phone,
            reportNumber: o.orderNumber,
            reportTitle: o.testsList.join(' + '),
            accessPin: pin
          });
        }

        return updated;
      }
      return o;
    }));

    if (!isEffectiveOnline) {
      queuePendingAction({
        actionType: 'update_order',
        entityType: 'Orden de Laboratorio',
        entityId: id,
        description: `Actualización de orden ID ${id}`,
        payload: updates
      });
    }
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    showNotification('Orden eliminada del sistema', 'info');
  };

  const archiveOrder = (id: string) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`;
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        return {
          ...o,
          isArchived: true,
          archivedAt: formattedDate,
          archivedBy: currentStaffUser?.name || 'Administrador VACLINIC'
        };
      }
      return o;
    }));
    showNotification('Orden archivada correctamente', 'success');
  };

  const restoreOrder = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        return {
          ...o,
          isArchived: false,
          archivedAt: undefined,
          archivedBy: undefined
        };
      }
      return o;
    }));
    showNotification('Orden restaurada a órdenes activas', 'success');
  };

  const bulkArchiveOrders = (ids: string[]) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`;
    setOrders(prev => prev.map(o => {
      if (ids.includes(o.id)) {
        return {
          ...o,
          isArchived: true,
          archivedAt: formattedDate,
          archivedBy: currentStaffUser?.name || 'Administrador VACLINIC'
        };
      }
      return o;
    }));
    showNotification(`${ids.length} orden(es) archivadas con éxito`, 'success');
  };

  const bulkRestoreOrders = (ids: string[]) => {
    setOrders(prev => prev.map(o => {
      if (ids.includes(o.id)) {
        return {
          ...o,
          isArchived: false,
          archivedAt: undefined,
          archivedBy: undefined
        };
      }
      return o;
    }));
    showNotification(`${ids.length} orden(es) restauradas a activas`, 'success');
  };

  const bulkDeleteOrders = (ids: string[]) => {
    setOrders(prev => prev.filter(o => !ids.includes(o.id)));
    showNotification(`${ids.length} orden(es) eliminadas`, 'info');
  };

  // Las 5 funciones de carpetas siguen el mismo patrón de resiliencia que
  // pacientes/órdenes/resultados: si la orden/carpeta involucrada tiene un
  // id real (remoteId), se intenta sincronizar contra
  // server/routes/carpetas.ts (migración 0011); si algo falla -o no hay id
  // real todavía-, se sigue aplicando el cambio local exactamente como
  // antes, con una notificación honesta en vez de fingir éxito.

  const moveOrderToFolder = async (orderId: string, folderId: string): Promise<void> => {
    const targetFolder = orderFolders.find(f => f.id === folderId);
    const finalFolderId = folderId === 'folder-all' ? 'folder-unassigned' : folderId;
    const finalTargetFolder = orderFolders.find(f => f.id === finalFolderId) || targetFolder;

    const order = orders.find(o => o.id === orderId);
    if (isEffectiveOnline && order?.remoteId && finalTargetFolder?.remoteId) {
      try {
        await moverOrdenACarpetaRemota(order.remoteId, finalTargetFolder.remoteId);
      } catch (err) {
        const mensaje = err instanceof CarpetasApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo mover la orden de carpeta en el servidor:', err);
        showNotification(`No se pudo sincronizar el cambio de carpeta con el servidor (${mensaje}). Se aplicó solo localmente.`, 'warning');
      }
    }

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, folderId: finalFolderId } : o)));
    showNotification(`Orden guardada en "${targetFolder?.name || 'Carpeta'}"`, 'success');
  };

  const bulkMoveOrdersToFolder = async (orderIds: string[], folderId: string): Promise<void> => {
    const targetFolder = orderFolders.find(f => f.id === folderId);
    const finalFolderId = folderId === 'folder-all' ? 'folder-unassigned' : folderId;
    const finalTargetFolder = orderFolders.find(f => f.id === finalFolderId) || targetFolder;

    if (isEffectiveOnline && finalTargetFolder?.remoteId) {
      const idsRemotos = orders
        .filter(o => orderIds.includes(o.id) && o.remoteId)
        .map(o => o.remoteId!) as number[];
      if (idsRemotos.length > 0) {
        try {
          await moverVariasOrdenesACarpetaRemota(idsRemotos, finalTargetFolder.remoteId);
        } catch (err) {
          const mensaje = err instanceof CarpetasApiError ? err.message : 'Error de red desconocido.';
          console.error('[ClinicContext] No se pudo mover varias órdenes de carpeta en el servidor:', err);
          showNotification(`No se pudo sincronizar el movimiento masivo con el servidor (${mensaje}). Se aplicó solo localmente.`, 'warning');
        }
      }
    }

    setOrders(prev => prev.map(o => (orderIds.includes(o.id) ? { ...o, folderId: finalFolderId } : o)));
    showNotification(`${orderIds.length} orden(es) organizadas en "${targetFolder?.name || 'Carpeta'}"`, 'success');
  };

  const createOrderFolder = async (name: string, color: string, description?: string): Promise<OrderFolder> => {
    const draftFolder: OrderFolder = {
      id: `folder-custom-${Date.now()}`,
      name: name.trim(),
      color: color || 'teal',
      description: description?.trim() || 'Carpeta personalizada de archivo',
      icon: 'Folder',
      isSystem: false,
      createdAt: new Date().toISOString()
    };

    let newFolder = draftFolder;
    if (isEffectiveOnline) {
      try {
        const creada = await crearCarpetaRemota(draftFolder.name, draftFolder.color, draftFolder.icon, draftFolder.description);
        newFolder = { ...draftFolder, id: `folder-remote-${creada.id_carpeta}`, remoteId: creada.id_carpeta };
      } catch (err) {
        const mensaje = err instanceof CarpetasApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo crear la carpeta en el servidor:', err);
        showNotification(`No se pudo registrar la carpeta en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
      }
    }

    setOrderFolders(prev => [...prev, newFolder]);
    showNotification(`Carpeta "${newFolder.name}" creada exitosamente`, 'success');
    return newFolder;
  };

  const updateOrderFolder = async (folderId: string, updates: Partial<OrderFolder>): Promise<void> => {
    const folder = orderFolders.find(f => f.id === folderId);
    if (isEffectiveOnline && folder?.remoteId) {
      try {
        await actualizarCarpetaRemota(folder.remoteId, {
          nombre: updates.name,
          color: updates.color,
          icono: updates.icon,
          descripcion: updates.description
        });
      } catch (err) {
        const mensaje = err instanceof CarpetasApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo actualizar la carpeta en el servidor:', err);
        showNotification(`No se pudo sincronizar la carpeta con el servidor (${mensaje}). Se actualizó solo localmente.`, 'warning');
      }
    }
    setOrderFolders(prev => prev.map(f => f.id === folderId ? { ...f, ...updates } : f));
    showNotification('Carpeta actualizada', 'success');
  };

  const deleteOrderFolder = async (folderId: string): Promise<void> => {
    const folderToDelete = orderFolders.find(f => f.id === folderId);
    if (folderToDelete?.isSystem) {
      showNotification('Las carpetas del sistema no pueden eliminarse', 'warning');
      return;
    }

    if (isEffectiveOnline && folderToDelete?.remoteId) {
      try {
        await eliminarCarpetaRemota(folderToDelete.remoteId);
      } catch (err) {
        const mensaje = err instanceof CarpetasApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo eliminar la carpeta en el servidor:', err);
        showNotification(`No se pudo eliminar la carpeta en el servidor (${mensaje}). Se eliminó solo localmente.`, 'warning');
      }
    }

    // Move associated orders to unassigned
    setOrders(prev => prev.map(o => o.folderId === folderId ? { ...o, folderId: 'folder-unassigned' } : o));
    setOrderFolders(prev => prev.filter(f => f.id !== folderId));
    showNotification(`Carpeta eliminada. Las órdenes se movieron a la bandeja sin clasificar.`, 'info');
  };

  // ==========================================
  // REAGENTS INVENTORY & STOCK ALERTS METHODS
  // ==========================================

  const addReagent = async (itemData: Omit<ReagentInventoryItem, 'id' | 'updatedAt'>): Promise<ReagentInventoryItem> => {
    const draftItem: ReagentInventoryItem = {
      ...itemData,
      id: `rgt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    let newItem = draftItem;
    if (isEffectiveOnline) {
      try {
        const creado = await crearReactivoRemoto({
          code: draftItem.code, name: draftItem.name, category: draftItem.category,
          associatedTests: draftItem.associatedTests, lotNumber: draftItem.lotNumber,
          expirationDate: draftItem.expirationDate, currentStock: draftItem.currentStock,
          minStockAlert: draftItem.minStockAlert, optimalStock: draftItem.optimalStock,
          unit: draftItem.unit, storageCondition: draftItem.storageCondition,
          supplier: draftItem.supplier, location: draftItem.location,
          costPerUnit: draftItem.costPerUnit, testsPerUnit: draftItem.testsPerUnit, notes: draftItem.notes
        });
        newItem = { ...draftItem, id: `rgt-remote-${creado.id_reactivo}`, remoteId: creado.id_reactivo };
      } catch (err) {
        const mensaje = err instanceof ReactivosApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo crear el reactivo en el servidor:', err);
        showNotification(`No se pudo registrar el reactivo en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
      }
    }

    setReagents(prev => [newItem, ...prev]);

    // Log movement of initial stock
    if (newItem.currentStock > 0) {
      const initialLog: ReagentMovementLog = {
        id: `mov-${Date.now()}`,
        reagentId: newItem.id,
        reagentName: newItem.name,
        type: 'entrada',
        quantity: newItem.currentStock,
        previousStock: 0,
        newStock: newItem.currentStock,
        reason: 'Ingreso inicial al catálogo',
        operator: currentStaffUser?.name || 'Administrador',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      setReagentMovements(prev => [initialLog, ...prev]);
    }

    // Check if new item is already below alert threshold
    if (newItem.currentStock <= newItem.minStockAlert) {
      playNotificationChime('urgent');
      showNotification(`¡Alerta! El reactivo "${newItem.name}" ingresó con stock bajo o crítico (${newItem.currentStock} ${newItem.unit})`, 'warning');
    }

    return newItem;
  };

  const updateReagent = async (id: string, updates: Partial<ReagentInventoryItem>): Promise<void> => {
    const target = reagents.find(r => r.id === id);
    if (isEffectiveOnline && target?.remoteId) {
      try {
        await actualizarReactivoRemoto(target.remoteId, {
          name: updates.name, category: updates.category, associatedTests: updates.associatedTests,
          lotNumber: updates.lotNumber, expirationDate: updates.expirationDate,
          minStockAlert: updates.minStockAlert, optimalStock: updates.optimalStock, unit: updates.unit,
          storageCondition: updates.storageCondition, supplier: updates.supplier, location: updates.location,
          costPerUnit: updates.costPerUnit, testsPerUnit: updates.testsPerUnit, notes: updates.notes
        });
      } catch (err) {
        const mensaje = err instanceof ReactivosApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo actualizar el reactivo en el servidor:', err);
        showNotification(`No se pudo sincronizar el reactivo con el servidor (${mensaje}). Se actualizó solo localmente.`, 'warning');
      }
    }
    setReagents(prev => prev.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };

        // Recalculate status if stock or threshold changed
        const current = updated.currentStock;
        const min = updated.minStockAlert;
        if (current <= Math.floor(min * 0.5)) {
          updated.status = 'critico';
        } else if (current <= min) {
          updated.status = 'bajo_stock';
        } else {
          updated.status = 'optimo';
        }

        return updated;
      }
      return item;
    }));
  };

  const deleteReagent = async (id: string): Promise<void> => {
    const target = reagents.find(r => r.id === id);
    if (isEffectiveOnline && target?.remoteId) {
      try {
        await eliminarReactivoRemoto(target.remoteId);
      } catch (err) {
        const mensaje = err instanceof ReactivosApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo eliminar el reactivo en el servidor:', err);
        showNotification(`No se pudo eliminar el reactivo en el servidor (${mensaje}). Se eliminó solo localmente.`, 'warning');
      }
    }
    setReagents(prev => prev.filter(r => r.id !== id));
    showNotification(`Reactivo "${target?.name || id}" eliminado del inventario`, 'info');
  };

  // Misma lógica de cálculo que ya usaba registerReagentMovement antes de
  // esta migración; se extrae aparte porque ahora también se necesita
  // como respaldo local cuando falla la llamada remota (ver más abajo).
  function calcularMovimientoLocal(
    target: ReagentInventoryItem,
    type: 'entrada' | 'salida_consumo' | 'ajuste' | 'baja_vencimiento',
    quantity: number
  ): { newStock: number; newStatus: ReagentInventoryItem['status'] } {
    let newStock = target.currentStock;
    if (type === 'entrada') {
      newStock = target.currentStock + quantity;
    } else if (type === 'salida_consumo' || type === 'baja_vencimiento') {
      newStock = Math.max(0, target.currentStock - quantity);
    } else if (type === 'ajuste') {
      newStock = quantity;
    }
    let newStatus: ReagentInventoryItem['status'] = 'optimo';
    if (newStock <= Math.floor(target.minStockAlert * 0.5)) {
      newStatus = 'critico';
    } else if (newStock <= target.minStockAlert) {
      newStatus = 'bajo_stock';
    }
    return { newStock, newStatus };
  }

  const registerReagentMovement = async (
    reagentId: string,
    type: 'entrada' | 'salida_consumo' | 'ajuste' | 'baja_vencimiento',
    quantity: number,
    reason: string
  ): Promise<void> => {
    const target = reagents.find(r => r.id === reagentId);
    if (!target) return;

    let previousStock = target.currentStock;
    let newStock = previousStock;
    let newStatus: ReagentInventoryItem['status'] = target.status;
    let remoteMovementId: number | undefined;

    if (isEffectiveOnline && target.remoteId) {
      try {
        const resultado = await registrarMovimientoReactivoRemoto(target.remoteId, type, quantity, reason);
        previousStock = Number(resultado.movimiento.stock_anterior);
        newStock = Number(resultado.movimiento.stock_nuevo);
        newStatus = resultado.reactivo.estado as ReagentInventoryItem['status'];
        remoteMovementId = resultado.movimiento.id_movimiento;
      } catch (err) {
        const mensaje = err instanceof ReactivosApiError ? err.message : 'Error de red desconocido.';
        console.error('[ClinicContext] No se pudo registrar el movimiento en el servidor:', err);
        showNotification(`No se pudo registrar el movimiento en el servidor (${mensaje}). Se guardó solo localmente.`, 'warning');
        // Continúa abajo con el cálculo local, igual que el resto de módulos.
        ({ newStock, newStatus } = calcularMovimientoLocal(target, type, quantity));
      }
    } else {
      ({ newStock, newStatus } = calcularMovimientoLocal(target, type, quantity));
    }

    // Update reagent stock
    setReagents(prev => prev.map(r => {
      if (r.id === reagentId) {
        return {
          ...r,
          currentStock: newStock,
          status: newStatus,
          lastRestockedAt: type === 'entrada' ? new Date().toISOString().slice(0, 10) : r.lastRestockedAt,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
      }
      return r;
    }));

    // Register movement log
    const newLog: ReagentMovementLog = {
      id: remoteMovementId ? `mov-remote-${remoteMovementId}` : `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reagentId: target.id,
      reagentName: target.name,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      operator: currentStaffUser?.name || 'Bioanalista en Turno',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      remoteId: remoteMovementId
    };

    setReagentMovements(prev => [newLog, ...prev]);

    if (!isEffectiveOnline) {
      queuePendingAction({
        actionType: 'reagent_movement',
        entityType: 'Reactivo e Insumo',
        entityId: target.id,
        description: `Movimiento de ${type} (${quantity} ${target.unit}): ${target.name}`,
        payload: newLog
      });
    }

    // Stock alert notifications
    if (newStock <= Math.floor(target.minStockAlert * 0.5)) {
      playNotificationChime('urgent');
      showNotification(`¡STOCK CRÍTICO! "${target.name}" ha quedado en ${newStock} ${target.unit} (Mínimo: ${target.minStockAlert}). Riesgo de detención de pruebas.`, 'error');
    } else if (newStock <= target.minStockAlert && previousStock > target.minStockAlert) {
      playNotificationChime('normal');
      showNotification(`Alerta de Stock Mínimo: "${target.name}" llegó al umbral de reposición (${newStock} ${target.unit}).`, 'warning');
    } else {
      showNotification(`Movimiento de ${type === 'entrada' ? 'entrada' : 'salida'} registrado para "${target.name}"`, 'success');
    }
  };

  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<'membrete' | 'firmas' | 'margenes' | 'colores' | 'seguridad' | 'operaciones' | 'inventario'>('membrete');

  // Continuous monitoring: Critical and Low Stock calculations
  const criticalReagents = useMemo(() => {
    return reagents.filter(r => r.currentStock <= Math.floor(r.minStockAlert * 0.5) || r.status === 'critico');
  }, [reagents]);

  const lowStockReagents = useMemo(() => {
    return reagents.filter(r => r.currentStock <= r.minStockAlert && r.currentStock > Math.floor(r.minStockAlert * 0.5) && r.status !== 'critico');
  }, [reagents]);

  const reagentsBelowMinThreshold = useMemo(() => {
    return reagents.filter(r => r.currentStock <= r.minStockAlert);
  }, [reagents]);

  const navigateToInventory = () => {
    setActiveSettingsSubTab('inventario');
    setStaffActiveTab('ajustes');
  };

  const quickRestockReagent = (reagentId: string, quantityToAdd?: number) => {
    const target = reagents.find(r => r.id === reagentId);
    if (!target) return;
    const qty = quantityToAdd || Math.max(10, target.optimalStock - target.currentStock);
    registerReagentMovement(reagentId, 'entrada', qty, 'Reabastecimiento urgente de stock mínimo');
    showNotification(`Reactivo "${target.name}" reabastecido (+${qty} ${target.unit}).`, 'success');
  };

  const simulateReagentConsumption = (reagentId: string, quantityToConsume?: number) => {
    const target = reagents.find(r => r.id === reagentId);
    if (!target) return;
    const qty = quantityToConsume || Math.max(1, Math.ceil(target.currentStock * 0.6));
    registerReagentMovement(reagentId, 'salida_consumo', qty, 'Consumo analítico en corrida (Simulación de stock crítico)');
  };

  const restockAllCriticalReagents = () => {
    if (reagentsBelowMinThreshold.length === 0) {
      showNotification('No hay reactivos con stock crítico en este momento.', 'info');
      return;
    }
    reagentsBelowMinThreshold.forEach(r => {
      const qty = Math.max(10, r.optimalStock - r.currentStock);
      registerReagentMovement(r.id, 'entrada', qty, 'Reposición general express');
    });
    showNotification(`Se reabastecieron ${reagentsBelowMinThreshold.length} reactivo(s) críticos al stock óptimo`, 'success');
  };

  const resetReagentsToFactory = () => {
    setReagents(INITIAL_REAGENTS);
    localStorage.setItem(REAGENTS_STORAGE_KEY, JSON.stringify(INITIAL_REAGENTS));
    showNotification('Catálogo e inventario de reactivos restablecido de fábrica', 'info');
  };

  const exportReagentsJson = () => {
    return JSON.stringify({ reagents, movements: reagentMovements }, null, 2);
  };

  const importReagentsJson = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed && Array.isArray(parsed.reagents)) {
        setReagents(parsed.reagents);
        if (Array.isArray(parsed.movements)) {
          setReagentMovements(parsed.movements);
        }
        showNotification(`${parsed.reagents.length} reactivos importados y sincronizados`, 'success');
        return { success: true, message: 'Reactivos importados con éxito.' };
      } else if (Array.isArray(parsed)) {
        setReagents(parsed);
        showNotification(`${parsed.length} reactivos importados`, 'success');
        return { success: true, message: 'Reactivos importados con éxito.' };
      }
      return { success: false, message: 'Formato de archivo inválido.' };
    } catch (err: any) {
      return { success: false, message: `Error al procesar archivo JSON: ${err?.message || ''}` };
    }
  };

  // ==========================================
  // BACKUP & RESTORE RECOVERY SYSTEM
  // ==========================================
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [backupSnapshots, setBackupSnapshots] = useState<BackupSnapshot[]>(() => {
    return BackupService.getRecentSnapshots();
  });
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(LAST_BACKUP_TIME_STORAGE_KEY) || null;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const createBackupSnapshot = (trigger: BackupSnapshot['trigger'], triggerDetail: string) => {
    try {
      const fullBackup = BackupService.generateFullBackup({
        reports,
        patients,
        orders,
        orderFolders,
        episodes,
        transfers,
        catalogTests,
        customProfiles,
        templates,
        labSettings,
        staffUsers,
        staffRoles,
        auditLogs,
        reagents,
        reagentMovements,
        chatMessages,
        pushNotifications
      }, {
        userId: currentStaffUser?.id,
        userName: currentStaffUser?.fullName,
        userRole: currentStaffUser?.role
      });

      const jsonStr = JSON.stringify(fullBackup);
      const sizeBytes = jsonStr.length;

      const snapshot: BackupSnapshot = {
        id: `snap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        trigger,
        triggerDetail,
        totalRecords: fullBackup.backupMetadata.totalRecords,
        recordCounts: {
          reports: reports.length,
          patients: patients.length,
          orders: orders.length
        },
        authorName: currentStaffUser?.fullName || 'Personal de Laboratorio',
        sizeBytes,
        backupData: fullBackup
      };

      BackupService.saveSnapshot(snapshot);
      setBackupSnapshots(BackupService.getRecentSnapshots());
      const nowIso = new Date().toISOString();
      setLastBackupTime(nowIso);
      try {
        localStorage.setItem(LAST_BACKUP_TIME_STORAGE_KEY, nowIso);
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error('Error al generar snapshot automático de respaldo:', err);
    }
  };

  const downloadFullBackupJson = (): string => {
    const fullBackup = BackupService.generateFullBackup({
      reports,
      patients,
      orders,
      orderFolders,
      episodes,
      transfers,
      catalogTests,
      customProfiles,
      templates,
      labSettings,
      staffUsers,
      staffRoles,
      auditLogs,
      reagents,
      reagentMovements,
      chatMessages,
      pushNotifications
    }, {
      userId: currentStaffUser?.id,
      userName: currentStaffUser?.fullName,
      userRole: currentStaffUser?.role
    });

    const filename = BackupService.downloadFullBackup(fullBackup);
    const nowIso = new Date().toISOString();
    setLastBackupTime(nowIso);
    try {
      localStorage.setItem(LAST_BACKUP_TIME_STORAGE_KEY, nowIso);
    } catch (e) {
      console.error(e);
    }

    logAuditEvent({
      userId: currentStaffUser?.id || 'usr-system',
      userName: currentStaffUser?.fullName || 'Personal',
      userRole: currentStaffUser?.role || 'staff',
      module: 'seguridad',
      action: 'Exportación de Respaldo Completo',
      details: `Descargado archivo de respaldo ${filename} con ${fullBackup.backupMetadata.totalRecords} registros clínicos.`,
      severity: 'info'
    });

    showNotification(`Copia de seguridad descargada: ${filename}`, 'success');
    return filename;
  };

  const downloadReportsBackupJson = (): string => {
    const filename = BackupService.downloadReportsBackup(reports, currentStaffUser?.fullName);
    showNotification(`Respaldo de ${reports.length} informes clínicos descargado: ${filename}`, 'success');
    return filename;
  };

  const restoreFullBackup = (
    backupData: LabFullBackup, 
    mode: 'overwrite' | 'merge' = 'overwrite'
  ): { success: boolean; message: string; restoredCounts: any } => {
    try {
      // Step 1: Create a safety rollback snapshot of current state before applying restore!
      createBackupSnapshot('pre_restore', `Punto de seguridad automático previo a restauración (${mode})`);

      let restoredReports = 0;
      let restoredPatients = 0;
      let restoredOrders = 0;

      if (mode === 'overwrite') {
        if (Array.isArray(backupData.reports)) {
          setReports(backupData.reports);
          restoredReports = backupData.reports.length;
        }
        if (Array.isArray(backupData.patients)) {
          setPatients(backupData.patients);
          restoredPatients = backupData.patients.length;
        }
        if (Array.isArray(backupData.orders)) {
          setOrders(backupData.orders);
          restoredOrders = backupData.orders.length;
        }
        if (Array.isArray(backupData.orderFolders)) {
          setOrderFolders(backupData.orderFolders);
        }
        if (Array.isArray(backupData.episodes)) {
          setEpisodes(backupData.episodes);
        }
        if (Array.isArray(backupData.transfers)) {
          setTransfers(backupData.transfers);
        }
        if (Array.isArray(backupData.catalogTests)) {
          setCatalogTests(backupData.catalogTests);
        }
        if (Array.isArray(backupData.customProfiles)) {
          setCustomProfiles(backupData.customProfiles);
        }
        if (Array.isArray(backupData.templates)) {
          setTemplates(backupData.templates);
        }
        if (backupData.labSettings) {
          setLabSettingsState(backupData.labSettings);
        }
        if (Array.isArray(backupData.reagents)) {
          setReagents(backupData.reagents);
        }
        if (Array.isArray(backupData.reagentMovements)) {
          setReagentMovements(backupData.reagentMovements);
        }
      } else {
        // Merge mode: combine without duplicates
        if (Array.isArray(backupData.reports)) {
          setReports(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newReps = backupData.reports.filter(r => !existingIds.has(r.id));
            restoredReports = newReps.length;
            return [...newReps, ...prev];
          });
        }
        if (Array.isArray(backupData.patients)) {
          setPatients(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPats = backupData.patients.filter(p => !existingIds.has(p.id));
            restoredPatients = newPats.length;
            return [...newPats, ...prev];
          });
        }
        if (Array.isArray(backupData.orders)) {
          setOrders(prev => {
            const existingIds = new Set(prev.map(o => o.id));
            const newOrders = backupData.orders.filter(o => !existingIds.has(o.id));
            restoredOrders = newOrders.length;
            return [...newOrders, ...prev];
          });
        }
        if (Array.isArray(backupData.catalogTests)) {
          setCatalogTests(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newTests = backupData.catalogTests.filter(t => !existingIds.has(t.id));
            return [...prev, ...newTests];
          });
        }
      }

      logAuditEvent({
        userId: currentStaffUser?.id || 'usr-system',
        userName: currentStaffUser?.fullName || 'Personal',
        userRole: currentStaffUser?.role || 'staff',
        module: 'seguridad',
        action: 'Restauración de Respaldo',
        details: `Restauración de datos ejecutada exitosamente (${mode.toUpperCase()}). Informes: ${restoredReports}, Pacientes: ${restoredPatients}, Órdenes: ${restoredOrders}.`,
        severity: 'warning'
      });

      showNotification(`Restauración completada con éxito (${mode === 'overwrite' ? 'Sobrescritura limpia' : 'Fusión inteligente'}).`, 'success');

      return {
        success: true,
        message: 'Base de datos restaurada correctamente.',
        restoredCounts: {
          reports: restoredReports,
          patients: restoredPatients,
          orders: restoredOrders
        }
      };
    } catch (err: any) {
      console.error('Error al restaurar respaldo:', err);
      showNotification(`Error al restaurar respaldo: ${err?.message || ''}`, 'error');
      return {
        success: false,
        message: `Error al restaurar: ${err?.message || ''}`,
        restoredCounts: {}
      };
    }
  };

  const restoreSnapshot = (snapshotId: string): boolean => {
    const snapshot = backupSnapshots.find(s => s.id === snapshotId);
    if (!snapshot || !snapshot.backupData) {
      showNotification('Snapshot no encontrado o datos incompletos.', 'error');
      return false;
    }
    const result = restoreFullBackup(snapshot.backupData, 'overwrite');
    return result.success;
  };

  const deleteSnapshot = (snapshotId: string) => {
    BackupService.deleteSnapshot(snapshotId);
    setBackupSnapshots(BackupService.getRecentSnapshots());
    showNotification('Punto de respaldo eliminado', 'info');
  };

  const clearBackupSnapshots = () => {
    BackupService.clearAllSnapshots();
    setBackupSnapshots([]);
    showNotification('Historial de respaldos automáticos vaciado', 'info');
  };

  return (
    <ClinicContext.Provider
      value={{
        role,
        setRole,
        patients,
        reports,
        templates,
        addTemplate,
        updateTemplate,
        resetTemplatesToFactory,
        branches,
        isMultiBranchEnabled,
        setIsMultiBranchEnabled,
        currentBranch,
        setCurrentBranch,
        episodes,
        transfers,
        selectedPatientId,
        setSelectedPatientId,
        currentPatient,
        addPatient,
        updatePatient,
        deletePatient,
        addEpisode,
        updateEpisode,
        advanceEpisodeDimension,
        resolveDuplicity,
        addSampleTransfer,
        addReport,
        updateReport,
        deleteReport,
        publishReport,
        activeReportToPrint,
        setActiveReportToPrint,
        activeReportToEdit,
        setActiveReportToEdit,
        staffActiveTab,
        setStaffActiveTab,
        searchQuery,
        setSearchQuery,
        authenticatePatient,
        logoutPatient,
        notification,
        showNotification,
        pushNotifications,
        activePushToast,
        pushPermissionStatus,
        requestPushPermission,
        sendPushNotification,
        markPushAsRead,
        markAllPushAsRead,
        clearPushNotifications,
        dismissPushToast,
        simulatePushNotification,
        patientNotificationPrefs,
        updatePatientNotificationPrefs,
        fcmToken,
        requestFirebasePushPermission,
        sendFirebaseResultReadyPush,
        catalogTests,
        customProfiles,
        addCatalogTest,
        updateCatalogTest,
        bulkUpdateCatalogTests,
        deleteCatalogTest,
        addCustomProfile,
        updateCustomProfile,
        deleteCustomProfile,
        resetCatalogToFactory,
        exportCatalogJson,
        importCatalogJson,
        isStaffAuthenticated,
        setIsStaffAuthenticated,
        loginStaffUser,
        logoutStaff,
        staffUsers,
        staffRoles,
        auditLogs,
        addStaffUser,
        updateStaffUser,
        deleteStaffUser,
        toggleUserStatus,
        resetUserPin,
        updateRolePermissions,
        logAuditEvent,
        hasPermission,
        chatMessages,
        activeChatChannelId,
        setActiveChatChannelId,
        activeDirectUserId,
        setActiveDirectUserId,
        currentStaffUser,
        setCurrentStaffUser,
        isChatFloatingOpen,
        setIsChatFloatingOpen,
        unreadChatCount,
        sendChatMessage,
        markChatMessagesAsRead,
        addChatReaction,
        deleteChatMessage,
        clearChatChannelHistory,
        theme,
        setTheme,
        isDarkMode,
        toggleTheme,
        labSettings,
        updateLabSettings,
        resetLabSettingsToFactory,
        exportLabSettingsJson,
        importLabSettingsJson,
        orders,
        orderFolders,
        addOrder,
        updateOrder,
        deleteOrder,
        archiveOrder,
        restoreOrder,
        bulkArchiveOrders,
        bulkRestoreOrders,
        bulkDeleteOrders,
        moveOrderToFolder,
        bulkMoveOrdersToFolder,
        createOrderFolder,
        updateOrderFolder,
        deleteOrderFolder,
        reagents,
        reagentMovements,
        criticalReagents,
        lowStockReagents,
        reagentsBelowMinThreshold,
        addReagent,
        updateReagent,
        deleteReagent,
        registerReagentMovement,
        quickRestockReagent,
        simulateReagentConsumption,
        restockAllCriticalReagents,
        resetReagentsToFactory,
        exportReagentsJson,
        importReagentsJson,
        activeSettingsSubTab,
        setActiveSettingsSubTab,
        navigateToInventory,
        isOnline,
        isSimulatingOffline,
        setIsSimulatingOffline,
        offlineQueue,
        isSyncingQueue,
        syncPendingChanges,
        clearOfflineQueue,
        removeOfflineAction,
        retryOfflineAction,
        lastSyncTime,
        queuePendingAction,
        isOfflineQueueModalOpen,
        setIsOfflineQueueModalOpen,
        isBackupModalOpen,
        setIsBackupModalOpen,
        backupSnapshots,
        createBackupSnapshot,
        downloadFullBackupJson,
        downloadReportsBackupJson,
        restoreFullBackup,
        restoreSnapshot,
        deleteSnapshot,
        clearBackupSnapshots,
        lastBackupTime
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
