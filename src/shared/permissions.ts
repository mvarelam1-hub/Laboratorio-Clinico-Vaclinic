/**
 * Catálogo ÚNICO de roles y permisos de VACLINIC.
 *
 * Antes de la Etapa 3 este catálogo solo existía en el frontend
 * (src/data/staffUserData.ts) y `hasPermission()` únicamente filtraba
 * qué botones se mostraban en pantalla (ClinicContext.tsx) — el backend
 * no tenía ningún concepto de roles/permisos porque no existía backend
 * de negocio.
 *
 * Este archivo no depende de React ni de nada del navegador, así que lo
 * importan tanto el frontend (src/data/staffUserData.ts lo re-exporta)
 * como el backend (server/permissions-middleware.ts), garantizando que
 * "personal", "rol" y "permiso" signifiquen exactamente lo mismo en
 * ambos lados.
 */

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
  category:
    | 'D1_admision'
    | 'D2_flebotomia'
    | 'D3_analizadores'
    | 'D4_validacion'
    | 'calidad_qc'
    | 'catalogo_tarifas'
    | 'administracion_seguridad';
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

export const LAB_PERMISSIONS_CATALOG: LabPermissionDefinition[] = [
  { id: 'admision_crear_ordenes', name: 'Creación de Órdenes (D1)', description: 'Admitir pacientes, registrar estudios solicitados y generar episodios clínicos.', category: 'D1_admision' },
  { id: 'admision_pacientes', name: 'Gestión de Pacientes', description: 'Crear, actualizar datos demográficos y antecedentes de pacientes.', category: 'D1_admision' },
  { id: 'admision_duplicidad', name: 'Resolución de Duplicidad', description: 'Gestionar alertas de órdenes duplicadas y fusionar expedientes.', category: 'D1_admision' },

  { id: 'flebotomia_recoleccion', name: 'Registro de Toma (D2)', description: 'Confirmar punción venosa, tipo de tubo y hora de recolección de muestra.', category: 'D2_flebotomia' },
  { id: 'flebotomia_etiquetado', name: 'Códigos de Barras', description: 'Generación e impresión de etiquetas térmicas de código de barras 4D.', category: 'D2_flebotomia' },
  { id: 'flebotomia_manifiestos', name: 'Manifiestos de Transporte', description: 'Creación y despacho de envíos inter-sucursales con control de cadena de frío.', category: 'D2_flebotomia' },

  { id: 'analizadores_lotes', name: 'Operación de Analizadores (D3)', description: 'Cargar tandas analíticas automatizadas y recibir datos LIS directos.', category: 'D3_analizadores' },
  { id: 'analizadores_manual', name: 'Ingreso Manual de Resultados', description: 'Digitar valores de pruebas manuales, tinciones y microscopía.', category: 'D3_analizadores' },
  { id: 'analizadores_panico', name: 'Disparo de Alertas de Pánico', description: 'Notificar valores críticos que comprometen la vida del paciente de inmediato.', category: 'D3_analizadores' },

  { id: 'validacion_redaccion', name: 'Redacción y Asistencia IA (D4)', description: 'Elaborar conclusiones diagnósticas y utilizar asistencia clínica inteligente.', category: 'D4_validacion' },
  { id: 'validacion_firma_digital', name: 'Firma Digital y Sello Oficial', description: 'Firmar digitalmente con número de Colegiado Médico / Químico Biólogo.', category: 'D4_validacion' },
  { id: 'validacion_publicacion', name: 'Publicación Oficial de Informes', description: 'Liberar informe validado hacia el Portal del Paciente con código QR.', category: 'D4_validacion' },

  { id: 'qc_calibraciones', name: 'Gestión QC & Levey-Jennings', description: 'Registrar controles diarios, calibraciones y monitoreo de desviaciones típicas.', category: 'calidad_qc' },
  { id: 'qc_westgard_override', name: 'Autorización Excepcional Westgard', description: 'Liberar resultados bajo justificación documentada ante alertas Westgard.', category: 'calidad_qc' },

  { id: 'catalogo_tarifas_editar', name: 'Edición de Tarifas y Precios (Q)', description: 'Modificar listas de precios en Quetzales y paquetes comerciales.', category: 'catalogo_tarifas' },
  { id: 'catalogo_rangos_editar', name: 'Edición de Rangos y Unidades', description: 'Configurar valores de referencia biológicos, unidades y metodologías.', category: 'catalogo_tarifas' },
  { id: 'catalogo_perfiles_crear', name: 'Creación de Perfiles y Paneles', description: 'Agrupar pruebas en perfiles diagnósticos personalizados.', category: 'catalogo_tarifas' },

  { id: 'admin_multisucursal', name: 'Supervisión General del Laboratorio', description: 'Supervisión operativa y control de la sede única del sistema.', category: 'administracion_seguridad' },
  { id: 'admin_usuarios_roles', name: 'Gestión de Usuarios y Roles (RBAC)', description: 'Crear personal y asignar perfiles de acceso (la cuenta de acceso la crea Firebase Auth, no este módulo).', category: 'administracion_seguridad' },
  { id: 'admin_bitacora_auditoria', name: 'Auditoría y Trazabilidad ISO 15189', description: 'Consultar bitácora forense de accesos, modificaciones y firmas.', category: 'administracion_seguridad' }
];

