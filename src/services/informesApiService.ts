/**
 * Cliente HTTP para el informe clínico real (server/routes/informes.ts,
 * migración 0014) — el documento del informe en sí (título, hallazgos,
 * conclusiones, explicación IA para el paciente, recomendaciones, firma
 * digital, QR, reporte adjunto del analizador), no solo los valores
 * numéricos por examen que ya sincroniza resultadosApiService.ts.
 *
 * Mismo patrón que el resto de servicios: columnas reales para lo
 * consultable (estado/categoría/título/fechas/QR) + `datosAdicionales`
 * para el resto de MedicalReport, que el backend guarda en `datos_json`.
 */
import { getStaffSessionToken } from './staffSessionToken';
import type { MedicalReport } from '../types';

export class InformesApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'InformesApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStaffSessionToken();
  if (!token) {
    throw new InformesApiError('No hay una sesión de personal activa para llamar a la API.');
  }
  return fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch {
    /* sin cuerpo JSON */
  }
  return `El servidor respondió ${res.status}.`;
}

export interface InformeApiRow {
  id_informe: number;
  numero_informe: string;
  estado: string;
  [key: string]: unknown;
}

// Arma el body que entiende server/routes/informes.ts a partir de un
// MedicalReport (completo o parcial, para PATCH) del frontend: separa los
// campos con columna propia de los que van en datosAdicionales -misma
// lista exacta que `extraerDatosAdicionales` en el backend, para que
// ningún campo se pierda silenciosamente en la traducción.
function aBodyApi(report: Partial<MedicalReport>, idOrdenRemoto?: number | null) {
  return {
    idOrden: idOrdenRemoto ?? undefined,
    numeroInforme: report.reportNumber,
    titulo: report.title,
    categoria: report.category,
    estado: report.status,
    fechaMuestra: report.sampleDate,
    fechaEmision: report.emissionDate,
    hallazgosClinicos: report.clinicalFindings,
    conclusionesMedico: report.doctorConclusions,
    explicacionPaciente: report.patientExplanation,
    recomendaciones: report.recommendations,
    codigoVerificacionQr: report.qrVerificationCode,
    // Resto de MedicalReport sin columna propia -ver informes.ts
    // `extraerDatosAdicionales`-.
    patientId: report.patientId,
    patientName: report.patientName,
    patientNationalId: report.patientNationalId,
    patientAge: report.patientAge,
    patientGender: report.patientGender,
    referringDoctor: report.referringDoctor,
    company: report.company,
    laboratoryName: report.laboratoryName,
    sampleType: report.sampleType,
    tubeType: report.tubeType,
    parameters: report.parameters,
    includeConclusionsInReport: report.includeConclusionsInReport,
    includeRecommendationsInReport: report.includeRecommendationsInReport,
    includeAiExplanationInReport: report.includeAiExplanationInReport,
    urgentAlert: report.urgentAlert,
    signature: report.signature,
    notesToStaff: report.notesToStaff,
    episodeId: report.episodeId,
    branchId: report.branchId,
    attachedAnalyzerReport: report.attachedAnalyzerReport
  };
}

export async function crearInformeRemoto(report: MedicalReport, idOrdenRemoto?: number | null): Promise<InformeApiRow> {
  const res = await authFetch('/api/informes', { method: 'POST', body: JSON.stringify(aBodyApi(report, idOrdenRemoto)) });
  if (!res.ok) throw new InformesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarInformeRemoto(idInforme: number, updates: Partial<MedicalReport>, idOrdenRemoto?: number | null): Promise<InformeApiRow> {
  const res = await authFetch(`/api/informes/${idInforme}`, { method: 'PATCH', body: JSON.stringify(aBodyApi(updates, idOrdenRemoto)) });
  if (!res.ok) throw new InformesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function publicarInformeRemoto(idInforme: number, signature?: MedicalReport['signature']): Promise<InformeApiRow> {
  const res = await authFetch(`/api/informes/${idInforme}/publicar`, { method: 'PATCH', body: JSON.stringify({ signature }) });
  if (!res.ok) throw new InformesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

/**
 * PDF OFICIAL generado por el servidor (GET /api/informes/:id/pdf, migración
 * 0019): contenido, firmantes y QR salen de la base de datos, no del
 * navegador. Un 409 (INFORME_MODIFICADO / INFORME_SIN_SELLO) significa que el
 * informe publicado ya no coincide con su sello y hay que volver a publicarlo.
 */
export async function descargarInformePdfOficial(idInforme: number): Promise<Blob> {
  const res = await authFetch(`/api/informes/${idInforme}/pdf`, { headers: { Accept: 'application/pdf' } });
  if (!res.ok) throw new InformesApiError(await parseErrorBody(res), res.status);
  return res.blob();
}

export async function eliminarInformeRemoto(idInforme: number, motivo?: string): Promise<void> {
  const res = await authFetch(`/api/informes/${idInforme}`, { method: 'DELETE', body: JSON.stringify({ motivo }) });
  if (!res.ok) throw new InformesApiError(await parseErrorBody(res), res.status);
}
