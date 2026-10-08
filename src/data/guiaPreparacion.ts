/**
 * Guía de preparación: indicaciones GENERALES de uso común en cualquier
 * laboratorio clínico. No son indicaciones médicas personalizadas ni
 * reemplazan lo que el laboratorio o el médico le pidan para un examen
 * concreto; la pantalla lo dice siempre. Lo específico por examen sale del
 * catálogo (ayuno / instrucciones) solo si el laboratorio lo escribió.
 */
export interface SeccionGuia {
  id: string;
  titulo: string;
  resumen: string;
  pasos: string[];
}

export const SECCIONES_GUIA: SeccionGuia[] = [
  {
    id: 'antes',
    titulo: 'Antes de venir al laboratorio',
    resumen: 'Lo básico para cualquier examen.',
    pasos: [
      'Trae tu orden médica (si la tienes) y un documento de identificación.',
      'Dile al personal qué medicamentos, vitaminas o suplementos tomas. No los suspendas por tu cuenta: consulta primero a tu médico.',
      'Avisa si estás embarazada, si estás enferma o con fiebre, o si te hicieron estudios con medio de contraste o bario recientemente.',
      'Llega con unos minutos de anticipación; descansar sentado/a antes de la toma ayuda a que los resultados reflejen tu estado habitual.',
    ],
  },
  {
    id: 'sangre',
    titulo: 'Examen de sangre',
    resumen: 'Algunas pruebas piden ayuno; otras no.',
    pasos: [
      'Pruebas como la glucosa y el perfil de lípidos (colesterol, triglicéridos) suelen pedirse en ayuno, generalmente de 8 a 12 horas. Confirma con el laboratorio si el tuyo lo necesita.',
      'Durante el ayuno puedes tomar agua. Evita café, té, jugos, refrescos, alcohol y chicle.',
      'La noche anterior procura una cena ligera, sin frituras ni exceso de grasa.',
      'Evita el ejercicio intenso el día anterior y esa mañana.',
      'Si tu examen no requiere ayuno, puedes comer normalmente salvo que el laboratorio te indique otra cosa.',
    ],
  },
  {
    id: 'orina',
    titulo: 'Examen de orina',
    resumen: 'Una buena muestra evita repetir el examen.',
    pasos: [
      'Pide en el laboratorio el frasco limpio para la muestra; no uses frascos de otros usos.',
      'Lo ideal es la primera orina de la mañana.',
      'Lávate bien las manos y la zona genital antes de recolectar.',
      'Elimina el primer chorro y recolecta el chorro medio en el frasco.',
      'Cierra bien el frasco, escribe tu nombre y entrégalo lo antes posible. Si hay demora, guárdalo en un lugar fresco y avisa al laboratorio.',
      'Si estás en tu período menstrual, avísalo al personal.',
    ],
  },
  {
    id: 'heces',
    titulo: 'Examen de heces',
    resumen: 'Muestra fresca y en el frasco correcto.',
    pasos: [
      'Pide en el laboratorio el frasco para heces.',
      'Recolecta la muestra en un recipiente limpio y seco, evitando que se mezcle con orina, agua del inodoro o papel.',
      'Llena el frasco aproximadamente hasta la tercera parte o con una porción del tamaño de una nuez, según te indique el laboratorio.',
      'Escribe tu nombre en el frasco y entrégalo lo antes posible, el mismo día.',
      'Avisa si tomaste antibióticos, antiparasitarios, laxantes o te hicieron estudios con bario en los días previos.',
    ],
  },
  {
    id: 'cultivos',
    titulo: 'Cultivos y muestras especiales',
    resumen: 'Cuando se busca una infección.',
    pasos: [
      'Si vas a dar muestra para un cultivo (orina, garganta, secreciones), pregunta antes en el laboratorio cómo recolectarla.',
      'Si estás tomando antibióticos o los tomaste recientemente, avísalo antes de dar la muestra.',
      'Usa solo los recipientes estériles que te entregue el laboratorio y no toques el interior del frasco ni la tapa.',
    ],
  },
];

export interface PreguntaFrecuente { pregunta: string; respuesta: string; }

export const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  {
    pregunta: '¿Puedo tomar agua si estoy en ayuno?',
    respuesta: 'Sí, el agua sola está permitida y ayuda a que la toma de sangre sea más fácil. Evita café, té, jugos y refrescos.',
  },
  {
    pregunta: '¿Debo tomar mis medicamentos el día del examen?',
    respuesta: 'No los suspendas por tu cuenta. Pregunta a tu médico y avisa en el laboratorio qué medicamentos tomas.',
  },
  {
    pregunta: '¿Cuándo tendré mis resultados?',
    respuesta: 'Depende del examen; en el Catálogo de Pruebas aparece el tiempo estimado de cada una. Cuando el laboratorio publique tu informe lo verás en "Consultar mis resultados" con tu código.',
  },
  {
    pregunta: '¿Dónde consigo mi código de consulta?',
    respuesta: 'Te lo entrega el laboratorio al registrar tu orden. Si lo perdiste, pídelo en recepción.',
  },
  {
    pregunta: '¿Los resultados me dicen si tengo una enfermedad?',
    respuesta: 'No por sí solos. Los resultados deben ser interpretados por tu médico junto con tu historia clínica y síntomas.',
  },
];
