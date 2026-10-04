import { MedicalReport, LabCatalogItem } from '../types';
import { generateDemographicParametersForTests } from './referenceRangeEvaluator';

export interface DatosBorrador {
  /** Id de la orden (LabOrder.id) — vínculo real; undefined si la orden solo existe local. */
  orderId?: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  nationalId: string;
  /** Edad real en años; si no se conoce, el borrador no inventa una. */
  patientAge?: number;
  patientGender?: string;
  testsList: string[];
  examCodes?: string[];
  catalogTests?: LabCatalogItem[];
  sampleDate: string;
  laboratoryName: string;
  tubeType?: string;
}

/**
 * Borrador de informe para capturar resultados de una orden.
 *
 * Es SOLO un borrador: los valores quedan vacíos (se capturan o llegan del
 * analizador), y hallazgos, conclusión, explicación y recomendaciones también
 * empiezan vacíos. Nada de lo que aquí se escribe puede llegar al paciente sin
 * que el personal lo redacte: un texto genérico precargado ("resultados
 * compatibles con normalidad…") terminaría publicado en informes reales.
 */
export function construirBorradorDeOrden(d: DatosBorrador): MedicalReport {
  const edad = d.patientAge ?? 0;
  const esFemenino = (d.patientGender || '').toUpperCase().startsWith('F');
  const parameters = generateDemographicParametersForTests(
    d.testsList, edad, d.patientGender ?? 'M', d.catalogTests, d.examCodes
  );
  return {
    id: `rep-ord-${Date.now()}`,
    reportNumber: `INF-${d.orderNumber.replace('#', '')}-${new Date().getFullYear()}`,
    patientId: d.patientId,
    patientName: d.patientName,
    patientNationalId: d.nationalId,
    patientAge: edad,
    patientGender: esFemenino ? 'F' : 'M',
    category: 'bioquimica',
    title: d.testsList.join(' + ') || 'Análisis clínico de laboratorio',
    sampleDate: d.sampleDate,
    emissionDate: new Date().toISOString(),
    laboratoryName: d.laboratoryName,
    status: 'borrador',
    sampleType: '',
    tubeType: d.tubeType || '',
    parameters,
    clinicalFindings: '',
    doctorConclusions: '',
    patientExplanation: '',
    recommendations: [],
    // El código de verificación real lo emite el servidor al publicar (sello verificable).
    qrVerificationCode: '',
    orderId: d.orderId
  } as MedicalReport;
}

/**
 * Número de informe único (la base lo exige UNIQUE): fecha + marca de tiempo en
 * base 36 + 2 caracteres extra. Ya no usa "LAB-2026-" fijo ni 4 dígitos al azar,
 * que podían repetirse y rechazar el guardado.
 */
export function numeroInformeNuevo(ahora: Date = new Date(), azar: () => number = Math.random): string {
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  const t = ahora.getTime().toString(36).toUpperCase().slice(-6);
  const extra = Math.floor(azar() * 1296).toString(36).toUpperCase().padStart(2, '0');
  return `INF-${y}${m}${d}-${t}${extra}`;
}
