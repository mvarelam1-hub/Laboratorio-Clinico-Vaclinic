export type UserRole = 'personal' | 'paciente';

export type ReportCategory = 
  | 'laboratorio' 
  | 'bioquimica' 
  | 'hematologia' 
  | 'radiologia' 
  | 'cardiologia' 
  | 'patologia' 
  | 'consulta_general';

export type ReportStatus = 'borrador' | 'revision' | 'publicado' | 'entregado';

export type ParameterStatus = 'normal' | 'low' | 'high' | 'critical';

export type BranchSiteId = 'central' | 'norte' | 'este' | 'hospital_uci';

export interface BranchSite {
  id: BranchSiteId;
  name: string;
  code: string;
  city: string;
  address: string;
  isMain: boolean;
  activeSamplesCount: number;
  analyzersConnected: number;
  slaCompliance: number; // percentage e.g. 98.4
}

export type PatientType = 'ambulatorio' | 'hospitalizado' | 'emergencia' | 'empresa_convenio';

export type HealthProgram = 
  | 'general' 
  | 'diabeticos' 
  | 'materno_infantil' 
  | 'oncologico' 
  | 'ocupacional' 
  | 'cardiovascular' 
  | 'preventivo_360';

export type OriginDepartment = 
  | 'consulta_externa' 
  | 'cardiologia' 
  | 'emergencias' 
  | 'uci' 
  | 'medicina_interna' 
  | 'pediatria' 
  | 'oncologia' 
  | 'empresa_externa';

export type DimensionStage = 'D1_admision' | 'D2_flebotomia' | 'D3_analizadores' | 'D4_validacion';

export interface LabEpisode {
  id: string;
  episodeNumber: string; // e.g. "4D-2026-EP842"
  patientId: string;
  patientName: string;
  nationalId: string;
  patientType: PatientType;
  healthProgram: HealthProgram;
  origin: OriginDepartment;
  referringDoctor?: string;
  branchId: BranchSiteId;
  admissionTime: string;
  phlebotomyTime?: string;
  analyzerStartTime?: string;
  validationTime?: string;
  currentDimension: DimensionStage;
  priority: 'rutina' | 'urgente' | 'stat_panico';
  requestedTests: string[];
  tubeBarcodes: string[];
  sampleType?: string;
  tubeType?: string;
  tubesRequired?: string[];
  tatTargetMinutes: number;
  tatElapsedMinutes: number;
  duplicityFlag?: boolean;
  duplicityDetails?: string;
  isTransferred?: boolean;
  destinationBranch?: BranchSiteId;
  notes?: string;
  // Id real de episodio_4d (migración 0011) cuando este episodio se pudo
  // crear de verdad en el backend; un episodio creado solo local (servidor
  // caído) queda sin este campo, igual que LabOrder.remoteId.
  remoteId?: number;
}

export interface SampleTransferManifest {
  id: string;
  manifestCode: string;
  originBranch: BranchSiteId;
  destinationBranch: BranchSiteId;
  courierName: string;
  departureTime: string;
  estimatedArrivalTime: string;
  actualArrivalTime?: string;
  status: 'en_transito' | 'entregado' | 'retrasado';
  temperatureControl: '2_8_grados' | 'congelado_menos_20' | 'temperatura_ambiente';
  temperatureLogged: number; // e.g. 4.2 °C
  samplesCount: number;
  samplesCodes: string[];
  // Id real de transferencia_muestra (migración 0011) cuando el manifiesto
  // se pudo crear de verdad en el backend; igual convención que
  // LabOrder.remoteId / LabEpisode.remoteId.
  remoteId?: number;
}

export interface ReportParameter {
  id: string;
  name: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  status: ParameterStatus;
  notes?: string;
  minVal?: number;
  maxVal?: number;
  sampleType?: string;
  tubeType?: string;
  methodology?: string;
  section?: string; // Área o subdivisión clínica (ej: "Serie Roja", "Función Renal", "Examen Químico")
  area?: string;    // Alias de section
  criticalConfirmed?: boolean; // Confirmación analítica/médica de valor crítico o alerta
  // Código real del catálogo (examen.codigo_examen, ej. "PAN-01") que originó
  // este parámetro cuando se generó a partir de una orden real (ver
  // generateDemographicParametersForTests en referenceRangeEvaluator.ts).
  // Permite agrupar parámetros por examen real y mapearlos 1:1 a filas de
  // `resultado` en el backend (un resultado por detalle_orden/examen).
  examCode?: string;
}

