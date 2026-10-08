/**
 * URL de verificación PÚBLICA de un informe (server/routes/verificar.ts,
 * migración 0019). Solo existe para informes que el SERVIDOR selló al
 * publicarlos: el código lo emite el backend, nunca el navegador. Para un
 * informe sin sello (borrador, o publicado solo en pantalla porque el
 * servidor no estaba disponible) devuelve `null`: antes se imprimía un QR a
 * un dominio sin ruta detrás (vaclinic.laboratorio.gt/valida), que daba la
 * falsa impresión de un documento verificable.
 */
import type { MedicalReport } from '../types';

export function buildVerificationUrl(
  report: Pick<MedicalReport, 'verificationCode' | 'verificationHash'> | null | undefined,
  origin: string = typeof window !== 'undefined' ? window.location.origin : ''
): string | null {
  const code = report?.verificationCode;
  if (!code || !/^[A-Z0-9]{16}$/.test(code)) return null;
  const base = origin.replace(/\/+$/, '');
  const h = report?.verificationHash && /^[0-9a-f]{16,64}$/i.test(report.verificationHash)
    ? `?h=${report.verificationHash.slice(0, 16).toLowerCase()}`
    : '';
  return `${base}/verificar/${code}${h}`;
}

/** "ABCDEFGHJKMNPQRS" -> "ABCD-EFGH-JKMN-PQRS" para mostrar en el documento. */
export function formatVerificationCode(code: string | undefined | null): string | null {
  if (!code || !/^[A-Z0-9]{16}$/.test(code)) return null;
  return code.match(/.{1,4}/g)!.join('-');
}
