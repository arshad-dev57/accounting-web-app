'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { MfgEntityList, MfgStatusBadge } from '../../_components/MfgEntityList';
import { subcontractOrderService } from '@/lib/manufacturing-service';

export default function SubcontractOrdersPage() {
  return (
    <MfgEntityList
      title="Subcontract Orders"
      subtitle="Orders to subcontract vendors for outsourced operations"
      icon={<FileText className="w-5 h-5 text-white" />}
      service={subcontractOrderService}
      columns={[
        { key: 'orderNumber', label: 'Order #', render: (r) => <span className="font-semibold text-[#014582]">{r.orderNumber || r.number || r.id}</span> },
        { key: 'vendorName', label: 'Vendor', render: (r) => r.vendorName || r.subcontractVendor?.name || r.vendorId || '—' },
        { key: 'operationName', label: 'Operation', render: (r) => r.operationName || r.operation?.name || '—' },
        { key: 'quantity', label: 'Qty', render: (r) => r.quantity ?? '—' },
        { key: 'dueDate', label: 'Due', render: (r) => (r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-GB') : '—') },
        { key: 'status', label: 'Status', render: (r) => <MfgStatusBadge status={r.status} /> },
      ]}
      fields={[
        { name: 'vendorId', label: 'Vendor Id', type: 'text', required: true },
        { name: 'productId', label: 'Product', type: 'product', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number' },
        { name: 'expectedDeliveryDate', label: 'Due Date', type: 'date' },
        { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Sent', 'PartiallyReceived', 'Received', 'Cancelled'].map((v) => ({ value: v, label: v })) },
      ]}
    />
  );
}

export { MfgStatusBadge };