export interface Patient {
  id: string;
  patientCode?: string; // e.g. "VAC-000002"
  nationalId: string; // DNI / Cédula / RUT / CURP
  accessCode: string; // e.g. "MED-2041" for easy patient login
  pinCode: string;    // 4-digit PIN e.g. "4819"
  fullName: string;
  gender: 'M' | 'F' | 'Otro';
  birthDate: string;
  age: number;
  phone: string;
  email: string;
  bloodType: string;
  allergies: string[];
  address: string;
  patientType?: PatientType;
  defaultProgram?: HealthProgram;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  createdAt: string;
}

export interface DigitalSignature {
  doctorName: string;
  doctorSpecialty: string;
  doctorLicense: string; // Cédula profesional / Colegiatura
  bioanalystName?: string;
  bioanalystSpecialty?: string;
  bioanalystLicense?: string;
  signedAt: string;
  validationHash: string;
  digitalSealUrl?: string;
}

export interface CellMorphologyItem {
  cellCode: string; // e.g. "NST#", "NSG#", "NSH#", "LYM#", "MON#", "EOS#", "BAS#", "RET#"
  cellName: string; // e.g. "Neutrófilos segmentados"
  countValue: string; // e.g. "2.9 x 10³/µL"
  refRange: string; // e.g. "2.0-7.0"
  magnification?: string;
  images: string[];
}

export interface CellDistributionMicrograph {
  cellType: 'WBC' | 'RBC' | 'PLT';
  title: string;
  description: string;
  imageUrl?: string;
  colorTone?: string;
}

export interface VolumeHistogramData {
  title: string;
  type: 'WBC' | 'RBC' | 'PLT';
  xAxisUnit: string; // "FL (volumen)"
  xTicks: number[];
  curvePoints: Array<{ x: number; y: number }>;
  peakFl?: number;
  thresholds?: { low?: number; high?: number };
}

export interface AnalyzerAbnormalFinding {
  parameter: string;
  value: string;
  status: 'low' | 'high';
  clinicalAdvice: string;
  causesAnalysis: string;
}

export interface AnalyzerConditionProbability {
  condition: string;
  probability: 'alta' | 'media' | 'baja';
  clinicalNote: string;
}

export interface AttachedAnalyzerReport {
  id: string;
  analyzerBrand: string; // "Ozelle"
  model: string; // "Ozelle CBC Hematology Analyzer V4.0.26"
  reportTitle: string; // "CBC Report"
  reportNumber: string; // "20260908001"
  sampleId: string; // "20260908001"
  testDate: string; // "2026.09.08 08:16"
  printDate: string; // "2026.09.08 09:05"
  sampleType: string; // "WB"
  patientName: string; // "Reyna Calanche"
  patientGender: 'M' | 'F' | 'Otro';
  birthDateOrYear: string; // "195909"
  labName: string; // "Laboratorio Clinico V"
  location: string; // "Oratorio"
  phone: string; // "56125563"
  lotNumber?: string; // "C25YH-HC20011002"
  serialNumber?: string; // "FAM200125082800025"
  operator?: string; // "admin"
  pageCount: number;
  rawPdfUrl?: string;
  rawPdfName?: string;
  leukocyteSeries: Array<{ name: string; code: string; value: string; unit: string; refRange: string; status: 'low' | 'normal' | 'high' }>;
  erythrocyteSeries: Array<{ name: string; code: string; value: string; unit: string; refRange: string; status: 'low' | 'normal' | 'high' }>;
  plateletSeries: Array<{ name: string; code: string; value: string; unit: string; refRange: string; status: 'low' | 'normal' | 'high' }>;
  histograms: VolumeHistogramData[];
  cellDistribution: CellDistributionMicrograph[];
  morphologyGallery: CellMorphologyItem[];
  interpretation: {
    primaryTitle: string;
    flags: string[];
    primaryAdvice: string;
    causesAnalysis: string;
    abnormalFindings: AnalyzerAbnormalFinding[];
    possibleConditions: AnalyzerConditionProbability[];
    references: string[];
  };
  attachedToOfficialPdf: boolean;
}

