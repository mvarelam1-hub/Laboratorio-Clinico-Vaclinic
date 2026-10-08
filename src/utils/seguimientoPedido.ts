/**
 * Seguimiento del pedido para el personal ("Seguimiento del Pedido").
 * Solo usa lo que el sistema guarda de verdad de la orden y su informe: no hay
 * "recibida por" ni fechas inventadas. El detalle aparece únicamente si existe.
 */
import type { LabOrder, MedicalReport } from '../types';

export interface PasoPedido {
  clave: 'registrada' | 'recibida' | 'capturados' | 'validado' | 'enviado';
  titulo: string;
  hecho: boolean;
  fecha?: string;
  detalle?: string;
}

export function seguimientoDePedido(
  orden: Pick<LabOrder, 'date' | 'testsCount' | 'status' | 'reportStatus'>,
  informe?: Pick<MedicalReport, 'status' | 'signature'> | null
): PasoPedido[] {
  const enRevisionOMas = orden.reportStatus === 'En Revisión' || orden.reportStatus === 'Validado'
    || (!!informe && ['revision', 'publicado', 'entregado'].includes(informe.status));
  const validado = orden.reportStatus === 'Validado' || (!!informe && ['publicado', 'entregado'].includes(informe.status));
  const recibida = orden.status !== 'Pendiente' || enRevisionOMas || !!informe;
  const firmante = informe?.signature?.bioanalystName || informe?.signature?.doctorName || '';
  const n = Number(orden.testsCount) || 0;
  return [
    { clave: 'registrada', titulo: 'Orden registrada', hecho: true, fecha: orden.date, detalle: n > 0 ? `${n} ${n === 1 ? 'examen' : 'examenes'}` : undefined },
    { clave: 'recibida', titulo: 'Muestra recibida', hecho: recibida },
    { clave: 'capturados', titulo: 'Resultados capturados', hecho: enRevisionOMas },
    {
      clave: 'validado', titulo: 'Validado', hecho: validado,
      fecha: validado ? informe?.signature?.signedAt?.slice(0, 10) : undefined,
      detalle: validado && firmante ? `Por ${firmante}` : undefined
    },
    { clave: 'enviado', titulo: 'Enviado al paciente', hecho: orden.status === 'Entregado', detalle: orden.status === 'Entregado' ? undefined : 'Todavía no ocurre' }
  ];
}
