'use client';

import React from 'react';
import { Wrench } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { machineService } from '@/lib/manufacturing-service';

export default function MachinesPage() {
  return (
    <MfgEntityList
      title="Machines"
      subtitle="Machines tied to work centers, factories and maintenance"
      icon={<Wrench className="w-5 h-5 text-white" />}
      service={machineService}
      idKey="id"
      columns={[
        { key: 'machineName', label: 'Machine', render: (r) => <span className="font-semibold text-[#1A1A2E]">{r.machineName || r.name || '—'}</span> },
        { key: 'machineCode', label: 'Code', render: (r) => r.machineCode || r.code || '—' },
        { key: 'model', label: 'Model', render: (r) => r.model || '—' },
        { key: 'workCenterName', label: 'Work Center', render: (r) => r.workCenterName || r.workCenter?.name || '—' },
        { key: 'status', label: 'Status', render: (r) => <MfgStatusBadge status={r.status} /> },
        { key: 'hourlyCost', label: 'Hourly Cost', render: (r) => Number(r.hourlyCost || r.hourlyOperatingCost || 0).toLocaleString() },
      ]}
      fields={[
        { name: 'name', label: 'Machine Name', type: 'text', required: true },
        { name: 'machineCode', label: 'Machine Code', type: 'text' },
        { name: 'serialNumber', label: 'Serial Number', type: 'text' },
        { name: 'model', label: 'Model', type: 'text' },
        { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
        { name: 'workCenterId', label: 'Work Center', type: 'relation' },
        { name: 'status', label: 'Status', type: 'select', options: ['Running', 'Idle', 'Maintenance', 'Breakdown', 'Offline'].map((v) => ({ value: v, label: v })) },
        { name: 'hourlyOperatingCost', label: 'Hourly Operating Cost', type: 'number' },
        { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
        { name: 'installationDate', label: 'Installation Date', type: 'date' },
      ]}
    />
  );
}

export { MfgStatusBadge };
