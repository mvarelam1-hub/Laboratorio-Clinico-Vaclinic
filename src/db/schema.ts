import { relations } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  text, 
  boolean, 
  timestamp, 
  integer, 
  numeric, 
  date 
} from 'drizzle-orm/pg-core';

// 1. USUARIOS (Personal Interno del Laboratorio)
export const usuarios = pgTable('usuario', {
  idUsuario: serial('id_usuario').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID opcional
  nombreCompleto: text('nombre_completo').notNull(),
  correo: text('correo').notNull().unique(),
  contrasenaHash: text('contrasena_hash').notNull(),
  rol: text('rol').notNull(), // Administrador, Recepcionista, Analista, Director Tecnico, etc.
  especialidad: text('especialidad'),
  numeroColegiado: text('numero_colegiado'),
  pinCode: text('pin_code').default('1234'),
  estado: boolean('estado').default(true).notNull(),
  fechaCreacion: timestamp('fecha_creacion').defaultNow().notNull(),
});

// 2. PACIENTES
export const pacientes = pgTable('paciente', {
  idPaciente: serial('id_paciente').primaryKey(),
  nombreCompleto: text('nombre_completo').notNull(),
  dni: text('dni'),
  fechaNacimiento: date('fecha_nacimiento').notNull(),
  genero: text('genero'),
  telefonoWhatsApp: text('telefono_whatsapp').notNull(),
  correo: text('correo'),
  direccion: text('direccion'),
  esMenorEdad: boolean('es_menor_edad').default(false).notNull(),
  nombreEncargadoLegal: text('nombre_encargado_legal'),
  telefonoEncargadoLegal: text('telefono_encargado_legal'),
  fechaRegistro: timestamp('fecha_registro').defaultNow().notNull(),
});

// 3. MEDICOS TRATANTES
export const medicosTratantes = pgTable('medico_tratante', {
  idMedico: serial('id_medico').primaryKey(),
  nombreCompleto: text('nombre_completo').notNull(),
  numeroColegiado: text('numero_colegiado').notNull().unique(),
  telefono: text('telefono'),
  correo: text('correo'),
  especialidad: text('especialidad'),
  estadoSuscripcion: text('estado_suscripcion').default('Activa').notNull(),
});

// 4. AUTORIZACIONES PACIENTE-MEDICO
export const pacienteMedicoAutorizaciones = pgTable('paciente_medico_autorizacion', {
  idAutorizacion: serial('id_autorizacion').primaryKey(),
  idPaciente: integer('id_paciente').references(() => pacientes.idPaciente).notNull(),
  idMedico: integer('id_medico').references(() => medicosTratantes.idMedico).notNull(),
  fechaAutorizacion: timestamp('fecha_autorizacion').defaultNow().notNull(),
  estado: text('estado').default('Activa').notNull(),
});

// 5. ORDENES
export const ordenes = pgTable('orden', {
  idOrden: serial('id_orden').primaryKey(),
  numeroOrden: text('numero_orden').notNull().unique(),
  idPaciente: integer('id_paciente').references(() => pacientes.idPaciente).notNull(),
  idRecepcionista: integer('id_recepcionista').references(() => usuarios.idUsuario),
  idMedico: integer('id_medico').references(() => medicosTratantes.idMedico),
  fechaRegistro: timestamp('fecha_registro').defaultNow().notNull(),
  estado: text('estado').default('Registrada').notNull(), // Registrada, En proceso, Completada, Cancelada
  totalCobrado: numeric('total_cobrado', { precision: 10, scale: 2 }).default('0'),
  sede: text('sede').default('Sede Central'),
});

// 6. CODIGOS DE CONSULTA (Para acceso seguro sin password)
export const codigosConsulta = pgTable('codigo_consulta', {
  idCodigo: serial('id_codigo').primaryKey(),
  idOrden: integer('id_orden').references(() => ordenes.idOrden).notNull().unique(),
  codigo: text('codigo').notNull().unique(),
  fechaGeneracion: timestamp('fecha_generacion').defaultNow().notNull(),
  fechaVigencia: date('fecha_vigencia').notNull(),
  estado: text('estado').default('Vigente').notNull(),
});

// 7. EXAMENES (Catalogo)
export const examenes = pgTable('examen', {
  idExamen: serial('id_examen').primaryKey(),
  codigoExamen: text('codigo_examen').unique(),
  nombreExamen: text('nombre_examen').notNull(),
  categoria: text('categoria'),
  tipoMuestra: text('tipo_muestra').notNull(),
  contenedorRequerido: text('contenedor_requerido'),
  precio: numeric('precio', { precision: 10, scale: 2 }).default('0'),
  unidadMedida: text('unidad_medida'),
  tiempoEntregaHoras: integer('tiempo_entrega_horas').default(24),
  metodo: text('metodo'),
});