export interface MedicalReport {
  id: string;
  reportNumber: string; // e.g. "LAB-2026-0842"
  patientId: string;
  patientName: string;
  patientNationalId: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'Otro';
  referringDoctor?: string;
  company?: string;
  category: ReportCategory;
  title: string;
  sampleDate: string;
  emissionDate: string;
  laboratoryName: string;
  status: ReportStatus;
  sampleType?: string;
  tubeType?: string;
  parameters: ReportParameter[];
  clinicalFindings: string;
  doctorConclusions: string;
  patientExplanation: string;
  recommendations: string[];
  includeConclusionsInReport?: boolean;
  includeRecommendationsInReport?: boolean;
  includeAiExplanationInReport?: boolean;
  urgentAlert?: boolean;
  signature?: DigitalSignature;
  qrVerificationCode: string;
  notesToStaff?: string;
  episodeId?: string;
  branchId?: BranchSiteId;
  attachedAnalyzerReport?: AttachedAnalyzerReport;
  // Vínculo real con la orden que originó este informe (LabOrder.id, no
  // necesariamente LabOrder.remoteId) — permite ubicar `detalleRemoto` de la
  // orden y así resolver a qué `id_detalle_orden` corresponde cada grupo de
  // parámetros (por examCode) al sincronizar con /api/resultados.
  orderId?: string;
  // Mapa examCode -> id_resultado ya creado/sincronizado en el backend para
  // este informe, para saber si hay que crear (POST) o solo validar/publicar
  // (PATCH) en sincronizaciones posteriores. Rellenado por
  // ClinicContext.tsx `addReport`/`updateReport`.
  resultadosRemotos?: Record<string, number>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  category: ReportCategory;
  description: string;
  defaultParameters: Omit<ReportParameter, 'id'>[];
  defaultRecommendations: string[];
  sampleType?: string;
  tubeType?: string;
  tubesRequired?: string[];
  preanalyticalNotes?: string;
  panicAlertRule?: string;
  complianceStandard?: string;
  complianceScore?: number;
  lastAuditedAt?: string;
  // Marca que esta plantilla ya se guardó de verdad en el backend
  // (tabla plantilla_informe, migración 0011) bajo este mismo id -aquí
  // no hace falta un id remoto distinto porque id_plantilla es TEXT y lo
  // genera el propio frontend-. Las plantillas de fábrica
  // (INITIAL_TEMPLATES) nunca pasan por la API, así que no tienen esta
  // marca hasta que alguien las edite por primera vez estando en línea.
  remoteId?: string;
}

export interface ParameterTubeAuditItem {
  parameterName: string;
  tubeId: string;
  tubeName: string;
  shortName: string;
  capHex: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  additive: string;
  sampleMatrix: string;
  inversions: string;
  drawOrder: number;
  recommendedVolume: string;
  clinicalNotes?: string;
}

export interface TubeGroupAuditItem {
  tubeId: string;
  tubeName: string;
  shortName: string;
  capHex: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  additive: string;
  sampleMatrix: string;
  inversions: string;
  drawOrder: number;
  recommendedVolume: string;
  parameters: string[];
  count: number;
}

export interface TemplateAiAuditResult {
  complianceScore: number; // 0 - 100
  rating: string;
  executiveSummary: string;
  standardsEvaluated: {
    code: string;
    title: string;
    status: 'cumple' | 'parcial' | 'requiere_atencion';
    score: number;
    findings: string;
  }[];
  strengths: string[];
  structuralGaps: {
    standard: string;
    severity: 'alta' | 'media' | 'recomendacion';
    title: string;
    description: string;
    suggestedFix: string;
  }[];
  suggestedSections: {
    sectionName: string;
    standardRef: string;
    importance: string;
    recommendation: string;
  }[];
  missingOrEnhancedParameters: {
    name: string;
    action: 'agregar' | 'modificar';
    unit: string;
    referenceRange: string;
    methodology?: string;
    panicRange?: string;
    clinicalReason: string;
    tubeSuggested?: string;
  }[];
  improvedRecommendations: string[];
  sampleTypeSuggested?: string;
  fastingRequired?: string;
  panicAlertNote?: string;
  // Preanalytical Tube Differentiation according to CLSI H3-A6 & ISO 15189
  parameterTubeBreakdown?: ParameterTubeAuditItem[];
  tubesGrouped?: TubeGroupAuditItem[];
  orderOfDrawList?: string[];
  totalTubesCount?: number;
  estimatedBloodVolumeMl?: number;
  preanalyticalTubeWarning?: string;
  optimizedTemplate: {
    name: string;
    description: string;
    category: ReportCategory;
    sampleType?: string;
    tubeType?: string;
    tubesRequired?: string[];
    preanalyticalNotes?: string;
    panicAlertRule?: string;
    parameters: Omit<ReportParameter, 'id'>[];
    recommendations: string[];
  };
}

