'use client';

import React from 'react';
import { FileUp } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { materialIssueService } from '@/lib/manufacturing-service';

export default function MaterialIssuesPage() {
  return (
    <MfgEntityList
      title="Material Issues"
      subtitle="Material issued from warehouse to production (reservation → issue → WIP)"
      icon={<FileUp className="w-5 h-5 text-white" />}
      service={materialIssueService}
      columns={[
        { key: 'issueNumber', label: 'Issue #', render: (r) => <span className="font-semibold text-[#014582]">{r.issueNumber || r.number || r.id}</span> },
        { key: 'productionOrderNumber', label: 'MO #', render: (r) => r.productionOrderNumber || r.productionOrder?.orderNumber || r.productionOrderId || '—' },
        { key: 'productName', label: 'Material', render: (r) => r.productName || r.product?.name || '—' },
        { key: 'quantity', label: 'Qty', render: (r) => r.quantity ?? '—' },
        { key: 'warehouseName', label: 'Warehouse', render: (r) => r.warehouseName || r.warehouse?.name || r.warehouseId || '—' },
        { key: 'status', label: 'Status', render: (r) => <MfgStatusBadge status={r.status} /> },
      ]}
      fields={[
        { name: 'productionOrderId', label: 'Production Order Id', type: 'text', required: true },
        { name: 'productId', label: 'Material / Product', type: 'product', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'warehouseId', label: 'From Warehouse Id', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'textarea', full: true },
      ]}
    />
  );
}

export { MfgStatusBadge };
