import React from 'react';
import { OrdersMasterManager } from './OrdersMasterManager';

export const ArchivedOrdersView: React.FC = () => {
  return <OrdersMasterManager mode="archived" />;
};