export type PushNotificationType = 
  | 'report_ready' 
  | 'sample_processed' 
  | 'critical_alert' 
  | 'health_tip' 
  | 'general';

export type PushSubscriptionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PatientPushNotification {
  id: string;
  patientId: string; // Patient ID or 'all'
  patientName?: string;
  reportId?: string;
  reportNumber?: string;
  episodeId?: string;
  type: PushNotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  urgent?: boolean;
  downloadUrl?: string;
  actionLabel?: string;
  channel?: 'web_push' | 'whatsapp' | 'in_app' | 'firebase_fcm';
  deliveredViaBrowser?: boolean;
  firebaseDelivered?: boolean;
  firebaseMessageId?: string;
  fcmToken?: string;
}

export interface PatientNotificationPreferences {
  webPushEnabled: boolean;
  firebasePushEnabled?: boolean;
  whatsappAlerts: boolean;
  emailAlerts: boolean;
  criticalAlertsOnly: boolean;
  healthTipsEnabled: boolean;
}

export type LabCatalogCategory = 
  | '01_perfiles_paneles'
  | '02_hematologia_grupo'
  | '03_quimica_sanguinea'
  | '04_hormonas_fertilidad'
  | '05_marcadores_tumorales'
  | '06_infecciosas_serologia'
  | '07_inmunologia_reumatologia'
  | '08_uroanalisis_coprologia'
  | '09_microbiologia_cultivos'
  | '10_paquetes_especiales';

export type LabResultType = 'Numérico' | 'Texto' | 'Opciones';

export interface LabCatalogItem {
  id: string;
  code: string;
  name: string;
  technicalName?: string;
  category: LabCatalogCategory;
  categoryName: string;
  resultType: LabResultType;
  unit?: string;
  referenceRange?: string;
  minVal?: number;
  maxVal?: number;
  price: number; // In Quetzales Q
  priceFormatted: string; // e.g. "Q180" or "Q0"
  status?: 'Activo' | 'Inactivo';
  visibleForSale?: boolean;
  description: string;
  isProfile?: boolean;
  sampleType?: string;
  deliveryTime?: string;
  department?: string;
  fasting?: string;
  requiresFasting?: boolean;
  patientInstructions?: string;
  methodology?: string;
  tubeType?: string;
  panicRange?: string;
  parametersCount?: number;
  includedParameters?: string[];
  clinicalSignificance?: string;
  isFactory?: boolean;
}

export interface ProfileTestAgeGenderRange {
  id: string;
  gender: 'todos' | 'masculino' | 'femenino';
  minAge?: number | string;
  maxAge?: number | string;
  minRange?: number | string;
  maxRange?: number | string;
  referenceRange?: string;
  notes?: string;
}

export interface ProfileTestItem {
  id: string;
  catalogTestId?: string;
  name: string;
  code?: string;
  resultType: string;
  methodology?: string;
  minRange?: string | number;
  maxRange?: string | number;
  unit?: string;
  referenceRange?: string;
  ageGenderRanges?: ProfileTestAgeGenderRange[];
  observations?: string;
  isRequired?: boolean;
  status: 'Activa' | 'Inactiva';
}

export interface LabCustomProfile {
  id: string;
  code: string;
  name: string;
  categoryName: string;
  price: number;
  priceFormatted: string;
  regularPrice?: number;
  description: string;
  testIds: string[];
  testNames: string[];
  tests?: ProfileTestItem[];
  status?: 'Activo' | 'Inactivo';
  basedOn?: string;
  createdAt: string;
  createdBy?: string;
  notes?: string;
  isFactoryProfile?: boolean;
  // Id real de perfil_personalizado (migración 0011) cuando el perfil se
  // pudo crear de verdad en el backend; misma convención que los demás
  // remoteId de este archivo. Los perfiles de fábrica (DEFAULT_VACLINIC_PROFILES)
  // nunca pasan por la API, así que nunca tienen este campo.
  remoteId?: number;
}