export const INITIAL_ROLES_CONFIG: LabRoleConfig[] = [
  {
    id: 'director_laboratorio', name: 'Director Técnico de Laboratorio', title: 'Director / Microbiólogo & Químico Biólogo',
    description: 'Control y supervisión técnica global. Acceso total a validación, firmas de alta jerarquía, auditoría y configuración de catálogos.',
    badgeColor: 'from-amber-600 to-amber-800 text-amber-100 border-amber-500/40', isSystemRole: true,
    defaultPermissions: ['admision_crear_ordenes', 'admision_pacientes', 'admision_duplicidad', 'flebotomia_recoleccion', 'flebotomia_etiquetado', 'flebotomia_manifiestos', 'analizadores_lotes', 'analizadores_manual', 'analizadores_panico', 'validacion_redaccion', 'validacion_firma_digital', 'validacion_publicacion', 'qc_calibraciones', 'qc_westgard_override', 'catalogo_tarifas_editar', 'catalogo_rangos_editar', 'catalogo_perfiles_crear', 'admin_multisucursal', 'admin_usuarios_roles', 'admin_bitacora_auditoria']
  },
  {
    id: 'bioanalista_senior', name: 'Bioanalista / Químico Biólogo Senior', title: 'Bioanalista Validador Principal',
    description: 'Especialista responsable de validación analítica D4, redacción de diagnósticos, firma digital autorizada y gestión de control de calidad.',
    badgeColor: 'from-teal-600 to-teal-800 text-teal-100 border-teal-500/40', isSystemRole: true,
    defaultPermissions: ['admision_crear_ordenes', 'admision_pacientes', 'flebotomia_recoleccion', 'flebotomia_etiquetado', 'analizadores_lotes', 'analizadores_manual', 'analizadores_panico', 'validacion_redaccion', 'validacion_firma_digital', 'validacion_publicacion', 'qc_calibraciones', 'qc_westgard_override', 'catalogo_rangos_editar', 'catalogo_perfiles_crear', 'admin_multisucursal', 'admin_bitacora_auditoria']
  },
  {
    id: 'bioanalista', name: 'Bioanalista de Analizadores', title: 'Bioanalista de Turno Operativo',
    description: 'Operación técnica de analizadores automatizados D3, ingreso de datos manuales y redacción preliminar de informes.',
    badgeColor: 'from-cyan-600 to-cyan-800 text-cyan-100 border-cyan-500/40', isSystemRole: true,
    defaultPermissions: ['admision_pacientes', 'flebotomia_recoleccion', 'flebotomia_etiquetado', 'analizadores_lotes', 'analizadores_manual', 'analizadores_panico', 'validacion_redaccion', 'qc_calibraciones']
  },
  {
    id: 'tecnico_flebotomista', name: 'Técnico Flebotomista', title: 'Técnico en Extracción & Muestras',
    description: 'Encargado del flujo de toma de muestra D2, rotulado de tubos y despacho de muestras en cadena de frío.',
    badgeColor: 'from-emerald-600 to-emerald-800 text-emerald-100 border-emerald-500/40', isSystemRole: true,
    defaultPermissions: ['admision_pacientes', 'flebotomia_recoleccion', 'flebotomia_etiquetado', 'flebotomia_manifiestos']
  },
  {
    id: 'recepcionista', name: 'Recepcionista de Admisión', title: 'Atención al Paciente & Admisión',
    description: 'Recepción del paciente en D1, creación de episodios clínicos, registro demográfico y cotización de estudios.',
    badgeColor: 'from-indigo-600 to-indigo-800 text-indigo-100 border-indigo-500/40', isSystemRole: true,
    defaultPermissions: ['admision_crear_ordenes', 'admision_pacientes', 'flebotomia_etiquetado']
  },
  {
    id: 'auditor_calidad', name: 'Auditor de Calidad & Trazabilidad', title: 'Oficial de Calidad ISO 15189',
    description: 'Monitoreo de indicadores de calidad, reglas Westgard, bitácoras de auditoría e inspección de procesos.',
    badgeColor: 'from-purple-600 to-purple-800 text-purple-100 border-purple-500/40', isSystemRole: true,
    defaultPermissions: ['qc_calibraciones', 'qc_westgard_override', 'admin_multisucursal', 'admin_bitacora_auditoria']
  },
  {
    id: 'administrador_ti', name: 'Administrador de Sistemas & TI', title: 'Ingeniero de Sistemas LIS',
    description: 'Gestión de infraestructura técnica, usuarios, roles, seguridad de accesos y configuración global.',
    badgeColor: 'from-slate-700 to-slate-900 text-slate-100 border-slate-600', isSystemRole: true,
    defaultPermissions: ['admin_multisucursal', 'admin_usuarios_roles', 'admin_bitacora_auditoria', 'catalogo_tarifas_editar', 'catalogo_rangos_editar']
  }
];

/**
 * Forma mínima y neutral (ni React ni Postgres) que necesita hasPermission().
 * El frontend la construye desde `LabStaffUser`; el backend la construye
 * desde la fila de la tabla `usuario` (ver server/permissions-middleware.ts).
 */
export interface PermissionSubject {
  status: UserStatus | string;
  roleId: string;
  customPermissions?: Record<string, boolean>;
}

/**
 * Única implementación de la regla de autorización de VACLINIC.
 * Antes de la Etapa 3 esta misma lógica vivía SOLO en ClinicContext.tsx
 * (frontend) y por lo tanto solo servía para ocultar botones: cualquier
 * petición HTTP directa la evadía por completo. Ahora también corre en
 * el backend (server/permissions-middleware.ts) contra cada endpoint.
 */
export function hasPermission(subject: PermissionSubject, permissionId: string): boolean {
  if (subject.status !== 'activo') return false;
  if (subject.customPermissions && subject.customPermissions[permissionId] !== undefined) {
    return subject.customPermissions[permissionId];
  }
  const roleConfig = INITIAL_ROLES_CONFIG.find((r) => r.id === subject.roleId);
  return roleConfig ? roleConfig.defaultPermissions.includes(permissionId) : false;
}
