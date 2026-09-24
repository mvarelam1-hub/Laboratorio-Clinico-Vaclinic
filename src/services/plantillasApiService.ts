/**
 * Cliente HTTP para plantillas de informes (server/routes/plantillas.ts)
 * — séptimo módulo de los 9 migrados desde localStorage. A diferencia de
 * los demás servicios, no hay un remoteId separado: id_plantilla en
 * Postgres es el mismo string que ReportTemplate.id en el frontend
 * (TEXT PRIMARY KEY, generado siempre por el frontend), así que
 * `guardarPlantillaRemota` es un upsert real por ese mismo id.
 */
import { getFirebaseAuth } from './firebaseConfig';
import type { ReportTemplate } from '../types';

export class PlantillasApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'PlantillasApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new PlantillasApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
  }
  const idToken = await user.getIdToken();
  return fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}`, ...(options.headers || {}) }
  });
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch {
    /* respuesta sin cuerpo JSON */
  }
  return `El servidor respondió ${res.status}.`;
}

export interface PlantillaApiRow {
  id_plantilla: string;
  nombre: string;
  [key: string]: unknown;
}

export async function guardarPlantillaRemota(template: ReportTemplate): Promise<PlantillaApiRow> {
  const res = await authFetch(`/api/plantillas/${encodeURIComponent(template.id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: template.name, category: template.category, description: template.description,
      defaultParameters: template.defaultParameters, defaultRecommendations: template.defaultRecommendations,
      sampleType: template.sampleType, tubeType: template.tubeType, tubesRequired: template.tubesRequired,
      preanalyticalNotes: template.preanalyticalNotes, panicAlertRule: template.panicAlertRule,
      complianceStandard: template.complianceStandard, complianceScore: template.complianceScore,
      lastAuditedAt: template.lastAuditedAt
    })
  });
  if (!res.ok) throw new PlantillasApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarPlantillaRemota(id: string, updates: Partial<ReportTemplate>): Promise<PlantillaApiRow> {
  const res = await authFetch(`/api/plantillas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: updates.name, category: updates.category, description: updates.description,
      defaultParameters: updates.defaultParameters, defaultRecommendations: updates.defaultRecommendations,
      sampleType: updates.sampleType, tubeType: updates.tubeType, tubesRequired: updates.tubesRequired,
      preanalyticalNotes: updates.preanalyticalNotes, panicAlertRule: updates.panicAlertRule,
      complianceStandard: updates.complianceStandard, complianceScore: updates.complianceScore,
      lastAuditedAt: updates.lastAuditedAt
    })
  });
  if (!res.ok) throw new PlantillasApiError(await parseErrorBody(res), res.status);
  return res.json();
}