// ==========================================
// USER & ROLE MANAGEMENT (RBAC)
// ==========================================

export type LabStaffRole = 
  | 'director_laboratorio'
  | 'bioanalista_senior'
  | 'bioanalista'
  | 'tecnico_flebotomista'
  | 'recepcionista'
  | 'auditor_calidad'
  | 'administrador_ti';

export type UserStatus = 'activo' | 'inactivo' | 'suspendido' | 'vacaciones';

export interface LabPermissionDefinition {
  id: string;
  name: string;
  description: string;
  category: 'D1_admision' | 'D2_flebotomia' | 'D3_analizadores' | 'D4_validacion' | 'calidad_qc' | 'catalogo_tarifas' | 'administracion_seguridad';
}

export interface LabRoleConfig {
  id: LabStaffRole;
  name: string;
  title: string;
  description: string;
  badgeColor: string;
  defaultPermissions: string[];
  isSystemRole?: boolean;
}

export interface LabStaffUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  roleId: LabStaffRole;
  roleName: string;
  specialty: string;
  licenseNumber: string; // Colegiado No.
  assignedBranch: BranchSiteId | 'todas';
  status: UserStatus;
  pinCode: string;
  customPermissions?: Record<string, boolean>; // Overrides for specific permission IDs
  avatarColor?: string;
  createdAt: string;
  lastLogin?: string;
  signatureStampText?: string;
  signatureImageUrl?: string;
  twoFactorEnabled?: boolean;
  notes?: string;
  biometricEnrolled?: boolean;
  biometricCredentials?: StaffBiometricCredential[];
  biometricLastAuthAt?: string;
  // UID de Firebase Authentication vinculado a esta cuenta (Etapa 3).
  // Se llena manualmente desde Firebase Console al crear la cuenta real de
  // cada colaborador. Mientras no exista, el login solo puede emparejar
  // el resultado de Firebase con el registro local por correo (ver
  // StaffLoginView.tsx) — el control de acceso real siempre lo decide el
  // backend (server/auth-firebase.ts), nunca este campo por sí solo.
  firebaseUid?: string;
  // Id real en la tabla `usuario` (la misma que ya usa la autenticación)
  // cuando el usuario se pudo crear de verdad en el backend (migración
  // 0011). Misma convención que los demás remoteId de este archivo.
  remoteId?: number;
}

export interface StaffBiometricCredential {
  id: string;
  credentialId: string;
  rawIdBase64?: string;
  name: string; // e.g. 'Sensor Touch ID', 'Lector USB DigitalPersona'
  fingerLabel?: string; // 'Índice Derecho', 'Pulgar Derecho', etc.
  type: 'fingerprint' | 'facial' | 'passkey' | 'hardware_token';
  createdAt: string;
  lastUsedAt?: string;
  deviceInfo?: string;
  algorithm?: string;
  transports?: string[];
  isNativeWebAuthn?: boolean;
  aaguid?: string;
}

export interface LabAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: 'usuarios' | 'reportes' | 'control_calidad' | 'catalogo' | 'episodios' | 'autenticacion' | 'seguridad';
  details: string;
  ipAddress?: string;
  severity: 'info' | 'warning' | 'critical';
}

// ==========================================
// INTERNAL CHAT & INTERCOM (INTER-ÁREAS)
// ==========================================

export type LabChatChannelId = 
  | 'general'
  | 'recepcion'
  | 'analistas'
  | 'urgencias_uci'
  | 'administracion'
  | 'flebotomia';

export type ChatMessagePriority = 'normal' | 'urgente' | 'panico';

