'use client';

import React from 'react';
import { Route } from 'lucide-react';
import { MfgEntityList } from '../../_components/MfgEntityList';
import { routingService } from '@/lib/manufacturing-service';

export default function RoutingsPage() {
  return (
    <MfgEntityList
      title="Routings"
      subtitle="Process routings defining the ordered manufacturing operations"
      icon={<Route className="w-5 h-5 text-white" />}
      service={routingService}
      columns={[
        { key: 'routingNumber', label: 'Routing #', render: (r) => <span className="font-semibold text-[#014582]">{r.routingNumber || r.number || r.name || '—'}</span> },
        { key: 'description', label: 'Description', render: (r) => r.description || r.name || '—' },
        { key: 'productName', label: 'Product', render: (r) => r.productName || r.product?.name || '—' },
        { key: 'status', label: 'Status', render: (r) => r.status || '—' },
      ]}
      fields={[
        { name: 'productId', label: 'Product', type: 'product', required: true },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Obsolete'].map((v) => ({ value: v, label: v })) },
      ]}
    />
  );
}
