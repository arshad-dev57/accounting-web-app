'use client';

import { Eye, Edit3, Truck, FileText, X as XIcon, Trash2 } from 'lucide-react';
import PortalActionsMenu from '../purchases/PortalActionsMenu';
import type { Order } from '@/lib/sales-order-service';

export type SalesOrderAction =
  | 'view'
  | 'edit'
  | 'createDelivery'
  | 'createInvoice'
  | 'cancel'
  | 'delete'
  | 'report';

interface SalesOrderActionsMenuProps {
  order: Order;
  onAction: (action: SalesOrderAction, order: Order) => void;
}

export function canCreateDelivery(order: Order) {
  if (['Cancelled', 'Draft', 'Delivered', 'Returned'].includes(order.orderStatus)) {
    return false;
  }
  return true;
}

export function canCreateInvoice(order: Order) {
  return !['Cancelled', 'Draft', 'Returned'].includes(order.orderStatus);
}

export default function SalesOrderActionsMenu({ order, onAction }: SalesOrderActionsMenuProps) {
  const items = [
    {
      key: 'view',
      label: 'View details',
      icon: <Eye className="w-3.5 h-3.5" />,
      show: true,
    },
    {
      key: 'report',
      label: 'Order report',
      icon: <FileText className="w-3.5 h-3.5" />,
      show: true,
    },
    {
      key: 'edit',
      label: 'Edit order',
      icon: <Edit3 className="w-3.5 h-3.5" />,
      show: ['Draft', 'Pending', 'On Hold'].includes(order.orderStatus),
    },
    {
      key: 'createDelivery',
      label: 'Create delivery',
      icon: <Truck className="w-3.5 h-3.5" />,
      show: canCreateDelivery(order),
    },
    {
      key: 'createInvoice',
      label: 'Create invoice',
      icon: <FileText className="w-3.5 h-3.5" />,
      show: canCreateInvoice(order),
    },
    {
      key: 'cancel',
      label: 'Cancel',
      icon: <XIcon className="w-3.5 h-3.5" />,
      show: ['Draft', 'Pending', 'Processing', 'On Hold', 'Packed', 'Shipped', 'In Transit'].includes(
        order.orderStatus
      ),
      danger: true,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      show: ['Draft', 'Cancelled'].includes(order.orderStatus),
      danger: true,
    },
  ];

  return (
    <PortalActionsMenu
      items={items}
      onSelect={(key) => onAction(key as SalesOrderAction, order)}
    />
  );
}