export interface LabChatMessage {
  id: string;
  channelId: LabChatChannelId | string; // Can be channel ID or direct conversation ID
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatarColor?: string;
  recipientId?: string; // For 1-on-1 direct messages
  recipientName?: string;
  timestamp: string;
  content: string;
  priority: ChatMessagePriority;
  referenceEpisodeId?: string;
  referenceEpisodeNumber?: string;
  referencePatientName?: string;
  readBy: string[];
  reactions?: { emoji: string; count: number; users: string[] }[];
  // Octavo módulo de los 9 migrados desde localStorage (mensaje_chat, ver
  // db/migrations/0011_modulos_restantes.sql). Se llena solo si el envío
  // remoto (POST /api/chat) tuvo éxito; igual convención que los demás
  // remoteId de este archivo.
  remoteId?: number;
}

export interface LabChatChannel {
  id: LabChatChannelId;
  name: string;
  slug: string;
  description: string;
  department: 'todos' | 'recepcion' | 'analistas' | 'administracion' | 'urgencias' | 'flebotomia';
  badgeColor: string;
  icon: string;
  unreadCount?: number;
}

// ==========================================
// ORDENES, CARPETAS Y ARCHIVO ORGANIZADO
// ==========================================

export interface OrderFolder {
  id: string;
  name: string;
  color: string; // 'teal' | 'cyan' | 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  icon?: string;
  description?: string;
  year?: number;
  month?: number; // 1-12
  isSystem?: boolean;
  orderCount?: number;
  createdAt: string;
  // Id real de carpeta_orden (migración 0011) cuando esta carpeta existe de
  // verdad en el backend -la carpeta de sistema "folder-unassigned" siempre
  // lo tiene (remoteId: 1, sembrado por esa migración); una carpeta creada
  // solo local (servidor caído) queda sin este campo.
  remoteId?: number;
}

export interface LabOrder {
  id: string;
  orderNumber: string; // e.g. "#198" or "198-2026"
  seqNumber: number; // e.g. 198
  patientId?: string;
  patientName: string;
  patientCode: string; // e.g. "198-2026"
  nationalId: string;
  phone?: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "11:14 a. m."
  createdAt?: string;
  year: number;
  month: number; // 1-12
  testsCount: number;
  testsList: string[];
  totalPrice?: string; // e.g. "Q225.00"
  status: 'Pendiente' | 'En Proceso' | 'Listo' | 'Entregado';
  reportStatus: 'Borrador' | 'En Revisión' | 'Validado' | 'Sin Informe';
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  folderId?: string; // ID de la carpeta donde se guarda
  priority: 'rutina' | 'urgente' | 'stat_panico';
  branchId?: BranchSiteId;
  notes?: string;
  tubeBarcodes?: string[];
  reportId?: string;
  // Clinical & Sample Data
  email?: string;
  origin?: OriginDepartment | string;
  patientType?: PatientType;
  referringDoctor?: string;
  fastingCondition?: string;
  sampleType?: string;
  phlebotomistName?: string;
  clinicalDiagnosis?: string;
  paymentMethod?: 'efectivo' | 'tarjeta' | 'transferencia' | 'seguro' | 'por_cobrar';
  pendingBalance?: number;
  appliedPromo?: string;
  bedRoom?: string;
  // Biometría y Autorización Segura
  isHighRisk?: boolean;
  biometricAuthorized?: boolean;
  biometricAuthData?: {
    method: 'fingerprint' | 'facial' | 'passkey' | 'hardware_token';
    authorizedBy: string;
    staffRole: string;
    timestamp: string;
    credentialId?: string;
    confidenceScore?: number;
    deviceType?: string;
  };
  // Integración con la API real (ver ClinicContext.tsx `addOrder` y
  // src/services/ordenesApiService.ts). `examCodes` son los códigos del
  // catálogo (ej. "PAN-01") que addOrder resuelve a id_examen reales antes
  // de crear la orden en Postgres; `remoteId`/`codigoConsulta` quedan
  // rellenos solo si esa creación remota tuvo éxito.
  examCodes?: string[];
  remoteId?: number;
  codigoConsulta?: string;
  // Detalle real de la orden devuelto por POST /api/ordenes (una fila por
  // examen, con su id_detalle_orden y el codigo_examen del catálogo) —
  // permite, al capturar resultados, mapear cada grupo de ReportParameter
  // (por examCode) al id_detalle_orden exacto que exige POST /api/resultados.
  // Queda vacío si la orden no pudo crearse en el backend (solo local).
  detalleRemoto?: Array<{ idDetalle: number; idExamen: number; codigoExamen: string | null }>;
}
