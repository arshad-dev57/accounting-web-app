'use client';

import React from 'react';
import { CalendarRange } from 'lucide-react';
import { MfgEntityList } from '../../_components/MfgEntityList';
import { demandPlanningService } from '@/lib/manufacturing-service';

export default function DemandPlanningPage() {
  return (
    <MfgEntityList
      title="Demand Planning"
      subtitle="Structured demand from sales orders, forecasts and manual entries"
      icon={<CalendarRange className="w-5 h-5 text-white" />}
      service={demandPlanningService}
      columns={[
        { key: 'productName', label: 'Product', render: (r) => <span className="font-semibold">{r.productName || r.product?.name || '—'}</span> },
        { key: 'demandType', label: 'Type', render: (r) => r.demandType || r.source || '—' },
        { key: 'quantity', label: 'Qty', render: (r) => r.quantity ?? '—' },
        { key: 'period', label: 'Period', render: (r) => r.period || r.month || r.week || '—' },
        { key: 'status', label: 'Status', render: (r) => r.status || '—' },
      ]}
      fields={[
        { name: 'productId', label: 'Product', type: 'product', required: true },
        { name: 'demandType', label: 'Demand Type', type: 'select', options: ['SalesOrder', 'Forecast', 'Manual'].map((v) => ({ value: v, label: v })) },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'requiredDate', label: 'Required Date', type: 'date', required: true },
        { name: 'notes', label: 'Notes', type: 'textarea', full: true },
      ]}
    />
  );
}
