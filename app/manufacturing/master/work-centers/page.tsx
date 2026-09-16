'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { MfgEntityList } from '../../_components/MfgEntityList';
import { workCenterService } from '@/lib/manufacturing-service';

export default function WorkCentersPage() {
  return (
    <MfgEntityList
      title="Work Centers"
      subtitle="Production work centers with capacity, shifts and cost per hour"
      icon={<Users className="w-5 h-5 text-white" />}
      service={workCenterService}
      columns={[
        { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name || r.workCenterName || '—'}</span> },
        { key: 'workCenterCode', label: 'Code', render: (r) => r.workCenterCode || r.code || '—' },
        { key: 'department', label: 'Department', render: (r) => r.department || '—' },
        { key: 'factory', label: 'Factory', render: (r) => r.factory || r.factoryName || '—' },
        { key: 'capacity', label: 'Capacity', render: (r) => Number(r.capacity || 0).toLocaleString() },
        { key: 'efficiency', label: 'Efficiency', render: (r) => `${Number(r.efficiency || 0)}%` },
        { key: 'status', label: 'Status', render: (r) => r.status || '—' },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'workCenterCode', label: 'Code', type: 'text' },
        { name: 'department', label: 'Department', type: 'text' },
        { name: 'factory', label: 'Factory', type: 'text' },
        { name: 'capacity', label: 'Capacity / hour', type: 'number' },
        { name: 'shift', label: 'Shift', type: 'text' },
        { name: 'costPerHour', label: 'Cost Per Hour', type: 'number' },
        { name: 'efficiency', label: 'Efficiency %', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Maintenance'].map((v) => ({ value: v, label: v })) },
        { name: 'notes', label: 'Notes', type: 'textarea', full: true },
      ]}
    />
  );
}
