'use client';

import React from 'react';
import { PackageSearch } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { materialReservationService } from '@/lib/manufacturing-service';

export default function MaterialReservationsPage() {
  return (
    <MfgEntityList
      title="Material Reservations"
      subtitle="Materials reserved against released production orders"
      icon={<PackageSearch className="w-5 h-5 text-white" />}
      service={materialReservationService}
      columns={[
        { key: 'productionOrderNumber', label: 'MO #', render: (r) => <span className="font-semibold text-[#014582]">{r.productionOrderNumber || r.productionOrder?.orderNumber || r.productionOrderId || '—'}</span> },
        { key: 'productName', label: 'Material', render: (r) => r.productName || r.product?.name || '—' },
        { key: 'requiredQty', label: 'Required', render: (r) => r.requiredQty ?? r.required ?? '—' },
        { key: 'reservedQty', label: 'Reserved', render: (r) => r.reservedQty ?? '—' },
        { key: 'status', label: 'Status', render: (r) => <MfgStatusBadge status={r.status} /> },
      ]}
      fields={[
        { name: 'productionOrderId', label: 'Production Order', type: 'relation', required: true },
        { name: 'productId', label: 'Material / Product', type: 'product', required: true },
        { name: 'requiredQuantity', label: 'Required Qty', type: 'number' },
        { name: 'reservedQuantity', label: 'Reserved Qty', type: 'number' },
      ]}
    />
  );
}

export { MfgStatusBadge };
