/**
 * PDF oficial del informe: UN solo formato, el que genera el servidor
 * (GET /api/informes/:id/pdf). Todas las pantallas del personal que descargan
 * o imprimen un informe pasan por aquí, para que lo que ve el paciente y lo
 * que imprime el personal sea exactamente el mismo documento.
 *
 * Solo un informe que ya existe en el servidor (`remoteId`) tiene PDF oficial.
 * Un informe 100% local (sin conexión / modo demostración) sigue usando la
 * exportación del navegador, porque no hay otro origen de datos.
 */
import { MedicalReport } from '../types';
import { descargarInformePdfOficial } from './informesApiService';

const limpiar = (s: string) => s.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');

/** ¿Este informe tiene PDF oficial en el servidor? */
export function tienePdfOficial(report: Partial<MedicalReport>): boolean {
  return typeof report.remoteId === 'number' && report.remoteId > 0;
}

/** Nombre del archivo: el N.º de orden (único código visible) y el paciente. */
export function nombreArchivoOficial(report: Partial<MedicalReport>, numeroOrden?: string): string {
  const codigo = limpiar(numeroOrden || report.reportNumber || 'Informe');
  const paciente = limpiar(report.patientName || 'Paciente');
  return `Informe-${codigo}-${paciente}.pdf`;
}

/** Descarga el PDF oficial como archivo. Lanza InformesApiError si el servidor lo rechaza. */
export async function descargarPdfOficial(report: Partial<MedicalReport>, numeroOrden?: string): Promise<void> {
  if (!tienePdfOficial(report)) throw new Error('Este informe todavía no está en el servidor.');
  const blob = await descargarInformePdfOficial(report.remoteId as number);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivoOficial(report, numeroOrden);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Abre el PDF oficial en una pestaña nueva para imprimirlo desde el visor.
 * La pestaña se abre ANTES de pedir el PDF (dentro del clic) para que el
 * navegador no la bloquee como ventana emergente.
 */
export async function abrirPdfOficial(report: Partial<MedicalReport>, numeroOrden?: string): Promise<void> {
  if (!tienePdfOficial(report)) throw new Error('Este informe todavía no está en el servidor.');
  const ventana = window.open('', '_blank');
  try {
    const blob = await descargarInformePdfOficial(report.remoteId as number);
    const url = URL.createObjectURL(blob);
    if (ventana) {
      ventana.location.href = url;
    } else {
      // Ventana emergente bloqueada: se descarga el mismo documento.
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivoOficial(report, numeroOrden);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
  } catch (err) {
    ventana?.close();
    throw err;
  }
}
