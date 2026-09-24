export type OfflineActionType = 
  | 'create_report' 
  | 'update_report' 
  | 'publish_report'
  | 'create_patient' 
  | 'update_patient' 
  | 'create_order' 
  | 'update_order' 
  | 'advance_dimension' 
  | 'reagent_movement' 
  | 'clinical_data_change';

export interface OfflinePendingAction {
  id: string;
  actionType: OfflineActionType;
  entityType: string;
  entityId?: string;
  description: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

export interface ConnectionDiagnostics {
  effectiveType?: string; // '4g', '3g', 'wifi', etc.
  downlinkSpeed?: number; // Mbps
  rtt?: number; // round trip time ms
  lastChecked: string;
  serverReachable: boolean;
}
