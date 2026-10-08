import React from 'react';
import { OrdersMasterManager } from './OrdersMasterManager';

/**
 * ANTES: esta vista era un stub -`trashedItems` vivía en un useState local
 * que nunca se llenaba (no existía ningún `setTrashedItems` en todo el
 * archivo), así que la Papelera estaba siempre vacía sin importar cuántas
 * órdenes se "eliminaran" realmente, y el botón "Restaurar" solo mostraba
 * una notificación de éxito falsa sin restaurar nada. AHORA: igual que
 * ArchivedOrdersView, delega en OrdersMasterManager (modo 'trash'), que lee
 * `orders.filter(o => o.isDeleted)` -el mismo arreglo real que ya usan
 * "Órdenes" y "Órdenes Archivadas"- y ofrece restaurar una por una o en
 * lote contra server/routes/ordenes.ts (GET /papelera,
 * /:id/restaurar-papelera, /restaurar-varias-papelera).
 */
export const TrashOrdersView: React.FC = () => {
  return <OrdersMasterManager mode="trash" />;
};
