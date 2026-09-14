'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { MfgEntityList } from '../../_components/MfgEntityList';
import { scrapService } from '@/lib/manufacturing-service';

export default function ScrapPage() {
  return (
    <MfgEntityList
      title="Scrap"
      subtitle="Track scrap by production order, material, reason, work center and cost"
      icon={<RotateCcw className="w-5 h-5 text-white" />}
      service={scrapService}
      columns={[
        { key: 'productionOrderNumber', label: 'MO #', render: (r) => <span className="font-semibold text-[#014582]">{r.productionOrderNumber || r.productionOrder?.orderNumber || r.productionOrderId || '—'}</span> },
        { key: 'productName', label: 'Material', render: (r) => r.productName || r.product?.name || '—' },
        { key: 'quantity', label: 'Qty', render: (r) => r.quantity ?? '—' },
        { key: 'reason', label: 'Reason', render: (r) => r.reason || '—' },
        { key: 'workCenterName', label: 'Work Center', render: (r) => r.workCenterName || r.workCenter?.name || '—' },
        { key: 'cost', label: 'Cost', render: (r) => Number(r.cost || 0).toLocaleString() },
      ]}
      fields={[
        { name: 'productionOrderId', label: 'Production Order Id', type: 'text', required: true },
        { name: 'productId', label: 'Product / Material', type: 'product', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'reason', label: 'Reason', type: 'text' },
        { name: 'workCenterId', label: 'Work Center Id', type: 'text' },
        { name: 'machineId', label: 'Machine Id', type: 'text' },
        { name: 'cost', label: 'Cost', type: 'number' },
      ]}
    />
  );
}
