import { 
  Patient, 
  MedicalReport, 
  ReportTemplate, 
  LabEpisode, 
  SampleTransferManifest, 
  LabCatalogItem, 
  LabCustomProfile, 
  LabStaffUser, 
  LabRoleConfig, 
  LabAuditLog, 
  LabChatMessage, 
  LabOrder, 
  OrderFolder,
  PatientPushNotification
} from '../types';
import { LabSettings } from './labSettings';
import { ReagentInventoryItem, ReagentMovementLog } from './reagentInventory';

export interface BackupMetadata {
  version: string;
  exportDate: string; // ISO date string
  system: string; // "LABVACLINIC LIS"
  schemaVersion: number;
  environment: string;
  totalRecords: number;
  recordCounts: {
    reports: number;
    patients: number;
    orders: number;
    orderFolders: number;
    episodes: number;
    transfers: number;
    catalogTests: number;
    customProfiles: number;
    templates: number;
    staffUsers: number;
    staffRoles: number;
    auditLogs: number;
    reagents: number;
    reagentMovements: number;
    chatMessages: number;
    pushNotifications: number;
  };
  exportedBy: {
    userId: string;
    userName: string;
    userRole: string;
  };
  checksum?: string;
  description?: string;
}

export interface LabFullBackup {
  backupMetadata: BackupMetadata;
  reports: MedicalReport[];
  patients: Patient[];
  orders: LabOrder[];
  orderFolders: OrderFolder[];
  episodes: LabEpisode[];
  transfers: SampleTransferManifest[];
  catalogTests: LabCatalogItem[];
  customProfiles: LabCustomProfile[];
  templates: ReportTemplate[];
  labSettings: LabSettings;
  staffUsers: LabStaffUser[];
  staffRoles: LabRoleConfig[];
  auditLogs: LabAuditLog[];
  reagents: ReagentInventoryItem[];
  reagentMovements: ReagentMovementLog[];
  chatMessages: LabChatMessage[];
  pushNotifications: PatientPushNotification[];
}

export interface BackupSnapshot {
  id: string;
  timestamp: string; // ISO date
  trigger: 'save_report' | 'save_patient' | 'save_order' | 'save_settings' | 'manual' | 'pre_restore' | 'delete_item';
  triggerDetail: string; // e.g., "Informe LAB-2026-8912 guardado (Borrador)"
  totalRecords: number;
  recordCounts: {
    reports: number;
    patients: number;
    orders: number;
  };
  authorName: string;
  sizeBytes: number;
  backupData: LabFullBackup;
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  backupData?: LabFullBackup;
  metadata?: BackupMetadata;
}
