'use client';

import React from 'react';
import { PackagePlus } from 'lucide-react';
import { MfgEntityList } from '../../_components/MfgEntityList';
import { byProductService } from '@/lib/manufacturing-service';

export default function ByProductsPage() {
  return (
    <MfgEntityList
      title="By-products"
      subtitle="Secondary products produced alongside the main finished goods"
      icon={<PackagePlus className="w-5 h-5 text-white" />}
      service={byProductService}
      columns={[
        { key: 'productionOrderNumber', label: 'MO #', render: (r) => <span className="font-semibold text-[#014582]">{r.productionOrderNumber || r.productionOrder?.orderNumber || r.productionOrderId || '—'}</span> },
        { key: 'productName', label: 'By-product', render: (r) => r.productName || r.product?.name || '—' },
        { key: 'quantity', label: 'Qty', render: (r) => r.quantity ?? '—' },
        { key: 'warehouseName', label: 'Warehouse', render: (r) => r.warehouseName || r.warehouse?.name || r.warehouseId || '—' },
        { key: 'batchNumber', label: 'Batch', render: (r) => r.batchNumber || '—' },
      ]}
      fields={[
        { name: 'productionOrderId', label: 'Production Order', type: 'relation', required: true },
        { name: 'productId', label: 'By-product', type: 'product', required: true },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'warehouseId', label: 'Warehouse', type: 'relation' },
        { name: 'batchNumber', label: 'Batch / Lot', type: 'text' },
        { name: 'costAllocation', label: 'Cost allocation', type: 'number' },
      ]}
    />
  );
}
