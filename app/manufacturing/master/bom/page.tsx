'use client';

import React from 'react';
import { Boxes } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { bomService } from '@/lib/manufacturing-service';

export default function BomPage() {
  return (
    <MfgEntityList
      title="Bill of Materials (BOM)"
      subtitle="Component structures for finished products — supports multi-level BOM"
      icon={<Boxes className="w-5 h-5 text-white" />}
      service={bomService}
      idKey="id"
      columns={[
        { key: 'name', label: 'BOM', render: (r) => (
          <a href={`/manufacturing/master/bom/${r.id || r._id}`} className="font-semibold text-[#014582] hover:underline">{r.bomNumber || r.name || r.id}</a>
        ) },
        { key: 'productName', label: 'Product', render: (r) => r.productName || r.product?.name || '—' },
        { key: 'version', label: 'Version', render: (r) => r.version || '—' },
        { key: 'components', label: 'Components', render: (r) => (Array.isArray(r.components) ? r.components.length : '—') },
        { key: 'status', label: 'Status', render: (r) => <MfgStatusBadge status={r.status} /> },
      ]}
      requireLocation={false}
      fields={[
        { name: 'productId', label: 'Finished Product', type: 'product', required: true },
        { name: 'components', label: 'Components', type: 'products', withQuantity: true, full: true },
        { name: 'version', label: 'Version', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Obsolete'].map((v) => ({ value: v, label: v })) },
        { name: 'notes', label: 'Notes', type: 'textarea', full: true },
      ]}
    />
  );
}

export { MfgStatusBadge };
