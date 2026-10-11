/**
 * Catálogo de especialidades y profesionales de la salud (100 registros).
 * Es compartido por el cliente (selector en la orden) y por el servidor
 * (asistente de IA que orienta hacia el especialista que podría valorar un resultado).
 */

export type CategoriaProfesionalSalud =
  | 'especialidad_medica'
  | 'especialidad_quirurgica'
  | 'laboratorio_clinico'
  | 'enfermeria'
  | 'otros_salud';

export interface ProfesionalSalud {
  numero: number;
  nombre: string;
  area: string;
  categoria: CategoriaProfesionalSalud;
}

export const CATEGORIAS_PROFESIONALES_SALUD: Record<CategoriaProfesionalSalud, string> = {
  especialidad_medica: 'Especialidades médicas',
  especialidad_quirurgica: 'Especialidades quirúrgicas',
  laboratorio_clinico: 'Profesionales del laboratorio clínico',
  enfermeria: 'Enfermería y atención clínica',
  otros_salud: 'Otros profesionales de la salud',
};

const fila = (numero: number, nombre: string, area: string, categoria: CategoriaProfesionalSalud): ProfesionalSalud => ({ numero, nombre, area, categoria });

export const PROFESIONALES_SALUD: ProfesionalSalud[] = [
  fila(1, 'Alergólogo', 'Alergias y reacciones alérgicas.', 'especialidad_medica'),
  fila(2, 'Inmunólogo clínico', 'Enfermedades del sistema inmunitario.', 'especialidad_medica'),
  fila(3, 'Cardiólogo', 'Corazón y sistema cardiovascular.', 'especialidad_medica'),
  fila(4, 'Neurólogo', 'Cerebro y sistema nervioso.', 'especialidad_medica'),
  fila(5, 'Neurocirujano', 'Cirugía del cerebro, columna y sistema nervioso.', 'especialidad_medica'),
  fila(6, 'Endocrinólogo', 'Hormonas, diabetes y tiroides.', 'especialidad_medica'),
  fila(7, 'Gastroenterólogo', 'Estómago, intestinos y aparato digestivo.', 'especialidad_medica'),
  fila(8, 'Hepatólogo', 'Enfermedades del hígado.', 'especialidad_medica'),
  fila(9, 'Nefrólogo', 'Enfermedades de los riñones.', 'especialidad_medica'),
  fila(10, 'Urólogo', 'Sistema urinario y aparato reproductor masculino.', 'especialidad_medica'),
  fila(11, 'Neumólogo', 'Pulmones y enfermedades respiratorias.', 'especialidad_medica'),
  fila(12, 'Hematólogo', 'Sangre y enfermedades hematológicas.', 'especialidad_medica'),
  fila(13, 'Oncólogo', 'Diagnóstico y tratamiento del cáncer.', 'especialidad_medica'),
  fila(14, 'Dermatólogo', 'Piel, cabello y uñas.', 'especialidad_medica'),
  fila(15, 'Reumatólogo', 'Enfermedades autoinmunes, articulaciones y tejido conectivo.', 'especialidad_medica'),
  fila(16, 'Infectólogo', 'Enfermedades infecciosas.', 'especialidad_medica'),
  fila(17, 'Internista', 'Enfermedades de adultos.', 'especialidad_medica'),
  fila(18, 'Geriatra', 'Salud de adultos mayores.', 'especialidad_medica'),
  fila(19, 'Pediatra', 'Salud de niños y adolescentes.', 'especialidad_medica'),
  fila(20, 'Neonatólogo', 'Atención de recién nacidos.', 'especialidad_medica'),
  fila(21, 'Ginecólogo', 'Sistema reproductor femenino.', 'especialidad_medica'),
  fila(22, 'Obstetra', 'Embarazo, parto y puerperio.', 'especialidad_medica'),
  fila(23, 'Otorrinolaringólogo', 'Oído, nariz y garganta.', 'especialidad_medica'),
  fila(24, 'Oftalmólogo', 'Ojos y enfermedades visuales.', 'especialidad_medica'),
  fila(25, 'Psiquiatra', 'Trastornos de salud mental.', 'especialidad_medica'),
  fila(26, 'Traumatólogo y ortopedista', 'Huesos, articulaciones y lesiones musculoesqueléticas.', 'especialidad_medica'),
  fila(27, 'Fisiatra', 'Medicina física y rehabilitación.', 'especialidad_medica'),
  fila(28, 'Anestesiólogo', 'Anestesia y atención perioperatoria.', 'especialidad_medica'),
  fila(29, 'Radiólogo', 'Diagnóstico mediante imágenes médicas.', 'especialidad_medica'),
  fila(30, 'Patólogo', 'Diagnóstico de enfermedades mediante tejidos, células y otras muestras.', 'especialidad_medica'),
  fila(31, 'Médico genetista', 'Enfermedades hereditarias y genéticas.', 'especialidad_medica'),
  fila(32, 'Médico de emergencias', 'Urgencias y emergencias médicas.', 'especialidad_medica'),
  fila(33, 'Médico familiar', 'Atención integral de personas y familias.', 'especialidad_medica'),
  fila(34, 'Médico del deporte', 'Salud y lesiones relacionadas con la actividad física.', 'especialidad_medica'),
  fila(35, 'Médico laboral', 'Salud ocupacional y enfermedades relacionadas con el trabajo.', 'especialidad_medica'),
  fila(36, 'Especialista en medicina intensiva', 'Pacientes en estado crítico.', 'especialidad_medica'),
  fila(37, 'Especialista en medicina nuclear', 'Diagnóstico y tratamiento mediante radiofármacos.', 'especialidad_medica'),
  fila(38, 'Especialista en cuidados paliativos', 'Alivio del sufrimiento en enfermedades graves.', 'especialidad_medica'),
  fila(39, 'Especialista en medicina del dolor', 'Diagnóstico y tratamiento del dolor.', 'especialidad_medica'),
  fila(40, 'Especialista en salud pública', 'Prevención y control de enfermedades en poblaciones.', 'especialidad_medica'),
  fila(41, 'Cirujano general', 'Procedimientos quirúrgicos generales.', 'especialidad_quirurgica'),
  fila(42, 'Cirujano cardiovascular', 'Cirugía del corazón y vasos sanguíneos.', 'especialidad_quirurgica'),
  fila(43, 'Cirujano torácico', 'Cirugía de órganos y estructuras del tórax.', 'especialidad_quirurgica'),
  fila(44, 'Cirujano plástico', 'Cirugía reconstructiva y estética.', 'especialidad_quirurgica'),
  fila(45, 'Cirujano pediátrico', 'Procedimientos quirúrgicos en niños.', 'especialidad_quirurgica'),
  fila(46, 'Cirujano vascular', 'Enfermedades de arterias y venas.', 'especialidad_quirurgica'),
  fila(47, 'Cirujano maxilofacial', 'Cirugía de boca, mandíbula, cara y estructuras relacionadas.', 'especialidad_quirurgica'),
  fila(48, 'Coloproctólogo', 'Enfermedades del colon, recto y ano.', 'especialidad_quirurgica'),
  fila(49, 'Cirujano oncólogo', 'Tratamiento quirúrgico del cáncer.', 'especialidad_quirurgica'),
  fila(50, 'Cirujano de trasplantes', 'Trasplante de órganos.', 'especialidad_quirurgica'),
  fila(51, 'Flebotomista', 'Extracción y obtención de muestras sanguíneas.', 'laboratorio_clinico'),
  fila(52, 'Técnico en laboratorio clínico', 'Procesamiento y análisis de muestras biológicas, según su competencia.', 'laboratorio_clinico'),
  fila(53, 'Tecnólogo médico de laboratorio', 'Realización de análisis clínicos y procedimientos especializados.', 'laboratorio_clinico'),
  fila(54, 'Químico biólogo', 'Análisis, supervisión y control de calidad del laboratorio, según la normativa aplicable.', 'laboratorio_clinico'),
  fila(55, 'Microbiólogo', 'Estudio e identificación de microorganismos.', 'laboratorio_clinico'),
  fila(56, 'Bacteriólogo', 'Estudio e identificación de bacterias.', 'laboratorio_clinico'),
  fila(57, 'Parasitólogo', 'Identificación y estudio de parásitos.', 'laboratorio_clinico'),
  fila(58, 'Virólogo', 'Estudio de los virus.', 'laboratorio_clinico'),
  fila(59, 'Micólogo', 'Estudio e identificación de hongos.', 'laboratorio_clinico'),
  fila(60, 'Citotecnólogo', 'Análisis microscópico de muestras celulares.', 'laboratorio_clinico'),
  fila(61, 'Histotecnólogo', 'Preparación de tejidos para estudios histológicos.', 'laboratorio_clinico'),
  fila(62, 'Técnico en banco de sangre', 'Procedimientos de inmunohematología y preparación de componentes sanguíneos.', 'laboratorio_clinico'),
  fila(63, 'Especialista en biología molecular', 'Análisis molecular y pruebas genéticas.', 'laboratorio_clinico'),
  fila(64, 'Especialista en química clínica', 'Análisis bioquímicos de muestras biológicas.', 'laboratorio_clinico'),
  fila(65, 'Especialista en inmunohematología', 'Grupos sanguíneos y compatibilidad transfusional.', 'laboratorio_clinico'),
  fila(66, 'Especialista en inmunología de laboratorio', 'Pruebas de anticuerpos, antígenos y respuesta inmunitaria.', 'laboratorio_clinico'),
  fila(67, 'Especialista en hematología de laboratorio', 'Estudios celulares y pruebas hematológicas.', 'laboratorio_clinico'),
  fila(68, 'Especialista en coagulación', 'Pruebas de hemostasia y coagulación.', 'laboratorio_clinico'),
  fila(69, 'Especialista en toxicología clínica', 'Detección y análisis de sustancias tóxicas.', 'laboratorio_clinico'),
  fila(70, 'Especialista en control de calidad', 'Verificación de la precisión y confiabilidad de los análisis clínicos.', 'laboratorio_clinico'),
  fila(71, 'Enfermero profesional', 'Cuidados integrales del paciente.', 'enfermeria'),
  fila(72, 'Auxiliar de enfermería', 'Apoyo en la atención y cuidados del paciente.', 'enfermeria'),
  fila(73, 'Enfermero de cuidados intensivos', 'Atención de pacientes críticos.', 'enfermeria'),
  fila(74, 'Enfermero quirúrgico', 'Atención durante procedimientos quirúrgicos.', 'enfermeria'),
  fila(75, 'Enfermero pediátrico', 'Cuidados de niños.', 'enfermeria'),
  fila(76, 'Enfermero neonatal', 'Cuidados de recién nacidos.', 'enfermeria'),
  fila(77, 'Enfermero obstétrico', 'Atención durante el embarazo, parto y puerperio, según sus competencias.', 'enfermeria'),
  fila(78, 'Enfermero en emergencias', 'Atención de pacientes con urgencias médicas.', 'enfermeria'),
  fila(79, 'Enfermero oncológico', 'Cuidados de pacientes con cáncer.', 'enfermeria'),
  fila(80, 'Paramédico', 'Atención prehospitalaria de emergencias.', 'enfermeria'),
  fila(81, 'Psicólogo clínico', 'Evaluación y atención psicológica.', 'otros_salud'),
  fila(82, 'Nutricionista', 'Alimentación y nutrición.', 'otros_salud'),
  fila(83, 'Fisioterapeuta', 'Rehabilitación y recuperación funcional.', 'otros_salud'),
  fila(84, 'Terapeuta respiratorio', 'Atención y tratamiento respiratorio.', 'otros_salud'),
  fila(85, 'Terapeuta ocupacional', 'Rehabilitación para actividades cotidianas.', 'otros_salud'),
  fila(86, 'Terapeuta del lenguaje', 'Comunicación, habla y deglución.', 'otros_salud'),
  fila(87, 'Odontólogo', 'Salud bucodental.', 'otros_salud'),
  fila(88, 'Ortodoncista', 'Corrección de posición dental y problemas de mordida.', 'otros_salud'),
  fila(89, 'Endodoncista', 'Tratamiento del interior del diente.', 'otros_salud'),
  fila(90, 'Periodoncista', 'Encías y tejidos de soporte dental.', 'otros_salud'),
  fila(91, 'Optometrista', 'Evaluación visual y corrección de defectos refractivos.', 'otros_salud'),
  fila(92, 'Audiólogo', 'Evaluación de la audición y equilibrio.', 'otros_salud'),
  fila(93, 'Podólogo', 'Atención de afecciones de los pies, según su habilitación profesional.', 'otros_salud'),
  fila(94, 'Farmacéutico', 'Medicamentos y atención farmacéutica.', 'otros_salud'),
  fila(95, 'Trabajador social sanitario', 'Apoyo social a pacientes y familias.', 'otros_salud'),
  fila(96, 'Técnico en radiología', 'Obtención de imágenes diagnósticas.', 'otros_salud'),
  fila(97, 'Técnico en ultrasonografía', 'Realización de estudios ecográficos según su formación.', 'otros_salud'),
  fila(98, 'Perfusionista', 'Operación de equipos de circulación extracorpórea.', 'otros_salud'),
  fila(99, 'Técnico en electrocardiografía', 'Registro de electrocardiogramas.', 'otros_salud'),
  fila(100, 'Técnico en esterilización', 'Limpieza, preparación y esterilización de instrumental médico.', 'otros_salud'),
];

/** Especialidades médicas y quirúrgicas: las que pueden valorar a un paciente (para referencias). */
export const ESPECIALIDADES_CLINICAS = PROFESIONALES_SALUD.filter(
  (p) => p.categoria === 'especialidad_medica' || p.categoria === 'especialidad_quirurgica'
);

export function buscarProfesionalSalud(nombre: string): ProfesionalSalud | undefined {
  const n = nombre.trim().toLowerCase();
  return PROFESIONALES_SALUD.find((p) => p.nombre.toLowerCase() === n);
}
