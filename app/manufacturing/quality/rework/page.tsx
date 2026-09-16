'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { reworkService } from '@/lib/manufacturing-service';

export default function ReworkPage() {
  return (
    <MfgEntityList
      title="Rework"
      subtitle="Rework after quality failure → re-inspection → pass or scrap"
      icon={<RotateCcw className="w-5 h-5 text-white" />}
      service={reworkService}
      columns={[
        { key: 'productionOrderNumber', label: 'MO #', render: (r) => <span className="font-semibold text-[#014582]">{r.productionOrderNumber || r.productionOrder?.orderNumber || r.productionOrderId || '—'}</span> },
        { key: 'productName', label: 'Product', render: (r) => r.productName || r.product?.name || '—' },
        { key: 'reworkQty', label: 'Rework Qty', render: (r) => r.reworkQty ?? r.quantity ?? '—' },
        { key: 'reason', label: 'Reason', render: (r) => r.reason || '—' },
        { key: 'cost', label: 'Cost', render: (r) => Number(r.cost || 0).toLocaleString() },
        { key: 'status', label: 'Status', render: (r) => <MfgStatusBadge status={r.status} /> },
      ]}
      fields={[
        { name: 'productionOrderId', label: 'Production Order', type: 'relation', required: true },
        { name: 'productId', label: 'Product', type: 'product', required: true },
        { name: 'reworkQty', label: 'Rework Qty', type: 'number' },
        { name: 'reason', label: 'Reason', type: 'text' },
        { name: 'cost', label: 'Rework Cost', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'InProgress', 'Completed', 'Scrap'].map((v) => ({ value: v, label: v })) },
      ]}
    />
  );
}

export { MfgStatusBadge };