// 8. RANGOS DE REFERENCIA
export const rangosReferencia = pgTable('rango_referencia', {
  idRango: serial('id_rango').primaryKey(),
  idExamen: integer('id_examen').references(() => examenes.idExamen).notNull(),
  idAdministrador: integer('id_administrador').references(() => usuarios.idUsuario),
  genero: text('genero').default('Ambos'),
  edadMinima: integer('edad_minima').default(0),
  edadMaxima: integer('edad_maxima').default(120),
  valorMinimo: numeric('valor_minimo', { precision: 10, scale: 2 }),
  valorMaximo: numeric('valor_maximo', { precision: 10, scale: 2 }),
  textoReferencia: text('texto_referencia'),
  fechaActualizacion: timestamp('fecha_actualizacion').defaultNow().notNull(),
});

// 9. DETALLE ORDEN
export const detalleOrden = pgTable('detalle_orden', {
  idDetalle: serial('id_detalle').primaryKey(),
  idOrden: integer('id_orden').references(() => ordenes.idOrden).notNull(),
  idExamen: integer('id_examen').references(() => examenes.idExamen).notNull(),
  precioUnitario: numeric('precio_unitario', { precision: 10, scale: 2 }).default('0'),
});

// 10. RESULTADOS
export const resultados = pgTable('resultado', {
  idResultado: serial('id_resultado').primaryKey(),
  idDetalle: integer('id_detalle').references(() => detalleOrden.idDetalle).notNull().unique(),
  idAnalista: integer('id_analista').references(() => usuarios.idUsuario),
  valorCapturado: text('valor_capturado').notNull(),
  estado: text('estado').default('Borrador').notNull(), // Borrador, Validado, Publicado, En correccion
  estaFueraDeRango: boolean('esta_fuera_de_rango').default(false),
  interpretacionClinica: text('interpretacion_clinica'),
  fechaCaptura: timestamp('fecha_captura').defaultNow().notNull(),
  fechaPublicacion: timestamp('fecha_publicacion'),
  validadoPorNombre: text('validado_por_nombre'),
});

// 11. HISTORIAL AUDITORIA (ISO 15189)
export const historialAuditoria = pgTable('historial_auditoria', {
  idRegistro: serial('id_registro').primaryKey(),
  idResultado: integer('id_resultado').references(() => resultados.idResultado),
  idUsuario: integer('id_usuario').references(() => usuarios.idUsuario).notNull(),
  accion: text('accion').notNull(),
  valorAnterior: text('valor_anterior'),
  valorNuevo: text('valor_nuevo'),
  motivoCambio: text('motivo_cambio').notNull(),
  ipOrigen: text('ip_origen'),
  fechaHora: timestamp('fecha_hora').defaultNow().notNull(),
});

// 12. NOTIFICACIONES
export const notificaciones = pgTable('notificacion', {
  idNotificacion: serial('id_notificacion').primaryKey(),
  idResultado: integer('id_resultado').references(() => resultados.idResultado),
  canal: text('canal').default('WhatsApp').notNull(),
  destinatario: text('destinatario').notNull(),
  mensaje: text('mensaje'),
  estadoEnvio: text('estado_envio').default('Pendiente').notNull(),
  intentos: integer('intentos').default(0).notNull(),
  fechaEnvio: timestamp('fecha_envio').defaultNow().notNull(),
});

// 13. REPORTES ADMINISTRATIVOS
export const reportesAdministrativos = pgTable('reporte_administrativo', {
  idReporte: serial('id_reporte').primaryKey(),
  idAdministrador: integer('id_administrador').references(() => usuarios.idUsuario).notNull(),
  rangoFechaInicio: date('rango_fecha_inicio').notNull(),
  rangoFechaFin: date('rango_fecha_fin').notNull(),
  tipoReporte: text('tipo_reporte').notNull(),
  parametrosFiltro: text('parametros_filtro'),
  fechaGeneracion: timestamp('fecha_generacion').defaultNow().notNull(),
});

// RELACIONES DRIZZLE
export const usuariosRelations = relations(usuarios, ({ many }) => ({
  ordenes: many(ordenes),
  resultados: many(resultados),
  auditorias: many(historialAuditoria),
}));

export const pacientesRelations = relations(pacientes, ({ many }) => ({
  ordenes: many(ordenes),
  medicosAutorizados: many(pacienteMedicoAutorizaciones),
}));

export const ordenesRelations = relations(ordenes, ({ one, many }) => ({
  paciente: one(pacientes, {
    fields: [ordenes.idPaciente],
    references: [pacientes.idPaciente],
  }),
  recepcionista: one(usuarios, {
    fields: [ordenes.idRecepcionista],
    references: [usuarios.idUsuario],
  }),
  codigoConsulta: one(codigosConsulta, {
    fields: [ordenes.idOrden],
    references: [codigosConsulta.idOrden],
  }),
  detalles: many(detalleOrden),
}));

export const detalleOrdenRelations = relations(detalleOrden, ({ one }) => ({
  orden: one(ordenes, {
    fields: [detalleOrden.idOrden],
    references: [ordenes.idOrden],
  }),
  examen: one(examenes, {
    fields: [detalleOrden.idExamen],
    references: [examenes.idExamen],
  }),
  resultado: one(resultados, {
    fields: [detalleOrden.idDetalle],
    references: [resultados.idDetalle],
  }),
}));
