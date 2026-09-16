'use client';

import React from 'react';
import { ClipboardPen } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { maintenanceOrderService } from '@/lib/manufacturing-service';

export default function MaintenanceOrdersPage() {
  return (
    <MfgEntityList
      title="Maintenance Orders"
      subtitle="Orders for maintenance work with technician, timing and cost"
      icon={<ClipboardPen className="w-5 h-5 text-white" />}
      service={maintenanceOrderService}
      columns={[
        { key: 'orderNumber', label: 'Order #', render: (r) => <span className="font-semibold text-[#014582]">{r.orderNumber || r.number || r.id}</span> },
        { key: 'machineName', label: 'Machine', render: (r) => r.machineName || r.machine?.name || r.machineId || '—' },
        { key: 'technician', label: 'Technician', render: (r) => r.technician || r.technicianName || '—' },
        { key: 'startTime', label: 'Start', render: (r) => (r.startTime ? new Date(r.startTime).toLocaleString('en-GB') : '—') },
        { key: 'cost', label: 'Cost', render: (r) => Number(r.cost || 0).toLocaleString() },
        { key: 'status', label: 'Status', render: (r) => <MfgStatusBadge status={r.status} /> },
      ]}
      fields={[
        { name: 'machineId', label: 'Machine', type: 'relation', required: true },
        { name: 'technician', label: 'Technician', type: 'text' },
        { name: 'startTime', label: 'Start Time', type: 'date' },
        { name: 'endTime', label: 'End Time', type: 'date' },
        { name: 'cost', label: 'Maintenance Cost', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Completed', 'Cancelled'].map((v) => ({ value: v, label: v })) },
      ]}
    />
  );
}

export { MfgStatusBadge };
