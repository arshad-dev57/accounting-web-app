'use client';

import React from 'react';
import { LifeBuoy } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { maintenanceRequestService } from '@/lib/manufacturing-service';

export default function MaintenanceRequestsPage() {
  return (
    <MfgEntityList
      title="Maintenance Requests"
      subtitle="Requested maintenance for machines"
      icon={<LifeBuoy className="w-5 h-5 text-white" />}
      service={maintenanceRequestService}
      columns={[
        { key: 'requestNumber', label: 'Request #', render: (r) => <span className="font-semibold text-[#014582]">{r.requestNumber || r.number || r.id}</span> },
        { key: 'machineName', label: 'Machine', render: (r) => r.machineName || r.machine?.name || r.machineId || '—' },
        { key: 'requestType', label: 'Type', render: (r) => r.requestType || r.type || r.maintenanceType || '—' },
        { key: 'priority', label: 'Priority', render: (r) => r.priority || '—' },
        { key: 'status', label: 'Status', render: (r) => <MfgStatusBadge status={r.status} /> },
      ]}
      fields={[
        { name: 'machineId', label: 'Machine Id', type: 'text', required: true },
        { name: 'requestType', label: 'Type', type: 'select', options: ['Preventive', 'Corrective', 'Breakdown'].map((v) => ({ value: v, label: v })) },
        { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Normal', 'High', 'Urgent'].map((v) => ({ value: v, label: v })) },
        { name: 'description', label: 'Description', type: 'textarea', full: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'InProgress', 'Completed', 'Rejected'].map((v) => ({ value: v, label: v })) },
      ]}
    />
  );
}

export { MfgStatusBadge };
