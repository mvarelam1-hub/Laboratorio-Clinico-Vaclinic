import React from 'react';
import { useClinic, StaffTabType } from '../../context/ClinicContext';
import { calcularAlertasReales } from '../../utils/alertasReales';
import { HubTabs, PestanaHub } from './HubTabs';
import { LabAlertsView } from './LabAlertsView';
import { CriticalVerificationQueueView } from './CriticalVerificationQueueView';

/** Pestañas de personal que se muestran dentro de la pantalla "Alertas y críticos". */
export const PESTANAS_ALERTAS = ['alertas', 'verificacion_criticos'] as const;
type PestanaAlertas = (typeof PESTANAS_ALERTAS)[number];

export const esPestanaAlertas = (tab: StaffTabType): tab is PestanaAlertas =>
  (PESTANAS_ALERTAS as readonly string[]).includes(tab);

/**
 * Alertas del laboratorio y verificación de valores críticos en una sola
 * pantalla (antes eran dos botones del menú que trataban de lo mismo).
 */
export const AlertsHub: React.FC = () => {
  const { staffActiveTab, setStaffActiveTab, reports, reagents } = useClinic();
  const activa: PestanaAlertas = esPestanaAlertas(staffActiveTab) ? staffActiveTab : 'alertas';
  const totalAlertas = calcularAlertasReales(reports, reagents).length;

  const pestanas: PestanaHub<PestanaAlertas>[] = [
    { id: 'alertas', etiqueta: 'Alertas', contador: totalAlertas, alerta: true },
    { id: 'verificacion_criticos', etiqueta: 'Verificación de críticos' }
  ];

  return (
    <div>
      <HubTabs pestanas={pestanas} activa={activa} onCambiar={setStaffActiveTab} etiquetaAccesible="Alertas y valores críticos" />
      {activa === 'alertas' && <LabAlertsView />}
      {activa === 'verificacion_criticos' && <CriticalVerificationQueueView />}
    </div>
  );
};
