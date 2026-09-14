'use client';

import React from 'react';
import { SearchCheck } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { inspectionService } from '@/lib/manufacturing-service';

export default function QualityInspectionsPage() {
  return (
    <MfgEntityList
      title="Quality Inspections"
      subtitle="Inspection records with parameters, tolerances and results"
      icon={<SearchCheck className="w-5 h-5 text-white" />}
      service={inspectionService}
      columns={[
        { key: 'inspectionNumber', label: 'Inspection #', render: (r) => <span className="font-semibold text-[#014582]">{r.inspectionNumber || r.number || r.id}</span> },
        { key: 'productionOrderNumber', label: 'MO #', render: (r) => r.productionOrderNumber || r.productionOrder?.orderNumber || r.productionOrderId || '—' },
        { key: 'productName', label: 'Product', render: (r) => r.productName || r.product?.name || '—' },
        { key: 'inspector', label: 'Inspector', render: (r) => r.inspector || r.inspectorName || '—' },
        { key: 'result', label: 'Result', render: (r) => <MfgStatusBadge status={r.result || r.status} /> },
      ]}
      fields={[
        { name: 'productionOrderId', label: 'Production Order Id', type: 'text', required: true },
        { name: 'productId', label: 'Product', type: 'product', required: true },
        { name: 'inspectionType', label: 'Type', type: 'select', options: ['Incoming', 'InProcess', 'Final'].map((v) => ({ value: v, label: v })) },
        { name: 'result', label: 'Result', type: 'select', options: ['Pending', 'Passed', 'Failed', 'Rework', 'Scrap'].map((v) => ({ value: v, label: v })) },
      ]}
    />
  );
}

export { MfgStatusBadge };
