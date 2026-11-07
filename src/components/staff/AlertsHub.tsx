import React from 'react';
import { StaffTabType } from '../../context/ClinicContext';
import { LabAlertsView } from './LabAlertsView';
import { CriticalVerificationQueueView } from './CriticalVerificationQueueView';

/** Pestañas de personal que se muestran dentro de la pantalla "Alertas y críticos". */
export const PESTANAS_ALERTAS = ['alertas', 'verificacion_criticos'] as const;
type PestanaAlertas = (typeof PESTANAS_ALERTAS)[number];

export const esPestanaAlertas = (tab: StaffTabType): tab is PestanaAlertas =>
  (PESTANAS_ALERTAS as readonly string[]).includes(tab);

/**
 * Una sola lista de pendientes: primero los valores críticos que esperan a un
 * segundo bioanalista y debajo las alertas del laboratorio (críticos en
 * informes y reactivos). Sin cambiar de pestaña.
 */
export const AlertsHub: React.FC = () => (
  <div className="space-y-8">
    <CriticalVerificationQueueView />
    <LabAlertsView />
  </div>
);
