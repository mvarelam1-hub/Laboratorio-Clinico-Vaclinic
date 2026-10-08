import { LabChatMessage, LabChatChannel } from '../types';

export const LAB_CHAT_CHANNELS: LabChatChannel[] = [
  {
    id: 'general',
    name: 'General Intercom',
    slug: '#general-vaclinic',
    description: 'Avisos institucionales, cambios de turno y coordinación general del laboratorio.',
    department: 'todos',
    badgeColor: 'teal',
    icon: 'Radio'
  },
  {
    id: 'recepcion',
    name: 'Recepción & Admisión',
    slug: '#recepcion-admision',
    description: 'Ingreso de pacientes, verificación de órdenes, turnos de flebotomía y entrega de resultados.',
    department: 'recepcion',
    badgeColor: 'cyan',
    icon: 'Users'
  },
  {
    id: 'analistas',
    name: 'Analistas & Bioquímica',
    slug: '#analizadores-lab',
    description: 'Estatus de analizadores Mindray/Sysmex, corridas analíticas, diluciones y retomas de muestras.',
    department: 'analistas',
    badgeColor: 'indigo',
    icon: 'FlaskConical'
  },
  {
    id: 'urgencias_uci',
    name: 'Urgencias & Valores de Pánico',
    slug: '#urgencias-stat',
    description: 'Canal prioritario para valores de pánico, emergencias hospitalarias y muestras STAT.',
    department: 'urgencias',
    badgeColor: 'rose',
    icon: 'AlertTriangle'
  },
  {
    id: 'administracion',
    name: 'Área Administrativa & Seguros',
    slug: '#administracion-convenios',
    description: 'Aprobación de copagos, seguros médicos, convenios empresariales y facturación FEL.',
    department: 'administracion',
    badgeColor: 'amber',
    icon: 'Building2'
  },
  {
    id: 'flebotomia',
    name: 'Toma de Muestras & Cabinas',
    slug: '#cabinas-flebotomia',
    description: 'Tiempos de espera en cabina, insumos de punción, tubos al vacío y muestras pediátricas.',
    department: 'flebotomia',
    badgeColor: 'emerald',
    icon: 'Syringe'
  }
];

export const INITIAL_CHAT_MESSAGES: LabChatMessage[] = [
  {
    id: 'msg-101',
    channelId: 'recepcion',
    senderId: 'usr-005',
    senderName: 'Srita. Sofía Mariana Castillo',
    senderRole: 'Recepcionista de Admisión',
    senderAvatarColor: 'teal',
    timestamp: '2026-08-29T10:15:00.000Z',
    content: 'Buenos días equipo. Ingresó el paciente Roberto Díaz (#4D-2026-EP842) con orden de Perfil Hepático y Glucosa STAT. Ya pasó a cabina 2 con Carlos.',
    priority: 'normal',
    referenceEpisodeId: 'ep-001',
    referenceEpisodeNumber: '4D-2026-EP842',
    referencePatientName: 'Roberto Díaz Morales',
    readBy: ['usr-001', 'usr-002', 'usr-003', 'usr-004', 'usr-005']
  },
  {
    id: 'msg-102',
    channelId: 'recepcion',
    senderId: 'usr-004',
    senderName: 'Téc. Carlos Humberto Ruiz',
    senderRole: 'Técnico Flebotomista & Muestras',
    senderAvatarColor: 'amber',
    timestamp: '2026-08-29T10:20:15.000Z',
    content: 'Muestra tomada sin complicaciones (1 tubo tapa roja, 1 tubo tapa dorada con gel). Ya la deposité en la gradilla de recepción del analizador de Bioquímica.',
    priority: 'normal',
    referenceEpisodeId: 'ep-001',
    referenceEpisodeNumber: '4D-2026-EP842',
    referencePatientName: 'Roberto Díaz Morales',
    readBy: ['usr-001', 'usr-002', 'usr-003', 'usr-005']
  },
  {
    id: 'msg-103',
    channelId: 'analistas',
    senderId: 'usr-003',
    senderName: 'Licda. Elena Rocío Morales Cruz',
    senderRole: 'Bioanalista de Analizadores Automatizados',
    senderAvatarColor: 'indigo',
    timestamp: '2026-08-29T10:45:30.000Z',
    content: 'Iniciando lote de 14 muestras en Mindray BS-240. Calibradores y controles Levey-Jennings de esta mañana pasaron con CV < 2.1%.',
    priority: 'normal',
    readBy: ['usr-001', 'usr-002', 'usr-003']
  },
  {
    id: 'msg-104',
    channelId: 'urgencias_uci',
    senderId: 'usr-003',
    senderName: 'Licda. Elena Rocío Morales Cruz',
    senderRole: 'Bioanalista de Analizadores Automatizados',
    senderAvatarColor: 'indigo',
    timestamp: '2026-08-29T11:05:10.000Z',
    content: '🚨 ATENCIÓN INMEDIATA: Glucosa sérica en 485 mg/dL en paciente Roberto Díaz (#4D-2026-EP842). Valor crítico verificado en duplicado. Solicitamos a recepción contactar urgentemente al Dr. Vásquez en UCI.',
    priority: 'panico',
    referenceEpisodeId: 'ep-001',
    referenceEpisodeNumber: '4D-2026-EP842',
    referencePatientName: 'Roberto Díaz Morales',
    readBy: ['usr-001', 'usr-002', 'usr-005']
  },
  {
    id: 'msg-105',
    channelId: 'urgencias_uci',
    senderId: 'usr-005',
    senderName: 'Srita. Sofía Mariana Castillo',
    senderRole: 'Recepcionista de Admisión',
    senderAvatarColor: 'teal',
    timestamp: '2026-08-29T11:08:45.000Z',
    content: 'Confirmado. Comuniqué el valor de pánico directamente al Dr. Vásquez en la extensión 104 de UCI. Dejó constancia telefónica de recepción.',
    priority: 'urgente',
    referenceEpisodeId: 'ep-001',
    referenceEpisodeNumber: '4D-2026-EP842',
    referencePatientName: 'Roberto Díaz Morales',
    readBy: ['usr-001', 'usr-002', 'usr-003', 'usr-005']
  },
  {
    id: 'msg-106',
    channelId: 'administracion',
    senderId: 'usr-006',
    senderName: 'Ing. Fernando José Méndez',
    senderRole: 'Administrador de Sistemas & TI',
    senderAvatarColor: 'slate',
    timestamp: '2026-08-29T11:20:00.000Z',
    content: 'Estimados, el enlace del portal web de pacientes y las notificaciones automáticas por WhatsApp / SMS están operando con 100% de disponibilidad.',
    priority: 'normal',
    readBy: ['usr-001', 'usr-005', 'usr-006']
  },
  {
    id: 'msg-107',
    channelId: 'administracion',
    senderId: 'usr-005',
    senderName: 'Srita. Sofía Mariana Castillo',
    senderRole: 'Recepcionista de Admisión',
    senderAvatarColor: 'teal',
    timestamp: '2026-08-29T11:32:10.000Z',
    content: 'Administración: ¿Podrían verificar si la empresa Ingenio Santa Rosa tiene aprobada la cotización de los 15 exámenes ocupacionales para mañana?',
    priority: 'normal',
    readBy: ['usr-001', 'usr-006']
  },
  {
    id: 'msg-108',
    channelId: 'general',
    senderId: 'usr-001',
    senderName: 'Dra. Carmen Alicia Morales V.',
    senderRole: 'Director Técnico de Laboratorio',
    senderAvatarColor: 'rose',
    timestamp: '2026-08-29T11:38:00.000Z',
    content: 'Excelente trabajo a todos en la auditoría mensual ISO 15189 de hoy. Recordemos mantener la firma digital validada en todos los informes antes de las 13:00 hrs.',
    priority: 'normal',
    readBy: ['usr-001', 'usr-002', 'usr-003', 'usr-004', 'usr-005', 'usr-006']
  }
];

