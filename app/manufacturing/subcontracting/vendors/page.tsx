'use client';

import React from 'react';
import { Handshake } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { subcontractVendorService } from '@/lib/manufacturing-service';

export default function SubcontractVendorsPage() {
  return (
    <MfgEntityList
      title="Subcontract Vendors"
      subtitle="Vendors that perform outsourced manufacturing steps"
      icon={<Handshake className="w-5 h-5 text-white" />}
      service={subcontractVendorService}
      columns={[
        { key: 'name', label: 'Vendor', render: (r) => <span className="font-semibold">{r.name || r.vendorName || '—'}</span> },
        { key: 'email', label: 'Email', render: (r) => r.email || '—' },
        { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
        { key: 'status', label: 'Status', render: (r) => <MfgStatusBadge status={r.status} /> },
      ]}
      fields={[
        { name: 'name', label: 'Vendor Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'text' },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'].map((v) => ({ value: v, label: v })) },
      ]}
    />
  );
}

export { MfgStatusBadge };
