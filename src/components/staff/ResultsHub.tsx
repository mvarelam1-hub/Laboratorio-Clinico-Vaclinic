import React from 'react';
import { useClinic, StaffTabType } from '../../context/ClinicContext';
import { HubTabs, PestanaHub } from './HubTabs';
import { ResultsWorkspace } from './ResultsWorkspace';
import { LabDispatchesView } from './LabDispatchesView';

/** Pestañas de personal que se muestran dentro de la pantalla "Resultados". */
export const PESTANAS_RESULTADOS = ['redactor', 'envios'] as const;
type PestanaResultados = (typeof PESTANAS_RESULTADOS)[number];

export const esPestanaResultados = (tab: StaffTabType): tab is PestanaResultados =>
  (PESTANAS_RESULTADOS as readonly string[]).includes(tab);

/**
 * Ingresar los resultados de una orden y entregarlos al paciente en el mismo
 * lugar (antes eran dos botones del menú).
 */
export const ResultsHub: React.FC = () => {
  const { staffActiveTab, setStaffActiveTab, reports } = useClinic();
  const activa: PestanaResultados = esPestanaResultados(staffActiveTab) ? staffActiveTab : 'redactor';

  const pestanas: PestanaHub<PestanaResultados>[] = [
    { id: 'redactor', etiqueta: 'Ingresar resultados' },
    { id: 'envios', etiqueta: 'Entregar al paciente', contador: reports.filter((r) => r.status === 'publicado').length }
  ];

  return (
    <div>
      <HubTabs pestanas={pestanas} activa={activa} onCambiar={setStaffActiveTab} etiquetaAccesible="Resultados" />
      {activa === 'redactor' && <ResultsWorkspace />}
      {activa === 'envios' && <LabDispatchesView />}
    </div>
  );
};