export const QUICK_CLINICAL_SNIPPETS = {
  recepcion: [
    { label: '🚨 Paciente STAT en cabina', text: 'Paciente STAT ingresado en recepción para toma urgente de muestras.', priority: 'urgente' },
    { label: '📄 Seguro / Convenio Aprobado', text: 'Convenio y carta de garantía verificada y aprobada para facturación.', priority: 'normal' },
    { label: '👥 Alta Afluencia en Espera', text: 'Sala de espera con más de 6 pacientes en cola para flebotomía.', priority: 'normal' },
    { label: '📦 Muestra Remitida Recibida', text: 'Muestra externa con cadena de frío recibida en ventanilla de admisión.', priority: 'normal' }
  ],
  analistas: [
    { label: '🧪 Lote Iniciado en BS-240', text: 'Iniciando procesamiento de lote en analizador automatizado.', priority: 'normal' },
    { label: '⚠️ Muestra Hemolizada / Retoma', text: 'Muestra con hemólisis 3+. Se solicita retoma de muestra a flebotomía.', priority: 'urgente' },
    { label: '🚨 VALOR DE PÁNICO Detectado', text: 'Valor de pánico detectado y confirmado en duplicado. Notificar a médico tratante.', priority: 'panico' },
    { label: '✅ Resultados Validados', text: 'Resultados analíticos validados y firmados por Bioanalista Colegiado.', priority: 'normal' },
    { label: '🔬 Frotis en Microscopía', text: 'Muestra en tinción Wright para diferencial manual al microscopio.', priority: 'normal' }
  ],
  administracion: [
    { label: '💳 Pago Confirmado', text: 'Pago con tarjeta / transferencia bancaria verificado en caja central.', priority: 'normal' },
    { label: '🧾 Factura FEL Emitida', text: 'Factura electrónica emitida y enviada al correo del paciente.', priority: 'normal' },
    { label: '📋 Descuento Autorizado', text: 'Descuento especial por convenio institucional aprobado por Gerencia.', priority: 'normal' },
    { label: '📦 Reactivos Entregados', text: 'Lote nuevo de reactivos y controles recibido en bodega central.', priority: 'normal' }
  ],
  urgencias: [
    { label: '🚨 Notificación a UCI', text: 'Reporte verbal de valor crítico transmitido a médico especialista de UCI.', priority: 'panico' },
    { label: '⚡ Prioridad Absoluta STAT', text: 'Muestra de emergencia con tiempo de respuesta comprometido < 30 min.', priority: 'urgente' },
    { label: '📞 Confirmación Telefónica', text: 'Médico tratante enterado de resultados urgentes vía telefónica.', priority: 'urgente' }
  ],
  flebotomia: [
    { label: '🩸 Muestra Obtenida', text: 'Muestra sanguínea recolectada con éxito y rotulada con código de barras.', priority: 'normal' },
    { label: '👶 Paciente Pediátrico', text: 'Punción capilar pediátrica completada. Tubo microtainer entregado a lab.', priority: 'normal' },
    { label: '⚠️ Paciente en Ayuno Dudoso', text: 'Paciente refiere ingesta ligera de alimentos hace 4 horas. Registrar en orden.', priority: 'urgente' }
  ]
};
