import React from 'react';
import { useClinic, StaffTabType } from '../../context/ClinicContext';
import { HubTabs, PestanaHub } from './HubTabs';
import { PatientManager } from './PatientManager';
import { OrdersListView } from './OrdersListView';
import { FourDimensionControlHub } from './FourDimensionControlHub';
import { OrderHistoryView } from './OrderHistoryView';
import { ArchivedOrdersView } from './ArchivedOrdersView';
import { TrashOrdersView } from './TrashOrdersView';

/** Pestañas de personal que se muestran dentro de la pantalla "Pacientes y órdenes". */
export const PESTANAS_ORDENES = ['pacientes', 'ordenes', 'episodios', 'historial_ordenes', 'ordenes_archivadas', 'papelera'] as const;
type PestanaOrdenes = (typeof PESTANAS_ORDENES)[number];

export const esPestanaOrdenes = (tab: StaffTabType): tab is PestanaOrdenes =>
  (PESTANAS_ORDENES as readonly string[]).includes(tab);

/**
 * Un solo lugar para pacientes y órdenes: directorio de pacientes, órdenes
 * activas, flujo de trabajo, historial, archivadas y papelera (antes eran 7
 * botones sueltos en el menú). Cada pestaña muestra la misma pantalla de siempre.
 */
export const OrdersHub: React.FC = () => {
  const { staffActiveTab, setStaffActiveTab, orders, patients } = useClinic();
  const activa: PestanaOrdenes = esPestanaOrdenes(staffActiveTab) ? staffActiveTab : 'ordenes';

  const pestanas: PestanaHub<PestanaOrdenes>[] = [
    { id: 'pacientes', etiqueta: 'Pacientes', contador: patients.length },
    { id: 'ordenes', etiqueta: 'Órdenes activas', contador: orders.filter((o) => !o.isArchived && !o.isDeleted).length },
    { id: 'episodios', etiqueta: 'Flujo de trabajo' },
    { id: 'historial_ordenes', etiqueta: 'Historial' },
    { id: 'ordenes_archivadas', etiqueta: 'Archivadas', contador: orders.filter((o) => o.isArchived && !o.isDeleted).length },
    { id: 'papelera', etiqueta: 'Papelera', contador: orders.filter((o) => o.isDeleted).length }
  ];

  return (
    <div>
      <HubTabs pestanas={pestanas} activa={activa} onCambiar={setStaffActiveTab} etiquetaAccesible="Pacientes y órdenes" />
      {activa === 'pacientes' && <PatientManager />}
      {activa === 'ordenes' && <OrdersListView />}
      {activa === 'episodios' && <FourDimensionControlHub />}
      {activa === 'historial_ordenes' && <OrderHistoryView />}
      {activa === 'ordenes_archivadas' && <ArchivedOrdersView />}
      {activa === 'papelera' && <TrashOrdersView />}
    </div>
  );
};
