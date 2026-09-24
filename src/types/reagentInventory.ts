export interface ReagentInventoryItem {
  id: string;
  code: string; // e.g., "RGT-GLU-01"
  name: string; // e.g., "Reactivo de Glucosa Hexoquinasa"
  category: 'bioquimica' | 'hematologia' | 'inmunologia' | 'microbiologia' | 'uroanalisis' | 'coagulacion' | 'insumos_generales';
  associatedTests: string[]; // e.g. ["Glucosa en Ayunas", "Curva de Tolerancia"]
  lotNumber: string; // e.g. "LOT-2026-X94"
  expirationDate: string; // YYYY-MM-DD
  currentStock: number; // e.g. 14
  minStockAlert: number; // e.g. 20 (threshold for low stock warning)
  optimalStock: number; // e.g. 50
  unit: string; // 'Kits' | 'Frascos (100mL)' | 'Cartuchos' | 'Tiras reactivas' | 'Cajas' | 'Determinaciones'
  storageCondition: 'refrigerado_2_8' | 'congelado_menos_20' | 'temperatura_ambiente' | 'protegido_luz';
  supplier: string; // e.g. "Roche Diagnostics", "Wiener Lab", "Bio-Rad"
  location: string; // e.g. "Refrigerador Central B1", "Cámara Fría #2", "Estante A4"
  costPerUnit: number; // e.g. 185.50
  testsPerUnit: number; // Tests yielded per unit, e.g. 100 tests/kit
  status: 'optimo' | 'bajo_stock' | 'critico' | 'vencido';
  notes?: string;
  lastRestockedAt?: string;
  updatedAt: string;
  // Id real de reactivo (migración 0011) cuando se pudo crear de verdad
  // en el backend; misma convención que los demás remoteId del proyecto.
  remoteId?: number;
}

export interface ReagentMovementLog {
  id: string;
  reagentId: string;
  reagentName: string;
  type: 'entrada' | 'salida_consumo' | 'ajuste' | 'baja_vencimiento';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string; // e.g. "Consumo corrida matutina 50 pruebas", "Recepción lote nuevo", "Calibración y QC"
  operator: string;
  timestamp: string;
  remoteId?: number;
}
